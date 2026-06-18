import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  lessons,
  type CompareLesson,
  type ComparePrompt,
  type ConnectLesson,
  type DemoLesson,
  type FanoutLesson,
  type Lesson,
  type LibraryLesson,
  type Section,
  type TemplateCard,
  type TipCard,
  type TipsLesson,
  type TipsPlayground,
  type VibeLesson,
} from "./lessons.ts";
import { checkHealth, saveNote, streamChat, type StreamEvent } from "./api.ts";
import { Markdown } from "./Markdown.tsx";

const SECTION_LABEL: Record<Section, string> = {
  fundamentos: "Fundamentos",
  prompting: "Buenas prácticas de prompting",
  avanzados: "Demos para principiantes",
  plantillas: "Plantillas",
};

// Descripción cálida de cada sección, para el navegador del home.
const SECTION_BLURB: Record<Section, string> = {
  fundamentos:
    "Lo esencial que hace cualquier modelo de lenguaje: escribir código, razonar paso a paso y convertir texto suelto en datos ordenados.",
  prompting:
    "El arte de pedir bien — la diferencia entre una respuesta genérica y una que de verdad te sirve. Aquí están las buenas prácticas.",
  avanzados:
    "Una primera mirada a la IA agéntica, pensada para quien aún no ha trabajado con agentes: demos en vivo donde Claude actúa como agente —ejecuta tareas reales en un sandbox, reconoce con honestidad sus límites y convierte un requerimiento en un entregable completo—.",
  plantillas:
    "Prompts listos para tu trabajo de DBA y BI: cópialos, ajústalos a tu caso y úsalos hoy mismo.",
};

// Etiqueta corta (sin emoji) para el kicker y la barra del diseño «sharp».
const SHARP_KICKER: Record<Section, string> = {
  fundamentos: "Fundamentos",
  prompting: "Prompting",
  avanzados: "Demos para principiantes",
  plantillas: "Plantillas",
};

// Subniveles del menú para Prompting: etiqueta del grupo que ARRANCA en cada
// lección (id → nombre del nivel). Es solo señalización visual de avance entre
// lecciones; no cambia la lógica ni la numeración.
const MENU_SUBLEVELS: Record<string, string> = {
  "prompting-contexto-ejemplos": "Cómo pedir bien",
  "prompting-guardarrailes": "Dirigir al modelo",
  "prompting-modos-ejecucion": "Claude Code a fondo",
};

// Número de la lección dentro de su sección, con cero a la izquierda (01, 02…).
function sectionPad(lesson: Lesson): string {
  const within = lessons.filter((l) => l.section === lesson.section);
  return String(within.findIndex((l) => l.id === lesson.id) + 1).padStart(2, "0");
}

// Lecciones «comodín»: no siguen la numeración de su sección (son un grab-bag de
// tips pequeños para aprender a usar la IA). En vez del número muestran una marca
// especial, y van fijadas al final de su sección.
const WILDCARD_IDS = new Set(["prompting-tips-claude-code"]);
const WILDCARD_BADGE = "✳";
function isWildcard(lesson: Lesson): boolean {
  return WILDCARD_IDS.has(lesson.id);
}
// Insignia de posición: el número de sección, o la marca comodín si aplica.
function sectionBadge(lesson: Lesson): string {
  return isWildcard(lesson) ? WILDCARD_BADGE : sectionPad(lesson);
}

// Orden de las secciones en el menú: los dos listados de demos juntos y las
// buenas prácticas al final. El sort es estable, así que respeta el orden
// dentro de cada sección. `active` se indexa sobre este arreglo ordenado.
// Prompting y Plantillas al frente (el foco del sitio); los demos avanzados
// quedan al final. Fundamentos se retiró por decisión del equipo.
const SECTION_ORDER: Section[] = ["prompting", "plantillas", "avanzados"];
const orderedLessons = [...lessons].sort(
  (a, b) => SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section),
);

// En el demo agéntico la respuesta es una transcripción ordenada de bloques de
// texto y llamadas a herramientas, en el mismo orden en que ocurrieron.
type Part =
  | { kind: "text"; text: string }
  | {
      kind: "tool";
      name: string;
      detail: string;
      result?: string;
      error?: boolean;
    };

/** Anexa texto al último bloque de texto, o abre uno nuevo si el último fue tool. */
function pushText(parts: Part[], text: string): Part[] {
  const last = parts[parts.length - 1];
  if (last && last.kind === "text") {
    return [...parts.slice(0, -1), { ...last, text: last.text + text }];
  }
  return [...parts, { kind: "text", text }];
}

/** Adjunta el resultado a la última herramienta que aún esté pendiente. */
function attachResult(parts: Part[], output: string, error?: boolean): Part[] {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (p.kind === "tool" && p.result === undefined) {
      const copy = parts.slice();
      copy[i] = { ...p, result: output, error };
      return copy;
    }
  }
  return parts;
}

/**
 * Hook: mantiene un textarea ajustado a su contenido (sin altura fija ni
 * resize manual). Se recalcula cuando cambia el valor.
 */
function useAutosize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    // scrollHeight excluye el borde; sumamos su alto para no recortar el texto.
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
  }, [value]);
  return ref;
}

/**
 * Revela un elemento (fade + slide) la primera vez que entra al viewport.
 * Usa IntersectionObserver; si no existe, muestra de inmediato. El movimiento
 * lo aplica el CSS (`.reveal` / `.reveal.in`), que respeta prefers-reduced-motion.
 */
function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        }),
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, inView };
}

