import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// El frontend corre en :5173 y reenvía las llamadas /api al backend Express (:8787),
// que es quien guarda la API key. Así la clave nunca llega al navegador.
//
// Dos targets de build:
//  - normal (`vite build`): para remo.upaep.mx/conoce-claude/ → base con subpath.
//  - Lienzo (`vite build --mode lienzo`): sitio estático en otro origen → base
//    RELATIVA "./" (requisito de Lienzo) y API absoluta a remo (ver .env.lienzo).
export default defineConfig(({ mode }) => {
  const lienzo = mode === "lienzo";
  return {
    // Lienzo exige rutas relativas (sirve la app bajo una subruta variable).
    base: lienzo ? "./" : "/conoce-claude/",
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: "http://localhost:8787",
          changeOrigin: true,
        },
      },
    },
  };
});
