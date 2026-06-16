# Conoce a Claude — Tutorial interactivo

Una app web para presentar las capacidades de **Claude Opus 4.8** a tu equipo.
Cada sección es una demo en vivo: editas un prompt y ves la respuesta real de
Claude en streaming.

## Capacidades que recorre

1. 💬 **Conversación y explicación** — lenguaje natural, sin sintaxis especial
2. ⚙️ **Generación de código** — de una descripción a SQL/Python funcional
3. 🧠 **Razonamiento paso a paso** — el modelo descompone el problema
4. 🗂️ **Extracción de datos estructurados** — texto libre → JSON
5. 🔎 **Análisis y síntesis** — resúmenes accionables
6. ✍️ **Escritura y reformulación** — mismo mensaje, distintos tonos

## Arquitectura

```
Navegador (React + Vite)  ──/api──>  Backend Express  ──>  CLI `claude` (headless)
   :5173                                 :8787              Opus 4.8 vía tu suscripción
```

El backend **no usa la API de pago**: lanza el CLI de Claude Code en modo
headless (`claude -p --output-format stream-json`) y traduce su salida al
streaming que consume el navegador. La autenticación es **tu suscripción
Claude (Max/Pro)**, no créditos de API.

> **Por qué así:** la suscripción Claude (claude.ai) y la plataforma de API
> (Console) son productos con facturación separada. El plan Max **no** incluye
> créditos de API. El único camino que reutiliza tu suscripción para uso
> programático es el CLI de Claude Code autenticado por OAuth — que es justo lo
> que hace este backend.
>
> ⚠️ Una suscripción personal está pensada para uso individual: úsala para
> conducir tú la demo, no para dar servicio simultáneo a varias personas (eso
> requeriría Claude for Teams/Enterprise o créditos de API).

## Puesta en marcha

Requisitos: Node.js 18+ y el CLI de Claude Code.

```bash
# 1. Instalar el CLI de Claude Code (si no lo tienes)
npm install -g @anthropic-ai/claude-code

# 2. Iniciar sesión con tu suscripción (abre el navegador)
claude            # luego escribe: /login
#   …o, para un entorno headless/servidor, genera un token de larga duración:
#   claude setup-token   →   exporta CLAUDE_CODE_OAUTH_TOKEN

# 3. Instalar dependencias del proyecto
npm install

# 4. (Opcional) configurar variables
cp .env.example .env

# 5. Levantar frontend + backend juntos
npm run dev
```

Abre **http://localhost:5173**.

> Si ves "No se encontró el CLI", revisa que `claude --version` funcione en tu
> terminal y que hayas iniciado sesión.

## Notas técnicas

- Modelo: `opus` (Claude Opus 4.8) vía el CLI `claude` en modo `--print`.
- Streaming token a token: el CLI emite `stream-json` con
  `--include-partial-messages`; el backend lo reenvía como Server-Sent Events.
- El CLI corre en un directorio temporal aislado (sin acceso a tu repo) y sin
  ejecutar herramientas: las demos son puro texto.
- Consumo: cada demo cuenta contra los **límites de uso de tu suscripción**
  (ventanas de 5 horas), no contra créditos de API.
- Configurable por entorno: `CLAUDE_MODEL`, `CLAUDE_BIN`, `PORT`. Si defines
  `ANTHROPIC_API_KEY`, el CLI usará créditos de API en su lugar.
