import React from "react";

export default function VeganRating({ value }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-green-900">
      <span className="font-semibold">Vegan Rating</span>
      <span>{Number(value).toFixed(1)} / 5</span>
    </div>
  );
}
