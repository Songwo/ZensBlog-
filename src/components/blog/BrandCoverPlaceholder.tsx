import { cn } from "@/lib/utils";

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function BrandCoverPlaceholder({
  seed,
  compact = false,
}: {
  seed: string;
  compact?: boolean;
}) {
  const hash = hashString(seed || "zenlab");
  const gradients = [
    "from-[#f8b7cf]/70 via-[#fce4ef]/75 to-[#f2b8ff]/50",
    "from-[#ffc6de]/70 via-[#fde8f3]/80 to-[#b8d8ff]/55",
    "from-[#f6d9ff]/65 via-[#fdf0f7]/80 to-[#ffc9e8]/60",
    "from-[#ffd9e9]/68 via-[#f7e9ff]/78 to-[#c7dfff]/58",
  ];
  const gradientClass = gradients[hash % gradients.length];

  return (
    <div className={cn("zen-cover-placeholder", "bg-gradient-to-br", gradientClass, compact ? "zen-cover-compact" : "")}>
      <div className="zen-cover-grid" />
      <div className="zen-cover-glow" />
      <div className="zen-cover-mark">
        <span>ZEN::LAB</span>
      </div>
    </div>
  );
}
