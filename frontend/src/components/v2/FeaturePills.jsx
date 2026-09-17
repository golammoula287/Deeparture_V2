import React from "react";

const labels = {
  wifi: "Wi-Fi",
  starlink: "Starlink",
  nitrox: "Nitrox",
  "free nitrox": "Free Nitrox",
  "camera room": "Camera Room",
  vegan: "Vegan Meals",
  vegetarian: "Vegetarian Meals",
  "wheelchair assistance": "Wheelchair Assistance",
  "accessible room": "Accessible Room",
};

export default function FeaturePills({ items = [], title }) {
  if (!items?.length) return null;
  return (
    <section className="my-6">
      {title ? <h3 className="text-xl font-semibold mb-3">{title}</h3> : null}
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full border border-gray-300 px-3 py-1 text-sm bg-white">
            {labels[item] || String(item).replace(/[_-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())}
          </span>
        ))}
      </div>
    </section>
  );
}
