"use client";

import { useEffect } from "react";

type LinkPreview = {
  url: string;
  siteName: string;
  title: string;
  description: string;
  image: string;
  favicon: string;
  type: "github-repo" | "github-issue" | "github-pr" | "generic";
  extra?: Record<string, string | number | boolean>;
};

const cache = new Map<string, Promise<LinkPreview>>();

async function getPreview(url: string) {
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(`/api/link-preview?url=${encodeURIComponent(url)}`, { cache: "force-cache" })
        .then((res) => res.json() as Promise<LinkPreview>)
        .catch(() => ({
          url,
          siteName: new URL(url).hostname,
          title: new URL(url).hostname,
          description: "",
          image: "",
          favicon: "",
          type: "generic" as const,
        })),
    );
  }
  return cache.get(url)!;
}

function createCardNode(meta: LinkPreview) {
  const shell = document.createElement("div");
  shell.className = "link-card-shell";
  shell.dataset.url = meta.url;

  const card = document.createElement("a");
  card.href = meta.url;
  card.target = "_blank";
  card.rel = "noreferrer";
  card.className = `link-card link-card-${meta.type}`;

  const head = document.createElement("div");
  head.className = "link-card-head";

  if (meta.favicon) {
    const icon = document.createElement("img");
    icon.className = "link-card-favicon";
    icon.src = meta.favicon;
    icon.alt = meta.siteName;
    icon.loading = "lazy";
    icon.decoding = "async";
    head.appendChild(icon);
  }

  const site = document.createElement("span");
  site.className = "link-card-site";
  site.textContent = meta.siteName;
  head.appendChild(site);

  const title = document.createElement("strong");
  title.className = "link-card-title";
  title.textContent = meta.title || meta.url;

  const desc = document.createElement("p");
  desc.className = "link-card-desc";
  desc.textContent = meta.description || "";

  const extra = document.createElement("div");
  extra.className = "link-card-extra";
  if (meta.extra) {
    Object.entries(meta.extra).slice(0, 4).forEach(([k, v]) => {
      if (v === "" || v === null || v === undefined) return;
      const chip = document.createElement("span");
      chip.className = "link-card-chip";
      chip.textContent = `${k}: ${String(v)}`;
      extra.appendChild(chip);
    });
  }

  if (meta.image) {
    const thumb = document.createElement("img");
    thumb.className = "link-card-thumb";
    thumb.src = meta.image;
    thumb.alt = meta.title || meta.siteName;
    thumb.loading = "lazy";
    thumb.decoding = "async";
    card.appendChild(thumb);
  }

  card.appendChild(head);
  card.appendChild(title);
  if (meta.description) card.appendChild(desc);
  if (extra.childElementCount > 0) card.appendChild(extra);

  shell.appendChild(card);
  return shell;
}

function collapseRuns(root: HTMLElement) {
  const groupedParents = new Set<HTMLElement>();
  const cards = Array.from(root.querySelectorAll<HTMLElement>(".link-card-shell"));
  cards.forEach((card) => {
    const parent = card.parentElement;
    if (!parent || groupedParents.has(parent)) return;
    groupedParents.add(parent);

    const children = Array.from(parent.children);
    let run: HTMLElement[] = [];
    const flush = () => {
      if (run.length < 3) {
        run = [];
        return;
      }
      const wrapper = document.createElement("div");
      wrapper.className = "link-card-group is-collapsed";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "link-card-toggle";
      button.textContent = `展开 ${run.length} 个链接`;

      const list = document.createElement("div");
      list.className = "link-card-group-list";
      run.forEach((item) => list.appendChild(item));

      button.onclick = () => {
        const collapsed = wrapper.classList.toggle("is-collapsed");
        button.textContent = collapsed ? `展开 ${run.length} 个链接` : "收起链接";
      };

      wrapper.appendChild(button);
      wrapper.appendChild(list);
      parent.insertBefore(wrapper, run[0]);
      run = [];
    };

    children.forEach((child) => {
      if (child.classList.contains("link-card-shell")) {
        run.push(child as HTMLElement);
      } else {
        flush();
      }
    });
    flush();
  });
}

export function LinkCardEnhancer({ containerId }: { containerId: string }) {
  useEffect(() => {
    const root = document.getElementById(containerId);
    if (!root) return;

    const anchors = Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href^="http"]'));
    anchors.forEach((anchor) => {
      if (anchor.closest("pre, code, .link-card-shell")) return;
      if (anchor.dataset.linkCardEnhanced === "1") return;

      const parent = anchor.parentElement;
      if (!parent) return;
      const onlyAnchorChild =
        parent.childNodes.length === 1 &&
        parent.firstChild?.nodeType === Node.ELEMENT_NODE &&
        (parent.firstChild as Element).tagName.toLowerCase() === "a";
      const standalone = onlyAnchorChild || parent.textContent?.trim() === anchor.textContent?.trim();
      const isGitHub = (() => {
        try {
          return new URL(anchor.href).hostname.toLowerCase() === "github.com";
        } catch {
          return false;
        }
      })();
      if (!standalone && !isGitHub) return;

      anchor.dataset.linkCardEnhanced = "1";
      const url = anchor.href;
      void getPreview(url).then((meta) => {
        if (!meta?.url) return;
        const card = createCardNode(meta);
        if (parent.childElementCount === 1 && (parent.tagName === "P" || parent.tagName === "LI")) {
          parent.replaceWith(card);
        } else if (isGitHub) {
          parent.insertAdjacentElement("afterend", card);
        } else {
          anchor.replaceWith(card);
        }
        collapseRuns(root);
      });
    });
  }, [containerId]);

  return null;
}
