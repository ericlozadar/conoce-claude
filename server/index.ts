import express from "express";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  rmSync,
  appendFileSync,
  existsSync,
  type Dirent,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import "dotenv/config";

const PORT = Number(process.env.PORT) || 8787;
// Binario del CLI de Claude Code (en PATH por defecto).
const CLAUDE_BIN = process.env.CLAUDE_BIN || "claude";
// Modelo: alias ("opus", "sonnet") o id completo ("claude-opus-4-8").
const MODEL = process.env.CLAUDE_MODEL || "opus";

const app = express();
app.use(express.json({ limit: "1mb" }));

// CORS: permite que una copia del frontend alojada en OTRO origen (p.ej. la
// versión de Lienzo en https://shadow.spdigital.mx) llame a esta API. Claude
// sigue ejecutándose AQUÍ, en el backend de Joaquín; solo se autoriza a los
// orígenes de la allowlist a invocarlo. Configurable por ALLOWED_ORIGINS
// (lista separada por comas); por defecto incluye el host de Lienzo.
const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS || "https://shadow.spdigital.mx")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
  }
  // Responde el preflight CORS sin tocar la lógica de las rutas.
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Directorio neutro y vacío para ejecutar el CLI: evita que descubra el
// CLAUDE.md del proyecto, la auto-memoria o el git status del repo.
const WORKDIR = mkdtempSync(join(tmpdir(), "tutorial-claude-"));

// CSV con problemas de calidad sembrado en el sandbox del demo agéntico:
// espacios, mayúsculas inconsistentes, fechas en varios formatos, montos con
// símbolos/comas, faltantes y duplicados (incluidos los que solo varían por
// mayúsculas/espacios). El agente debe detectarlos y limpiarlos por su cuenta.
const SEED_CSV = `nombre,programa,fecha_inscripcion,monto_pagado
 Ana López ,Ingeniería,2026-01-15,"1,200"
ana lópez,INGENIERIA,15/01/2026,1200
Luis Pérez,Derecho,2026/02/03,$1500
LUIS PEREZ,derecho,2026-02-03,1500
María Ruiz,Medicina,,2000
 María Ruiz ,medicina,2026-01-20,2000
Jorge Díaz,,2026-01-22,900
Sofía Mendoza,Arquitectura,2026-01-25,
Sofía Mendoza,Arquitectura,2026-01-25,1800
Pedro Gómez,DERECHO, 2026-01-30 ,"1,500"
`;

// CSV LIMPIO y pequeño para el ejercicio de «modos de ejecución»: la tarea es
// trivial (contar filas) porque lo que importa no es el resultado, sino CÓMO se
// comporta el agente según el --permission-mode (si pide permiso, planea, o
// escribe el archivo). 5 filas de datos.
const MODES_CSV = `nombre,programa,periodo
Ana López,Ingeniería,2026-1
Luis Pérez,Derecho,2026-1
María Ruiz,Medicina,2026-1
Jorge Díaz,Arquitectura,2026-1
Sofía Mendoza,Medicina,2026-1
`;

// Modos de permisos válidos que aceptamos del frontend (ejercicio de modos).
const VALID_PERMISSION_MODES = new Set([
  "default",
  "plan",
  "acceptEdits",
  "bypassPermissions",
]);

