"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

/**
 * @fileOverview A robust Markdown renderer that supports LaTeX formulas.
 * Optimized for pedagogical content in JEE/NEET simulations.
 */

export function MathText({ text, className }: { text: string; className?: string }) {
  if (!text) return null;

  return (
    <div className={cn("prose prose-slate dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Ensure LaTeX blocks are centered and clear
          div: ({ node, ...props }) => <div {...props} className="my-4 overflow-x-auto" />,
          // Style headers for educational structure
          h3: ({ node, ...props }) => <h3 {...props} className="text-xl font-bold text-primary mt-6 mb-3" />,
          h4: ({ node, ...props }) => <h4 {...props} className="text-lg font-semibold text-secondary mt-4 mb-2" />,
          // Style lists
          ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-6 space-y-2 mb-4" />,
          li: ({ node, ...props }) => <li {...props} className="text-muted-foreground leading-relaxed" />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}