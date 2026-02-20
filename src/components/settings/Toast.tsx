"use client";

export function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      className={`fixed right-4 top-4 z-[80] rounded-lg px-4 py-2 text-sm text-white shadow-lg ${
        type === "success" ? "bg-emerald-600" : "bg-rose-600"
      }`}
    >
      {message}
    </div>
  );
}