// Definiciones CRUDAS de tablas del ERP legado (estilo UNISOFT4: MAYÚSCULAS,
// STATUS de 1 letra, sin integridad referencial) para el demo de «agentes en
// paralelo»: se siembra un archivo .sql por tabla y un subagente documenta cada
// una a la vez. Son archivos de MUESTRA (no una BD real), pero los subagentes
// que los leen y documentan SÍ corren de verdad.
const LEGACY_TABLES: Record<string, string> = {
  "ALUMNO.sql": `-- Tabla ALUMNO (ERP legado UNISOFT4, Oracle)
CREATE TABLE ALUMNO (
  NUMCTL    VARCHAR2(10),   -- matrícula del alumno
  NOMBRE    VARCHAR2(80),   -- "APELLIDO APELLIDO, NOMBRE", en MAYÚSCULAS
  CARRERA   VARCHAR2(6),    -- clave de carrera (p.ej. ISC, DER, MED)
  SEMING    NUMBER(5),      -- semestre de ingreso, formato AAAAS (p.ej. 20211)
  STATUS    CHAR(1),        -- 'A' activo, 'B' baja, 'E' egresado
  CURP      VARCHAR2(18),   -- CURP del alumno
  EMAIL     VARCHAR2(60)    -- correo institucional
);
`,
  "MATERIA.sql": `-- Tabla MATERIA (ERP legado UNISOFT4, Oracle)
CREATE TABLE MATERIA (
  CVEMAT    VARCHAR2(8),    -- clave de la materia
  NOMMAT    VARCHAR2(80),   -- nombre de la materia
  CREDITOS  NUMBER(2),      -- créditos
  CARRERA   VARCHAR2(6),    -- carrera a la que pertenece
  TIPO      CHAR(1),        -- 'O' obligatoria, 'P' optativa
  HRSSEM    NUMBER(2)       -- horas por semana
);
`,
  "INSCMAT.sql": `-- Tabla INSCMAT (ERP legado UNISOFT4, Oracle): inscripción de materias
CREATE TABLE INSCMAT (
  NUMCTL    VARCHAR2(10),   -- matrícula (referencia lógica a ALUMNO.NUMCTL)
  CVEMAT    VARCHAR2(8),    -- clave de materia (referencia lógica a MATERIA.CVEMAT)
  CVEGPO    VARCHAR2(6),    -- grupo
  PERIODO   VARCHAR2(6),    -- periodo, formato AAAAS
  FECINS    DATE,           -- fecha de inscripción
  CALIF     NUMBER(5,2),    -- calificación final (NULL si la materia está en curso)
  STATUS    CHAR(1)         -- 'I' inscrito, 'B' baja, 'A' acreditada
);
`,
};

/** Busca recursivamente un archivo por nombre dentro del sandbox (para detectar
 *  el artefacto que el agente creó, p.ej. SKILL.md en .claude/skills/...). */
function findFile(dir: string, name: string, depth = 5): string | null {
  if (depth < 0) return null;
  let entries: Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isFile() && entry.name === name) return full;
    if (entry.isDirectory()) {
      const found = findFile(full, name, depth - 1);
      if (found) return found;
    }
  }
  return null;
}

// Herramientas permitidas en modo agéntico: solo Python (para el ETL) y
// utilidades de SOLO lectura, más leer/escribir archivos del sandbox. Cualquier
// otro comando de shell (rm, curl, etc.) queda fuera de la lista y el CLI lo
// deniega automáticamente en headless. No usamos --dangerously-skip-permissions.
const AGENT_TOOLS = [
  "Bash(python3:*)",
  "Bash(cat:*)",
  "Bash(ls:*)",
  "Bash(head:*)",
  "Bash(wc:*)",
  "Read",
  "Write",
];

// El CLI usa tu suscripción (OAuth) si CLAUDE_CODE_OAUTH_TOKEN está definido
// o si ya iniciaste sesión con `claude` (`claude /login`). NO usa créditos de
// API: en ese caso la respuesta del CLI trae "apiKeySource":"none".
const usingApiKey = Boolean(process.env.ANTHROPIC_API_KEY);

/** Comprueba que el binario del CLI responde (no valida la sesión). */
function cliReady(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(CLAUDE_BIN, ["--version"], { stdio: "ignore" });
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
  });
}

// Diagnóstico para que el frontend avise si el CLI no está disponible.
app.get("/api/health", async (_req, res) => {
  const ready = await cliReady();
  res.json({
    ok: true,
    ready,
    mode: usingApiKey ? "api-key" : "suscripción",
  });
});

// Buzón de ideas del equipo (post-it del sitio). Cada nota se añade como un
// item de lista al archivo `ideas-equipo.md` en la raíz del proyecto, para
// leerlas al continuar el desarrollo. Anclado al archivo del servidor (no al
// cwd) para que funcione sin importar desde dónde se lance.
const NOTES_FILE = fileURLToPath(
  new URL("../ideas-equipo.md", import.meta.url),
);

