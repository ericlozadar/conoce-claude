import React from "react";
import ReactDOM from "react-dom/client";
// Fuentes self-hosted (sin depender de Google Fonts en runtime):
// Inter para el cuerpo, Fraunces (serif display) para los títulos,
// Caveat (manuscrita) para notas tipo «pizarra».
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/caveat";
import { App } from "./App.tsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
