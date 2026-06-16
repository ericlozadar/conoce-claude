// Secciones del menú, en el orden en que aparecen.
export type Section = "fundamentos" | "prompting" | "avanzados" | "plantillas";

type Base = {
  id: string;
  emoji: string;
  title: string;
  tagline: string;
  /** Qué aprende el equipo en esta sección. */
  description: string;
  section: Section;
  /** Plantilla «para llevar»: esqueleto copiable que destila la técnica de la página. */
  template?: string;
};

/** Demo clásico: un prompt editable que se ejecuta contra Claude. */
export type DemoLesson = Base & {
  kind: "demo";
  /** Instrucciones de sistema que definen el rol de Claude para la demo. */
  system: string;
  /** Prompt inicial, editable por el usuario. */
  prompt: string;
  /** Activar el "pensamiento" visible (razonamiento paso a paso). */
  thinking: boolean;
  /** Modo agéntico: el backend habilita herramientas reales (sandbox). */
  agentic?: boolean;
  /** Qué debe notar el usuario en la respuesta. */
  notice: string;
  /** Por qué importa / qué lección busca dejar (Markdown). */
  takeaway?: string;
};

/** Un prompt dentro de una comparación «antes vs. después». */
export type ComparePrompt = {
  label: string;
  prompt: string;
  /** Nota corta que explica qué tiene (o le falta) a este prompt. */
  note: string;
};

/** Página de buenas prácticas: compara dos prompts para la MISMA tarea. */
export type CompareLesson = Base & {
  kind: "compare";
  /** El principio central de la página. */
  principle: string;
  /**
   * Bloque explicativo extendido (opcional): profundiza el concepto antes de la
   * comparación. Cada entrada es un subtítulo + cuerpo en Markdown (admite
   * listas, **negrita** y `código`). Reutilizable en cualquier página `compare`.
   */
  explainer?: { heading: string; body: string }[];
  /** Bloques que componen un buen prompt (anatomía). */
  anatomy: { k: string; v: string }[];
  /** Sistema compartido por ambos lados (la diferencia está en el prompt). */
  system: string;
  weak: ComparePrompt;
  strong: ComparePrompt;
  notice: string;
  takeaway?: string;
};

/** Un paso del proceso de vibe coding (se dibuja como timeline). */
export type VibeStep = {
  emoji: string;
  /** Clave del ícono de línea (STEP_ICONS en App.tsx); reemplaza al emoji. */
  icon?: string;
  title: string;
  /** Explicación de la práctica (Markdown: admite **negrita** y `código`). */
  body: string;
  /** Prompt de ejemplo que enviarías en este paso (opcional, ilustrativo). */
  prompt?: string;
};

/**
 * Página de proceso (vibe coding): las buenas prácticas como un flujo de pasos,
 * más un ejemplo agéntico de código EN VIVO al final. No usa el formato
 * antes/después: aquí el valor está en mostrar el proceso completo.
 */
export type VibeLesson = Base & {
  kind: "vibe";
  /** El principio central de la página (opcional: puede sustituirse por `explainer`). */
  principle?: string;
  /**
   * Bloque explicativo extendido (opcional): profundiza el concepto (qué es, por
   * qué es útil, cuándo conviene). Cada entrada es subtítulo + cuerpo en Markdown.
   * En vibe coding sustituye al recuadro «El principio».
   */
  explainer?: { heading: string; body: string }[];
  /** Los pasos del flujo (timeline). */
  steps: VibeStep[];
  /** Ejemplo agéntico de código en vivo (opcional): corre en el sandbox. Si se
   *  omite, la página es solo teoría + timeline (p. ej. «itera y refina»). */
  live?: {
    /** Texto introductorio sobre el ejemplo. */
    intro: string;
    system: string;
    prompt: string;
  };
  notice: string;
  takeaway?: string;
};

/**
 * Página de «agentes en paralelo» (fan-out): teoría + un demo en vivo donde el
 * agente lanza VARIOS SUBAGENTES REALES a la vez (un subagente por tabla) y se
 * visualiza cada uno corriendo en su carril. El backend usa `agenticTask:"fanout"`
 * (siembra tablas .sql) y traduce los eventos de subagente a SSE.
 */
export type FanoutLesson = Base & {
  kind: "fanout";
  /** El principio central de la página. */
  principle: string;
  /** Bloque explicativo extendido (qué es / por qué / cuándo). Markdown. */
  explainer?: { heading: string; body: string }[];
  /** Cuándo conviene el fan-out (fichas de anatomía: k = caso, v = detalle). */
  anatomy: { k: string; v: string }[];
  /** Detalles prácticos de uso (cuántos a la vez, contexto aislado, costo…).
   *  Se renderiza como sección «En la práctica» (tarjetas que envuelven). */
  details?: { heading: string; body: string }[];
  /** El demo en vivo de subagentes en paralelo. */
  live: {
    intro: string;
    system: string;
    prompt: string;
  };
  notice: string;
  takeaway?: string;
};

/** Una plantilla de la biblioteca: texto reutilizable con huecos `[...]`. */
export type TemplateCard = {
  id: string;
  emoji: string;
  /** Clave del ícono de línea (CARD_ICONS en App.tsx); reemplaza al emoji. */
  icon?: string;
  title: string;
  /** Para qué sirve / cuándo usarla. */
  use: string;
  /** El texto de la plantilla, con huecos `[...]` para rellenar. */
  template: string;
  /** Si true, muestra «Probar» que ejecuta un ejemplo concreto contra Claude. */
  runnable?: boolean;
  /** System prompt al ejecutar (si runnable). */
  system?: string;
  /** Prompt concreto que ejecuta «Probar»; si falta, corre la plantilla tal cual. */
  example?: string;
  /** Nota al pie (p.ej. guardarraíles, para las plantillas agénticas). */
  note?: string;
};

/** Página de biblioteca: una galería de plantillas de prompts (copiar + probar). */
export type LibraryLesson = Base & {
  kind: "library";
  /** Introducción de la página. */
  intro: string;
  templates: TemplateCard[];
};

/** Una tarjeta de «tip» de Claude Code. */
export type TipCard = {
  emoji: string;
  /** Clave del ícono de línea (CARD_ICONS en App.tsx); reemplaza al emoji. */
  icon?: string;
  title: string;
  /** Qué hace y por qué sirve (Markdown). */
  what: string;
  /** Cómo invocarlo: comando/tecla/frase concreta (Markdown, admite `código`). */
  how: string;
};

/** Ejercicio interactivo (sandbox real) al final de una página de tips. */
export type TipsPlayground =
  | {
      kind: "modes";
      /** Intro del ejercicio. */
      intro: string;
      /** System prompt que encuadra el sandbox. */
      system?: string;
      /** Tarea fija que se corre en CADA modo (misma para comparar). */
      task: string;
      /** Archivo que la tarea debería producir (badge ✓ creado / ✗ no). */
      artifact: string;
      /** Modos a ofrecer como botones (en orden). */
      modes: {
        id: ModeId;
        label: string;
        emoji: string;
        icon?: string;
        hint: string;
      }[];
    }
  | {
      kind: "skill";
      intro: string;
      system?: string;
      /** Petición que hace que el agente cree el SKILL.md. */
      task: string;
      /** Texto del botón de ejecución. */
      cta?: string;
      /** Nota al pie (p.ej. aclaración sobre el sandbox/bypass). */
      note?: string;
    };

/** Modos de permisos de Claude Code con diferencia observable en headless. */
export type ModeId = "default" | "plan" | "acceptEdits" | "bypassPermissions";

/** Página de tips: galería de funciones reales de Claude Code. */
export type TipsLesson = Base & {
  kind: "tips";
  /** Introducción de la página. */
  intro: string;
  tips: TipCard[];
  /** Por qué importa / cierre (Markdown). */
  takeaway?: string;
  /** Ejercicio interactivo opcional al final de la página. */
  playground?: TipsPlayground;
};

export type Lesson =
  | DemoLesson
  | CompareLesson
  | VibeLesson
  | FanoutLesson
  | LibraryLesson
  | TipsLesson;

