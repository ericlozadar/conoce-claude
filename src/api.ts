export type StreamEvent =
  | { type: "thinking"; text: string }
  | { type: "text"; text: string }
  | { type: "tool"; id?: string; name: string; detail: string }
  | { type: "tool_result"; id?: string; output: string; is_error?: boolean }
  | {
      // Subagente en paralelo (fan-out). phase: spawn/started → arranca;
      // progress → actividad actual (title); done → terminó; result → su informe.
      type: "subagent";
      phase: "spawn" | "started" | "progress" | "done" | "result";
      id: string;
      title?: string;
      output?: string;
    }
  | {
      type: "done";
      usage?: { input: number; output: number };
      /** Artefacto que el agente creó en el sandbox (ejercicios de modos/skill):
       *  si existe el archivo esperado y su contenido. */
      artifact?: { name: string; exists: boolean; content: string };
    }
  | { type: "error"; message: string };

export type Health = { ok: boolean; ready: boolean; mode?: string };

// Base de la API.
//  - Build normal (mismo origen que sirve el sitio, p.ej. remo): se deriva del
//    base path de Vite → "/conoce-claude/api". Apache lo proxya al Express local.
//  - Build de Lienzo (sitio estático en OTRO origen): se fija una URL ABSOLUTA
//    vía VITE_API_BASE en tiempo de build (ver .env.lienzo), p.ej.
//    "https://remo.upaep.mx/conoce-claude/api". Así el sitio en Lienzo llama al
//    backend de Joaquín, donde Claude se ejecuta bajo su control.
const ENV_API_BASE = import.meta.env.VITE_API_BASE as string | undefined;
const API_BASE = ENV_API_BASE
  ? ENV_API_BASE.replace(/\/+$/, "") // absoluta: solo quita "/" final (preserva "https://")
  : `${import.meta.env.BASE_URL}api`.replace(/\/{2,}/g, "/");

export async function checkHealth(): Promise<Health> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  } catch {
    return { ok: false, ready: false };
  }
}

/** Guarda una nota/idea del equipo en el backend (buzón del post-it). */
export async function saveNote(text: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok && data?.ok === true;
  } catch {
    return false;
  }
}

/**
 * Envía un prompt al backend y consume la respuesta en streaming.
 * Invoca onEvent por cada token/evento recibido.
 */
export async function streamChat(
  body: {
    system?: string;
    prompt: string;
    thinking?: boolean;
    agentic?: boolean;
    /** Tarea del modo agéntico: "etl" siembra un CSV; "code"/"skill" dejan el
     *  sandbox vacío; "modes" siembra un CSV limpio para el ejercicio de modos;
     *  "fanout" siembra tablas .sql para documentarlas con subagentes. */
    agenticTask?: "etl" | "code" | "modes" | "skill" | "fanout";
    /** Modo de permisos para el ejercicio de modos de ejecución. */
    permissionMode?: "default" | "plan" | "acceptEdits" | "bypassPermissions";
  },
  onEvent: (ev: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) {
    let message = `Error ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* respuesta no-JSON */
    }
    onEvent({ type: "error", message });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Los eventos SSE se separan por una línea en blanco.
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const line = chunk.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      try {
        onEvent(JSON.parse(line.slice(6)) as StreamEvent);
      } catch {
        /* ignorar líneas malformadas */
      }
    }
  }
}
