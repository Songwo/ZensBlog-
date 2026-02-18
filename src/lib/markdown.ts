import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeRaw from "rehype-raw";
import { createHighlighter } from "shiki";
import type { Root, Element, Text } from "hast";
import type { Plugin } from "unified";

let highlighterPromise: ReturnType<typeof createHighlighter> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: [
        "javascript",
        "typescript",
        "jsx",
        "tsx",
        "json",
        "css",
        "html",
        "bash",
        "python",
        "rust",
        "go",
        "sql",
        "markdown",
      ],
    });
  }
  return highlighterPromise;
}

const rehypeShiki: Plugin<[], Root> = () => {
  return async (tree: Root) => {
    const highlighter = await getHighlighter();
    const { visit } = await import("unist-util-visit");

    visit(tree, "element", (node: Element) => {
      if (
        node.tagName === "pre" &&
        node.children[0] &&
        (node.children[0] as Element).tagName === "code"
      ) {
        const codeNode = node.children[0] as Element;
        const className = (codeNode.properties?.className as string[]) || [];
        const lang =
          className
            .find((c: string) => c.startsWith("language-"))
            ?.replace("language-", "") || "text";

        const code = (codeNode.children[0] as Text)?.value || "";

        try {
          const html = highlighter.codeToHtml(code, {
            lang,
            themes: { light: "github-light", dark: "github-dark" },
          });

          node.tagName = "div";
          node.properties = { className: ["code-block"] };
          node.children = [
            { type: "raw", value: html } as unknown as Element,
          ];
        } catch {
          // If language not supported, leave as-is
        }
      }
    });
  };
};

export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

function normalizeFenceLines(source: string) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const fenceIndexes: number[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    const tildeFence = trimmed.match(/^~~~(\w+)?$/);
    if (tildeFence) {
      lines[i] = lines[i].replace(/^(\s*)~~~(\w+)?$/, (_m, ws, lang) => `${ws}\`\`\`${lang || ""}`);
    }
    if (/^\s*```/.test(lines[i])) {
      fenceIndexes.push(i);
    }
  }

  // If the fence count is odd, the last opener is likely accidental.
  // Escape it to prevent the remainder of the article from collapsing into one code block.
  if (fenceIndexes.length % 2 === 1) {
    const idx = fenceIndexes[fenceIndexes.length - 1];
    lines[idx] = lines[idx].replace("```", "\\```");
  }

  return lines.join("\n");
}

export function extractTOC(content: string): TOCItem[] {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const items: TOCItem[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const text = match[2].replace(/\*\*/g, "").trim();
    items.push({
      id: text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fff]+/g, "-")
        .replace(/^-|-$/g, ""),
      text,
      level: match[1].length,
    });
  }

  return items;
}

export async function renderMarkdown(source: string) {
  const normalized = normalizeFenceLines(source);
  const { content } = await compileMDX({
    source: normalized,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
          rehypeShiki,
          rehypeRaw,
        ],
      },
    },
  });

  return content;
}