app.post("/api/notes", (req, res) => {
  const raw = typeof req.body?.text === "string" ? req.body.text : "";
  const text = raw.trim();
  if (!text) return res.status(400).json({ ok: false, error: "Nota vacía" });
  if (text.length > 2000)
    return res.status(400).json({ ok: false, error: "Nota demasiado larga" });
  try {
    if (!existsSync(NOTES_FILE)) {
      writeFileSync(
        NOTES_FILE,
        "# Ideas del equipo — Conoce a Claude\n\n" +
          "Notas capturadas desde el post-it del sitio (fecha en UTC).\n\n",
      );
    }
    const ts = new Date().toISOString().slice(0, 16).replace("T", " ");
    const clean = text.replace(/\r?\n+/g, " / ");
    appendFileSync(NOTES_FILE, `- **${ts}** — ${clean}\n`);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false, error: "No se pudo guardar la nota" });
  }
});

type ChatBody = {
  system?: string;
  prompt: string;
  /** Pide un razonamiento más deliberado (sube el effort). */
  thinking?: boolean;
  /** Modo agéntico: habilita herramientas reales en un sandbox sembrado. */
  agentic?: boolean;
  /** Tarea agéntica: "etl" siembra el CSV sucio; "code" deja el sandbox vacío
   *  (para construir software desde cero, p.ej. el demo de vibe coding);
   *  "modes" siembra un CSV limpio para el ejercicio de modos de permisos;
   *  "skill" deja el sandbox vacío para que el agente cree un SKILL.md;
   *  "fanout" siembra varias tablas .sql para documentarlas con subagentes
   *  en paralelo. */
  agenticTask?: "etl" | "code" | "modes" | "skill" | "fanout";
  /** Modo de permisos del CLI para el ejercicio de modos de ejecución
   *  (default | plan | acceptEdits | bypassPermissions). */
  permissionMode?: string;
};

/**
 * Endpoint de chat con streaming (Server-Sent Events).
 * Lanza el CLI `claude` en modo headless y traduce su salida `stream-json`
 * al protocolo SSE que consume el frontend:
 *   {type:"text", text} · {type:"done", usage} · {type:"error", message}
 */
