import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        "bg-secondary": "var(--color-bg-secondary)",
        text: "var(--color-text)",
        "text-secondary": "var(--color-text-secondary)",
        accent: "var(--color-accent)",
        border: "var(--color-border)",
      },
      fontFamily: {
        heading: "var(--font-heading)",
        body: "var(--font-body)",
        mono: "var(--font-mono)",
      },
      maxWidth: {
        article: "720px",
      },
      typography: {
        DEFAULT: {
          css: {
            "--tw-prose-body": "var(--color-text)",
            "--tw-prose-headings": "var(--color-text)",
            "--tw-prose-links": "var(--color-accent)",
            "--tw-prose-bold": "var(--color-text)",
            "--tw-prose-quotes": "var(--color-text-secondary)",
            "--tw-prose-code": "var(--color-accent)",
            "--tw-prose-hr": "var(--color-border)",
            maxWidth: "none",
            lineHeight: "var(--line-height, 1.75)",
            fontFamily: "var(--font-body)",
          },
        },
      },
    },
  },
  plugins: [typography],
};

export default config;
