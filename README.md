# Conoce a Claude

App web interactiva para mostrarle a un equipo —sin tecnicismos— **qué se puede
hacer con Claude**. Cada lección termina en una demo en vivo: editas un prompt y
ves la respuesta **real** de Claude en streaming, no un video ni una captura.

Hecho en la célula de **Datos y Analítica de UPAEP** como herramienta para
acercar la IA agéntica al trabajo diario (DBA, ETL, BI).

---

## Lo que logramos

- 🟢 **Claude de verdad, en vivo.** Las demos ejecutan el modelo real y
  responden token a token. Sin trucos.
- 💳 **Costo cero de API.** El backend reutiliza la **suscripción** vía el CLI de
  Claude Code (OAuth), no créditos de pago. Fue la pieza que hizo viable el
  proyecto.
- 🤖 **Demos agénticos reales.** Claude trabaja en un sandbox aislado con
  herramientas: limpia un CSV sucio, escribe y corrige código con pruebas, y
  hasta **lanza varios subagentes en paralelo** que documentan tablas a la vez.
- 🎓 **16 lecciones** organizadas en una escalera de complejidad: de "cómo pedir
  bien" hasta dirigir agentes en Claude Code.
- 🧰 **Plantillas listas para llevar**, aterrizadas al dominio real del equipo
  (Oracle, PostgreSQL, gobierno de datos), copiables con un clic.
- 🎨 **Diseño editorial "sharp"** propio, con identidad UPAEP, para que no se
  vea como una app genérica más.
- 🚀 **Desplegado y en uso** en `remo.upaep.mx/conoce-claude`, con un buzón de
  ideas tipo post-it para recoger feedback del equipo.

---

## Qué hay dentro

| Sección | Contenido |
| --- | --- |
| **Prompting** | 11 lecciones: contexto y ejemplos, anclar para no alucinar, descomponer, guardarraíles, vibe coding, modos de ejecución, agentes en paralelo, y más. |
| **Plantillas** | Biblioteca de prompts reutilizables (regulares + recetas agénticas) para tareas recurrentes del equipo. |
| **Demos** | Una primera mirada a la IA agéntica para quien empieza: límites honestos, requerimiento → entregable, y un agente con herramientas. |

---

## Arquitectura

```
Navegador (React + Vite)  ──/api──>  Backend Express  ──>  CLI `claude` (headless)
                                                           Opus 4.8 · vía suscripción
```

El backend lanza el CLI de Claude Code en modo headless y traduce su salida a
Server-Sent Events para el navegador. La autenticación es la **suscripción
Claude (Max/Pro)**, no la API de pago.

> Una suscripción personal es para uso individual: sirve para conducir la demo,
> no para dar servicio simultáneo a muchas personas.

---

## Puesta en marcha

Requisitos: Node.js 18+ y el CLI de Claude Code.

```bash
npm install -g @anthropic-ai/claude-code   # 1. instalar el CLI
claude                                      # 2. iniciar sesión (escribe /login)
npm install                                 # 3. dependencias del proyecto
npm run dev                                 # 4. frontend + backend juntos
```

Abre **http://localhost:5173**.

---

## Scripts

| Comando | Para qué |
| --- | --- |
| `npm run dev` | Desarrollo local (frontend + backend). |
| `npm run deploy` | Build y publicación en el servidor de UPAEP. |
| `npm run zip:lienzo` | Empaqueta el sitio estático para publicarlo en Lienzo. |
