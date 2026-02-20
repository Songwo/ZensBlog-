import { parseEmojiHtml } from "@/lib/emoji";

export function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function toHeadingId(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, "-")
    .replace(/^-|-$/g, "");
}

function renderInline(text: string) {
  const inlineCodeTokens: string[] = [];
  const inlineLinkTokens: string[] = [];
  const stashInlineCode = (input: string) =>
    input.replace(/`([^`]+)`/g, (_m, code) => {
      const token = `__INLINE_CODE_${inlineCodeTokens.length}__`;
      inlineCodeTokens.push(`<code>${escapeHtml(code)}</code>`);
      return token;
    });

  const restoreInlineCode = (input: string) =>
    input.replace(/__INLINE_CODE_(\d+)__/g, (_m, idx) => inlineCodeTokens[Number(idx)] || "");

  const stashMarkdownLinks = (input: string) =>
    input
      .replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g, (_m, alt, src) => {
        const token = `__INLINE_LINK_${inlineLinkTokens.length}__`;
        inlineLinkTokens.push(`<img alt="${alt}" src="${src}" />`);
        return token;
      })
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g, (_m, label, href) => {
        const token = `__INLINE_LINK_${inlineLinkTokens.length}__`;
        inlineLinkTokens.push(`<a href="${href}" target="_blank" rel="noreferrer">${label}</a>`);
        return token;
      });

  const restoreMarkdownLinks = (input: string) =>
    input.replace(/__INLINE_LINK_(\d+)__/g, (_m, idx) => inlineLinkTokens[Number(idx)] || "");

  const linkify = (input: string) =>
    input.replace(/(^|[\s(>])((https?:\/\/[^\s<)]+))/g, (_m, prefix, url) => {
      return `${prefix}<a href="${url}" target="_blank" rel="noreferrer" data-auto-link="1">${url}</a>`;
    });

  const escaped = escapeHtml(text);
  const protectedText = stashMarkdownLinks(stashInlineCode(escaped));

  const rendered = protectedText
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");

  return parseEmojiHtml(restoreInlineCode(restoreMarkdownLinks(linkify(rendered))));
}

export function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const codeMatch = line.match(/^```([\w+-]+)?\s*$/);
    if (codeMatch) {
      const lang = (codeMatch[1] || "text").toLowerCase();
      i += 1;
      const buf: string[] = [];
      while (i < lines.length && !lines[i].startsWith("```")) {
        buf.push(lines[i]);
        i += 1;
      }
      const code = escapeHtml(buf.join("\n"));
      const numbered = code
        .split("\n")
        .map((row, idx) => `<span class="md-code-row"><span class="md-code-ln">${idx + 1}</span><span class="md-code-tx">${row || " "}</span></span>`)
        .join("");
      out.push(`<pre><code class="language-${lang}">${numbered}</code></pre>`);
      i += 1;
      continue;
    }

    if (/^ {4,}\S/.test(line)) {
      const buf: string[] = [line.replace(/^ {4}/, "")];
      i += 1;
      while (i < lines.length && (/^ {4,}/.test(lines[i]) || !lines[i].trim())) {
        buf.push(lines[i].replace(/^ {4}/, ""));
        i += 1;
      }
      const code = escapeHtml(buf.join("\n"));
      out.push(`<pre><code class="language-text">${code}</code></pre>`);
      continue;
    }

    const detailsMatch = line.match(/^<details>\s*$/i);
    if (detailsMatch) {
      const buf: string[] = [line];
      i += 1;
      while (i < lines.length && !/^<\/details>\s*$/i.test(lines[i])) {
        buf.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) buf.push(lines[i]);
      out.push(buf.join("\n"));
      i += 1;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].trim();
      const id = toHeadingId(text);
      out.push(`<h${level} id="${id}"><a href="#${id}">${renderInline(text)}</a></h${level}>`);
      i += 1;
      continue;
    }

    if (line.startsWith("|") && i + 1 < lines.length && /^\|?[-:\s|]+\|?$/.test(lines[i + 1])) {
      const header = line.split("|").map((s) => s.trim()).filter(Boolean);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(lines[i].split("|").map((s) => s.trim()).filter(Boolean));
        i += 1;
      }
      out.push('<div class="md-table-wrap"><table><thead><tr>');
      for (const cell of header) out.push(`<th>${renderInline(cell)}</th>`);
      out.push("</tr></thead><tbody>");
      rows.forEach((row, idx) => {
        out.push(`<tr class="${idx % 2 === 0 ? "md-row-even" : "md-row-odd"}">`);
        row.forEach((cell) => out.push(`<td>${renderInline(cell)}</td>`));
        out.push("</tr>");
      });
      out.push("</tbody></table></div>");
      continue;
    }

    if (/^\s*[-*]\s+\[( |x|X)\]\s+/.test(line)) {
      out.push('<ul class="contains-task-list">');
      while (i < lines.length && /^\s*[-*]\s+\[( |x|X)\]\s+/.test(lines[i])) {
        const m = lines[i].match(/^\s*[-*]\s+\[( |x|X)\]\s+(.*)$/);
        const checked = m?.[1].toLowerCase() === "x";
        out.push(`<li class="task-list-item"><input type="checkbox" disabled ${checked ? "checked" : ""} /> ${renderInline(m?.[2] || "")}</li>`);
        i += 1;
      }
      out.push("</ul>");
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      out.push(`<blockquote>${renderInline(quote[1])}</blockquote>`);
      i += 1;
      continue;
    }

    if (!line.trim()) {
      i += 1;
      continue;
    }

    out.push(`<p>${renderInline(line)}</p>`);
    i += 1;
  }

  return out.join("\n") || "<p class=\"text-sm text-slate-500\">暂无内容</p>";
}
