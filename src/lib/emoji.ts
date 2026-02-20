export type EmojiEntry = {
  shortcode: string;
  unicode?: string;
  image?: string;
  label?: string;
};

const EMOJI_ENTRIES: EmojiEntry[] = [
  { shortcode: "smile", unicode: "😄", label: "smile" },
  { shortcode: "rocket", unicode: "🚀", label: "rocket" },
  { shortcode: "+1", unicode: "👍", label: "+1" },
  { shortcode: "tada", unicode: "🎉", label: "tada" },
  { shortcode: "heart", unicode: "❤️", label: "heart" },
  { shortcode: "fire", unicode: "🔥", label: "fire" },
  { shortcode: "eyes", unicode: "👀", label: "eyes" },
  { shortcode: "my_heart", image: "/emojis/my_heart.png", label: "my_heart" },
  { shortcode: "zenspark", image: "/emojis/zenspark.png", label: "zenspark" },
];

export const EMOJI_MAP = new Map<string, EmojiEntry>(
  EMOJI_ENTRIES.map((entry) => [entry.shortcode, entry]),
);

export const EMOJI_PICKER_ITEMS = EMOJI_ENTRIES.filter((entry) => entry.unicode || entry.image);

export function findEmoji(shortcode: string) {
  return EMOJI_MAP.get(shortcode);
}

export function shortcodeToUnicode(shortcode: string) {
  return EMOJI_MAP.get(shortcode)?.unicode || null;
}

export function parseEmojiHtml(text: string) {
  return text.replace(/:([a-zA-Z0-9_+\-]+):/g, (raw, key) => {
    const found = findEmoji(key);
    if (!found) return raw;
    if (found.unicode) return found.unicode;
    if (found.image) {
      return `<img src="${found.image}" alt=":${key}:" class="emoji-inline emoji-custom" loading="lazy" decoding="async" />`;
    }
    return raw;
  });
}