function Reveal({
  as = "div",
  className = "",
  variant,
  delay,
  children,
}: {
  as?: "div" | "section" | "aside" | "li";
  className?: string;
  /** Dirección de entrada: por defecto sube; "left"/"right" desliza lateral. */
  variant?: "left" | "right";
  /** Retraso en ms para escalonar (cascada) elementos hermanos. */
  delay?: number;
  children: ReactNode;
}) {
  const { ref, inView } = useInView();
  const Tag = as as "div";
  const dir =
    variant === "left" ? "from-left" : variant === "right" ? "from-right" : "";
  return (
    <Tag
      ref={ref}
      className={`reveal ${dir} ${inView ? "in" : ""} ${className}`
        .replace(/\s+/g, " ")
        .trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

/** Tarjeta tipo «terminal» para una llamada a herramienta y su salida. */
function ToolCall({ part }: { part: Extract<Part, { kind: "tool" }> }) {
  const iconId =
    part.name === "Bash"
      ? "terminal"
      : part.name === "Write"
        ? "pencil"
        : part.name === "Read"
          ? "doc"
          : "gear";
  return (
    <div className={`tool-call ${part.error ? "tool-error" : ""}`}>
      <div className="tool-head">
        <span className="tool-badge">
          <CardIcon id={iconId} /> {part.name}
        </span>
        {part.result === undefined && (
          <span className="tool-pending">ejecutando…</span>
        )}
      </div>
      <pre className="tool-cmd">{part.detail}</pre>
      {part.result !== undefined && (
        <pre className="tool-output">{part.result || "(sin salida)"}</pre>
      )}
    </div>
  );
}

/** Botón «copiar al portapapeles» con confirmación efímera. */
function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback para contextos sin Clipboard API
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* noop */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button className="copy-btn" onClick={copy} type="button">
      {copied ? (
        <>
          <IconCheck /> Copiado
        </>
      ) : (
        <>
          <IconCopy /> {label}
        </>
      )}
    </button>
  );
}

/** Plantilla «para llevar» al final de una lección: esqueleto copiable. */
function TemplateBlock({ template }: { template: string }) {
  return (
    <section className="template-block">
      <header className="template-block-head">
        <span className="template-block-label">
          <IconDoc /> Plantilla para llevar
        </span>
        <CopyButton text={template} />
      </header>
      <pre className="template-text">{template}</pre>
    </section>
  );
}

// Íconos de línea (monocromáticos) por página, para el menú. Heredan el color
// del acento de la sección vía `currentColor`. Representan la idea de cada página.
const ICON_PATHS: Record<string, ReactNode> = {
  // Fundamentos
  codigo: (
    <>
      <path d="M9 8l-4 4 4 4" />
      <path d="M15 8l4 4-4 4" />
    </>
  ),
  razonamiento: (
    <>
      <circle cx="12" cy="6" r="2" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M12 8v2.5" />
      <path d="M11 11.5 7 16" />
      <path d="M13 11.5 17 16" />
    </>
  ),
  extraccion: (
    <>
      <path d="M9 5c-2 0-2 2-2 3.5S6 11 5 12c1 1 2 1.5 2 3.5S7 19 9 19" />
      <path d="M15 5c2 0 2 2 2 3.5S18 11 19 12c-1 1-2 1.5-2 3.5S17 19 15 19" />
    </>
  ),
  // Prompting
  "prompting-guardarrailes": (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  "prompting-contexto-ejemplos": (
    <>
      <path d="M12 4 3 9l9 5 9-5-9-5z" />
      <path d="M3 14l9 5 9-5" />
    </>
  ),
  "prompting-descomponer": <path d="M4 18h5v-4h5v-4h6" />,
  "prompting-anclar-no-alucinar": (
    <>
      <circle cx="12" cy="4" r="2" />
      <path d="M12 6v14" />
      <path d="M8 10h8" />
      <path d="M4 13a8 8 0 0 0 16 0" />
    </>
  ),
  "prompting-iterar-refinar": (
    <>
      <path d="M4 9a8 8 0 0 1 14-3" />
      <path d="M18 3v3.5h-3.5" />
      <path d="M20 15a8 8 0 0 1-14 3" />
      <path d="M6 21v-3.5h3.5" />
    </>
  ),
  "prompting-vibe-coding": (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M7 10l3 2.5-3 2.5" />
      <path d="M13 15h4" />
    </>
  ),
  "prompting-tips-claude-code": (
    <>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.3 1 2.5h6c0-1.2.2-1.7 1-2.5A6 6 0 0 0 12 3z" />
    </>
  ),
  "prompting-contratos-prp": (
    <>
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M15 3v3h3" />
      <path d="M9 11h6M9 14h6M9 17h4" />
    </>
  ),
  "prompting-modos-ejecucion": (
    <>
      <path d="M4 7h10M18 7h2" />
      <path d="M4 12h2M10 12h10" />
      <path d="M4 17h6M14 17h6" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="12" cy="17" r="2" />
    </>
  ),
  "prompting-skills-mcp": (
    <>
      <path d="M9 2v5M15 2v5" />
      <path d="M6 7h12v4a6 6 0 0 1-12 0z" />
      <path d="M12 17v5" />
    </>
  ),
  "prompting-agentes-paralelo": (
    <>
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="5" cy="19" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
      <circle cx="19" cy="19" r="1.8" />
      <path d="M12 6.8 6.5 17.4" />
      <path d="M12 6.8v10.4" />
      <path d="M12 6.8 17.5 17.4" />
    </>
  ),
  // Avanzados
  limites: (
    <>
      <path d="M9 3h6" />
      <path d="M10 3v6l-5 9a1 1 0 0 0 1 1.5h12a1 1 0 0 0 1-1.5l-5-9V3" />
      <path d="M7.5 14h9" />
    </>
  ),
  entregable: (
    <>
      <path d="M3 9l9-5 9 5" />
      <path d="M5 20h14" />
      <path d="M7 9v11" />
      <path d="M12 9v11" />
      <path d="M17 9v11" />
    </>
  ),
  agente: <path d="M13 3 5 13h6l-1 8 8-10h-6l1-8z" />,
  // Plantillas
  "plantillas-biblioteca": (
    <>
      <path d="M5 4h5a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H5z" />
      <path d="M19 4h-5a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h5z" />
    </>
  ),
  "plantillas-agenticas": (
    <>
      <rect x="5" y="8" width="14" height="10" rx="2" />
      <path d="M12 5.5V8" />
      <circle cx="12" cy="4.5" r="1.2" />
      <circle cx="9.5" cy="12.5" r="1" />
      <circle cx="14.5" cy="12.5" r="1" />
      <path d="M10 15.5h4" />
    </>
  ),
  "plantillas-conectar-apps": (
    <>
      <path d="M9 3v4M15 3v4" />
      <rect x="7" y="7" width="10" height="5" rx="1" />
      <path d="M12 12v3a4 4 0 0 1-4 4H6" />
    </>
  ),
};

function NavIcon({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[id] ?? <circle cx="12" cy="12" r="8" />}
    </svg>
  );
}

// Íconos de línea para los PASOS de los timelines (vibe coding / itera y refina).
// Reemplazan los emojis: monocromáticos, heredan el acento por `currentColor`.
const STEP_ICONS: Record<string, ReactNode> = {
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  plan: (
    <>
      <rect x="6" y="3" width="12" height="18" rx="1" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  steps: <path d="M4 20h4v-5h4v-5h4v-5h4" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.3-4.3" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.4l2.6 2.6L16 9" />
    </>
  ),
  shield: <path d="M12 3l7 3v6c0 4-3 7-7 8-4-1-7-4-7-8V6z" />,
  memory: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="2.5" />
      <path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" />
      <path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20l1-4L16 5l3 3L8 19z" />
      <path d="M14 7l3 3" />
    </>
  ),
  layout: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="1" />
      <path d="M4 10h16M10 10v9" />
    </>
  ),
};

function StepIcon({ id }: { id?: string }) {
  const paths = id ? STEP_ICONS[id] : null;
  if (!paths) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}

