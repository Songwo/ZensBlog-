import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { createHighlighter } from "shiki";
import type { Root, Element, Text } from "hast";
import type { Plugin } from "unified";
import { findEmoji } from "@/lib/emoji";

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

const rehypeEmoji: Plugin<[], Root> = () => {
  return async (tree: Root) => {
    const { visit } = await import("unist-util-visit");

    visit(tree, "text", (node: Text, index, parent) => {
      if (!parent || typeof index !== "number") return;
      const parentTag = (parent as Element).tagName || "";
      if (parentTag === "code" || parentTag === "pre") return;

      const value = node.value || "";
      if (!/:([a-zA-Z0-9_+\-]+):/.test(value)) return;

      const parts: Array<Text | Element> = [];
      let lastIndex = 0;
      const regex = /:([a-zA-Z0-9_+\-]+):/g;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(value)) !== null) {
        const [raw, key] = match;
        const start = match.index;
        const end = start + raw.length;
        if (start > lastIndex) {
          parts.push({ type: "text", value: value.slice(lastIndex, start) });
        }

        const found = findEmoji(key);
        if (!found) {
          parts.push({ type: "text", value: raw });
        } else if (found.unicode) {
          parts.push({ type: "text", value: found.unicode });
        } else if (found.image) {
          parts.push({
            type: "element",
            tagName: "img",
            properties: {
              src: found.image,
              alt: `:${key}:`,
              className: ["emoji-inline", "emoji-custom"],
              loading: "lazy",
              decoding: "async",
            },
            children: [],
          });
        }
        lastIndex = end;
      }

      if (lastIndex < value.length) {
        parts.push({ type: "text", value: value.slice(lastIndex) });
      }

      if (parts.length > 0) {
        (parent.children as Array<Text | Element>).splice(index, 1, ...parts);
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

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    const tildeFence = trimmed.match(/^~~~\s*([A-Za-z0-9_+-]+)?\s*$/);
    if (tildeFence) {
      lines[i] = lines[i].replace(
        /^(\s*)~~~\s*([A-Za-z0-9_+-]+)?\s*$/,
        (_m, ws, lang) => `${ws}\`\`\`${lang || ""}`,
      );
    }
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
          rehypeEmoji,
          rehypeShiki,
        ],
      },
    },
  });

  return content;
}