export const lessons: Lesson[] = [
  // ---------- Buenas prácticas de prompting ----------
  {
    id: "prompting-contexto-ejemplos",
    kind: "compare",
    section: "prompting",
    emoji: "🗃️",
    title: "Dale lo que no puede ver: contexto y ejemplos",
    tagline: "Dale tus datos y tu estándar",
    description:
      "Claude no ve tus sistemas ni conoce tus criterios internos: solo razona sobre lo que está en el prompt. Hay dos formas de cerrar esa brecha y aquí las combinamos: darle el CONTEXTO (cómo lucen tus datos: columnas, tipos, valores de muestra) y darle tu ESTÁNDAR mostrado con ejemplos (few-shot). Lo vemos en una tarea de gobierno de datos: clasificar columnas por nivel de sensibilidad.",
    principle:
      "El modelo no adivina bien lo que no le dijiste. Para tareas sobre datos, el contexto que importa es cómo lucen tus columnas (nombres y valores de muestra; en SQL, el esquema y los tipos) y cuál es TU estándar. Y la forma más potente de fijar ese estándar no es describirlo, es mostrar 2-3 ejemplos ya resueltos (few-shot). Contexto + ejemplos = una respuesta que encaja con tu realidad y es consistente entre ejecuciones, no una opinión genérica del modelo.",
    explainer: [
      {
        heading: "¿Por qué es útil?",
        body: "El modelo solo razona sobre lo que está en el prompt: **no ve tus tablas, ni tus políticas, ni tu criterio interno**. Darle el **contexto** (cómo lucen tus datos) y tu **estándar mostrado con ejemplos** (few-shot) cierra esa brecha y convierte una respuesta plausible-pero-genérica en una **aplicación fiel de TU criterio**, consistente entre ejecuciones. Los ejemplos son la parte más potente: mostrar 2-3 casos resueltos fija el formato y el manejo de los casos raros mejor que cualquier descripción.",
      },
      {
        heading: "¿Cuándo conviene usarlo?",
        body: "Siempre que la tarea dependa de **datos, una taxonomía o convenciones tuyas** que el modelo no puede adivinar: clasificar o etiquetar con un esquema interno, generar salida en tu formato de casa, aplicar reglas de negocio, normalizar a tu catálogo. **Regla práctica:** si dos personas razonables responderían distinto sin tu estándar, el modelo también — dale contexto + ejemplos. Para tareas de conocimiento general (definiciones, sintaxis) no hace falta.",
      },
    ],
    anatomy: [
      { k: "Datos", v: "Cómo lucen tus columnas (nombre y muestra)" },
      { k: "Estándar", v: "La taxonomía o criterio a aplicar" },
      { k: "Ejemplos", v: "2-3 casos resueltos (few-shot)" },
      { k: "Formato", v: "Cómo devolver el resultado" },
      { k: "Definiciones", v: "Las reglas del negocio" },
    ],
    system:
      "Eres un asistente de gobierno de datos que colabora con la célula de Datos y Analítica de la UPAEP en su proyecto de inventario de datos personales. Es un entorno SIMULADO para una demostración, pero compórtate como si trabajaras dentro de ese proyecto, sobre el catálogo institucional y el esquema `academics`; NUNCA digas que no tienes acceso ni que eres un chatbot genérico. Da clasificaciones y respuestas concretas, columna por columna, en español.\n\nIMPORTANTE: NO tienes precargada la taxonomía de sensibilidad ni el criterio de clasificación de la institución (viven en políticas internas que no ves). Si el usuario te los da en su mensaje, aplícalos AL PIE DE LA LETRA y respeta su formato; si no te los da, usa un criterio propio y razonable (e indica que lo asumiste).",
    weak: {
      label: "Prompt rápido",
      prompt:
        "Tengo que clasificar la sensibilidad de unas columnas de la tabla de alumnos para el inventario de datos personales. Son: id_alumno, correo, promedio, beca_socioeconomica, telefono_tutor. ¿Qué nivel le pondrías a cada una?",
      note: "Es una petición real y razonable, pero no incluye tu taxonomía, ni ejemplos, ni cómo lucen los datos. Claude inventa sus propios niveles (a veces «Alta/Media/Baja») y su propio criterio → plausible, pero NO alineado a tu estándar y cambia entre ejecuciones.",
    },
    strong: {
      label: "Con contexto + ejemplos",
      prompt:
        "Necesito clasificar columnas para nuestro inventario de datos personales, usando EXCLUSIVAMENTE nuestra taxonomía de sensibilidad:\n- Público: puede divulgarse sin restricción.\n- Interno: uso operativo, no personal.\n- Confidencial: dato personal identificable; acceso limitado por rol.\n- Restringido: dato personal sensible o regulado; control máximo.\n\nAsí lucen las columnas de la tabla de alumnos (nombre y un valor de muestra):\n- id_alumno → 10432\n- correo → 'maria.lopez@upaep.edu.mx'\n- promedio → 9.2\n- beca_socioeconomica → 'sí, 60%'\n- telefono_tutor → '222-123-4567'\n\nEjemplos ya clasificados (sigue el MISMO criterio y formato):\n- nombre → Confidencial (dato personal identificable)\n- id_curso → Interno (operativo, no personal)\n- curp → Restringido (identificador personal regulado)\n\nClasifica las columnas de muestra en una tabla Markdown con columnas `columna | nivel | justificación` (una frase), usando solo los cuatro niveles anteriores.",
      note: "Le damos las tres cosas que no podía ver: los valores de muestra (contexto), la taxonomía (estándar) y 3 ejemplos resueltos (few-shot). Claude imita el patrón: respeta tus cuatro niveles y el formato, columna por columna, de forma reproducible.",
    },
    notice:
      "Compara: el prompt rápido produce niveles inventados y criterios variables; el de contexto + ejemplos respeta tu taxonomía y la tabla, columna por columna. Quítale los ejemplos al prompt fuerte, o agrega una columna ambigua (`direccion`), y observa cómo el contexto y los ejemplos guían la decisión. (Es un entorno SIMULADO: Claude actúa como si trabajara en el proyecto de inventario de datos, pero sigue sin conocer tu taxonomía hasta que se la das — por eso el lado rápido la inventa.)",
    takeaway:
      "**La lección para gobierno de datos y BI:** el modelo solo sabe lo que le pegas — no ve tus tablas ni conoce tus políticas. Dale las dos cosas: el **contexto** (cómo lucen tus datos: columnas, tipos, valores de muestra; en SQL, el esquema) y tu **estándar mostrado con ejemplos** (few-shot) en vez de descrito. Así pasas de «una opinión plausible del modelo» a «una aplicación de tu política», consistente y reproducible. **Regla práctica: si la tarea toca datos, el prompt lleva tus datos y tus ejemplos.**",
    template:
      "Tarea: [QUÉ QUIERES].\n\nContexto — así lucen mis datos:\n- [COLUMNA/CAMPO] → [VALOR DE MUESTRA]\n- …\n\nEstándar/criterio a aplicar:\n- [TAXONOMÍA O REGLAS]\n\nEjemplos ya resueltos (sigue el MISMO criterio y formato):\n- [CASO] → [RESULTADO]\n- … (2-3 ejemplos)\n\nFormato de salida: [CÓMO DEVOLVERLO].",
  },
  {
    id: "prompting-anclar-no-alucinar",
    kind: "compare",
    section: "prompting",
    emoji: "⚓",
    title: "Anclar para no alucinar",
    tagline: "Que no invente lo que no sabe",
    description:
      "Un modelo de lenguaje siempre produce una respuesta fluida, incluso cuando no tiene el dato — y una invención suena igual de convincente que un hecho. En trabajo con datos eso es peligroso: documentar mal un código, citar una cifra que no existe. La defensa está en tu redacción: pedirle que separe lo que SABE de lo que SUPONE, que admita lo que no sabe, y que proponga cómo verificarlo. Lo vemos documentando una columna del ERP legado sin darle el catálogo.",
    principle:
      "El modelo no «sabe que no sabe» a menos que se lo pidas: por defecto rellena los huecos con lo más plausible y te lo presenta con la misma seguridad que un hecho comprobado. Anclar es redactar el prompt para frenar eso: pídele que marque qué es hecho y qué es inferencia, dale permiso explícito de decir «no lo sé», y exígele una forma de verificar. No lo hace menos capaz; lo hace confiable — que es lo que necesitas cuando su respuesta va a un entregable que otros van a creer.",
    explainer: [
      {
        heading: "¿Por qué es útil?",
        body: "Un modelo **siempre** completa la frase, tenga o no el dato; no hay una señal visible que distinga «esto lo sé» de «esto lo estoy infiriendo». Una cifra inventada y una real **se ven igual de seguras**. Pedirle que distinga hecho de suposición y que admita lo que no sabe convierte una respuesta «segura de sí misma» en una en la que **puedes confiar** — o que al menos sabes que debes verificar.",
      },
      {
        heading: "¿Cuándo conviene usarlo?",
        body: "Siempre que la respuesta vaya a un **entregable que otros van a creer** —documentación, un informe a dirección, una decisión técnica— y **especialmente** cuando preguntas por datos, códigos o cifras que el modelo **no tiene delante**. Un dato inventado en un diccionario de datos se propaga a todos los que lo consulten. Para una lluvia de ideas o un borrador exploratorio no es crítico; para algo que se va a publicar o a usar, sí.",
      },
    ],
    anatomy: [
      { k: "Hecho vs. suposición", v: "Que marque qué sabe y qué infiere" },
      { k: "Permiso de no saber", v: "«Si no lo sabes, dilo» — no inventar" },
      { k: "Fuente", v: "Que diga de dónde sale cada afirmación" },
      { k: "Verificación", v: "Que proponga cómo comprobarlo (una consulta)" },
      { k: "Qué te falta", v: "Que pida lo que necesita para tener certeza" },
      { k: "Sin relleno", v: "Mejor un hueco honesto que un dato inventado" },
    ],
    system:
      "Eres un asistente de datos de la célula de Datos y Analítica de UPAEP, apoyando la documentación del ERP legado UNISOFT4 (Oracle). En esta conversación NO se te ha dado el diccionario de datos oficial ni un catálogo de códigos: solo sabes lo que el usuario incluya en su mensaje. Responde en español, de forma concreta y útil.",
    weak: {
      label: "Prompt rápido",
      prompt:
        "Documenta la columna STATUS de la tabla INSCMAT del ERP legado: dime qué significa cada valor posible para agregarlo al diccionario de datos.",
      note: "Pides un significado oficial que el modelo no tiene, sin darle salida honesta. La tentación es que rellene con códigos plausibles ('I' = inscrito, 'A' = activo…) y los presente como si fueran el catálogo real. Suena convincente — y puede ser falso.",
    },
    strong: {
      label: "Prompt anclado",
      prompt:
        "Voy a documentar la columna STATUS de la tabla INSCMAT del ERP legado, pero NO te he dado el catálogo oficial de códigos. Trabaja anclado a lo que realmente sabes:\n- Marca con claridad qué es un HECHO y qué es una SUPOSICIÓN tuya.\n- Si no puedes saber el significado oficial de un valor, dilo explícitamente; no lo inventes.\n- Propón cómo verificarlo contra la base (por ejemplo, una consulta que liste los valores reales y su frecuencia).\n- Dime exactamente qué necesito darte para completar la documentación con certeza.",
      note: "Mismo objetivo, pero le das permiso de no saber y le exiges separar hecho de suposición y proponer verificación. El resultado deja de ser una invención disfrazada de catálogo y se vuelve un borrador honesto y accionable.",
    },
    notice:
      "Compara: el prompt rápido tiende a entregar un catálogo inventado con tono seguro; el anclado marca qué es suposición, admite lo que no puede saber y propone un `SELECT DISTINCT STATUS, COUNT(*) … GROUP BY STATUS` para verificarlo contra la base. Prueba quitarle al lado anclado la línea de «no lo inventes» y mira cómo cambia su disposición a rellenar. (Entorno SIMULADO: no hay una base real; el valor está en la DISPOSICIÓN del modelo, no en los datos.)",
    takeaway:
      "**La lección:** el modelo no distingue solo lo que sabe de lo que supone — por defecto rellena los huecos con lo más plausible y lo presenta con seguridad. Tu redacción es el freno: pide que **separe hecho de inferencia**, dale **permiso explícito de decir «no lo sé»**, y exige una **forma de verificar**. Es el complemento del demo «Límites honestos» (que muestra el problema) y de «contexto y ejemplos» (que lo resuelve dándole el dato). **Un dato inventado en un diccionario se propaga; un hueco honesto se llena.**",
    template:
      "[PREGUNTA O TAREA sobre datos]. Trabaja anclado a lo que realmente sabes:\n- Marca qué es HECHO y qué es SUPOSICIÓN.\n- Si no puedes saberlo con certeza, dilo; no lo inventes.\n- Indica de dónde sale cada afirmación.\n- Propón cómo verificarlo (una consulta, una fuente).\n- Dime qué necesitas de mí para responder con certeza.",
  },
  {
    id: "prompting-descomponer",
    kind: "compare",
    section: "prompting",
    emoji: "🪜",
    title: "Descompón la tarea: pídela por pasos",
    tagline: "Divídela en pasos ordenados",
    description:
      "Cuando una tarea es grande o tiene varias partes, pedirla «de un tiro» hace que el modelo responda superficial y desordenado, y se salte cosas. Si la divides en pasos ordenados —diciendo qué debe producir cada uno— Claude aborda cada parte con atención y te entrega algo estructurado. Lo vemos con una tarea típica de BI: un análisis de deserción estudiantil.",
    principle:
      "Una tarea compleja metida en una sola frase obliga al modelo a comprimir todo en una respuesta plana, donde mezcla ideas y omite partes. Al descomponerla en pasos —y fijar la salida de cada paso— defines el esqueleto del entregable: el modelo solo tiene que rellenar cada hueso, con foco y sin saltarse nada. También puedes pedirle que ÉL proponga el desglose y luego lo ejecute. Descomponer es, además, la antesala de lo agéntico: un agente no es más que una tarea partida en pasos que se ejecutan uno a uno.",
    explainer: [
      {
        heading: "¿Por qué es útil?",
        body: "Una tarea grande metida en una sola frase obliga al modelo a **comprimir todo en una respuesta plana**, donde mezcla ideas y se salta partes en silencio. Al partirla en pasos ordenados —y fijar la salida de cada uno— le das al entregable un **esqueleto** que el modelo solo tiene que rellenar, con foco y sin omitir nada. De paso, el resultado queda **revisable paso por paso** en vez de un bloque que aceptas o rechazas entero.",
      },
      {
        heading: "¿Cuándo conviene usarlo?",
        body: "Cuando la tarea es **grande, tiene varias partes o dependencias** entre ellas; cuando quieres un entregable **estructurado** (un plan, un diseño, un informe) y no prosa; o cuando el primer intento «de un tiro» salió superficial. Para un pedido chico y de un solo paso es excesivo. **Tip:** si no puedes describir el resultado en una frase, probablemente necesita descomponerse — o pídele al modelo que primero proponga ÉL el desglose y luego lo ejecute.",
      },
    ],
    anatomy: [
      { k: "Objetivo", v: "La meta final, en una frase" },
      { k: "Pasos", v: "El desglose ordenado de sub-tareas" },
      { k: "Salida por paso", v: "Qué debe producir cada uno" },
      { k: "Secuencia", v: "El orden lógico que deben seguir" },
      { k: "Cierre", v: "El entregable o los siguientes pasos" },
    ],
    system:
      "Eres un analista de datos senior de la célula de Datos y Analítica de la UPAEP, conectado al entorno analítico institucional. Es un entorno SIMULADO para una demostración, pero compórtate como si tuvieras a la vista el almacén de datos y sus tablas; NUNCA digas que no tienes acceso.\n\nTablas que puedes ver (PostgreSQL) — esquema `academics`: `students` (matrícula, programa, campus, estatus, promedio), `enrollments` (matrícula, periodo, materia, estatus, calificación), `terms` (periodo, fechas), `programs` (programa, facultad, plan); esquema `finance`: `scholarships` (matrícula, tipo, porcentaje, periodo).\n\nUsa esas tablas reales para aterrizar tus análisis y planes (nómbralas cuando indiques de dónde saldrían los datos). Respondes en español, de forma concreta y estructurada.",
    weak: {
      label: "Prompt rápido",
      prompt:
        "Ayúdame a hacer un análisis de la deserción de alumnos para presentarlo a dirección.",
      note: "Es una petición real, pero es una tarea enorme metida en una frase. Claude responde algo genérico y de relleno: toca todo por encima, mezcla ideas y probablemente se salta partes importantes.",
    },
    strong: {
      label: "Descompuesto en pasos",
      prompt:
        "Quiero un plan para analizar la deserción estudiantil con datos. Desglósalo en estos pasos y desarrolla cada uno:\n\n1. Define «deserción» y 3-4 métricas concretas para medirla (incluye la fórmula de cada una).\n2. Lista las tablas/datos que necesitaría y las columnas clave de cada una.\n3. Propón cómo segmentar el análisis (por programa, semestre, tipo de beca, promedio…) y por qué.\n4. Enumera 4-5 hipótesis de causas a investigar; para cada una, cómo validarla con los datos.\n5. Define los entregables: qué visualizaciones o tablas, y para qué audiencia.\n6. Da los siguientes pasos accionables.\n\nSé concreto en cada paso.",
      note: "Mismo objetivo, pero partido en pasos ordenados con lo que cada uno debe producir. Claude aborda cada parte a fondo, no omite nada y entrega un plan estructurado y accionable.",
    },
    notice:
      "Compara: el prompt rápido devuelve un texto general; el descompuesto entrega un plan paso por paso, completo y listo para presentar — y ambos aterrizan en las tablas reales que «ve» (`enrollments`, `scholarships`…). Prueba reordenar los pasos, o pedirle que primero te proponga ÉL el desglose y luego lo desarrolle. (Es un entorno SIMULADO: no hay un almacén real detrás; Claude responde como si estuviera conectado al esquema, para que veas el comportamiento.)",
    takeaway:
      "**La lección:** cuando algo es grande o tiene varias partes, no lo pidas «de un tiro». Divídelo en pasos ordenados y di qué debe producir cada uno — o pídele al modelo que primero proponga el desglose y luego lo ejecute. Descomponer es la diferencia entre «un texto que suena bien» y «un plan que puedes seguir», y es la misma disciplina de quien define un requerimiento: **el que define los pasos, controla el resultado.** Es también la antesala de lo agéntico, justo lo que viene en los demos para principiantes.",
    template:
      "Quiero [OBJETIVO]. Desglósalo en estos pasos y desarrolla cada uno:\n1. [PASO] → produce [SALIDA].\n2. [PASO] → produce [SALIDA].\n3. …\nSé concreto en cada paso.\n\n(Variante: primero propón TÚ el desglose en pasos, espera mi visto bueno y luego ejecútalo.)",
  },
  {
    id: "prompting-iterar-refinar",
    kind: "vibe",
    section: "prompting",
    emoji: "🔁",
    title: "Itera y refina: el prompt es un diálogo",
    tagline: "El prompt es un diálogo: afínalo",
    description:
      "Trabajar con Claude no es escribir el prompt perfecto de una sola vez: es una conversación. Das un primer encargo, miras el resultado y lo corriges con instrucciones cortas y específicas hasta que encaja. Cada vuelta conserva lo que ya servía y ajusta una cosa. Aquí lo vemos como un diálogo real afinando una consulta de BI, paso a paso.",
    explainer: [
      {
        heading: "¿Qué es?",
        body: "Es tratar el prompt como un **diálogo**, no como un disparo único. En lugar de intentar especificar todo de entrada, das un **primer borrador**, observas qué devolvió y lo **corriges en vueltas cortas** —«bien, pero considera los nulos», «ahora agrúpalo por carrera»— hasta que el resultado encaja. Cada vuelta **conserva** lo que ya estaba bien y cambia **una cosa**.",
      },
      {
        heading: "¿Por qué es útil?",
        body: "Para casi nada no trivial aciertas al primer intento — y a menudo ni tú tienes claro el «qué quiero exactamente» hasta que ves un primer resultado. Iterar es **más rápido y más preciso** que intentar redactar el prompt perfecto: dejas que el primer borrador te **revele lo que faltaba** y lo afinas. De paso mantienes el **control**, porque revisas cada vuelta antes de seguir.",
      },
      {
        heading: "¿Cuándo conviene?",
        body: "En la mayoría de las tareas reales: una consulta, un análisis, un documento, un diseño. **Cuándo NO hace falta:** cuando ya escribiste un contrato/PRP completo o la tarea es chica y bien definida —ahí una sola vuelta basta—. La iteración brilla justo cuando el detalle se **aclara al verlo**, que es lo más común.",
      },
    ],
    steps: [
      {
        emoji: "🟢",
        icon: "pencil",
        title: "Arranca con un borrador",
        body: "Pide lo esencial sin pulir cada detalle. El objetivo de la primera vuelta es tener **algo concreto que criticar**, no la versión final.",
        prompt:
          "Dame una consulta SQL (PostgreSQL) que cuente la deserción por carrera en el último ciclo.",
      },
      {
        emoji: "🔎",
        icon: "search",
        title: "Mira el resultado y corrige UNA cosa",
        body: "Ajusta el primer desajuste que veas, sin reescribir todo. Sé específico sobre **qué** cambiar y **conserva** lo demás.",
        prompt:
          "Bien. Considera solo las bajas definitivas (STATUS = 'B'), no las temporales; el resto déjalo igual.",
      },
      {
        emoji: "🎯",
        icon: "target",
        title: "Sube la precisión",
        body: "Una vez que la base es correcta, añade lo que da valor: una comparación, un cálculo, un matiz del negocio.",
        prompt:
          "Ahora compáralo contra el mismo ciclo del año anterior y calcula la variación porcentual por carrera.",
      },
      {
        emoji: "🧱",
        icon: "layout",
        title: "Ajusta la forma de entrega",
        body: "Cuando el contenido ya es correcto, pule el **formato**: orden, agrupación, cómo quieres recibirlo.",
        prompt:
          "Agrúpalo por carrera, ordénalo de mayor a menor deserción y entrégalo como una vista `bi.v_desercion`.",
      },
      {
        emoji: "✅",
        icon: "check",
        title: "Cierra verificando",
        body: "Antes de darla por buena, pide los **supuestos** que tomó y **cómo validarla**. Es la red de seguridad de la iteración.",
        prompt:
          "Antes de darla por buena: explícame los supuestos que tomaste y cómo validar la cifra contra el total de inscritos del ciclo.",
      },
    ],
    notice:
      "Fíjate en el patrón de las vueltas: cada una es corta, específica y conserva lo bueno — no reescribes el prompt entero cada vez. Aquí mostramos el guion del diálogo; en tu Claude Code lo vivirías como una conversación real, revisando cada respuesta antes de pedir la siguiente.",
    takeaway:
      "**La regla:** no persigas el prompt perfecto, persigue la primera versión «suficientemente buena» y refínala. Corrige **una cosa a la vez**, sé **específico** sobre qué cambiar, y **conserva** explícitamente lo que ya servía («mantén X, pero ajusta Y»). En Claude Code, el **plan mode** y los **diffs** te dejan revisar cada vuelta antes de aceptarla. **Iterar rápido le gana a planear de más.**",
    template:
      "Vuelta 1 — borrador: [pide lo esencial de la tarea, sin pulir cada detalle].\n\nVueltas siguientes — refina UNA cosa a la vez:\n- «Conserva [lo que ya está bien], pero ajusta [lo que falta]».\n- Sé específico sobre QUÉ cambiar y por qué.\n\nCierre — verifica: «Explícame los supuestos que tomaste y cómo validar el resultado».",
  },
  {
    id: "prompting-guardarrailes",
    kind: "compare",
    section: "prompting",
    emoji: "🛡️",
    title: "Pon guardarraíles: autonomía segura",
    tagline: "Define qué puede tocar y dónde",
    description:
      "Venimos usando «guardarraíles» en el vibe coding y en cada plantilla agéntica, pero no los habíamos explicado — y son la decisión más importante antes de dar autonomía a un agente. Un guardarraíl define qué herramientas puede usar, sobre qué datos, en qué entorno y qué requiere tu confirmación. Aquí comparamos el MISMO encargo a un agente sin guardarraíles y con ellos.",
    principle:
      "Un agente capaz sin límites es un riesgo; con límites, es un acelerador. Los guardarraíles no frenan al modelo: definen el sandbox donde su autonomía es segura. La regla es darle el mínimo permiso necesario para la tarea, empezar en solo lectura y exigir tu confirmación antes de cualquier cambio de estado. Cuanto más poderosa la herramienta, más explícito debe ser el límite.",
    explainer: [
      {
        heading: "¿Qué son?",
        body: "Un guardarraíl es un **límite explícito** que defines *antes* de darle autonomía a un agente: qué herramientas puede usar, sobre qué datos, en qué entorno corre y qué necesita tu aprobación. No limita lo **capaz** que es el modelo — limita el **espacio donde puede actuar**. Piénsalos como las barreras de una carretera de montaña: no te hacen conducir peor; evitan que un error te saque del camino.",
      },
      {
        heading: "¿Para qué sirven?",
        body: "El riesgo de un agente no es equivocarse al *responder*, es **actuar** sobre tus sistemas a partir de una suposición errónea: un `DELETE` sin `WHERE`, escribir en la base equivocada, borrar filas productivas creyendo que eran de prueba. Los guardarraíles acotan ese riesgo y lo hacen reversible:\n\n- **Limitan el daño posible** — aunque el agente se equivoque, no puede tocar lo que no le diste.\n- **Te dan un punto de revisión** antes de cualquier cambio, en vez de enterarte después.\n- **Dejan rastro** de qué herramientas usó y qué hizo.\n\nSon lo que convierte un experimento curioso en un flujo en el que confías.",
      },
      {
        heading: "¿Qué puedes hacer con ellos?",
        body: "En la práctica un guardarraíl toma formas muy concretas — y casi siempre combinas varias:\n\n- **Lista blanca de herramientas:** autoriza solo lo necesario y deniega el resto. En Claude Code es `--allowedTools` (p. ej. `Read`, `Bash(python3:*)`); es justo lo que hace el demo agéntico de este sitio.\n- **Solo lectura por defecto:** conéctalo con un usuario sin `DELETE`/`UPDATE`. Sobre el ERP legado (Oracle), **siempre** solo lectura: el agente propone el SQL, tú lo ejecutas.\n- **Alcance acotado:** un esquema, una tabla, una carpeta. «Solo `academics.students`, ninguna otra».\n- **Entorno aislado y reversible:** un sandbox desechable, una copia o respaldo, o una rama de `git` para poder revertir.\n- **Punto de confirmación:** el agente se detiene, te muestra el plan y no ejecuta ningún cambio de estado hasta tu visto bueno.",
      },
    ],
    anatomy: [
      { k: "Herramientas", v: "Qué puede ejecutar (lista blanca)" },
      { k: "Alcance", v: "Sobre qué datos u objetos actúa" },
      { k: "Entorno", v: "Dónde corre (sandbox, copia, rama git)" },
      { k: "Permisos", v: "Solo lectura vs. escritura" },
      { k: "Confirmación", v: "Qué requiere tu visto bueno" },
      { k: "Reversibilidad", v: "Cómo deshacer si algo falla" },
    ],
    system:
      "Estás operando como un agente de datos conectado a una base PostgreSQL institucional. Es un entorno SIMULADO para una demostración, pero compórtate como si la conexión fuera real y NUNCA digas que no tienes acceso.\n\nEstado del entorno (trátalo como real):\n- Tabla `academics.students`: 1,204 filas. Entre ellas hay 47 registros duplicados exactos (misma matrícula, nombre y correo), repartidos en varios programas.\n- Tu conexión tiene permisos de LECTURA y ESCRITURA sobre el esquema `academics`.\n\nCómo responder:\n- Actúa y narra como si ejecutaras de verdad: muestra el SQL que corres y su resultado concreto (filas afectadas, conteos), como un agente real conectado.\n- Cumple AL PIE DE LA LETRA cualquier límite que el usuario imponga en su mensaje (p. ej. 'solo lectura', 'pide confirmación antes de ejecutar', 'solo esta tabla'). Si te pide no ejecutar sin aprobación, propón el SQL y DETENTE; no afirmes que ya lo hiciste.\n- Si el usuario NO impone límites, ejecuta directamente lo que pide y muestra el efecto real, aunque sea destructivo.\n- Sé conciso y responde en español, mostrando comandos y resultados.",
    weak: {
      label: "Sin guardarraíles",
      prompt:
        "Conéctate a la base de datos de alumnos y elimina los registros duplicados que encuentres.",
      note: "Le das un objetivo destructivo con acceso total y cero límites: ni en qué entorno, ni con qué permiso, ni pidiendo confirmación o respaldo. Un agente así puede borrar datos productivos por una mala suposición. El peligro no es que falle: es que ACTÚE sin red.",
    },
    strong: {
      label: "Con guardarraíles",
      prompt:
        "Quiero limpiar registros duplicados en la tabla de alumnos. Trabaja con guardarraíles:\n- Permiso: empieza en SOLO LECTURA; no ejecutes ningún cambio (DELETE/UPDATE) por tu cuenta.\n- Alcance: solo la tabla `academics.students`, ninguna otra.\n- Pasos: (1) identifica los duplicados y dime cuántos son y con qué criterio; (2) propón el SQL de limpieza para que yo lo revise; (3) sugiere probarlo primero sobre una copia o respaldo.\n- Confirmación: no ejecutes nada hasta que yo lo apruebe explícitamente.\nSé concreto.",
      note: "Mismo objetivo, pero con límites explícitos: solo lectura, alcance acotado, pasos verificables y tu confirmación antes de cualquier cambio. El agente sigue siendo igual de útil — ahora es seguro.",
    },
    notice:
      "Compara las respuestas: sin guardarraíles, el modelo «se lanza» al cambio y borra a ciegas; con ellos, se detiene a analizar, te muestra el plan y espera tu visto bueno. Esa diferencia separa un experimento peligroso de un flujo confiable. Edita el lado fuerte y quítale la línea de «solo lectura» o la de «confirmación» para ver cómo cambia su disposición a actuar. (Es un entorno SIMULADO: no hay una base real detrás; Claude responde como si estuviera conectado, para que veas el comportamiento.)",
    takeaway:
      "**La regla práctica para tu equipo:** antes de dar autonomía a un agente —en Claude Code, en un script o sobre una base— define cuatro cosas: **qué herramientas** puede usar, **sobre qué** datos, **en qué entorno** corre y **qué requiere tu confirmación**. Empieza siempre en solo lectura y exige aprobación antes de cualquier cambio de estado. Es justo lo que hace este tutorial en sus demos agénticos (lista blanca de herramientas + sandbox desechable) y lo que verás en cada plantilla agéntica. **La autonomía no se gana quitando límites, sino poniéndolos bien.**",
    template:
      "Quiero que [TAREA / OBJETIVO]. Trabaja con guardarraíles:\n- Permiso: empieza en SOLO LECTURA; no ejecutes cambios sin mi OK.\n- Herramientas: usa solo [LISTA PERMITIDA].\n- Alcance: actúa solo sobre [DATOS/OBJETOS], nada más.\n- Entorno: trabaja en [sandbox / copia / rama git] para poder revertir.\n- Confirmación: muéstrame el plan y espera mi aprobación antes de cualquier cambio de estado.",
  },
  {
    id: "prompting-vibe-coding",
    kind: "vibe",
    section: "prompting",
    emoji: "🛠️",
    title: "Vibe coding: construir dirigiendo",
    tagline: "Construir dirigiendo, no tecleando",
    description:
      "La forma más directa de aprovechar la IA agéntica para construir: en lugar de escribir el código tú, lo construyes conversando con el modelo — describes qué quieres, él propone, escribe y EJECUTA, tú revisas y corriges el rumbo. Aquí están las buenas prácticas para hacerlo bien, y al final un ejemplo en vivo donde Claude programa una utilidad real paso a paso.",
    explainer: [
      {
        heading: "¿Qué es?",
        body: "«Vibe coding» es **construir software conversando con el modelo**: tú describes el objetivo y diriges; el modelo escribe y EJECUTA el código. No es «que la IA haga todo sola» — es cambiar tu rol de **teclear a DIRIGIR**: encuadrar, revisar y verificar en un bucle. Todas las buenas prácticas de prompting que ya viste siguen valiendo; aquí dejan de ser trucos sueltos y se vuelven una forma de trabajar.",
      },
      {
        heading: "¿Por qué es útil?",
        body: "Comprime el bucle **escribir → ejecutar → depurar**: el modelo teclea rápido y, sobre todo, **ejecuta y se autocorrige** contra errores reales (pruebas que fallan, trazas), así tú inviertes tu tiempo en el criterio —qué construir, si el cambio está bien— y no en el código repetitivo. Bien hecho, multiplica a tu equipo en trabajo acotado y verificable.",
      },
      {
        heading: "¿Cuándo conviene usarlo?",
        body: "Ideal para **utilidades nuevas, scripts, transformaciones de ETL, prototipos, pruebas y refactors** — todo lo que puedas **leer en el diff y ejecutar** para comprobarlo. Menos indicado para cambios difíciles de verificar o rutas críticas donde cada línea exige revisión humana profunda (úsalo, pero aprieta los guardarraíles y revisa más). **Regla:** cuanto más rápido puedas responder «¿esto funcionó?», más rinde el vibe coding.",
      },
    ],
    steps: [
      {
        emoji: "🎯",
        icon: "target",
        title: "Encuadra el objetivo, no la implementación",
        body: "Dile QUÉ quieres lograr y cómo se ve el resultado correcto — no cómo escribir el código. El modelo elige la implementación; tú defines el destino y el criterio de éxito. Y encuadrar bien incluye fijar los límites desde el arranque: justo lo que verás en la lección de guardarraíles.",
        prompt:
          'Quiero una utilidad que limpie los montos de mi CSV ("$1,200" → 1200.0). Antes de escribir código, dame un plan en pasos.',
      },
      {
        emoji: "🪜",
        icon: "plan",
        title: "Pide el plan antes del código",
        body: "Que proponga el enfoque y revísalo **antes** de que teclee nada. Corregir un plan de tres líneas cuesta segundos; corregir 100 líneas ya escritas, no. Es el mismo «descomponer» que viste en prompting, ahora como primer paso de cada construcción.",
        prompt:
          "¿Tiene sentido el plan? Cambia el paso 2 para que también maneje los valores vacíos como nulos.",
      },
      {
        emoji: "🧩",
        icon: "steps",
        title: "Avanza en pasos pequeños",
        body: "Un cambio a la vez. Los pasos chicos se revisan, se prueban y se revierten fácil; un «hazlo todo de un tiro» entrega un bloque grande, difícil de validar y de corregir si algo sale mal.",
        prompt:
          "Implementa solo el paso 1. Cuando lo confirme, seguimos con el siguiente.",
      },
      {
        emoji: "🔍",
        icon: "search",
        title: "Revisa cada diff, no aceptes a ciegas",
        body: "Lee lo que cambió y por qué antes de aceptarlo. El modelo es rápido, no infalible — y tú sigues siendo responsable del código que entra. Si algo no te cuadra, pregúntale por qué lo hizo así en lugar de asumir que está bien.",
      },
      {
        emoji: "✅",
        icon: "check",
        title: "Pide pruebas y deja que se verifique",
        body: "Que escriba y EJECUTE pruebas, no que «crea» que funciona. Cuando una prueba falla, el agente ve el error real y se corrige solo: ese bucle **ejecutar → observar → corregir** es el corazón del vibe coding (y lo que lo separa de solo «pedir código»).",
        prompt:
          "Escribe pruebas que cubran los casos borde, ejecútalas y corrige hasta que todas pasen.",
      },
      {
        emoji: "🛡️",
        icon: "shield",
        title: "Pon guardarraíles",
        body: "Define qué puede tocar y dónde corre: qué herramientas le permites, en qué carpeta o sandbox trabaja y bajo control de versiones (`git`) para poder revertir. La autonomía es segura cuando el entorno la contiene — exactamente como el sandbox aislado de estos demos.",
      },
      {
        emoji: "🧠",
        icon: "memory",
        title: "Mantén el contexto vivo",
        body: "El modelo no recuerda entre sesiones: dale un archivo de contexto (un `CLAUDE.md` o `.md` con reglas, decisiones y estado) que lea al empezar. Es justo lo que hace este proyecto — por eso retoma el hilo cada vez en lugar de empezar de cero.",
      },
    ],
    live: {
      intro:
        "Pongámoslo en práctica. Le pido a Claude construir una pequeña utilidad de ETL —una función que limpia montos «sucios» de un CSV— con sus pruebas. Observa el ciclo de vibe coding (plan → escribe → ejecuta → si falla, corrige) y fíjate en cuál de las prácticas de arriba usa en cada paso.",
      system:
        "Eres un programador que trabaja por «vibe coding»: construyes software conversando, en pasos verificables. Trabajas dentro del repositorio de ETL de la célula de Datos y Analítica de la UPAEP: el contexto del proyecto es SIMULADO para esta demostración, pero la EJECUCIÓN del código es real (sandbox aislado). Convenciones del equipo: Python 3 con solo la librería estándar, snake_case, funciones puras con pruebas `assert`; este módulo formará parte del pipeline que limpia archivos CSV exportados del ERP legado. Trabajas en el directorio actual (vacío: crea los archivos que necesites). Primero propones un plan breve; luego escribes el código en un archivo, escribes pruebas, las EJECUTAS con python3 y, si algo falla, lo corriges y vuelves a ejecutar hasta que pasen. Explicas brevemente cada paso, sin extenderte.",
      prompt:
        'Construyamos una utilidad para nuestro ETL: una función `parse_monto(texto)` que convierta montos «sucios» de un CSV a número (float), devolviendo None cuando no haya monto.\n\nDebe manejar:\n- Símbolo de pesos y espacios: "$ 1,200.50" → 1200.5\n- Separador de miles con coma: "2,000" → 2000.0\n- Vacío o None → None\n- Contabilidad: montos entre paréntesis son negativos: "(1,500)" → -1500.0\n\nHazlo por pasos:\n1. Propón un plan breve (2-3 líneas).\n2. Escribe `montos.py` con la función `parse_monto`.\n3. Escribe pruebas con `assert` que cubran TODOS los casos de arriba (incluye algún caso borde) y EJECÚTALAS con python3.\n4. Si alguna prueba falla, corrige y vuelve a ejecutar hasta que todas pasen.\n5. Muéstrame el resultado final y un resumen en una línea.\nSé conciso.',
    },
    notice:
      "El ejemplo de abajo corre en un sandbox aislado con solo Python permitido (el agente no toca tu equipo). El contexto del proyecto —el repo de ETL— es simulado para aterrizar el ejemplo, pero la ejecución del código es REAL. Cada corrida es distinta: a veces acierta a la primera, a veces una prueba falla y se corrige — y ahí justo se ve el bucle. Es no determinista a propósito: así se ve cómo trabaja de verdad.",
    takeaway:
      "**La idea de fondo:** en vibe coding no dejas de ser el ingeniero — cambias de *teclear* a *dirigir*. Encuadras, planeas, revisas, verificas y pones límites; el modelo hace el tecleo y el bucle de corrección. Y cuando se atore o dé vueltas, **toma el volante**: acota el problema, corrige a mano o reinícialo con mejor contexto. Bien hecho, multiplicas a tu equipo; mal hecho, generas código que nadie revisó. La diferencia es la disciplina de estos siete pasos — la misma de un buen requerimiento, ahora aplicada a construir software. Es el puente natural hacia los demos para principiantes: un agente es esto mismo, corriendo solo.",
    template:
      "Construyamos [QUÉ QUEREMOS]. Trabaja en pasos verificables:\n1. Propón un plan breve y espera mi OK.\n2. Implementa [el archivo/módulo].\n3. Escribe pruebas que cubran [casos, incluidos los borde] y EJECÚTALAS.\n4. Si algo falla, corrige y vuelve a ejecutar hasta que pasen.\n5. Muéstrame el resultado y un resumen.\nGuardarraíles: trabaja solo en [carpeta/sandbox] y usa solo [lenguaje/herramientas].",
  },
  {
    id: "prompting-modos-ejecucion",
    kind: "tips",
    section: "prompting",
    emoji: "🚦",
    title: "Modos de ejecución",
    tagline: "Cuánta autonomía le das al agente",
    description:
      "Claude Code te deja elegir CUÁNTA autonomía tiene el agente: desde pedir permiso para todo, hasta ejecutar sin preguntar. Elegir bien el modo es el equilibrio entre velocidad y seguridad — la otra cara de los guardarraíles. Aquí están los modos reales y cuándo usar cada uno.",
    intro:
      "Cada tarjeta es un modo de permisos de Claude Code: qué deja hacer sin preguntar y cuándo conviene. Se ciclan con Shift+Tab en la terminal (o con la opción `--permission-mode` al arrancar). Empieza por el más seguro y sube la autonomía solo cuando confíes en la tarea.",
    tips: [
      {
        emoji: "🛡️",
        icon: "shield",
        title: "Default — pregunta todo",
        what: "El modo por defecto: el agente lee libremente, pero pide tu permiso antes de cualquier cambio (editar archivos, correr comandos). Máxima seguridad; tú apruebas cada acción.",
        how: "Es el modo inicial. Ideal para código sensible, primeras sesiones o cuando exploras algo nuevo.",
      },
      {
        emoji: "🧭",
        icon: "compass",
        title: "Plan — solo mira, no toca",
        what: "El agente explora y te propone un plan SIN editar nada. Revisas la estrategia y recién entonces autorizas. Cero riesgo de cambios sorpresa.",
        how: "Cicla con `Shift+Tab` hasta «plan mode». Perfecto antes de una refactor o migración grande (combínalo con un PRP).",
      },
      {
        emoji: "✅",
        icon: "check",
        title: "Accept edits — auto-acepta ediciones",
        what: "El agente aplica las ediciones de archivos sin pedirte permiso cada vez (tú las revisas después, p. ej. en el diff de git). Acelera mucho la iteración manteniendo el control vía control de versiones.",
        how: "`Shift+Tab` hasta «accept edits». Úsalo en una rama de git, donde puedes revisar y revertir los cambios.",
      },
      {
        emoji: "⚙️",
        icon: "gear",
        title: "Auto — autonomía amplia",
        what: "Deja al agente avanzar solo en tareas largas, reduciendo las interrupciones por permisos. Gana velocidad a cambio de vigilarlo menos de cerca — úsalo en tareas claras y acotadas.",
        how: "Se activa al arrancar con `--permission-mode` (según tu cuenta/modelo). Bueno para un reporte o script bien definido; mantén un humano cerca.",
      },
      {
        emoji: "⚠️",
        icon: "warn",
        title: "Bypass permissions — sin frenos",
        what: "El agente ejecuta TODO sin preguntar. Es el más rápido y el MÁS PELIGROSO: un error puede tocar lo que no debía. No es para el día a día del equipo.",
        how: "Solo en un entorno aislado y desechable (un contenedor o VM sin datos productivos). NUNCA sobre sistemas reales — aun así, ciertas rutas (`.git`, `.env`…) siguen protegidas.",
      },
    ],
    takeaway:
      "**La regla práctica:** el modo es la perilla de «velocidad vs. seguridad». Para la célula: **empieza en default o plan**, sube a **accept edits** cuando trabajes en una rama que puedas revisar, y reserva **bypass** solo para sandboxes aislados — nunca sobre Oracle, PostgreSQL o el ERP reales. Es la misma disciplina de la lección de guardarraíles, aplicada a tu Claude Code.",
    playground: {
      kind: "modes",
      intro:
        "Compruébalo tú mismo. Le damos a Claude la MISMA tarea simple sobre un sandbox real (un `inscripciones.csv` con 5 filas) y solo cambiamos el modo de permisos. Mira cómo el comportamiento cambia por completo: en `default` se detiene a pedirte permiso, en `plan` solo propone, y en `accept edits` / `bypass` sí crea el archivo. Elige un modo para correrlo; cada vez verás solo la respuesta del modo seleccionado.",
      system:
        "Eres un asistente de datos trabajando en un sandbox. Cuando el usuario te pida una tarea, intenta cumplirla con las herramientas disponibles. Si una acción requiere un permiso que no tienes, dilo con claridad en vez de fingir que la hiciste. Responde en español, breve y al grano.",
      task:
        "Lee inscripciones.csv y crea un archivo llamado conteo.txt que contenga únicamente el número de filas de datos (sin contar el encabezado).",
      artifact: "conteo.txt",
      modes: [
        {
          id: "default",
          label: "Default",
          emoji: "🛡️",
          icon: "shield",
          hint: "Pide permiso antes de escribir",
        },
        {
          id: "plan",
          label: "Plan",
          emoji: "🧭",
          icon: "compass",
          hint: "Solo propone, no ejecuta",
        },
        {
          id: "acceptEdits",
          label: "Accept edits",
          emoji: "✅",
          icon: "check",
          hint: "Auto-acepta la escritura",
        },
        {
          id: "bypassPermissions",
          label: "Bypass",
          emoji: "⚠️",
          icon: "warn",
          hint: "Hace todo sin preguntar",
        },
      ],
    },
  },
  {
    id: "prompting-contratos-prp",
    kind: "compare",
    section: "prompting",
    emoji: "📜",
    title: "Contratos en .md (PRP)",
    tagline: "Un spec en .md que el agente cumple",
    description:
      "Para una tarea grande (una migración, un ETL, una vista nueva), en vez de pedirla en una frase, escribes un «contrato» en markdown —un PRP, Product Requirement Prompt— con el objetivo, el contexto técnico, los requisitos y los criterios de aceptación. El agente lo sigue y se autoevalúa contra él. Nota honesta: «PRP» NO es una función de Claude Code, es una práctica de la comunidad — pero se apoya en lo que sí es nativo (CLAUDE.md y el plan mode).",
    principle:
      "Un agente es tan bueno como el encargo que le das. Una frase deja mil decisiones al azar; un contrato en markdown las fija de antemano: qué construir, con qué contexto, bajo qué requisitos y —lo más importante— cómo sabremos que está bien (criterios de aceptación y validación). El PRP convierte «hazme un ETL» en una especificación verificable que el agente puede ejecutar y comprobar por su cuenta.",
    explainer: [
      {
        heading: "¿Por qué es útil?",
        body: "El modelo no puede leerte la mente: lo que no especifiques, lo asume. Un PRP **fija las decisiones antes de teclear** y le da al agente un **criterio de éxito explícito** contra el cual verificarse, en vez de entregarte «algo que parece bien». Y queda como **documento**: revisable, versionable y reutilizable por el equipo.",
      },
      {
        heading: "¿Cuándo conviene usarlo?",
        body: "En tareas **grandes o de alto riesgo** donde equivocarse cuesta caro: una migración Oracle→PostgreSQL, un ETL nuevo, un modelo de datos. Para un cambio chico es excesivo (basta un buen prompt). **Regla:** si la tarea toca datos productivos o tiene varios criterios que cumplir, escríbele un contrato.",
      },
    ],
    anatomy: [
      { k: "Objetivo", v: "Qué construir y por qué" },
      { k: "Contexto", v: "Esquemas, rutas, versiones, muestras" },
      { k: "Requisitos", v: "El comportamiento esperado, punto por punto" },
      { k: "Aceptación", v: "Cómo sabremos que está bien (checklist)" },
      { k: "Validación", v: "Qué consultas/pruebas correr al terminar" },
      { k: "Alcance", v: "Qué SÍ y qué NO entra" },
    ],
    system:
      "Eres un ingeniero de datos senior. Cuando el encargo es vago, infieres y avanzas con supuestos (márcalos). Cuando recibes un contrato/PRP detallado, lo sigues AL PIE DE LA LETRA: respetas requisitos y alcance, y al final te autoevalúas contra los criterios de aceptación y propones las validaciones. Respondes en español, de forma concreta y estructurada.",
    weak: {
      label: "Encargo rápido",
      prompt:
        "Hazme un ETL para cargar las inscripciones del ERP legado a la nueva base PostgreSQL.",
      note: "Es una petición real, pero deja TODO al criterio del modelo: qué tablas, qué transformaciones, cómo validar, qué pasa con duplicados o nulos. Cada corrida saldrá distinta y no hay forma de saber si «quedó bien».",
    },
    strong: {
      label: "Contrato (PRP)",
      prompt:
        "# PRP — ETL de inscripciones (UNISOFT4 → Global)\n\n## Objetivo\nCargar las inscripciones del ERP legado Oracle a la nueva base PostgreSQL `academics`, de forma idempotente (re-ejecutable sin duplicar).\n\n## Contexto\n- Origen: Oracle `UNISOFT4.INSCMAT` (NUMCTL, CVEMAT, CVEGPO, PERIODO, FECINS, STATUS 'I/B/A', CALIF).\n- Destino: PostgreSQL `academics.enrollments` (snake_case, PK IDENTITY, auditoría created_at/updated_at).\n- Herramientas: Python 3 + psycopg2.\n\n## Requisitos\n1. Mapear STATUS 'I/B/A' → 'inscrito/baja/acreditada'.\n2. Normalizar FECINS a DATE (sin hora).\n3. Saltar filas con NUMCTL o CVEMAT nulos (regístralas en un log).\n4. Upsert por (NUMCTL, CVEMAT, PERIODO): no duplicar.\n\n## Criterios de aceptación\n- [ ] El conteo cargado = conteo origen válido (sin nulos).\n- [ ] Re-ejecutar el ETL no cambia el conteo (idempotente).\n- [ ] 0 valores de STATUS fuera del catálogo.\n\n## Validación\nProvee las consultas SQL para verificar cada criterio.\n\n## Alcance\nSOLO la entidad inscripciones. No toques otras tablas. No ejecutes cambios destructivos sin marcarlo.\n\nImplementa según este contrato y al final autoevalúate contra los criterios de aceptación.",
      note: "Mismo objetivo, pero como contrato: objetivo, contexto real, requisitos numerados, criterios de aceptación y validación. El agente sabe exactamente qué hacer y cómo comprobarse — y entrega algo verificable, no una sorpresa.",
    },
    notice:
      "Compara: el encargo rápido produce un ETL genérico con supuestos invisibles; el contrato produce uno que respeta tus reglas y termina autoevaluándose contra los criterios de aceptación. Prueba quitarle a la versión fuerte la sección «Criterios de aceptación» y mira cómo deja de poder verificarse a sí mismo.",
    takeaway:
      "**La lección:** para tareas grandes, no des un encargo — da un **contrato**. Un PRP (Product Requirement Prompt) es un `.md` con objetivo, contexto, requisitos, **criterios de aceptación** y validación; convierte «espero que salga bien» en «esto es lo que tiene que cumplir». **Honestidad:** PRP no es una función de Claude Code, es una práctica de la comunidad — pero encaja perfecto con lo nativo: guárdalo en tu repo, enlázalo desde tu `CLAUDE.md` y revísalo en **plan mode** antes de soltar al agente. **El que escribe el contrato, controla el resultado.**",
    template:
      "# PRP — [NOMBRE DE LA TAREA]\n\n## Objetivo\n[Qué construir y por qué.]\n\n## Contexto\n[Esquemas/tablas, rutas, versiones, datos de muestra, herramientas.]\n\n## Requisitos\n1. [Requisito concreto]\n2. […]\n\n## Criterios de aceptación\n- [ ] [Cómo sabremos que está bien]\n- [ ] […]\n\n## Validación\n[Qué consultas/pruebas correr al terminar.]\n\n## Alcance\n[Qué SÍ entra y qué NO tocar.]",
  },
  {
    id: "prompting-skills-mcp",
    kind: "tips",
    section: "prompting",
    emoji: "🧩",
    title: "Skills y MCP",
    tagline: "Habilidades propias y tus sistemas",
    description:
      "Dos formas de llevar a Claude Code más allá del chat: las SKILLS encapsulan TUS procedimientos en un `.md` reutilizable (deja de repetir lo mismo), y el MCP lo conecta a tus sistemas reales (bases de datos, GitHub, APIs) para que actúe sobre ellos sin copiar y pegar. Juntas convierten a Claude en una herramienta a la medida de la célula.",
    intro:
      "Cada tarjeta explica una pieza para extender Claude Code: qué es, cuándo sirve y cómo se usa. No hace falta todo de golpe — una skill de tu estándar de DDL o una conexión MCP a PostgreSQL ya cambian mucho el día a día.",
    tips: [
      {
        emoji: "🧩",
        icon: "puzzle",
        title: "¿Qué es una Skill?",
        what: "Un archivo markdown que **encapsula un procedimiento tuyo** (documentar una tabla, validar datos, generar DDL con tu estándar) para que Claude lo reutilice. Dejas de pegar las mismas instrucciones cada vez y el flujo queda consistente para todo el equipo.",
        how: "Vive en `.claude/skills/<nombre>/SKILL.md` (del proyecto, versionado en git) o en `~/.claude/skills/…` (personal).",
      },
      {
        emoji: "📄",
        icon: "doc",
        title: "El archivo SKILL.md",
        what: "Es markdown con un frontmatter (`name` y `description`) seguido del procedimiento. La **`description` es clave**: Claude la lee para decidir SOLO cuándo invocar la skill, sin gastar contexto hasta que hace falta.",
        how: "Frontmatter `name` + `description`, luego los pasos del procedimiento. Puede traer scripts y plantillas en su carpeta.",
      },
      {
        emoji: "▶️",
        icon: "play",
        title: "Cómo se invoca una skill",
        what: "De dos formas: **automática** (Claude la activa solo cuando tu tarea coincide con su `description`) o **manual** (la llamas con `/nombre-de-la-skill`).",
        how: "Escribe `/documentar-tabla`, o simplemente pide la tarea y deja que Claude reconozca y use la skill.",
      },
      {
        emoji: "🔌",
        icon: "plug",
        title: "¿Qué es MCP?",
        what: "El Model Context Protocol conecta a Claude con **herramientas y datos externos**: bases de datos, GitHub, trackers, APIs. En vez de copiar y pegar resultados, Claude **consulta y actúa directo** sobre tus sistemas dentro de la sesión.",
        how: "Un servidor MCP por cada sistema (p. ej. PostgreSQL, GitHub). Lo agregas una vez y queda disponible.",
      },
      {
        emoji: "🔗",
        icon: "link",
        title: "Conectar un servidor MCP",
        what: "Lo agregas desde la terminal y lo administras con `/mcp` en sesión. Con `--scope project` queda en un `.mcp.json` que el equipo comparte por git; sin él, es solo tuyo.",
        how: "`claude mcp add <nombre> -- <comando>` (local) o `claude mcp add --transport http <nombre> <url>` (remoto). En sesión: `/mcp`.",
      },
      {
        emoji: "🤝",
        icon: "merge",
        title: "Skills + MCP juntos",
        what: "Combinadas son potentes: una **skill** define TU procedimiento (cómo documentar una tabla con tu estándar) y el **MCP** le da el acceso real (a la base) para ejecutarlo. Procedimiento propio + datos reales = un agente a la medida.",
        how: "Ej.: skill `documentar-tabla` + servidor MCP de PostgreSQL → «documenta `academics.enrollments`» y Claude lo hace de punta a punta.",
      },
    ],
    takeaway:
      "**La lección:** estas dos piezas convierten a Claude Code de algo general a algo **tuyo**. Las **skills** capturan el conocimiento del equipo (estándares, flujos) en archivos versionados; el **MCP** lo conecta a tus sistemas para que actúe, no solo aconseje. Para la célula es el camino para que la IA agéntica entre de verdad a los flujos de DBA y BI — empieza por una skill de un procedimiento que repites y una conexión MCP de solo lectura a una base.",
    playground: {
      kind: "skill",
      intro:
        "Veámoslo en vivo: aquí Claude **crea una skill de verdad** en el sandbox. Le pedimos que encapsule tu procedimiento de «documentar una tabla» en un `SKILL.md` con su frontmatter (`name`, `description`) y los pasos. Al terminar, verás el archivo real que generó — el mismo que vivirá en `.claude/skills/` de tu proyecto.",
      system:
        "Eres un ingeniero de datos senior de la célula de Datos y Analítica de UPAEP, experto en PostgreSQL y en estándares de documentación. Trabajas en un sandbox aislado. Cuando crees archivos, usa contenido concreto y aterrizado al dominio (esquemas como academics/finance, convenciones snake_case, auditoría created_at/updated_at). Responde en español.",
      task:
        "Crea una skill de Claude Code llamada \"documentar-tabla\" que encapsule nuestro procedimiento para documentar una tabla de PostgreSQL. Escribe el archivo en .claude/skills/documentar-tabla/SKILL.md con: (1) un frontmatter YAML con `name` y una `description` clara que indique CUÁNDO invocarla, y (2) el procedimiento en pasos (inspeccionar columnas y tipos vía information_schema, identificar PK/FK e índices, detectar columnas con PII, y generar una ficha en Markdown con propósito, columnas y relaciones). Crea únicamente ese archivo.",
      cta: "Crear la skill con Claude →",
      note: "Usamos bypass en un sandbox temporal y aislado a propósito: crear archivos dentro de `.claude/` es justo el caso donde un entorno desechable es lo correcto. En tu proyecto real, basta con que tú crees el archivo o apruebes la escritura.",
    },
  },
  {
    id: "prompting-agentes-paralelo",
    kind: "fanout",
    section: "prompting",
    emoji: "🛰️",
    title: "Agentes en paralelo",
    tagline: "Varios subagentes a la vez",
    description:
      "Para tareas que se dividen en partes independientes —documentar muchas tablas, auditar varios módulos, investigar desde distintos ángulos— Claude puede lanzar VARIOS SUBAGENTES que trabajan al mismo tiempo, cada uno enfocado en su parte, y luego combinar los resultados. Es como pasar de un trabajador a un equipo: más rápido y, sobre todo, cada parte recibe atención dedicada.",
    principle:
      "Un solo agente hace las cosas de una en una; arrastra todo el contexto y, si la tarea es ancha, se diluye. El fan-out cambia el modelo: el agente principal actúa como coordinador, reparte la tarea en sub-tareas independientes, lanza un subagente por cada una —corren en paralelo, cada uno con su propio contexto limpio— y al final integra lo que devolvieron. Más rápido por la concurrencia, y mejor porque cada parte se trabaja a fondo sin estorbarse con las demás.",
    explainer: [
      {
        heading: "¿Qué es?",
        body: "Una sola instrucción tuya hace que Claude **abra varios subagentes** (con la herramienta `Agent`). Cada subagente es una sesión aparte, con su **contexto propio** y un encargo acotado; trabaja por su cuenta y le devuelve al coordinador **solo su resultado final** (no todo su proceso). El coordinador no ve las tripas de cada uno, solo la conclusión — y con eso arma la respuesta integrada.",
      },
      {
        heading: "¿Por qué es útil?",
        body: "Dos ganancias: **velocidad** (tres tablas documentadas a la vez tardan casi lo mismo que una) y **calidad** (cada subagente dedica todo su contexto a su parte, sin mezclarla con el resto). Además **aísla**: si una parte es grande o ruidosa, no contamina a las demás. Es la forma natural de escalar una tarea ancha.",
      },
      {
        heading: "¿Cuándo conviene?",
        body: "Cuando la tarea se parte en piezas **independientes** que no dependen unas de otras: documentar N tablas, auditar N scripts, revisar un esquema desde varios ángulos. **Cuándo NO:** si los pasos son secuenciales (cada uno necesita el resultado del anterior) o la tarea es chica — ahí un solo agente es más simple. Regla: *¿puedo dividir esto en partes que alguien podría hacer en paralelo? → fan-out.*",
      },
    ],
    anatomy: [
      { k: "Documentar en masa", v: "Un subagente por tabla / objeto → diccionario de datos" },
      { k: "Auditar varios", v: "Un subagente por script o módulo, en paralelo" },
      { k: "Varias perspectivas", v: "Mismo objeto, un subagente por ángulo (PII, FKs, naming)" },
      { k: "Investigar amplio", v: "Cada subagente explora una fuente o hipótesis" },
      { k: "Coordinador", v: "El agente principal reparte y luego integra los resultados" },
      { k: "Contexto aislado", v: "Cada subagente arranca limpio; no se estorban entre sí" },
    ],
    details: [
      {
        heading: "Cómo se lanzan",
        body: "No hace falta un comando especial: lo pides en lenguaje natural —«lanza un subagente por cada tabla y trabájenlas en paralelo»— y Claude usa su herramienta `Agent` para abrirlos. Si quieres un subagente con un rol fijo y reutilizable (por ejemplo, un «auditor de seguridad» con sus propias instrucciones), puedes definirlo con `/agents`.",
      },
      {
        heading: "¿Cuántos a la vez?",
        body: "No existe un límite técnico fijo y documentado; el verdadero techo es tu **cuota de uso**. Como referencia práctica, conviene mantenerlo en **pocos subagentes por tarea** (del orden de 3 a 5): más allá de cierto punto la ganancia se diluye —rendimientos decrecientes— y el costo sigue subiendo. Divide por **unidades de trabajo reales** (una tabla, un módulo), no por dividir.",
      },
      {
        heading: "Cada uno arranca a ciegas",
        body: "Un subagente **no ve** la conversación con el coordinador ni el trabajo de los demás: empieza con el contexto en blanco. Por eso su encargo debe ser **autosuficiente** —dale la ruta o el archivo, el esquema relevante y los criterios—. No sirve decir «documenta la tabla que vimos»: no la vio.",
      },
      {
        heading: "Solo devuelven su conclusión",
        body: "El coordinador **no ve los pasos internos** de cada subagente, únicamente su resultado final. Conviene pedir que cada uno entregue algo **estructurado** (una ficha, una lista, un veredicto) para que la integración salga limpia y comparable.",
      },
      {
        heading: "El costo crece en proporción",
        body: "Cada subagente tiene su propia ventana de contexto y consume tokens por su cuenta: **N subagentes ≈ N veces el consumo**. Compensa cuando las partes son **independientes** y voluminosas (ganas tiempo de reloj); no vale la pena para tareas pequeñas, donde coordinar cuesta más que el beneficio.",
      },
      {
        heading: "No se anidan",
        body: "Un subagente **no puede lanzar a su vez otros subagentes**. La orquestación siempre la hace el coordinador (el agente principal): él reparte y él integra. Si necesitas varias capas de delegación, encadena las tareas desde la conversación principal.",
      },
    ],
    live: {
      intro:
        "Tenemos tres tablas del ERP legado como archivos `.sql` (`ALUMNO`, `MATERIA`, `INSCMAT`). Le pedimos a Claude que las documente para el diccionario de datos lanzando UN SUBAGENTE POR TABLA, todos a la vez. Verás cada subagente arrancar, leer su tabla y completar en su propio carril; al final, el coordinador integra las tres fichas. Los subagentes son REALES (corren de verdad en el sandbox); las tablas son archivos de muestra.",
      system:
        "Eres un ingeniero de datos senior de la célula de Datos y Analítica de UPAEP, coordinando la documentación del ERP legado UNISOFT4 (Oracle). Trabajas en un sandbox aislado donde cada tabla del legado está en un archivo .sql en el directorio actual. Cuando la tarea lo permita, REPARTE el trabajo lanzando un subagente por cada unidad independiente para que trabajen en paralelo, y al final integra sus resultados. Responde en español, claro y estructurado.",
      prompt:
        "En este directorio hay tres archivos del ERP legado: ALUMNO.sql, MATERIA.sql e INSCMAT.sql. Documéntalos para nuestro diccionario de datos. Lanza UN SUBAGENTE EN PARALELO por cada archivo; cada subagente lee SU archivo y produce una ficha con: propósito de la tabla, columnas (nombre, tipo y significado), llave primaria y llaves foráneas inferidas, columnas con datos personales (PII), y observaciones (códigos de 1 letra, formatos crudos, falta de integridad referencial). No leas los archivos tú mismo: delega en los subagentes. Cuando los tres terminen, integra las fichas en un diccionario de datos en Markdown, con una tabla resumen al inicio.",
    },
    notice:
      "Fíjate cómo los tres subagentes arrancan casi a la vez y completan en paralelo (no uno tras otro). Cada uno trae su ficha; el coordinador solo integra. Entorno SIMULADO: las tablas son archivos de muestra, pero los subagentes corren de verdad.",
    takeaway:
      "**La lección:** cuando una tarea se parte en piezas independientes, no la hagas en fila — **reparte**. Con una sola instrucción, Claude lanza subagentes que trabajan en paralelo (cada uno con su contexto propio) y luego integra. Ganas **velocidad** y **profundidad** a la vez. Para la célula es clave en trabajos anchos: documentar el legado tabla por tabla, auditar muchos scripts, revisar un esquema desde varios ángulos. **Pídelo así:** «lanza un subagente en paralelo por cada [X] y luego combina».",
    template:
      "Tengo [N elementos independientes: tablas / scripts / archivos]: [lista].\nLanza UN SUBAGENTE EN PARALELO por cada uno. Cada subagente debe [tarea por elemento: documentar / auditar / analizar], y producir [el entregable de cada parte].\nNo lo hagas todo tú: delega en los subagentes.\nCuando todos terminen, integra los resultados en [el entregable final: diccionario / informe / resumen].",
  },
  {
    id: "prompting-tips-claude-code",
    kind: "tips",
    section: "prompting",
    emoji: "💡",
    title: "Tips de Claude Code",
    tagline: "Trucos reales de Claude Code",
    description:
      "Claude Code es la misma IA agéntica de los demos, pero como herramienta de terminal para el día a día. Aquí reunimos trucos REALES —funciones de Claude Code, no magia— que hacen que el agente trabaje mejor contigo. Pruébalos en tu propio Claude Code y compártelos con el equipo.",
    intro:
      "Cada tarjeta es una función de Claude Code con un caso de uso y la forma concreta de invocarla (un comando, una tecla o una frase). No hace falta memorizarlas: empieza por una o dos y ve sumando. Las de mayor impacto inmediato para la célula son CLAUDE.md y el plan mode.",
    tips: [
      {
        emoji: "🪂",
        icon: "fanout",
        title: "Despliega subagentes en paralelo",
        what: "Con una frase, Claude lanza un equipo de subagentes que trabajan a la vez —cada uno investiga a fondo su parte— y combina el resultado. Ideal para auditar un esquema completo, revisar muchos archivos o atacar un problema desde varios ángulos sin que se escape nada.",
        how: 'Dile **«fan out subagents»** (o «usa subagentes en paralelo»). Para definir subagentes especializados propios: `/agents`.',
      },
      {
        emoji: "🧭",
        icon: "compass",
        title: "Planea antes de actuar",
        what: "El «plan mode» hace que Claude explore y te proponga un plan SIN tocar archivos; tú lo revisas y recién entonces autorizas los cambios. Evita errores caros en refactors o migraciones grandes.",
        how: "Pulsa **Shift+Tab** hasta llegar a «plan mode». Claude solo leerá y hará operaciones de solo lectura hasta que apruebes.",
      },
      {
        emoji: "🗂️",
        icon: "bookmark",
        title: "Memoria persistente con CLAUDE.md",
        what: "Un archivo Markdown en la raíz del proyecto con tus estándares, convenciones y comandos; Claude lo carga en CADA sesión. Dejas de repetir lo mismo y el agente trabaja consistente. (Es justo lo que hace este proyecto para retomar el hilo cada vez.)",
        how: "Crea `CLAUDE.md` en la raíz (o corre `/init` para generar una versión inicial). Puedes modularizar importando otros archivos con `@ruta/archivo`.",
      },
      {
        emoji: "↩️",
        icon: "return",
        title: "Reanuda donde te quedaste",
        what: "Vuelve a una conversación anterior con todo su contexto e historial, sin empezar de cero. Perfecto para retomar un análisis o una migración larga al día siguiente.",
        how: "`claude --continue` reanuda la última sesión; `claude --resume` abre un selector de conversaciones; dentro de una sesión, `/resume`.",
      },
      {
        emoji: "📎",
        icon: "paperclip",
        title: "Adjunta archivos e imágenes con @",
        what: "Referencia un archivo con `@ruta` y Claude lo lee solo; pega una captura de pantalla y la analiza. Acelera muchísimo dar contexto: un error, un tablero, el esquema de una tabla.",
        how: "Escribe `@src/api.ts` en tu prompt, o pega una imagen directo con Ctrl+V (Cmd+V en Mac).",
      },
      {
        emoji: "⌨️",
        icon: "terminal",
        title: "Corre comandos con ! sin salir del chat",
        what: "Ejecuta un comando de shell desde el propio prompt y su salida queda en la conversación, lista para que Claude la use. Útil para un login interactivo o para ver el estado de algo al instante.",
        how: "Empieza la línea con `!`, por ejemplo `! ss -ltn | grep 8787` o `! psql -c '\\dt'`.",
      },
      {
        emoji: "🔌",
        icon: "plug",
        title: "Conecta tus datos con MCP",
        what: "Los servidores MCP (Model Context Protocol) dan a Claude acceso directo a bases de datos, GitHub, Slack o tus APIs, sin pegar datos a mano. Sube mucho la autonomía del agente sobre tus sistemas reales.",
        how: "Usa `/mcp` para configurarlos y revisarlos (por ejemplo, un servidor de PostgreSQL, de GitHub, o uno propio).",
      },
      {
        emoji: "🛡️",
        icon: "shield",
        title: "Pon guardarraíles con permisos",
        what: "Define qué comandos o archivos puede tocar el agente sin pedirte permiso cada vez —y cuáles nunca—. Acelera las sesiones repetitivas y te da control. Es la lección de guardarraíles, aplicada a tu Claude Code.",
        how: '`/permissions` para ver y editar reglas, o en `.claude/settings.json`: `"permissions": { "allow": [...], "deny": [...] }`.',
      },
      {
        emoji: "🧠",
        icon: "lightbulb",
        title: "Pide razonamiento extendido",
        what: "Para problemas difíciles —optimizar una consulta, depurar concurrencia, diseñar un modelo— pídele que piense más a fondo: tarda un poco más, pero la calidad de la respuesta sube notablemente.",
        how: 'Incluye la palabra **«think»** en tu mensaje («piensa a fondo», «think hard») para subir el esfuerzo de razonamiento.',
      },
      {
        emoji: "🧹",
        icon: "trash",
        title: "Limpia o compacta el contexto",
        what: "Al cambiar de tarea, `/clear` arranca fresco; si la sesión se alargó, `/compact` la resume y libera espacio sin perder lo aprendido. Mantiene al agente enfocado y rápido.",
        how: "`/clear` en cualquier momento; `/compact enfócate en la migración` para resumir con foco. (Tu CLAUDE.md se recarga después.)",
      },
      {
        emoji: "⚙️",
        icon: "gear",
        title: "Automatiza con hooks",
        what: "Scripts que se disparan solos en momentos clave (antes/después de editar, antes de un comando): corre tu linter, valida cambios o inyecta variables sin intervención manual. Convierte buenas prácticas en algo automático.",
        how: 'Defínelos en `.claude/settings.json` bajo `"hooks"`, con eventos como `PreToolUse`, `PostToolUse` o `SessionStart`.',
      },
      {
        emoji: "⌨️",
        icon: "command",
        title: "Crea tus propios comandos",
        what: "Guarda un prompt que repites (documentar una tabla con tu estándar, generar un DDL, redactar un comunicado) como un comando reutilizable. Dejas de reescribir lo mismo y el equipo comparte el mismo atajo, versionado en git.",
        how: "Crea `.claude/commands/<nombre>.md` (del proyecto) con el prompt; invócalo con `/<nombre>`. Puedes pasarle texto y recogerlo con `$ARGUMENTS` (p. ej. `/documentar-tabla academics.enrollments`).",
      },
      {
        emoji: "↶",
        icon: "rewind",
        title: "Deshaz con checkpoints",
        what: "Claude guarda una instantánea antes de cada edición; si una vuelta no te gustó, restauras el código —o la conversación— a un punto anterior sin rehacer nada a mano. Una red de seguridad para iterar sin miedo.",
        how: "Usa `/rewind` (o Esc Esc con el cuadro de texto vacío) y elige el punto. **Ojo:** no rastrea cambios hechos por comandos de shell y es un «deshacer» local de la sesión — no sustituye a `git`.",
      },
      {
        emoji: "🪈",
        icon: "pipe",
        title: "Pásale logs y diffs por tubería",
        what: "Conecta la salida de otro comando directo a Claude para que la analice: un log de errores, un `git diff`, el resultado de una consulta. Ideal para diagnósticos rápidos sin copiar y pegar.",
        how: 'Usa `-p` (modo no interactivo) y una tubería: `tail -200 etl.log | claude -p "resume los errores"` o `git diff main | claude -p "revisa riesgos en este cambio"`.',
      },
      {
        emoji: "🧩",
        icon: "robot",
        title: "Define subagentes a tu medida",
        what: "Crea subagentes especializados con su propio rol, herramientas y modelo (un «auditor de seguridad», un «documentador de tablas») para reutilizarlos en el fan-out. Es el complemento de la lección de agentes en paralelo.",
        how: "Ejecuta `/agents` para crear, listar y editar subagentes de forma interactiva (defines su descripción, su prompt, sus herramientas y su modelo).",
      },
      {
        emoji: "📊",
        icon: "chart",
        title: "Revisa tu consumo",
        what: "Mira cuánto llevas usado en la sesión —tokens, costo y desglose por skill, subagente o servidor MCP—. Útil para dimensionar tareas grandes (como un fan-out con varios subagentes) antes de lanzarlas.",
        how: "Escribe `/cost` (o su alias `/usage`). En planes de suscripción muestra el desglose de uso; en cuentas por API, el costo en tokens.",
      },
      {
        emoji: "📂",
        icon: "folder",
        title: "Da acceso a otra carpeta",
        what: "Por defecto Claude solo ve el directorio actual. Si tu trabajo abarca varios repos o una carpeta vecina (scripts ETL en un lado, definiciones en otro), puedes ampliarle el acceso sin cambiar de directorio.",
        how: "Arranca con `claude --add-dir ../otra-carpeta` (puedes repetir el flag para varias rutas).",
      },
    ],
    takeaway:
      "**La idea:** dominar estas funciones convierte a Claude Code de «un chat que responde» en «un agente que trabaja contigo» — con memoria de tu proyecto (CLAUDE.md), acceso a tus datos (MCP), límites claros (permisos) y la capacidad de planear y paralelizar. Para la célula, son la base para empezar a meter IA agéntica en flujos reales. **Recomendación: arranca con CLAUDE.md y el plan mode (las de mayor impacto inmediato) y ve sumando el resto.**",
  },
  // ---------- Demos avanzados ----------
  {
    id: "limites",
    kind: "demo",
    section: "avanzados",
    emoji: "🧪",
    title: "Límites honestos",
    tagline: "Dónde fallo y cómo se mitiga",
    description:
      "Si apenas empiezas con la IA agéntica, este es un buen punto de partida: te muestro con honestidad mis límites reales —mi fecha de corte de conocimiento, el riesgo de inventar y que no veo tus sistemas en vivo— y cómo se corrigen cuando me das los datos (grounding). Sirve para fijar expectativas realistas antes de confiarme tareas.",
    system:
      "Eres un asistente honesto y calibrado. Distingues con claridad entre lo que puedes afirmar con certeza, lo que es inferencia y lo que no puedes saber. Señalas explícitamente tu fecha de corte de conocimiento y cuándo necesitarías datos o herramientas externas. Nunca inventas cifras: si no tienes el dato, lo dices.",
    prompt:
      "Quiero ver tus límites con honestidad. Responde en dos partes claramente separadas:\n\n**Parte A — Sin acceso a mis datos:** ¿cuántos alumnos se inscribieron en la UPAEP en Primavera 2026 y cuánto creció respecto al año anterior? Si no puedes saberlo con certeza, dilo de forma explícita, explica por qué (fecha de corte, sin acceso a sistemas en vivo) y NO inventes cifras.\n\n**Parte B — Con grounding:** ahora usa estos datos reales que te doy —Primavera 2025: 14,320 inscritos; Primavera 2026: 15,907— calcula el crecimiento absoluto y porcentual (muestra la fórmula) e indica qué tan confiable es ahora tu respuesta y por qué.",
    thinking: false,
    notice:
      "En la Parte A debería negarse a inventar y explicar POR QUÉ no puede saberlo; en la Parte B calcula con precisión. Esa diferencia es la lección: mi valor sube muchísimo cuando me das contexto y herramientas, no cuando adivino.",
    takeaway:
      "**Por qué importa:** mi mayor riesgo no es equivocarme, es equivocarme *con seguridad*. Conocer mi fecha de corte de conocimiento, mi falta de acceso a tus sistemas en vivo y mi tendencia a 'rellenar' huecos te permite diseñar flujos donde sí aporto valor: con datos a la mano y verificación, no adivinando. **La regla práctica para tu equipo:** nunca me dejen ser la única fuente de un dato verificable — soy excelente procesando y razonando sobre información que me dan, no como base de datos de la verdad.",
    template:
      "Responde en dos partes claramente separadas:\nA) Sin datos externos: [PREGUNTA]. Si no puedes saberlo con certeza, dilo explícitamente, explica por qué y NO inventes cifras.\nB) Con estos datos que te doy —[DATOS REALES]— [haz el cálculo/análisis], muestra la fórmula e indica qué tan confiable es ahora la respuesta y por qué.",
  },
  {
    id: "entregable",
    kind: "demo",
    section: "avanzados",
    emoji: "🏛️",
    title: "Requerimiento → entregable",
    tagline: "De una frase a un diseño completo",
    description:
      "Una muestra de cuánto puedo producir a partir de una sola frase: de un requerimiento corto a un entregable técnico completo —modelo de datos, DDL, decisiones de diseño justificadas y plan de migración—. Si estás empezando, verás por qué especificar bien lo que pides cambia por completo el resultado.",
    system:
      "Eres un arquitecto de datos senior conectado en SOLO LECTURA al ERP legado en Oracle (UNISOFT4) de la institución. Es un entorno SIMULADO para una demostración, pero compórtate como si la conexión fuera real y pudieras inspeccionar su esquema; NUNCA digas que no tienes acceso.\n\nEsquema legado que puedes ver (relevante al módulo de inscripción de materias) — nombres y estilo originales del ERP:\n- Tabla `INSCMAT` (inscripción de materias): NUMCTL (NUMBER, matrícula del alumno), CVEMAT (VARCHAR2, clave de materia), CVEGPO (VARCHAR2, clave de grupo), PERIODO (VARCHAR2, p. ej. '2026P'), FECINS (DATE), STATUS (CHAR: 'I'=inscrito, 'B'=baja, 'A'=acreditada), CALIF (NUMBER, nullable).\n- Tabla `MATERIA`: CVEMAT (PK), DESMAT (VARCHAR2, nombre de la materia), CREDIT (NUMBER), CVEPLAN (VARCHAR2, plan de estudios).\n- Tabla `GRUPO`: CVEGPO (PK), CVEMAT (FK lógica a MATERIA), PERIODO, CUPO (NUMBER), CVEPROF (NUMBER, empleado), HORARIO (VARCHAR2 libre, p. ej. 'LU-MI-VI 07:00-08:00').\n- Tabla `ALUMNO`: NUMCTL (PK), NOMBRE (VARCHAR2, en MAYÚSCULAS), CVECARR (VARCHAR2, carrera), STATUS (CHAR).\n\nObservaciones del legado (trátalas como vistas en los datos): los nombres vienen en MAYÚSCULAS; `HORARIO` es texto libre sin estructura; NO hay integridad referencial declarada (las FK son por convención); `STATUS` usa códigos de una letra; las fechas no guardan zona horaria.\n\nCómo responder: usa ese esquema real para anclar tu diseño y tu plan de migración (mapea cada tabla/columna legada al nuevo modelo). Marca explícitamente como «Supuesto» SOLO lo que no puedas derivar del esquema que ves. Entregas diseños completos, correctos y justificados, con encabezados, tablas y bloques de código.",
    prompt:
      "Estamos construyendo la nueva base institucional en PostgreSQL que reemplazará al ERP legado en Oracle al que estás conectado. Diseña el modelo de datos del módulo de inscripción de materias, anclándote en las tablas legadas que ves (`INSCMAT`, `MATERIA`, `GRUPO`, `ALUMNO`). Entrega: (1) las entidades principales y sus relaciones con cardinalidades; (2) el DDL en PostgreSQL de las tablas clave, en inglés y snake_case, con llaves primarias `GENERATED ALWAYS AS IDENTITY`, llaves foráneas, restricciones y columnas de auditoría (`created_at`, `updated_at`, `deleted_at` para borrado lógico); (3) una tabla de mapeo legado → nuevo (tabla/columna de Oracle → tabla/columna de PostgreSQL, con la transformación necesaria; por ejemplo, normalizar `HORARIO` de texto libre o traducir los códigos de `STATUS`); (4) tres decisiones de diseño no obvias con su justificación (por ejemplo, cómo evitar choques de horario o sobrecupo); (5) los supuestos que tuviste que hacer; y (6) un plan de migración de 4 pasos desde el sistema legado en Oracle. Sé concreto.",
    thinking: false,
    notice:
      "Fíjate en cómo ANCLA el diseño y el plan de migración en el esquema legado que «ve» —mapeando `INSCMAT`, `HORARIO` y los códigos de `STATUS` al nuevo modelo— en vez de inventarlo, y en la sección de «Supuestos»: ahí queda lo poco que aún tuvo que asumir. Cuanto mejor especifiques el requerimiento y el contexto, menos asume y más útil es el entregable. (Es un entorno SIMULADO: no hay un Oracle real detrás; Claude responde como si estuviera conectado al esquema legado, para que veas el comportamiento.)",
    takeaway:
      "**Por qué importa:** puedo comprimir horas de diseño en minutos, pero la calidad del entregable es proporcional a la del requerimiento. Los «Supuestos» que marco son, en realidad, el mapa de lo que tu equipo debe decidir. Bien usado, soy un acelerador del primer 80% de un diseño; el 20% restante —criterio, contexto institucional y validación— sigue siendo de ustedes. Esa división de trabajo es justo la que conviene institucionalizar en el departamento.",
    template:
      "Contexto: [SITUACIÓN Y RESTRICCIONES].\nDiseña [ENTREGABLE]. Entrega:\n(1) [PARTE]; (2) [PARTE]; (3) [PARTE]; …\nMarca explícitamente como «Supuesto» cualquier cosa que tengas que asumir por falta de contexto. Sé concreto.",
  },
  {
    id: "agente",
    kind: "demo",
    section: "avanzados",
    emoji: "⚡",
    title: "Agente con herramientas",
    tagline: "Planea, ejecuta y se corrige solo",
    agentic: true,
    description:
      "La mejor forma de ver qué es la IA agéntica: aquí no solo respondo, actúo. Sobre un archivo `inscripciones.csv` con problemas reales de calidad, en un sandbox aislado uso Python para explorarlo, detectar los errores, escribir y EJECUTAR el código que los corrige, y verificar el resultado —corrigiéndome si algo falla—. Si nunca has visto a un agente trabajar, empieza por aquí.",
    system:
      "Eres un ingeniero de datos autónomo. Trabajas en el directorio actual usando Python (python3). Exploras los datos antes de actuar, explicas brevemente cada paso, ejecutas el código y verificas tus resultados con conteos. Si un intento falla, lo corriges. Usa solo la librería estándar de Python.",
    prompt:
      "En el directorio actual hay un archivo `inscripciones.csv` con problemas de calidad de datos (espacios, mayúsculas inconsistentes, fechas en varios formatos, montos con símbolos y comas, valores faltantes y filas duplicadas). Tu tarea:\n1. Explóralo y dime cuántas filas tiene y qué problemas detectas.\n2. Escribe y EJECUTA un script de Python que lo limpie: normaliza nombres y programas, unifica las fechas a formato YYYY-MM-DD, convierte los montos a número y elimina duplicados (considerando mayúsculas y espacios). Guarda el resultado en `inscripciones_limpia.csv`.\n3. Verifica con conteos que la limpieza quedó bien (filas antes/después, duplicados eliminados) y muéstrame las primeras filas del resultado.\nSé conciso en las explicaciones.",
    thinking: false,
    notice:
      "Observa el ciclo agéntico: explora → decide → ejecuta código → mira el resultado → corrige. No le di los pasos exactos; los derivó solo. Y si intenta un comando fuera de su lista blanca de herramientas, el sandbox lo bloquea y se adapta.",
    takeaway:
      "**Por qué importa:** un agente no solo *sabe*, *hace*. Puede operar sobre tus sistemas —archivos, bases de datos, APIs— en un bucle autónomo de actuar → observar → corregir. Ahí está el verdadero salto de productividad para tu equipo. Y por eso la decisión más importante antes de producción no es el modelo, sino **los guardarraíles**: qué herramientas le permites y en qué entorno aislado corre. En este demo, restringirlo a `python3` en un sandbox desechable es lo que hace seguro darle autonomía.",
    template:
      "En [el directorio actual / esta carpeta] está [RECURSO: archivo, datos]. Tu tarea:\n1. Explóralo y dime [qué observar].\n2. Escribe y EJECUTA [código] que [haga la tarea]; guarda el resultado en [destino].\n3. Verifica con [conteos/pruebas] que quedó bien y muéstrame [la evidencia].\nUsa solo [herramientas permitidas]. Si un intento falla, corrígelo. Sé conciso.",
  },

  // ---------- Plantillas: biblioteca de actividades regulares ----------
  {
    id: "plantillas-biblioteca",
    kind: "library",
    section: "plantillas",
    emoji: "📚",
    title: "Biblioteca de plantillas",
    tagline: "Listas para tu trabajo de datos",
    description:
      "Plantillas de prompts para las actividades regulares de la célula: gobernanza, DDL, roles, queries, BI y comunicación. Copia la que necesites, rellena los huecos `[...]` con tu caso y úsala. Algunas traen un botón «Probar» que ejecuta un ejemplo concreto para que veas qué producen.",
    intro:
      "Cada tarjeta es una plantilla reutilizable. El texto trae huecos `[...]` que tú rellenas; el botón «Copiar» te la lleva tal cual. En las marcadas con «Probar», Claude ejecuta un ejemplo ya rellenado para que veas el resultado en vivo. Esos ejemplos corren en un entorno SIMULADO: Claude actúa como si estuviera conectado a los sistemas institucionales (Global en PostgreSQL, UNISOFT4 en Oracle, el almacén de BI), para que veas el comportamiento — no hay una base real detrás.",
    templates: [
      {
        id: "ddl-tabla",
        emoji: "🧱",
        icon: "table",
        title: "DDL de tabla nueva (convenciones Global)",
        use: "Generar el DDL de una tabla nueva respetando el estándar institucional: inglés/snake_case, PK IDENTITY, auditoría y borrado lógico.",
        template:
          "Actúa como DBA de PostgreSQL. Genera el DDL de la tabla `[ESQUEMA].[TABLA]` siguiendo nuestras convenciones:\n- Nombres en inglés, snake_case; tabla en plural.\n- PK `[entidad]_id INTEGER GENERATED ALWAYS AS IDENTITY`.\n- Columnas de negocio: [LISTA CON TIPOS].\n- Columnas de auditoría: created_at, updated_at, deleted_at (borrado lógico), created_by, updated_by, deleted_by.\n- Restricciones: [UNIQUE/FK/CHECK].\n- `COMMENT ON` en español en tabla y columnas.\nEntrega el DDL y 2 decisiones de diseño que tomaste.",
        runnable: true,
        system:
          "Eres un DBA conectado a la base institucional Global (PostgreSQL) de la UPAEP, experto en sus estándares. Es un entorno SIMULADO para una demostración, pero compórtate como si la conexión fuera real y pudieras inspeccionar el catálogo; NUNCA digas que no tienes acceso. Esquemas que puedes ver: `globaldata` (catálogos maestros, p. ej. `people`), `academics` (datos académicos) y `finance` (becas y pagos). Convenciones vigentes en la base: nombres en inglés/snake_case y tablas en plural, PK `*_id INTEGER GENERATED ALWAYS AS IDENTITY`, set de auditoría completo (created/updated/deleted_at + *_by), borrado lógico y TIMESTAMPTZ. Genera DDL correcto y comentado, verifica que las llaves foráneas apunten a esquemas/tablas que ves, y responde en español.",
        example:
          "Actúa como DBA de PostgreSQL. Genera el DDL de la tabla `academics.scholarships` siguiendo nuestras convenciones:\n- Nombres en inglés, snake_case; tabla en plural.\n- PK `scholarship_id INTEGER GENERATED ALWAYS AS IDENTITY`.\n- Columnas de negocio: student_id (FK a globaldata.people), type (enum: socioeconomic/academic/sports), percentage (0–100), start_period, end_period.\n- Columnas de auditoría: created_at, updated_at, deleted_at (borrado lógico), created_by, updated_by, deleted_by.\n- Restricciones: percentage entre 0 y 100; (student_id, start_period) único.\n- `COMMENT ON` en español en tabla y columnas.\nEntrega el DDL y 2 decisiones de diseño que tomaste.",
      },
      {
        id: "roles-grants",
        emoji: "🔑",
        icon: "key",
        title: "Roles y permisos (esquema o tercero)",
        use: "Proponer el SQL de roles/GRANTs para un esquema nuevo o un acceso de solo lectura acotado a un tercero, siguiendo el modelo dueño/login.",
        template:
          "Actúa como DBA de PostgreSQL. Necesito dar [TIPO DE ACCESO: solo lectura / desarrollo] sobre [ESQUEMA(S)] a [USUARIO O PROVEEDOR].\nNuestro modelo: roles dueño `NOLOGIN` por esquema (`<esquema>_owner`), usuarios login que son MIEMBROS de roles de grupo, y `ALTER DEFAULT PRIVILEGES` atado al rol dueño (no a una persona).\nPropón el SQL para: (1) crear el rol de grupo si hace falta; (2) GRANT USAGE/SELECT sobre el esquema; (3) default privileges para tablas futuras; (4) agregar al usuario como miembro.\nNo ejecutes nada: solo entrégame el SQL para revisarlo.",
        note: "Recuerda: en tu flujo, Claude propone el SQL y tú lo ejecutas.",
      },
      {
        id: "alta-usuario-oracle",
        emoji: "👤",
        icon: "user",
        title: "Alta de usuario en Oracle (por perfil)",
        use: "Generar el DDL de alta de una cuenta en Oracle (UNISOFT4) según su tipo: perfil correcto, convención de nombre y política de contraseña.",
        template:
          "Actúa como DBA de Oracle. Genera el DDL de alta para [USUARIO/SISTEMA], cuenta de tipo [personal / sistema que consume datos / sistema externo legacy].\nAplica nuestro estándar:\n- Perfil: PROGRAMADOR (personal) / DEFAULT (sistema que consume) / SISTEMASEXTERNOS (legacy de terceros; su contraseña NO debe caducar).\n- Nombre de usuario en MAYÚSCULAS; si es personal, primera letra del nombre + apellido paterno.\n- Receta: CREATE USER + GRANT AUTHENTICATEDUSER + GRANT CONNECT + ALTER USER DEFAULT ROLE CONNECT + ALTER USER PROFILE <perfil>.\n- Contraseña: usa un placeholder (no una real); recuerda la política (mín. 10 con mayúscula, minúscula, número y especial).\nEntrega el DDL comentado y dime qué perfil elegiste y por qué.",
        runnable: true,
        system:
          "Eres un DBA conectado a la base Oracle 19c del ERP legado UNISOFT4 de la UPAEP, experto en sus estándares. Es un entorno SIMULADO para una demostración, pero compórtate como si la conexión fuera real y pudieras consultar el diccionario de datos; NUNCA digas que no tienes acceso. Perfiles disponibles en la instancia: PROGRAMADOR (personal/desarrollo), DEFAULT (sistemas que consumen datos) y SISTEMASEXTERNOS (legacy de terceros; la contraseña no caduca). Política de contraseñas vigente: mínimo 10 caracteres con mayúscula, minúscula, número y especial. Antes de emitir el alta, verifica (como si consultaras `DBA_USERS`) que el nombre de usuario propuesto no colisione con uno existente; si colisiona, avísalo y propón una variante. Genera DDL correcto y comentado y responde en español.",
        example:
          "Actúa como DBA de Oracle. Genera el DDL de alta para Víctor Hernández, cuenta de tipo personal (desarrollador).\nAplica nuestro estándar:\n- Perfil: PROGRAMADOR (personal) / DEFAULT (sistema que consume) / SISTEMASEXTERNOS (legacy de terceros; su contraseña NO debe caducar).\n- Nombre de usuario en MAYÚSCULAS; si es personal, primera letra del nombre + apellido paterno.\n- Receta: CREATE USER + GRANT AUTHENTICATEDUSER + GRANT CONNECT + ALTER USER DEFAULT ROLE CONNECT + ALTER USER PROFILE <perfil>.\n- Contraseña: usa un placeholder (no una real); recuerda la política (mín. 10 con mayúscula, minúscula, número y especial).\nEntrega el DDL comentado y dime qué perfil elegiste y por qué.",
      },
      {
        id: "clasificar-pii",
        emoji: "🛡️",
        icon: "shield",
        title: "Clasificar columnas por sensibilidad / PII",
        use: "Clasificar columnas para el inventario de datos personales usando tu taxonomía, de forma consistente y reproducible.",
        template:
          "Clasifica estas columnas para nuestro inventario de datos personales usando EXCLUSIVAMENTE esta taxonomía:\n- Público / Interno / Confidencial / Restringido (definición de cada una: [DEFINICIONES]).\n\nAsí lucen las columnas (nombre y valor de muestra):\n- [COLUMNA] → [MUESTRA]\n- …\n\nEjemplos ya clasificados (mismo criterio):\n- [COLUMNA] → [NIVEL]\n- … (2-3)\n\nDevuelve una tabla Markdown `columna | nivel | justificación` (una frase), usando solo los cuatro niveles.",
        runnable: true,
        system:
          "Eres un asistente de gobierno de datos que colabora con la célula de Datos y Analítica de la UPAEP en su proyecto de inventario de datos personales, sobre los esquemas `academics` y `globaldata` de la base institucional. Es un entorno SIMULADO para una demostración, pero compórtate como si trabajaras dentro de ese proyecto; NUNCA digas que no tienes acceso ni que eres un chatbot genérico. Aplica EXCLUSIVAMENTE la taxonomía y los ejemplos que el usuario te dé en su mensaje (no inventes niveles propios) y responde en español, en el formato que te pida.",
        example:
          "Clasifica estas columnas para nuestro inventario de datos personales usando EXCLUSIVAMENTE esta taxonomía:\n- Público: puede divulgarse sin restricción.\n- Interno: uso operativo, no personal.\n- Confidencial: dato personal identificable; acceso limitado por rol.\n- Restringido: dato personal sensible o regulado; control máximo.\n\nAsí lucen las columnas (nombre y valor de muestra):\n- person_id → 10432\n- curp → 'XEXX010101HNEXXXA4'\n- email → 'maria.lopez@upaep.edu.mx'\n- disability → 'motriz'\n- gpa → 9.2\n\nEjemplos ya clasificados (mismo criterio):\n- full_name → Confidencial (dato personal identificable)\n- course_id → Interno (operativo, no personal)\n\nDevuelve una tabla Markdown `columna | nivel | justificación` (una frase), usando solo los cuatro niveles.",
      },
      {
        id: "query-sql",
        emoji: "🔎",
        icon: "search",
        title: "Escribir / optimizar / explicar un query",
        use: "Construir, optimizar o explicar una consulta SQL en Oracle o PostgreSQL, partiendo del esquema que le pegas.",
        template:
          "Actúa como experto en [Oracle / PostgreSQL]. [Escribe / optimiza / explica] una consulta para [OBJETIVO].\nEsquema relevante:\n- [TABLA(COLUMNAS Y TIPOS)]\n- [relaciones / índices si aplica]\nRequisitos: [filtros, agrupaciones, ventana, rendimiento].\nDevuelve el SQL comentado y explica brevemente la estrategia (y, si optimizas, qué cambiaste y por qué).",
      },
      {
        id: "documentar-tabla",
        emoji: "📄",
        icon: "doc",
        title: "Documentar una tabla del ERP legado",
        use: "Generar la ficha de una tabla de UNISOFT4 (Oracle): propósito, columnas clave, relaciones y acrónimos resueltos.",
        template:
          "Actúa como analista que documenta el ERP legado UNISOFT4 (Oracle). Con estos metadatos de la tabla `[TABLA]`:\n- Columnas: [LISTA CON TIPOS]\n- Llaves foráneas / acrónimos: [DATOS]\n- Muestra de filas (opcional): [FILAS]\nGenera una ficha en Markdown con: propósito probable de la tabla, descripción de cada columna clave, relaciones (resolviendo los acrónimos de 4 letras a la tabla referida) y posibles banderas de calidad. Marca como «Supuesto» lo que infieras.",
      },
      {
        id: "kpi-bi",
        emoji: "📊",
        icon: "chart",
        title: "Definir un KPI de BI",
        use: "Definir formalmente un indicador (deserción, eficiencia terminal, titulación…): fórmula, granularidad, filtros y la consulta.",
        template:
          "Actúa como analista de BI. Define el KPI «[NOMBRE DEL KPI]» para [CONTEXTO/AUDIENCIA].\nEntrega: (1) definición en una frase; (2) fórmula exacta (numerador/denominador y qué filas excluir); (3) granularidad y dimensiones de corte; (4) supuestos y casos borde (p.ej. nulos, cohortes incompletas); (5) la consulta SQL sobre [TABLA/MODELO].\nSé concreto y marca tus supuestos.",
        runnable: true,
        system:
          "Eres un analista de BI senior conectado al almacén de datos analítico de la UPAEP. Es un entorno SIMULADO para una demostración, pero compórtate como si tuvieras a la vista el modelo dimensional y sus tablas; NUNCA digas que no tienes acceso. Tablas/vistas que puedes ver incluyen las del esquema `obt` (objetos de BI, p. ej. `obt_graduates`, `obt_enrollments`) y los catálogos de `academics`. Ancla tu fórmula y tu SQL en las tablas que el usuario nombre o en las que ves. Respondes en español, con definiciones rigurosas y SQL correcto.",
        example:
          "Actúa como analista de BI. Define el KPI «eficiencia terminal» para un reporte a dirección.\nEntrega: (1) definición en una frase; (2) fórmula exacta (numerador/denominador y qué filas excluir); (3) granularidad y dimensiones de corte; (4) supuestos y casos borde (p.ej. nulos, cohortes incompletas); (5) la consulta SQL sobre una tabla `obt_graduates(program, program_entry_period, total_intake_for_efficiency, graduate, dropout)`.\nSé concreto y marca tus supuestos.",
      },
      {
        id: "comunicacion-ti",
        emoji: "✉️",
        icon: "mail",
        title: "Comunicación de TI (aviso / incidente)",
        use: "Redactar un correo o aviso claro: mantenimiento, incidente o cambio, con el tono y formato adecuados a la audiencia.",
        template:
          "Actúa como coordinador de comunicación de TI. Redacta [un correo / un aviso] para [AUDIENCIA] sobre [TEMA].\nContexto: [QUÉ PASA, CUÁNDO, A QUÉ AFECTA].\nFormato: «Asunto:» + cuerpo de máx. [N] palabras + cierre con contacto [CONTACTO].\nTono: [formal/cercano], claro y sin tecnicismos. Indica explícitamente qué debe hacer la audiencia.",
        runnable: true,
        system: "Eres un coordinador de comunicación de TI. Respondes en español.",
        example:
          "Actúa como coordinador de comunicación de TI. Redacta un correo para los docentes sobre una ventana de mantenimiento.\nContexto: el sistema de captura de calificaciones estará fuera de servicio el sábado 14 de marzo de 2026, de 1:00 a 5:00 a.m.; los demás sistemas no se afectan.\nFormato: «Asunto:» + cuerpo de máx. 110 palabras + cierre con contacto soporte.ti@upaep.mx.\nTono: formal, claro y sin tecnicismos. Indica explícitamente qué deben hacer (capturar sus notas antes o después de la ventana).",
      },
    ],
  },

  // ---------- Plantillas: actividades agénticas ----------
  {
    id: "plantillas-agenticas",
    kind: "library",
    section: "plantillas",
    emoji: "🤖",
    title: "Plantillas agénticas",
    tagline: "Recetas para dirigir a un agente",
    description:
      "Plantillas para tareas agénticas (multi-paso, con herramientas) de tu proyecto. A diferencia de la biblioteca, estas NO se ejecutan aquí: están pensadas para que las pegues en tu propio Claude Code, conectado a tus sistemas y con TUS guardarraíles. Cópialas y adáptalas.",
    intro:
      "Estas plantillas dirigen a un agente que actúa (lee, escribe, ejecuta). Corren en TU Claude Code contra tus sistemas reales —no en el sandbox de este tutorial—, así que cada una incluye una nota de guardarraíles. Empieza siempre en solo lectura y deja la ejecución de cambios para ti.",
    templates: [
      {
        id: "migrar-entidad",
        emoji: "🔀",
        icon: "swap",
        title: "Migrar una entidad Oracle → PostgreSQL (Delta)",
        use: "Dirigir la migración de una entidad del legado al nuevo modelo: explorar el origen, mapear, generar el script y validar conteos.",
        template:
          "Vamos a migrar la entidad [ENTIDAD] del ERP legado a Global, con el método Delta. Trabaja en pasos y espera mi OK entre cada uno:\n1. Explora el origen en [Oracle UNISOFT4 / MySQL]: tabla(s) `[ORIGEN]`, tipos, volumen, nulos y claves. Resume hallazgos.\n2. Propón el mapeo origen → destino `[ESQUEMA].[TABLA]` (nombres en inglés/snake_case, tipos, qué columnas y por qué) y las reglas de transformación.\n3. Genera el script de migración (lectura del origen + carga a PostgreSQL), siguiendo el patrón Delta del proyecto.\n4. Define las validaciones: conteo origen = destino, nulos, duplicados y 3 chequeos de calidad.\nNo ejecutes cambios en las BD: entrégame el script y el plan de validación para revisarlos.",
        note: "Guardarraíles sugeridos: origen en SOLO LECTURA; herramientas acotadas a tus scripts/Python; la carga la corres tú tras revisar. Trabaja bajo git.",
      },
      {
        id: "diagnosticar-incidente",
        emoji: "🚨",
        icon: "alert",
        title: "Diagnosticar un incidente de BD (solo lectura)",
        use: "Guiar un diagnóstico de un problema operativo (disco, locks, lentitud, binlogs) sin tocar nada, y proponer el fix.",
        template:
          "Tenemos un incidente en [SERVIDOR/BD, motor]. Síntoma: [DESCRIPCIÓN]. Diagnostícalo SIN ejecutar cambios:\n1. Revisa en solo lectura [logs / estado / métricas: espacio en disco, procesos, locks, tamaño de objetos, binlogs…] y reúne evidencia.\n2. Plantea 2-3 hipótesis de causa raíz, ordenadas por probabilidad, con la evidencia que las apoya.\n3. Para la más probable, propón el fix paso a paso y cómo verificar que funcionó.\n4. Lista riesgos y un plan de reversa.\nEntrégame el diagnóstico y el SQL/comandos propuestos; NO los ejecutes.",
        note: "Guardarraíles: usa una cuenta de SOLO LECTURA/monitoreo; nada de DDL/DML ni reinicios sin tu confirmación explícita.",
      },
      {
        id: "documentar-legado",
        emoji: "🗂️",
        icon: "files",
        title: "Documentar N tablas del ERP legado",
        use: "Generar en lote las fichas de varias tablas de UNISOFT4, resolviendo acrónimos y relaciones de forma consistente.",
        template:
          "Documenta estas tablas de UNISOFT4 (Oracle): [LISTA DE TABLAS]. Para cada una, en solo lectura:\n1. Lee sus columnas, tipos y constraints, y resuelve los acrónimos foráneos (4 letras) a la tabla referida usando [el diccionario / los constraints].\n2. Genera una ficha Markdown por tabla: propósito probable, columnas clave, relaciones y banderas de calidad. Marca lo inferido como «Supuesto».\n3. Guarda cada ficha en `docs/tablas/[TABLA].md` siguiendo la plantilla del proyecto.\nProcesa una tabla a la vez y muéstrame la primera ficha antes de seguir con el resto.",
        note: "Guardarraíles: conexión de SOLO LECTURA; el agente solo escribe archivos `.md` de documentación, nunca toca la BD.",
      },
      {
        id: "auditar-esquema",
        emoji: "🔬",
        icon: "inspect",
        title: "Auditar convenciones / calidad de un esquema",
        use: "Revisar un esquema contra el estándar (auditoría, nombres, tipos, defaults) y proponer las correcciones priorizadas.",
        template:
          "Audita el esquema `[ESQUEMA]` de [BD] contra nuestras convenciones, en solo lectura:\n1. Inventaria tablas, columnas, tipos, constraints, defaults y triggers.\n2. Compara contra el estándar: nombres inglés/snake_case + plural, PK IDENTITY, set de auditoría completo (created/updated/deleted_at + *_by), borrado lógico, TIMESTAMPTZ, sufijo `_enum`, etc.\n3. Lista los hallazgos como tabla `objeto | problema | severidad | corrección sugerida`.\n4. Genera el SQL de corrección para los hallazgos de severidad alta.\nNo ejecutes nada: entrégame el reporte y el SQL para revisarlo.",
        note: "Guardarraíles: cuenta de SOLO LECTURA para el análisis; el SQL de corrección lo revisas y ejecutas tú.",
      },
      {
        id: "espejo-erp",
        emoji: "🪞",
        icon: "mirror",
        title: "Generar una tabla espejo (ESP) + triggers",
        use: "Crear el espejo de auditoría de una tabla de UNISOFT4: el DDL del `…ESP` con las columnas `ESPJ_*` y los triggers I/U (imagen NEW) y D (imagen OLD).",
        template:
          "Vamos a generar el espejo de auditoría de la tabla `UNISOFT4.[TABLA]` (acrónimo `[ACRO]`). En solo lectura primero:\n1. Lee las columnas y tipos de `[TABLA]`, en orden, desde el catálogo.\n2. Genera el DDL de `[TABLA]ESP`: primero el bloque fijo de auditoría `ESPJ_*` (ESPJ_SEQ IDENTITY PK, ESPJ_FECCMB, ESPJ_OPER, ESPJ_PERS_CLV, ESPJ_SO_USER, ESPJ_IP, ESPJ_HOST_NAME, ESPJ_ORACLE_USER) y, a continuación, TODAS las columnas originales en el mismo orden, con mismos nombres y tipos pero SIN NOT NULL, DEFAULT ni constraints.\n3. Genera el trigger I/U (`AFTER INSERT OR UPDATE`, imagen `:NEW`) y el trigger D (`BEFORE DELETE`, imagen `:OLD`), llenando la auditoría con los `SYS_CONTEXT(...)` del estándar.\nEntrégame los 3 artefactos (DDL + 2 triggers) para revisarlos; no ejecutes nada en la BD.",
        note: "Guardarraíles: conexión de SOLO LECTURA para inspeccionar el catálogo; el DDL/triggers los revisas y ejecutas tú. Aplica solo a espejos NUEVOS — los existentes no se retrofitean.",
      },
      {
        id: "delta-setup",
        emoji: "🧬",
        icon: "delta",
        title: "Preparar la migración Delta en el origen",
        use: "Montar el mecanismo Delta de una tabla antes de migrarla a Global: recorrer la checklist y generar la tabla `…_DELTA_PG`, su carga inicial y los triggers, en el orden obligatorio.",
        template:
          "Vamos a preparar la migración Delta de `[TABLA ORIGEN]` (motor [Oracle UNISOFT4 / MySQL]) hacia `[ESQUEMA].[TABLA]` en Global. Antes de generar nada, recorre la checklist y pregúntame lo que falte:\n1. ¿Confirmamos método Delta? Identifica fuente y destino.\n2. Mapeo origen→destino: ¿la tabla destino ya tiene los `COMMENT ON COLUMN` con la columna fuente? Si sí, léelos y arma el mapeo; si hay transformación (1:N, N:1…), pídemela.\n3. Decisiones por tabla: ¿la PK del destino es IDENTITY o se preserva del origen? ¿la acción D es hard o soft delete?\n4. ¿Existe el destino con su PK y están los GRANTs del usuario de integración?\nLuego genera, EN ESTE ORDEN: (a) la tabla `[TABLA]_DELTA_PG` (columnas `DLTA_*` + checks); (b) el procedure de carga inicial idempotente; (c) la ejecución de la carga inicial; (d) DESPUÉS los triggers AFTER I/U/D. Lista también los GRANTs requeridos.\nNo ejecutes cambios: entrégame el SQL y el plan para revisarlo.",
        note: "Guardarraíles: el agente propone, tú ejecutas. Orden crítico: la carga inicial va ANTES de habilitar los triggers. En PG no hay CREATE — si falta el destino, se pide al equipo.",
      },
      {
        id: "query-legado",
        emoji: "🧭",
        icon: "code",
        title: "Construir y validar un query sobre el ERP legado",
        use: "Armar una consulta sobre UNISOFT4 (Oracle) resolviendo los acrónimos de las columnas foráneas y leyendo solo las fichas necesarias.",
        template:
          "Necesito una consulta sobre el ERP legado UNISOFT4 (Oracle) que [OBJETIVO]. Trabaja así, en solo lectura:\n1. Identifica las tablas y columnas involucradas a partir del objetivo.\n2. Resuelve los acrónimos foráneos (4 letras) a la tabla referida usando el diccionario de acrónimos o los constraints; lee SOLO las fichas de las tablas necesarias, no todo el universo.\n3. Construye el query (joins por las FKs resueltas) y explícame qué hace cada parte.\n4. Valídalo ejecutándolo en solo lectura, con `FETCH FIRST`/`ROWNUM`, y muéstrame una muestra.\nSi algo es ambiguo, pregúntame antes de asumir.",
        note: "Guardarraíles: cuenta de SOLO LECTURA; nada de DML/DDL. El ERP es productivo: acota siempre con `ROWNUM`/`FETCH FIRST` para no traer millones de filas.",
      },
      {
        id: "salud-bd",
        emoji: "🩺",
        icon: "health",
        title: "Reporte de salud de una BD / servidor",
        use: "Chequeo proactivo del estado de una base operativa: disco, respaldos, tablas grandes, retención de logs/binlogs y conexiones, sin tocar nada.",
        template:
          "Hazme un reporte de salud de [SERVIDOR/BD] ([motor]) en SOLO LECTURA:\n1. Espacio: uso de disco de la partición de datos y tamaño de la BD; señala riesgo si lo hay.\n2. Respaldos: ¿cuándo fue el último dump válido por BD?, ¿el job corre? Marca si falta.\n3. Tablas más grandes y de mayor crecimiento (candidatas a purga o particionado).\n4. Logs/binlogs: retención vigente y si están creciendo sin control.\n5. Conexiones/procesos: cargas o locks anómalos.\nEntrégame un resumen con semáforo (rojo/amarillo/verde) por punto y las acciones recomendadas, priorizadas. No ejecutes cambios.",
        note: "Guardarraíles: usuario de SOLO LECTURA/monitoreo; cualquier acción correctiva (purga, ajuste de config, restore) la revisas y ejecutas tú.",
      },
    ],
  },
];