// Ícono inline (tamaño 1em) que reemplaza símbolos/emoji dentro de texto o chrome.
function InlineIcon({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      className={`i-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
const IconCheck = ({ className }: { className?: string }) => (
  <InlineIcon className={className}>
    <path d="M5 13l4 4L19 7" />
  </InlineIcon>
);
const IconCross = ({ className }: { className?: string }) => (
  <InlineIcon className={className}>
    <path d="M6 6l12 12M18 6L6 18" />
  </InlineIcon>
);
const IconBolt = ({ className }: { className?: string }) => (
  <InlineIcon className={className}>
    <path d="M13 2L5 13.5h5L9 22l9-12h-5l1-8z" />
  </InlineIcon>
);
const IconWarn = ({ className }: { className?: string }) => (
  <InlineIcon className={className}>
    <path d="M12 3.5l9 16H3z" />
    <path d="M12 10v4.5M12 17.5h.01" />
  </InlineIcon>
);
const IconDoc = ({ className }: { className?: string }) => (
  <InlineIcon className={className}>
    <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" />
    <path d="M14 3v5h5" />
  </InlineIcon>
);
const IconCopy = ({ className }: { className?: string }) => (
  <InlineIcon className={className}>
    <rect x="9" y="9" width="11" height="11" rx="1.5" />
    <path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5V4.5A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
  </InlineIcon>
);

// Íconos de línea para las TARJETAS (tips, plantillas, botones de modo).
// Monocromáticos, heredan el acento por `currentColor`. Clave → paths.
const CARD_ICONS: Record<string, ReactNode> = {
  shield: <path d="M12 3l7 3v6c0 4-3 7-7 8-4-1-7-4-7-8V6z" />,
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.4l2.6 2.6L16 9" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2v3.2M12 18.8V22M22 12h-3.2M5.2 12H2M19.07 4.93l-2.26 2.26M7.19 16.81l-2.26 2.26M19.07 19.07l-2.26-2.26M7.19 7.19L4.93 4.93" />
    </>
  ),
  warn: (
    <>
      <path d="M12 3.5l9 16H3z" />
      <path d="M12 10v4.5M12 17.5h.01" />
    </>
  ),
  puzzle: (
    <path d="M10 4.5a1.7 1.7 0 0 1 3.4 0c0 .3-.1.6-.2.9.5.1 1.4.1 2.3 0a.6.6 0 0 1 .7.7c-.1.9-.1 1.8 0 2.3.3-.1.6-.2.9-.2a1.7 1.7 0 0 1 0 3.4c-.3 0-.6-.1-.9-.2.1.5.1 1.4 0 2.3a.6.6 0 0 1-.7.7c-.9-.1-1.8-.1-2.3 0 .1-.3.2-.6.2-.9a1.7 1.7 0 0 0-3.4 0c0 .3.1.6.2.9-.5-.1-1.4-.1-2.3 0a.6.6 0 0 1-.7-.7c.1-.9.1-1.8 0-2.3-.3.1-.6.2-.9.2a1.7 1.7 0 0 1 0-3.4c.3 0 .6.1.9.2-.1-.5-.1-1.4 0-2.3a.6.6 0 0 1 .7-.7c.9.1 1.8.1 2.3 0-.1-.3-.2-.6-.2-.9z" />
  ),
  doc: (
    <>
      <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" />
      <path d="M14 3v5h5" />
    </>
  ),
  play: <path d="M7 5l11 7-11 7z" />,
  plug: (
    <>
      <path d="M9 3v5M15 3v5" />
      <rect x="7" y="8" width="10" height="5" rx="1" />
      <path d="M12 13v4a3 3 0 0 0 3 3h2" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a4 4 0 0 0 5.6.4l2.4-2.4a4 4 0 0 0-5.6-5.6L11 7" />
      <path d="M14 11a4 4 0 0 0-5.6-.4L6 13a4 4 0 0 0 5.6 5.6L13 17" />
    </>
  ),
  slack: <path d="M10 4L8 20M16.5 4l-2 16M4.5 9.5H20M4 14.5h15.5" />,
  asana: (
    <>
      <circle cx="12" cy="6.2" r="2.4" />
      <circle cx="6.6" cy="15.4" r="2.4" />
      <circle cx="17.4" cy="15.4" r="2.4" />
    </>
  ),
  github: (
    <>
      <circle cx="7" cy="6" r="2.2" />
      <circle cx="7" cy="18" r="2.2" />
      <circle cx="17" cy="8.5" r="2.2" />
      <path d="M7 8.2v7.6M17 10.7c0 3.6-3.6 3.2-6.6 4.8" />
    </>
  ),
  merge: (
    <>
      <path d="M6 4v4a4 4 0 0 0 4 4h7" />
      <path d="M18 4v4a4 4 0 0 1-4 4" />
      <path d="M14 9l3 3-3 3" />
    </>
  ),
  fanout: (
    <>
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="5" cy="19" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
      <circle cx="19" cy="19" r="1.8" />
      <path d="M12 6.8 6.5 17.4" />
      <path d="M12 6.8v10.4" />
      <path d="M12 6.8 17.5 17.4" />
    </>
  ),
  bookmark: <path d="M7 3h10a1 1 0 0 1 1 1v17l-6-4-6 4V4a1 1 0 0 1 1-1z" />,
  return: (
    <>
      <path d="M9 14l-4-4 4-4" />
      <path d="M5 10h9a5 5 0 0 1 0 10H8" />
    </>
  ),
  paperclip: (
    <path d="M18 8.5l-7.8 7.8a3 3 0 0 1-4.2-4.2L13 4a2 2 0 0 1 2.8 2.8L8.3 14.3a.9.9 0 0 1-1.3-1.3l6.5-6.5" />
  ),
  terminal: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M7 9l3 3-3 3M13 15h4" />
    </>
  ),
  lightbulb: (
    <>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    </>
  ),
  command: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M14 9l-4 6" />
    </>
  ),
  rewind: <path d="M11 6l-7 6 7 6zM20 6l-7 6 7 6z" />,
  pipe: (
    <>
      <path d="M4 7h7a2 2 0 0 1 2 2v6a2 2 0 0 0 2 2h5" />
      <path d="M17 14l3 3-3 3" />
    </>
  ),
  robot: (
    <>
      <rect x="5" y="8" width="14" height="11" rx="2" />
      <path d="M12 8V5M9 5h6" />
      <path d="M9.5 13h.01M14.5 13h.01" />
      <path d="M2 12v3M22 12v3" />
    </>
  ),
  chart: (
    <>
      <path d="M3 21h18" />
      <rect x="5" y="11" width="3" height="7" />
      <rect x="10.5" y="6" width="3" height="12" />
      <rect x="16" y="9" width="3" height="9" />
    </>
  ),
  folder: (
    <path d="M4 6h5l2 2h7a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" />
  ),
  table: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="1" />
      <path d="M4 10h16M4 14.5h16M12 5v14" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="8" r="4" />
      <path d="M11 11l8 8M16 18l2-2M19 21l2-2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.3-4.3" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3.5 7l8.5 6 8.5-6" />
    </>
  ),
  swap: <path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5" />,
  alert: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  files: (
    <>
      <rect x="8" y="3" width="11" height="14" rx="1" />
      <path d="M5 7v12a1 1 0 0 0 1 1h9" />
    </>
  ),
  inspect: (
    <>
      <rect x="6" y="4" width="12" height="16" rx="1" />
      <path d="M9.5 4V3h5v1" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  mirror: (
    <>
      <rect x="3" y="5" width="7" height="14" rx="1" />
      <rect x="14" y="5" width="7" height="14" rx="1" />
      <path d="M12 3v18" />
    </>
  ),
  delta: <path d="M12 4l8 16H4z" />,
  code: <path d="M9 8l-4 4 4 4M15 8l4 4-4 4" />,
  health: <path d="M3 12h4l2-5 3 9 2-4h7" />,
  pencil: (
    <>
      <path d="M4 20l1-4L16 5l3 3L8 19z" />
      <path d="M14 7l3 3" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="9" cy="6" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="11" cy="18" r="2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="1" />
      <path d="M4 10h16M8 5V2M16 5V2" />
    </>
  ),
  bolt: <path d="M13 3l-6 10h6l-2 8 7-10h-7z" />,
};

function CardIcon({ id }: { id?: string }) {
  const paths = id ? CARD_ICONS[id] : null;
  if (!paths) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}

// Buzón de ideas tipo post-it (fijo, esquina inferior derecha, en todas las
// páginas). Guarda la nota en el backend → `ideas-equipo.md`.
function FeedbackNote() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  useEffect(() => {
    if (status === "saved" || status === "error") {
      const t = setTimeout(() => setStatus("idle"), 2600);
      return () => clearTimeout(t);
    }
  }, [status]);

  async function save() {
    if (!text.trim() || status === "saving") return;
    setStatus("saving");
    const ok = await saveNote(text);
    if (ok) {
      setText("");
      setStatus("saved");
    } else {
      setStatus("error");
    }
  }

  if (!open) {
    return (
      <>
        <div className="note-hint" aria-hidden="true">
          <span className="note-hint-text">
            Si quieres una lección de
            <br />
            algo que no ves, anótala.
          </span>
          <svg
            className="note-hint-arrow"
            viewBox="0 0 40 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 4c10 6 16 16 14 30" />
            <path d="M14 28l8 8 6-9" />
          </svg>
        </div>
        <button
          className="note-launcher"
          onClick={() => setOpen(true)}
          aria-label="Anotar una idea"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 4h10l4 4v12H5z" />
            <path d="M15 4v4h4" />
            <path d="M8 13h6M8 16h4" />
          </svg>
          Idea
        </button>
      </>
    );
  }

  return (
    <div className="note-pad">
      <div className="note-pad-head">
        <span className="note-pad-title">Ideas para el sitio</span>
        <button
          className="note-pad-close"
          onClick={() => setOpen(false)}
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
      <textarea
        className="note-pad-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribe aquí una idea de tu equipo…"
        spellCheck={true}
      />
      <div className="note-pad-foot">
        <span className="note-pad-status">
          {status === "saved"
            ? (
              <>
                ¡Guardada! <IconCheck />
              </>
            )
            : status === "error"
              ? "No se pudo guardar"
              : ""}
        </span>
        <button
          className="note-pad-save"
          onClick={save}
          disabled={status === "saving" || !text.trim()}
        >
          {status === "saving" ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}

export function App() {
  const [active, setActive] = useState<number | "home">("home");
  // El menú arranca compacto; el usuario lo expande si quiere el detalle.
  const [collapsed, setCollapsed] = useState(true);
  const [ready, setReady] = useState<boolean | null>(null);
  const [mode, setMode] = useState<string | undefined>();

  useEffect(() => {
    checkHealth().then((h) => {
      setReady(h.ready);
      setMode(h.mode);
    });
  }, []);

  const lesson = typeof active === "number" ? orderedLessons[active] : null;

  return (
    <div className={`app ${collapsed ? "collapsed" : ""}`}>
      <aside className="sidebar">
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expandir menú" : "Contraer menú"}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 7l-5 5 5 5" />
          </svg>
        </button>

        <button
          className="brand"
          onClick={() => setActive("home")}
          aria-label="Ir al inicio"
        >
          <span className="brand-mark">✦</span>
          <span className="brand-text">
            <span className="brand-title">Conoce a Claude</span>
            <span className="brand-sub">Opus 4.8 · tutorial interactivo</span>
          </span>
        </button>

        <nav>
          {orderedLessons.map((l, i) => {
            const newSection = l.section !== orderedLessons[i - 1]?.section;
            return (
              <Fragment key={l.id}>
                {newSection && (
                  <div
                    className={`nav-divider ${i === 0 ? "first" : ""} ${l.section}`}
                  >
                    <span className="nav-divider-full">
                      {SECTION_LABEL[l.section]}
                    </span>
                    <span className="nav-divider-short">
                      {SHARP_KICKER[l.section]}
                    </span>
                  </div>
                )}
                {MENU_SUBLEVELS[l.id] && (
                  <div className="nav-sublevel">
                    <span className="nav-sublevel-label">
                      {MENU_SUBLEVELS[l.id]}
                    </span>
                    <span className="nav-sublevel-line" aria-hidden="true" />
                  </div>
                )}
                <button
                  className={`nav-item ${i === active ? "active" : ""}`}
                  data-section={l.section}
                  onClick={() => setActive(i)}
                  title={l.title}
                >
                  <span className="nav-icon">
                    <NavIcon id={l.id} />
                  </span>
                  <span className="nav-text">
                    <strong>{l.title}</strong>
                    <small>{l.tagline}</small>
                  </span>
                  <span className={`nav-step ${isWildcard(l) ? "wild" : ""}`}>
                    {isWildcard(l) ? WILDCARD_BADGE : String(i + 1).padStart(2, "0")}
                  </span>
                </button>
              </Fragment>
            );
          })}
        </nav>

        <footer className="sidebar-foot">
          {ready === false && (
            <div className="key-warning">
              <IconWarn /> No se encontró el CLI <code>claude</code>. Instálalo e
              inicia sesión, luego reinicia.
            </div>
          )}
          {ready === true && (
            <div className="key-ok">
              <IconCheck /> Conectado{mode ? ` · modo ${mode}` : ""}
            </div>
          )}
          <p>Respuestas generadas en vivo por Claude Opus 4.8.</p>
        </footer>
      </aside>

      {lesson === null ? (
        <HomePage onNavigate={(i) => setActive(i)} />
      ) : lesson.kind === "compare" ? (
        <ComparePage key={lesson.id} lesson={lesson} />
      ) : lesson.kind === "vibe" ? (
        <VibePage key={lesson.id} lesson={lesson} />
      ) : lesson.kind === "fanout" ? (
        <FanoutPage key={lesson.id} lesson={lesson} />
      ) : lesson.kind === "library" ? (
        <LibraryPage key={lesson.id} lesson={lesson} />
      ) : lesson.kind === "connect" ? (
        <ConnectPage key={lesson.id} lesson={lesson} />
      ) : lesson.kind === "tips" ? (
        <TipsPage key={lesson.id} lesson={lesson} />
      ) : (
        <DemoPageSharp key={lesson.id} lesson={lesson} />
      )}

      {typeof active === "number" && (
        <LessonPager active={active} onNavigate={setActive} />
      )}
      <FeedbackNote />
    </div>
  );
}

// ---------- Pager: navegación entre lecciones de la MISMA sección ----------
// Fijo abajo-centro del área de contenido. Los topes salen solos: solo deja
// avanzar/retroceder si la lección vecina es de la misma sección (orderedLessons
// está agrupado por sección), así no se cruza de prompting a plantillas, etc.
function LessonPager({
  active,
  onNavigate,
}: {
  active: number;
  onNavigate: (i: number) => void;
}) {
  const current = orderedLessons[active];
  if (!current) return null;
  const prev =
    active > 0 && orderedLessons[active - 1].section === current.section
      ? active - 1
      : null;
  const next =
    active < orderedLessons.length - 1 &&
    orderedLessons[active + 1].section === current.section
      ? active + 1
      : null;
  const total = lessons.filter((l) => l.section === current.section).length;

  return (
    <div
      className="lesson-pager"
      data-section={current.section}
      aria-label="Navegación entre lecciones de la sección"
    >
      <div className="pager-inner">
        <button
          className="pager-btn prev"
          onClick={() => prev !== null && onNavigate(prev)}
          disabled={prev === null}
          aria-label="Lección anterior"
        >
          <span className="pager-arrow" aria-hidden="true">
            ‹
          </span>
          <span className="pager-label">Anterior</span>
        </button>
        <span className="pager-pos">
          {sectionPad(current)} / {String(total).padStart(2, "0")}
        </span>
        <button
          className="pager-btn next"
          onClick={() => next !== null && onNavigate(next)}
          disabled={next === null}
          aria-label="Lección siguiente"
        >
          <span className="pager-label">Siguiente</span>
          <span className="pager-arrow" aria-hidden="true">
            ›
          </span>
        </button>
      </div>
    </div>
  );
}

// ---------- Cascarón «sharp» compartido (hero + barra compacta + parallax) ----------
// Lo usan las tres clases de página migradas (demo, compare, vibe): renderiza el
// hero editorial full-bleed, el encabezado compacto fijo que aparece al scrollear
// y el parallax del número gigante. El cuerpo de cada página va como `children`.
function SharpShell({
  lesson,
  children,
}: {
  lesson: Lesson;
  children: ReactNode;
}) {
  const mainRef = useRef<HTMLElement>(null);
  const cueRef = useRef<HTMLSpanElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const [compact, setCompact] = useState(false);
  const compactRef = useRef(false);

  // Scroll del hero: (1) parallax sutil del número gigante (off en
  // reduced-motion) y (2) alterna el encabezado compacto fijo cuando el
  // «Desplázate» alcanza el borde superior. Un solo handler rAF.
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = main.scrollTop;
        if (!reduce && numRef.current)
          numRef.current.style.transform = `translateY(${y * 0.22}px)`;
        const cue = cueRef.current;
        const next = cue ? cue.getBoundingClientRect().top <= 0 : y > 480;
        if (next !== compactRef.current) {
          compactRef.current = next;
          setCompact(next);
        }
      });
    };
    main.addEventListener("scroll", onScroll, { passive: true });
    return () => main.removeEventListener("scroll", onScroll);
  }, []);

  const pad = sectionBadge(lesson);
  const wild = isWildcard(lesson);
  const kicker = SHARP_KICKER[lesson.section];

  return (
    <main className="content sharp" data-section={lesson.section} ref={mainRef}>
      <div className={`sharp-bar ${compact ? "in" : ""}`} aria-hidden={!compact}>
        <div className="sharp-bar-inner">
          <span className="sharp-bar-kicker">
            {kicker} · {pad}
          </span>
          <span className="sharp-bar-sep" aria-hidden="true" />
          <span className="sharp-bar-title">{lesson.title}</span>
        </div>
      </div>

      <header className="sharp-hero">
        <span
          className={`sharp-bignum ${wild ? "wild" : ""}`}
          aria-hidden="true"
          ref={numRef}
        >
          {pad}
        </span>
        <div className="sharp-hero-inner">
          <span className="sharp-kicker">
            {kicker} · {pad}
          </span>
          <h1 className="sharp-title">{lesson.title}</h1>
          <p className="sharp-lede">{lesson.description}</p>
          <span className="sharp-scrollcue" ref={cueRef}>
            Desplázate
          </span>
        </div>
      </header>

      {children}
    </main>
  );
}

// ---------- Página de demo «sharp» (Fundamentos + Avanzados) ----------
// Layout editorial dentro de <SharpShell>. Maneja los tres modos de streaming:
// respuesta normal, razonamiento (thinking) y agéntico (con transcripción).

function DemoPageSharp({ lesson }: { lesson: DemoLesson }) {
  const [prompt, setPrompt] = useState(lesson.prompt);
  const [thinking, setThinking] = useState("");
  const [answer, setAnswer] = useState("");
  const [parts, setParts] = useState<Part[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const [usage, setUsage] = useState<{ input: number; output: number } | null>(
    null,
  );
  const abortRef = useRef<AbortController | null>(null);
  const taRef = useAutosize(prompt);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function run() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setThinking("");
    setAnswer("");
    setParts([]);
    setError("");
    setUsage(null);
    setStatus("loading");
    await streamChat(
      {
        system: lesson.system,
        prompt,
        thinking: lesson.thinking,
        agentic: lesson.agentic,
      },
      (ev) => {
        if (ev.type === "thinking") setThinking((t) => t + ev.text);
        else if (ev.type === "text") {
          if (lesson.agentic) setParts((p) => pushText(p, ev.text));
          else setAnswer((a) => a + ev.text);
        } else if (ev.type === "tool") {
          setParts((p) => [
            ...p,
            { kind: "tool", name: ev.name, detail: ev.detail },
          ]);
        } else if (ev.type === "tool_result") {
          setParts((p) => attachResult(p, ev.output, ev.is_error));
        } else if (ev.type === "done") {
          setUsage(ev.usage ?? null);
          setStatus("done");
        } else if (ev.type === "error") {
          setError(ev.message);
          setStatus("error");
        }
      },
      controller.signal,
    );
    setStatus((s) => (s === "loading" ? "done" : s));
  }

  const pad = sectionPad(lesson);
  const loading = status === "loading";

  return (
    <SharpShell lesson={lesson}>
      <section className="sharp-stage">
        <Reveal className="sharp-field">
          <div className="sharp-label">
            <span className="num">{pad}</span> Prompt
          </div>
          <textarea
            ref={taRef}
            className="sharp-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            spellCheck={false}
          />
          <div className="sharp-actions">
            <button
              className="sharp-run"
              onClick={run}
              disabled={loading || !prompt.trim()}
            >
              {loading ? "Generando…" : "Enviar a Claude →"}
            </button>
            {usage && (
              <span className="sharp-usage">
                {usage.input} tok entrada · {usage.output} salida
              </span>
            )}
          </div>
        </Reveal>
      </section>

      {status === "error" && (
        <div className="sharp-stage">
          <div className="error-box">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {thinking && (
        <Reveal as="section" className="sharp-think">
          <div className="sharp-label">Razonamiento de Claude</div>
          <pre className="sharp-think-pre">{thinking}</pre>
        </Reveal>
      )}

      {lesson.agentic
        ? (parts.length > 0 || loading) && (
            <Reveal as="section" className="sharp-answer sharp-agentic">
              <div className="sharp-label">
                <span className={`dot ${loading ? "live" : ""}`} /> Transcripción
                del agente
              </div>
              {parts.map((part, i) =>
                part.kind === "text" ? (
                  part.text.trim() ? (
                    <Markdown key={i}>{part.text}</Markdown>
                  ) : null
                ) : (
                  <ToolCall key={i} part={part} />
                ),
              )}
              {loading && <span className="cursor">▋</span>}
            </Reveal>
          )
        : (answer || loading) && (
            <Reveal as="section" className="sharp-answer">
              <div className="sharp-label">
                <span className={`dot ${loading ? "live" : ""}`} /> Respuesta
              </div>
              <Markdown>{answer}</Markdown>
              {loading && <span className="cursor">▋</span>}
            </Reveal>
          )}

      <Reveal as="aside" className="sharp-note">
        <span className="sharp-note-label">Qué observar</span>
        <p>{lesson.notice}</p>
      </Reveal>

      {lesson.takeaway && (
        <Reveal as="aside" className="sharp-takeaway">
          <span className="sharp-note-label accent">Por qué importa</span>
          <Markdown>{lesson.takeaway}</Markdown>
        </Reveal>
      )}

      {lesson.template && (
        <Reveal className="sharp-tmpl">
          <TemplateBlock template={lesson.template} />
        </Reveal>
      )}
    </SharpShell>
  );
}

// ---------- Página de buenas prácticas: comparación «antes vs. después» ----------

type RunState = {
  answer: string;
  status: "idle" | "loading" | "done" | "error";
  usage: { input: number; output: number } | null;
  error: string;
};
const EMPTY_RUN: RunState = { answer: "", status: "idle", usage: null, error: "" };

function ComparePage({ lesson }: { lesson: CompareLesson }) {
  const [weakPrompt, setWeakPrompt] = useState(lesson.weak.prompt);
  const [strongPrompt, setStrongPrompt] = useState(lesson.strong.prompt);
  const [runs, setRuns] = useState<{ weak: RunState; strong: RunState }>({
    weak: EMPTY_RUN,
    strong: EMPTY_RUN,
  });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  function streamInto(
    side: "weak" | "strong",
    prompt: string,
    signal: AbortSignal,
  ) {
    setRuns((r) => ({ ...r, [side]: { ...EMPTY_RUN, status: "loading" } }));
    return streamChat(
      { system: lesson.system, prompt, thinking: false },
      (ev) => {
        setRuns((r) => {
          const cur = r[side];
          if (ev.type === "text")
            return { ...r, [side]: { ...cur, answer: cur.answer + ev.text } };
          if (ev.type === "done")
            return {
              ...r,
              [side]: { ...cur, status: "done", usage: ev.usage ?? null },
            };
          if (ev.type === "error")
            return {
              ...r,
              [side]: { ...cur, status: "error", error: ev.message },
            };
          return r;
        });
      },
      signal,
    ).then(() => {
      setRuns((r) =>
        r[side].status === "loading"
          ? { ...r, [side]: { ...r[side], status: "done" } }
          : r,
      );
    });
  }

  function freshController() {
    abortRef.current?.abort();
    const c = new AbortController();
    abortRef.current = c;
    return c.signal;
  }

  function runBoth() {
    const signal = freshController();
    streamInto("weak", weakPrompt, signal);
    streamInto("strong", strongPrompt, signal);
  }

  function runOne(side: "weak" | "strong") {
    const signal = freshController();
    streamInto(side, side === "weak" ? weakPrompt : strongPrompt, signal);
  }

  const loading =
    runs.weak.status === "loading" || runs.strong.status === "loading";

  return (
    <SharpShell lesson={lesson}>
      <Reveal as="aside" className="sharp-principle" variant="left">
        <span className="sharp-note-label accent">El principio</span>
        <p>{lesson.principle}</p>
      </Reveal>

      {lesson.explainer && (
        <section className="sharp-explainer">
          {lesson.explainer.map((b, i) => (
            <Reveal key={b.heading} className="sharp-explain-block" delay={i * 90}>
              <h4>{b.heading}</h4>
              <Markdown>{b.body}</Markdown>
            </Reveal>
          ))}
        </section>
      )}

      <section className="sharp-anatomy">
        <Reveal>
          <span className="sharp-note-label">Anatomía de un buen prompt</span>
        </Reveal>
        <div className="sharp-anatomy-grid">
          {lesson.anatomy.map((a, i) => (
            <Reveal key={a.k} className="sharp-chip" delay={i * 60}>
              <strong>{a.k}</strong>
              <span>{a.v}</span>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="sharp-compare">
        <Reveal className="sharp-compare-actions">
          <button className="sharp-run" onClick={runBoth} disabled={loading}>
            {loading ? "Generando…" : "Ejecutar y comparar →"}
          </button>
          <span className="sharp-hint">o ejecuta cada lado por separado</span>
        </Reveal>
        <div className="sharp-compare-grid">
          <PromptSide
            tone="weak"
            meta={lesson.weak}
            prompt={weakPrompt}
            setPrompt={setWeakPrompt}
            run={() => runOne("weak")}
            state={runs.weak}
            disabled={loading}
          />
          <PromptSide
            tone="strong"
            meta={lesson.strong}
            prompt={strongPrompt}
            setPrompt={setStrongPrompt}
            run={() => runOne("strong")}
            state={runs.strong}
            disabled={loading}
          />
        </div>
      </section>

      <Reveal as="aside" className="sharp-note">
        <span className="sharp-note-label">Qué observar</span>
        <p>{lesson.notice}</p>
      </Reveal>

      {lesson.takeaway && (
        <Reveal as="aside" className="sharp-takeaway">
          <span className="sharp-note-label accent">La lección</span>
          <Markdown>{lesson.takeaway}</Markdown>
        </Reveal>
      )}

      {lesson.template && (
        <Reveal className="sharp-tmpl">
          <TemplateBlock template={lesson.template} />
        </Reveal>
      )}
    </SharpShell>
  );
}

function PromptSide({
  tone,
  meta,
  prompt,
  setPrompt,
  run,
  state,
  disabled,
}: {
  tone: "weak" | "strong";
  meta: ComparePrompt;
  prompt: string;
  setPrompt: (v: string) => void;
  run: () => void;
  state: RunState;
  disabled: boolean;
}) {
  const taRef = useAutosize(prompt);
  const showAnswer =
    state.answer || state.status === "loading" || state.status === "error";

  return (
    <div className={`sharp-side sharp-side-${tone}`}>
      <div className="sharp-side-label">
        <span className="sharp-side-mark">
          {tone === "weak" ? <IconCross /> : <IconCheck />}
        </span>
        {meta.label}
        {state.usage && (
          <span className="sharp-side-usage">{state.usage.output} tok</span>
        )}
      </div>
      <textarea
        ref={taRef}
        className="sharp-input"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        spellCheck={false}
      />
      <p className="sharp-side-note">{meta.note}</p>
      <button className="sharp-run small" onClick={run} disabled={disabled}>
        {state.status === "loading" ? "Generando…" : "Ejecutar este →"}
      </button>
      {showAnswer && (
        <div className="sharp-side-answer">
          <div className="sharp-label">
            <span className={`dot ${state.status === "loading" ? "live" : ""}`} />
            Respuesta
          </div>
          {state.status === "error" ? (
            <div className="error-box">{state.error}</div>
          ) : (
            <>
              <Markdown>{state.answer}</Markdown>
              {state.status === "loading" && <span className="cursor">▋</span>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Página de proceso: vibe coding (pasos + ejemplo en vivo) ----------

function VibePage({ lesson }: { lesson: VibeLesson }) {
  return (
    <SharpShell lesson={lesson}>
      {lesson.explainer ? (
        <section className="sharp-explainer">
          {lesson.explainer.map((b, i) => (
            <Reveal key={b.heading} className="sharp-explain-block" delay={i * 90}>
              <h4>{b.heading}</h4>
              <Markdown>{b.body}</Markdown>
            </Reveal>
          ))}
        </section>
      ) : (
        lesson.principle && (
          <Reveal as="aside" className="sharp-principle" variant="left">
            <span className="sharp-note-label accent">El principio</span>
            <p>{lesson.principle}</p>
          </Reveal>
        )
      )}

      <ol className="sharp-steps">
        {lesson.steps.map((s, i) => (
          <Reveal
            as="li"
            key={i}
            className="sharp-step"
            variant={i % 2 ? "right" : "left"}
          >
            <div className="sharp-step-num">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="sharp-step-body">
              <h3 className="sharp-step-title">
                <span className="sharp-step-icon">
                  <StepIcon id={s.icon} />
                </span>
                {s.title}
              </h3>
              <Markdown>{s.body}</Markdown>
              {s.prompt && (
                <div className="sharp-step-prompt">
                  <span className="sharp-step-prompt-label">Ejemplo</span>
                  <code>{s.prompt}</code>
                </div>
              )}
            </div>
          </Reveal>
        ))}
      </ol>

      {lesson.live && <LiveAgentRun live={lesson.live} />}

      <Reveal as="aside" className="sharp-note">
        <span className="sharp-note-label">Qué observar</span>
        <p>{lesson.notice}</p>
      </Reveal>

      {lesson.takeaway && (
        <Reveal as="aside" className="sharp-takeaway">
          <span className="sharp-note-label accent">La lección</span>
          <Markdown>{lesson.takeaway}</Markdown>
        </Reveal>
      )}

      {lesson.template && (
        <Reveal className="sharp-tmpl">
          <TemplateBlock template={lesson.template} />
        </Reveal>
      )}
    </SharpShell>
  );
}

/** Ejemplo agéntico de código en vivo (reusa la transcripción del agente). */
function LiveAgentRun({ live }: { live: NonNullable<VibeLesson["live"]> }) {
  const [prompt, setPrompt] = useState(live.prompt);
  const [parts, setParts] = useState<Part[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const [usage, setUsage] = useState<{ input: number; output: number } | null>(
    null,
  );
  const abortRef = useRef<AbortController | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const taRef = useAutosize(prompt);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function run() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setParts([]);
    setError("");
    setUsage(null);
    setStatus("loading");

    await streamChat(
      {
        system: live.system,
        prompt,
        agentic: true,
        agenticTask: "code",
      },
      (ev) => {
        if (ev.type === "text") setParts((p) => pushText(p, ev.text));
        else if (ev.type === "tool") {
          setParts((p) => [
            ...p,
            { kind: "tool", name: ev.name, detail: ev.detail },
          ]);
        } else if (ev.type === "tool_result") {
          setParts((p) => attachResult(p, ev.output, ev.is_error));
        } else if (ev.type === "done") {
          setUsage(ev.usage ?? null);
          setStatus("done");
        } else if (ev.type === "error") {
          setError(ev.message);
          setStatus("error");
        }
        boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
      },
      controller.signal,
    );
    setStatus((s) => (s === "loading" ? "done" : s));
  }

  return (
    <section className="sharp-live">
      <Reveal className="sharp-live-intro">
        <span className="sharp-live-tag">
          <IconBolt /> En vivo
        </span>
        <p>{live.intro}</p>
      </Reveal>

      <div className="sharp-field">
        <div className="sharp-label">Petición</div>
        <textarea
          ref={taRef}
          className="sharp-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          spellCheck={false}
        />
        <div className="sharp-actions">
          <button
            className="sharp-run"
            onClick={run}
            disabled={status === "loading" || !prompt.trim()}
          >
            {status === "loading" ? "Construyendo…" : "Construir con Claude →"}
          </button>
          {usage && (
            <span className="sharp-usage">
              {usage.input} tok entrada · {usage.output} salida
            </span>
          )}
        </div>
      </div>

      {status === "error" && (
        <div className="error-box">
          <strong>Error:</strong> {error}
        </div>
      )}

      {(parts.length > 0 || status === "loading") && (
        <div className="sharp-answer sharp-agentic" ref={boxRef}>
          <div className="sharp-label">
            <span className={`dot ${status === "loading" ? "live" : ""}`} /> Claude
            programando
          </div>
          {parts.map((part, i) =>
            part.kind === "text" ? (
              part.text.trim() ? (
                <Markdown key={i}>{part.text}</Markdown>
              ) : null
            ) : (
              <ToolCall key={i} part={part} />
            ),
          )}
          {status === "loading" && <span className="cursor">▋</span>}
        </div>
      )}
    </section>
  );
}

// ---------- Página de agentes en paralelo (fan-out) ----------

function FanoutPage({ lesson }: { lesson: FanoutLesson }) {
  return (
    <SharpShell lesson={lesson}>
      {lesson.explainer ? (
        <section className="sharp-explainer">
          {lesson.explainer.map((b, i) => (
            <Reveal key={b.heading} className="sharp-explain-block" delay={i * 90}>
              <h4>{b.heading}</h4>
              <Markdown>{b.body}</Markdown>
            </Reveal>
          ))}
        </section>
      ) : (
        <Reveal as="aside" className="sharp-principle" variant="left">
          <span className="sharp-note-label accent">El principio</span>
          <p>{lesson.principle}</p>
        </Reveal>
      )}

      {lesson.details && (
        <section className="fanout-details">
          <Reveal>
            <span className="sharp-note-label accent">
              En la práctica · cómo usarlos bien
            </span>
          </Reveal>
          <div className="fanout-details-grid">
            {lesson.details.map((d, i) => (
              <Reveal key={d.heading} className="fanout-detail" delay={(i % 2) * 70}>
                <h4>{d.heading}</h4>
                <Markdown>{d.body}</Markdown>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="sharp-anatomy">
        <Reveal>
          <span className="sharp-note-label">Cuándo conviene el fan-out</span>
        </Reveal>
        <div className="sharp-anatomy-grid">
          {lesson.anatomy.map((a, i) => (
            <Reveal key={a.k} className="sharp-chip" delay={i * 60}>
              <strong>{a.k}</strong>
              <span>{a.v}</span>
            </Reveal>
          ))}
        </div>
      </section>

      <FanoutRun lesson={lesson} />

      <Reveal as="aside" className="sharp-note">
        <span className="sharp-note-label">Qué observar</span>
        <p>{lesson.notice}</p>
      </Reveal>

      {lesson.takeaway && (
        <Reveal as="aside" className="sharp-takeaway">
          <span className="sharp-note-label accent">La lección</span>
          <Markdown>{lesson.takeaway}</Markdown>
        </Reveal>
      )}

      {lesson.template && (
        <Reveal className="sharp-tmpl">
          <TemplateBlock template={lesson.template} />
        </Reveal>
      )}
    </SharpShell>
  );
}

/** Un subagente del fan-out: su carril en la visualización. */
type Subagent = {
  id: string;
  title: string;
  /** Última actividad reportada (task_progress). */
  activity: string;
  status: "running" | "done";
  /** Ficha final que devolvió el subagente. */
  result?: string;
};

/** Demo en vivo del fan-out: el agente lanza subagentes reales en paralelo. */
function FanoutRun({ lesson }: { lesson: FanoutLesson }) {
  const [prompt, setPrompt] = useState(lesson.live.prompt);
  const [parts, setParts] = useState<Part[]>([]); // narración del coordinador
  const [subs, setSubs] = useState<Record<string, Subagent>>({});
  const [order, setOrder] = useState<string[]>([]); // orden de aparición
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const [usage, setUsage] = useState<{ input: number; output: number } | null>(
    null,
  );
  const abortRef = useRef<AbortController | null>(null);
  const taRef = useAutosize(prompt);

  useEffect(() => () => abortRef.current?.abort(), []);

  /** Crea o actualiza un subagente por id (upsert). */
  function upsertSub(id: string, patch: Partial<Subagent>) {
    setSubs((s) => {
      const prev = s[id] ?? {
        id,
        title: "Subagente",
        activity: "",
        status: "running" as const,
      };
      return { ...s, [id]: { ...prev, ...patch } };
    });
    setOrder((o) => (o.includes(id) ? o : [...o, id]));
  }

  async function run() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setParts([]);
    setSubs({});
    setOrder([]);
    setError("");
    setUsage(null);
    setStatus("loading");

    await streamChat(
      {
        system: lesson.live.system,
        prompt,
        agentic: true,
        agenticTask: "fanout",
      },
      (ev) => {
        if (ev.type === "text") setParts((p) => pushText(p, ev.text));
        else if (ev.type === "tool")
          setParts((p) => [
            ...p,
            { kind: "tool", name: ev.name, detail: ev.detail },
          ]);
        else if (ev.type === "tool_result")
          setParts((p) => attachResult(p, ev.output, ev.is_error));
        else if (ev.type === "subagent") {
          if (ev.phase === "spawn" || ev.phase === "started")
            upsertSub(ev.id, {
              status: "running",
              ...(ev.title ? { title: ev.title } : {}),
            });
          else if (ev.phase === "progress")
            upsertSub(ev.id, { activity: ev.title ?? "" });
          else if (ev.phase === "done")
            upsertSub(ev.id, { status: "done", activity: "" });
          else if (ev.phase === "result")
            upsertSub(ev.id, { status: "done", result: ev.output ?? "" });
        } else if (ev.type === "done") {
          setUsage(ev.usage ?? null);
          setStatus("done");
        } else if (ev.type === "error") {
          setError(ev.message);
          setStatus("error");
        }
      },
      controller.signal,
    );
    setStatus((s) => (s === "loading" ? "done" : s));
  }

  const lanes = order.map((id) => subs[id]).filter(Boolean);
  const runningCount = lanes.filter((l) => l.status === "running").length;
  const started = status !== "idle";
  // Texto del coordinador (narración + diccionario integrado).
  const coordText = parts
    .filter((p) => p.kind === "text")
    .map((p) => (p.kind === "text" ? p.text : ""))
    .join("");

  return (
    <section className="sharp-live sharp-fanout">
      <Reveal className="sharp-live-intro">
        <span className="sharp-live-tag">
          <IconBolt /> En vivo
        </span>
        <p>{lesson.live.intro}</p>
      </Reveal>

      <div className="sharp-field">
        <div className="sharp-label">Petición al coordinador</div>
        <textarea
          ref={taRef}
          className="sharp-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          spellCheck={false}
        />
        <div className="sharp-actions">
          <button
            className="sharp-run"
            onClick={run}
            disabled={status === "loading" || !prompt.trim()}
          >
            {status === "loading"
              ? "Subagentes trabajando…"
              : "Lanzar subagentes en paralelo →"}
          </button>
          {usage && (
            <span className="sharp-usage">
              {usage.input} tok entrada · {usage.output} salida
            </span>
          )}
        </div>
      </div>

      {status === "error" && (
        <div className="error-box">
          <strong>Error:</strong> {error}
        </div>
      )}

      {started && (lanes.length > 0 || status === "loading") && (
        <div className="fanout-stage">
          <div className="fanout-lanes-head">
            <span className="fanout-count">
              {lanes.length || "…"} subagente{lanes.length === 1 ? "" : "s"} en
              paralelo
            </span>
            {runningCount > 0 && (
              <span className="fanout-running">
                <span className="dot live" /> {runningCount} activo
                {runningCount === 1 ? "" : "s"}
              </span>
            )}
          </div>

          <div className="fanout-lanes">
            {lanes.map((l) => (
              <div key={l.id} className="fanout-lane" data-status={l.status}>
                <div className="fanout-lane-head">
                  <span className="fanout-lane-dot" aria-hidden="true">
                    {l.status === "done" ? (
                      <IconCheck className="i-lane" />
                    ) : (
                      <span className="dot live" />
                    )}
                  </span>
                  <span className="fanout-lane-title">{l.title}</span>
                  <span className="fanout-lane-state">
                    {l.status === "done"
                      ? l.result
                        ? "ficha lista"
                        : "listo"
                      : l.activity || "arrancando…"}
                  </span>
                </div>
                {l.result && (
                  <details className="fanout-lane-result">
                    <summary>Ver ficha</summary>
                    <Markdown>{l.result}</Markdown>
                  </details>
                )}
              </div>
            ))}
            {status === "loading" && lanes.length === 0 && (
              <div className="fanout-lane" data-status="running">
                <div className="fanout-lane-head">
                  <span className="fanout-lane-dot">
                    <span className="dot live" />
                  </span>
                  <span className="fanout-lane-title">
                    El coordinador está repartiendo el trabajo…
                  </span>
                </div>
              </div>
            )}
          </div>

          {coordText.trim() && (
            <div className="fanout-coord">
              <div className="sharp-label">
                <span
                  className={`dot ${status === "loading" ? "live" : ""}`}
                />{" "}
                Coordinador · integración
              </div>
              <Markdown>{coordText}</Markdown>
              {status === "loading" && <span className="cursor">▋</span>}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ---------- Página de biblioteca de plantillas ----------

function LibraryPage({ lesson }: { lesson: LibraryLesson }) {
  return (
    <SharpShell lesson={lesson}>
      <Reveal as="aside" className="sharp-lead" variant="left">
        <span className="sharp-note-label accent">Cómo usarlas</span>
        <p>{lesson.intro}</p>
      </Reveal>

      <section className="sharp-templates">
        {lesson.templates.map((t, i) => (
          <Reveal key={t.id} delay={(i % 2) * 80}>
            <TemplateCardView card={t} />
          </Reveal>
        ))}
      </section>
    </SharpShell>
  );
}

/** Una tarjeta de plantilla: copiar siempre; «probar» si es runnable. */
function TemplateCardView({ card }: { card: TemplateCard }) {
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function run() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setAnswer("");
    setError("");
    setStatus("loading");

    await streamChat(
      { system: card.system, prompt: card.example ?? card.template, thinking: false },
      (ev) => {
        if (ev.type === "text") setAnswer((a) => a + ev.text);
        else if (ev.type === "done") setStatus("done");
        else if (ev.type === "error") {
          setError(ev.message);
          setStatus("error");
        }
      },
      controller.signal,
    );
    setStatus((s) => (s === "loading" ? "done" : s));
  }

  const showAnswer =
    answer || status === "loading" || status === "error";

  return (
    <section className="sharp-tcard">
      <header className="sharp-tcard-head">
        <span className="sharp-tcard-title">
          <span className="sharp-tcard-icon">
            <CardIcon id={card.icon} />
          </span>
          {card.title}
        </span>
        <CopyButton text={card.template} />
      </header>
      <div className="sharp-tcard-body">
        <p className="sharp-tcard-use">{card.use}</p>
        <pre className="sharp-tcard-text">{card.template}</pre>
        {card.note && (
          <p className="sharp-tcard-note">
            <IconWarn /> {card.note}
          </p>
        )}
        {card.runnable && (
          <div className="sharp-tcard-actions">
            <button
              className="sharp-run small"
              onClick={run}
              disabled={status === "loading"}
            >
              {status === "loading" ? "Generando…" : "Probar ejemplo →"}
            </button>
            <span className="sharp-hint">corre un caso ya rellenado</span>
          </div>
        )}
        {showAnswer && (
          <div className="sharp-tcard-answer">
            <div className="sharp-label">
              <span className={`dot ${status === "loading" ? "live" : ""}`} />
              Resultado del ejemplo
            </div>
            {status === "error" ? (
              <div className="error-box">{error}</div>
            ) : (
              <>
                <Markdown>{answer}</Markdown>
                {status === "loading" && <span className="cursor">▋</span>}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ---------- Página «conecta tus apps» (Plantillas) ----------
// Convierte a Claude Code en asistente de trabajo enchufando apps externas vía
// MCP. Una intro de MCP y, por cada app, un mini-tutorial de conexión seguido de
// sus plantillas (de copiar; corren en el Claude Code del propio miembro).

function ConnectPage({ lesson }: { lesson: ConnectLesson }) {
  return (
    <SharpShell lesson={lesson}>
      <Reveal as="aside" className="sharp-lead" variant="left">
        <span className="sharp-note-label accent">Cómo usarlas</span>
        <p>{lesson.intro}</p>
      </Reveal>

      {lesson.explainer && (
        <section className="sharp-explainer">
          {lesson.explainer.map((b, i) => (
            <Reveal key={b.heading} className="sharp-explain-block" delay={i * 90}>
              <h4>{b.heading}</h4>
              <Markdown>{b.body}</Markdown>
            </Reveal>
          ))}
        </section>
      )}

      {lesson.apps.map((app) => (
        <Reveal as="section" key={app.id} className="connect-app">
          <header className="connect-app-head">
            <span className="connect-app-icon">
              <CardIcon id={app.icon} />
            </span>
            <div className="connect-app-meta">
              <h2 className="connect-app-name">{app.name}</h2>
              <p className="connect-app-blurb">{app.blurb}</p>
            </div>
            {app.endpoint && (
              <code className="connect-app-endpoint">{app.endpoint}</code>
            )}
          </header>

          <div className="connect-setup">
            <span className="sharp-note-label accent">Conéctala (una vez)</span>
            <ol className="connect-steps">
              {app.steps.map((s, i) => (
                <li key={i} className="connect-step">
                  <div className="connect-step-body">
                    <Markdown>{s.body}</Markdown>
                  </div>
                  {s.code && (
                    <div className="connect-code">
                      <pre>{s.code}</pre>
                      <CopyButton text={s.code} />
                    </div>
                  )}
                </li>
              ))}
            </ol>
            {app.security && (
              <div className="connect-security">
                <IconWarn />
                <Markdown>{app.security}</Markdown>
              </div>
            )}
          </div>

          <div className="connect-templates">
            <span className="sharp-note-label accent">Plantillas</span>
            {app.templates.map((t) => (
              <section key={t.id} className="sharp-tcard">
                <header className="sharp-tcard-head">
                  <span className="sharp-tcard-title">{t.title}</span>
                  <CopyButton text={t.template} />
                </header>
                <div className="sharp-tcard-body">
                  <p className="sharp-tcard-use">{t.use}</p>
                  <pre className="sharp-tcard-text">{t.template}</pre>
                </div>
              </section>
            ))}
          </div>
        </Reveal>
      ))}

      {lesson.takeaway && (
        <Reveal as="aside" className="sharp-takeaway">
          <span className="sharp-note-label accent">Por qué importa</span>
          <Markdown>{lesson.takeaway}</Markdown>
        </Reveal>
      )}
    </SharpShell>
  );
}

// ---------- Ejercicios interactivos de las páginas de tips ----------

type Artifact = { name: string; exists: boolean; content: string };

/** Estado de una corrida agéntica (transcripción + artefacto + estado). */
type AgentRun = {
  parts: Part[];
  artifact: Artifact | null;
  status: "loading" | "done" | "error";
  error?: string;
};

/** Aplica un evento de stream al estado de una corrida (transcripción). */
function reduceRun(run: AgentRun, ev: StreamEvent): AgentRun {
  switch (ev.type) {
    case "text":
      return { ...run, parts: pushText(run.parts, ev.text) };
    case "tool":
      return {
        ...run,
        parts: [...run.parts, { kind: "tool", name: ev.name, detail: ev.detail }],
      };
    case "tool_result":
      return { ...run, parts: attachResult(run.parts, ev.output, ev.is_error) };
    case "done":
      return { ...run, status: "done", artifact: ev.artifact ?? run.artifact };
    case "error":
      return { ...run, status: "error", error: ev.message };
    default:
      return run;
  }
}

/** Renderiza una transcripción agéntica (texto + tarjetas de herramienta). */
function Transcript({ parts }: { parts: Part[] }) {
  return (
    <>
      {parts.map((part, i) =>
        part.kind === "text" ? (
          part.text.trim() ? (
            <Markdown key={i}>{part.text}</Markdown>
          ) : null
        ) : (
          <ToolCall key={i} part={part} />
        ),
      )}
    </>
  );
}

/** Insignia del artefacto: si el agente creó el archivo esperado y su contenido. */
function ArtifactBadge({ artifact }: { artifact: Artifact }) {
  return (
    <div className={`sharp-artifact ${artifact.exists ? "ok" : "no"}`}>
      <div className="sharp-artifact-row">
        <span className="sharp-artifact-state">
          {artifact.exists ? (
            <>
              <IconCheck /> archivo creado
            </>
          ) : (
            <>
              <IconCross /> archivo NO creado
            </>
          )}
        </span>
        <code className="sharp-artifact-name">{artifact.name}</code>
      </div>
      {artifact.exists && artifact.content && (
        <pre className="sharp-artifact-content">{artifact.content}</pre>
      )}
    </div>
  );
}

/** Ejercicio de «modos de ejecución»: misma tarea, varios modos, comparación. */
function ModePlayground({ pg }: { pg: Extract<TipsPlayground, { kind: "modes" }> }) {
  // Una sola corrida visible a la vez: al elegir un modo se limpia la anterior,
  // así solo observas la respuesta del modo seleccionado.
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [run, setRun] = useState<AgentRun | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function runMode(id: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setActiveMode(id);
    setRun({ parts: [], artifact: null, status: "loading" });

    await streamChat(
      {
        system: pg.system,
        prompt: pg.task,
        agentic: true,
        agenticTask: "modes",
        permissionMode: id as
          | "default"
          | "plan"
          | "acceptEdits"
          | "bypassPermissions",
      },
      (ev) => setRun((r) => (r ? reduceRun(r, ev) : r)),
      controller.signal,
    );
    setRun((r) => (r && r.status === "loading" ? { ...r, status: "done" } : r));
  }

  const m = pg.modes.find((x) => x.id === activeMode);
  const loading = run?.status === "loading";

  return (
    <section className="sharp-pg">
      <Reveal className="sharp-pg-head">
        <span className="sharp-note-label accent">Pruébalo en un sandbox real</span>
        <p>{pg.intro}</p>
      </Reveal>

      <Reveal className="sharp-pg-task">
        <span className="sharp-pg-task-label">
          Tarea — igual para todos los modos
        </span>
        <p>{pg.task}</p>
      </Reveal>

      <div className="sharp-pg-modes">
        {pg.modes.map((md) => {
          const isActive = md.id === activeMode;
          return (
            <button
              key={md.id}
              className={`sharp-mode-btn ${isActive ? "active" : ""}`}
              data-mode={md.id}
              onClick={() => runMode(md.id)}
              disabled={loading}
            >
              <span className="sharp-mode-top">
                <span className="sharp-mode-icon">
                  <CardIcon id={md.icon} />
                </span>
                <span className="sharp-mode-label">{md.label}</span>
              </span>
              <span className="sharp-mode-hint">
                {isActive && loading ? "corriendo…" : md.hint}
              </span>
            </button>
          );
        })}
      </div>

      {run && m && (
        <div className="sharp-pg-runs">
          <div className="sharp-run-card" data-mode={m.id}>
            <div className="sharp-run-head">
              <span className="sharp-run-mode">
                <CardIcon id={m.icon} /> {m.label}
              </span>
              {run.status === "loading" && (
                <span className="sharp-run-status">
                  <span className="dot live" /> corriendo
                </span>
              )}
            </div>
            {run.status === "error" ? (
              <div className="error-box">{run.error}</div>
            ) : (
              <div className="sharp-run-body">
                <Transcript parts={run.parts} />
                {run.status === "loading" && <span className="cursor">▋</span>}
                {run.artifact && <ArtifactBadge artifact={run.artifact} />}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/** Ejercicio de «skills»: Claude crea un SKILL.md real en el sandbox. */
function SkillPlayground({ pg }: { pg: Extract<TipsPlayground, { kind: "skill" }> }) {
  const [run, setRun] = useState<AgentRun | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function go() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setRun({ parts: [], artifact: null, status: "loading" });
    await streamChat(
      { system: pg.system, prompt: pg.task, agentic: true, agenticTask: "skill" },
      (ev) => {
        setRun((r) => (r ? reduceRun(r, ev) : r));
        boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
      },
      controller.signal,
    );
    setRun((r) => (r && r.status === "loading" ? { ...r, status: "done" } : r));
  }

  return (
    <section className="sharp-pg">
      <Reveal className="sharp-pg-head">
        <span className="sharp-note-label accent">Pruébalo en un sandbox real</span>
        <p>{pg.intro}</p>
      </Reveal>

      <div className="sharp-actions sharp-pg-cta">
        <button
          className="sharp-run"
          onClick={go}
          disabled={run?.status === "loading"}
        >
          {run?.status === "loading"
            ? "Creando la skill…"
            : (pg.cta ?? "Crear la skill →")}
        </button>
      </div>

      {run && (
        <div className="sharp-answer sharp-agentic" ref={boxRef}>
          <div className="sharp-label">
            <span className={`dot ${run.status === "loading" ? "live" : ""}`} />{" "}
            Claude creando la skill
          </div>
          {run.status === "error" ? (
            <div className="error-box">{run.error}</div>
          ) : (
            <>
              <Transcript parts={run.parts} />
              {run.status === "loading" && <span className="cursor">▋</span>}
              {run.artifact && <ArtifactBadge artifact={run.artifact} />}
            </>
          )}
        </div>
      )}

      {pg.note && <p className="sharp-pg-note">ℹ️ {pg.note}</p>}
    </section>
  );
}

// ---------- Página de tips de Claude Code (galería informativa) ----------

function TipsPage({ lesson }: { lesson: TipsLesson }) {
  // Agrupa los tips por su campo `group`, preservando el orden del array.
  type GroupedTips = { label: string; tips: (TipCard & { idx: number })[] };
  const groups = lesson.tips.reduce<GroupedTips[]>((acc, t, idx) => {
    const label = t.group ?? "";
    const last = acc[acc.length - 1];
    if (!last || last.label !== label) acc.push({ label, tips: [{ ...t, idx }] });
    else last.tips.push({ ...t, idx });
    return acc;
  }, []);

  return (
    <SharpShell lesson={lesson}>
      <Reveal as="aside" className="sharp-lead" variant="left">
        <span className="sharp-note-label accent">De qué va</span>
        <p>{lesson.intro}</p>
      </Reveal>

      <div className="sharp-tips-section">
        {groups.map(({ label, tips: gt }) => (
          <div key={label || "_"} className="sharp-tips-group">
            {label && (
              <Reveal className="sharp-tips-group-label" variant="left">
                {label}
              </Reveal>
            )}
            <div className="sharp-tips">
              {gt.map((t) => (
                <Reveal key={t.title} className="sharp-tip" delay={(t.idx % 2) * 80}>
                  <div className="sharp-tip-head">
                    <span className="sharp-tip-icon">
                      <CardIcon id={t.icon} />
                    </span>
                    <h3 className="sharp-tip-title">{t.title}</h3>
                  </div>
                  <div className="sharp-tip-what">
                    <Markdown>{t.what}</Markdown>
                  </div>
                  <div className="sharp-tip-how">
                    <span className="sharp-tip-how-label">Cómo</span>
                    <Markdown>{t.how}</Markdown>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        ))}
      </div>

      {lesson.playground &&
        (lesson.playground.kind === "modes" ? (
          <ModePlayground pg={lesson.playground} />
        ) : (
          <SkillPlayground pg={lesson.playground} />
        ))}

      {lesson.takeaway && (
        <Reveal as="aside" className="sharp-takeaway">
          <span className="sharp-note-label accent">La lección</span>
          <Markdown>{lesson.takeaway}</Markdown>
        </Reveal>
      )}
    </SharpShell>
  );
}

// ---------- Home: la cara del sitio (bienvenida + navegador de secciones) ----------

function HomePage({ onNavigate }: { onNavigate: (index: number) => void }) {
  return (
    <main className="content sharp home" data-section="home">
      <header className="sharp-hero home-hero">
        <span className="sharp-bignum home-mark" aria-hidden="true">
          ✦
        </span>
        <div className="sharp-hero-inner">
          <span className="sharp-kicker">Tutorial interactivo · UPAEP</span>
          <h1 className="sharp-title">Hola, te damos la bienvenida</h1>
          <p className="sharp-lede">
            Soy Claude, la IA de Anthropic, y este es un recorrido para
            conocernos. Aquí vas a ver —en vivo, no en teoría— qué puedo hacer y,
            sobre todo, cómo puedo echarte una mano en el día a día de Datos y
            Analítica. Edita los prompts, ejecútalos, prueba lo que se te ocurra:
            todo responde de verdad. Explora a tu ritmo y llévate ideas para tu
            equipo.
          </p>
          <span className="sharp-scrollcue">Explora el recorrido</span>
        </div>
      </header>

      <section className="home-nav">
        {SECTION_ORDER.map((section) => {
          const items = orderedLessons
            .map((l, index) => ({ l, index }))
            .filter((it) => it.l.section === section);
          if (items.length === 0) return null;
          return (
            <div className="home-section" data-section={section} key={section}>
              <Reveal className="home-section-head" variant="left">
                <span className="home-section-label">
                  {SECTION_LABEL[section]}
                </span>
                <p className="home-section-blurb">{SECTION_BLURB[section]}</p>
              </Reveal>
              <div className="home-pages">
                {items.map(({ l, index }, j) => (
                  <Reveal key={l.id} delay={(j % 2) * 70}>
                    <button
                      className="home-page"
                      onClick={() => onNavigate(index)}
                    >
                      <span className="home-page-icon">
                        <NavIcon id={l.id} />
                      </span>
                      <span className="home-page-text">
                        <strong>{l.title}</strong>
                        <small>{l.tagline}</small>
                      </span>
                      <span className="home-page-arrow" aria-hidden="true">
                        →
                      </span>
                    </button>
                  </Reveal>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
