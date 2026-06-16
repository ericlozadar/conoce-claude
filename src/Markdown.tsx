import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// Renderiza la respuesta del modelo como Markdown real en lugar de texto plano:
// - remark-gfm  → tablas, listas de tareas, tachado, autolinks
// - remark-math + rehype-katex → fórmulas $inline$ y $$display$$
// throwOnError:false evita que una fórmula a medio escribir (durante el
// streaming) rompa el render; muestra el fragmento en rojo hasta completarse.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, errorColor: "#b91c1c" }]]}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