app.post("/api/chat", (req, res) => {
  const {
    system,
    prompt,
    thinking = false,
    agentic = false,
    agenticTask = "etl",
    permissionMode,
  } = req.body as ChatBody;

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Falta el campo 'prompt'." });
    return;
  }

  // Cabeceras SSE.
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (data: unknown) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  // Sandbox por corrida para el modo agéntico: un directorio temporal aislado
  // con el CSV sucio sembrado. El agente solo puede actuar aquí. Los demos
  // normales siguen usando el WORKDIR neutro compartido.
  let runDir = WORKDIR;
  if (agentic) {
    runDir = mkdtempSync(join(tmpdir(), "tutorial-agente-"));
    // Siembra según la tarea: "etl" → CSV sucio (demo de limpieza); "modes" →
    // CSV limpio (ejercicio de modos de permisos); "code"/"skill" → sandbox
    // vacío (construir desde cero / crear un SKILL.md).
    if (agenticTask === "etl") {
      writeFileSync(join(runDir, "inscripciones.csv"), SEED_CSV);
    } else if (agenticTask === "modes") {
      writeFileSync(join(runDir, "inscripciones.csv"), MODES_CSV);
    } else if (agenticTask === "fanout") {
      for (const [name, sql] of Object.entries(LEGACY_TABLES)) {
        writeFileSync(join(runDir, name), sql);
      }
    }
  }

  const args = [
    "-p",
    prompt,
    "--model",
    MODEL,
    "--output-format",
    "stream-json",
    "--include-partial-messages",
    "--verbose",
  ];
  if (system) args.push("--system-prompt", system);
  // Razonamiento más deliberado para la demo de "paso a paso".
  if (thinking) args.push("--effort", "high");
  // Modo agéntico: la configuración depende de la tarea.
  if (agentic) {
    if (agenticTask === "modes") {
      // El protagonista es el MODO de permisos: NO damos lista blanca (así es
      // el --permission-mode quien decide si el agente puede escribir o no).
      const mode =
        permissionMode && VALID_PERMISSION_MODES.has(permissionMode)
          ? permissionMode
          : "default";
      args.push("--permission-mode", mode);
    } else if (agenticTask === "skill" || agenticTask === "fanout") {
      // skill: crear .claude/skills/<n>/SKILL.md requiere bypass (`.claude` es
      // ruta protegida incluso en acceptEdits). fanout: el agente lanza
      // subagentes (Agent) que leen los .sql; bypass evita fricción de permisos.
      // Seguro en ambos casos: sandbox temporal aislado.
      args.push("--permission-mode", "bypassPermissions");
    } else {
      // ETL / code: lista blanca de herramientas (sin saltarse permisos).
      args.push("--allowedTools", ...AGENT_TOOLS);
    }
  }

  const child = spawn(CLAUDE_BIN, args, {
    cwd: runDir,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let buffer = "";
  let stderr = "";
  let finished = false;
  // Ids de las llamadas a la herramienta `Agent` (subagentes) de este run, para
  // distinguir el informe final de un subagente de un tool_result normal.
  const agentIds = new Set<string>();

  const finish = (data: unknown) => {
    if (finished) return;
    finished = true;
    send(data);
    res.end();
  };

  // El CLI emite un objeto JSON por línea. Lo parseamos y reenviamos.
  child.stdout.on("data", (chunk: Buffer) => {
    buffer += chunk.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      let obj: any;
      try {
        obj = JSON.parse(line);
      } catch {
        continue; // línea parcial o no-JSON
      }

      if (obj.type === "stream_event" && obj.event) {
        const ev = obj.event;
        if (ev.type === "content_block_delta") {
          if (ev.delta?.type === "text_delta") {
            send({ type: "text", text: ev.delta.text });
          } else if (ev.delta?.type === "thinking_delta") {
            send({ type: "thinking", text: ev.delta.thinking });
          }
        }
      } else if (obj.type === "assistant" && obj.message?.content) {
        // El trabajo INTERNO de un subagente llega marcado con
        // parent_tool_use_id; no lo mostramos en la transcripción del padre (su
        // progreso se refleja en los carriles vía los eventos `system task_*`).
        if (obj.parent_tool_use_id) continue;
        // Llamadas a herramientas del agente padre. El texto ya se emitió por
        // los deltas de stream_event, así que aquí solo mandamos tool_use.
        for (const b of obj.message.content) {
          if (b.type === "tool_use") {
            if (b.name === "Agent") {
              // Subagente: lo manejamos como carril (no como tarjeta de tool).
              agentIds.add(b.id);
              send({
                type: "subagent",
                phase: "spawn",
                id: b.id,
                title: b.input?.description ?? "Subagente",
              });
              continue;
            }
            const detail =
              b.name === "Bash"
                ? b.input?.command ?? ""
                : b.input?.file_path ?? JSON.stringify(b.input ?? {});
            send({ type: "tool", id: b.id, name: b.name, detail });
          }
        }
      } else if (
        obj.type === "system" &&
        typeof obj.subtype === "string" &&
        obj.subtype.startsWith("task")
      ) {
        // Eventos de los subagentes en paralelo (fan-out):
        //   task_started → arranca · task_progress → qué hace ahora ·
        //   task_notification (completed) → terminó.
        const id = obj.tool_use_id;
        if (id) {
          if (obj.subtype === "task_started") {
            send({ type: "subagent", phase: "started", id, title: obj.description });
          } else if (obj.subtype === "task_progress") {
            send({ type: "subagent", phase: "progress", id, title: obj.description });
          } else if (obj.subtype === "task_notification" && obj.status === "completed") {
            send({ type: "subagent", phase: "done", id });
          }
        }
      } else if (obj.type === "user" && Array.isArray(obj.message?.content)) {
        // El resultado interno de una herramienta de un subagente también llega
        // con parent_tool_use_id: lo omitimos (no es del padre).
        if (obj.parent_tool_use_id) continue;
        for (const b of obj.message.content) {
          if (b.type === "tool_result") {
            let out: any = b.content;
            if (Array.isArray(out))
              out = out.map((x: any) => x?.text ?? "").join("");
            out = String(out ?? "");
            // El informe final de un subagente: va a su carril, no a la
            // transcripción del padre.
            if (agentIds.has(b.tool_use_id)) {
              if (out.length > 6000) out = out.slice(0, 6000) + "\n…(truncado)";
              send({
                type: "subagent",
                phase: "result",
                id: b.tool_use_id,
                output: out,
              });
              continue;
            }
            if (out.length > 3000) out = out.slice(0, 3000) + "\n…(truncado)";
            send({
              type: "tool_result",
              id: b.tool_use_id,
              output: out,
              is_error: Boolean(b.is_error),
            });
          }
        }
      } else if (obj.type === "rate_limit_event") {
        const status = obj.rate_limit_info?.status;
        if (status && status !== "allowed") {
          finish({
            type: "error",
            message:
              "Límite de uso de tu suscripción alcanzado. Intenta de nuevo más tarde.",
          });
        }
      } else if (obj.type === "result") {
        if (obj.is_error || obj.subtype !== "success") {
          finish({
            type: "error",
            message: obj.result || obj.api_error_status || "Error del CLI.",
          });
        } else {
          // Para los ejercicios con artefacto (modos → conteo.txt; skill →
          // SKILL.md), comprobamos si el agente realmente creó el archivo —
          // esa es la diferencia observable que demuestra el modo. Se lee aquí
          // (antes de limpiar el sandbox en el 'close').
          let artifact:
            | { name: string; exists: boolean; content: string }
            | undefined;
          if (agentic && agenticTask === "modes") {
            const p = join(runDir, "conteo.txt");
            const exists = existsSync(p);
            artifact = {
              name: "conteo.txt",
              exists,
              content: exists ? readFileSync(p, "utf8").slice(0, 400).trim() : "",
            };
          } else if (agentic && agenticTask === "skill") {
            const p = findFile(runDir, "SKILL.md");
            artifact = p
              ? {
                  name:
                    ".claude/skills/" +
                    (p.split("/skills/")[1] ?? "documentar-tabla/SKILL.md"),
                  exists: true,
                  content: readFileSync(p, "utf8").slice(0, 4000),
                }
              : { name: "SKILL.md", exists: false, content: "" };
          }
          finish({
            type: "done",
            usage: {
              input: obj.usage?.input_tokens ?? 0,
              output: obj.usage?.output_tokens ?? 0,
            },
            artifact,
          });
        }
      }
    }
  });

  child.stderr.on("data", (c: Buffer) => {
    stderr += c.toString();
  });

  child.on("error", (err) => {
    finish({
      type: "error",
      message: `No se pudo ejecutar el CLI '${CLAUDE_BIN}': ${err.message}`,
    });
  });

  child.on("close", (code) => {
    // Limpia el sandbox de la corrida agéntica (archivos que creó el agente).
    if (agentic && runDir !== WORKDIR) {
      try {
        rmSync(runDir, { recursive: true, force: true });
      } catch {
        /* best-effort */
      }
    }
    if (code !== 0) {
      finish({
        type: "error",
        message:
          stderr.trim() ||
          `El CLI terminó con código ${code}. ¿Iniciaste sesión con 'claude' o definiste CLAUDE_CODE_OAUTH_TOKEN?`,
      });
    } else {
      // Cierre normal sin evento 'result' (raro): cerramos la respuesta.
      finish({ type: "done" });
    }
  });

  // Si el cliente cancela (cambia de demo), matamos el proceso. Escuchamos en
  // 'res' (no en 'req': su 'close' se dispara al consumirse el body del POST).
  res.on("close", () => {
    if (!finished) child.kill("SIGTERM");
  });
});

app.listen(PORT, async () => {
  console.log(`\n  API lista en http://localhost:${PORT}`);
  const ready = await cliReady();
  if (!ready) {
    console.log(
      `  ⚠️  No se encontró el CLI '${CLAUDE_BIN}'. Instálalo con: npm i -g @anthropic-ai/claude-code\n`,
    );
  } else if (usingApiKey) {
    console.log("  ✓ CLI detectado · modo API key (ANTHROPIC_API_KEY)\n");
  } else {
    console.log(
      "  ✓ CLI detectado · modo suscripción (usa tu plan Max, sin créditos de API)\n",
    );
  }
});
