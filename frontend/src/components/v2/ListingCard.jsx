import React from "react";
import Link from "next/link";
import VeganRating from "./VeganRating";

export default function ListingCard({ item, type }) {
  const href = type === "resort" ? `/resorts/${item.slug}` : `/liveaboards/${item.slug}`;
  return (
    <Link href={href} className="block rounded-xl border bg-white overflow-hidden hover:shadow-md transition-shadow">
      {item.featuredImage ? <img src={item.featuredImage} alt={item.name} className="w-full h-52 object-cover" /> : <div className="w-full h-52 bg-gray-100" />}
      <div className="p-4">
        <h2 className="text-xl font-semibold">{item.name}</h2>
        {item.destinationSlugs?.length ? <p className="text-gray-600 mt-1">{item.destinationSlugs.map((d) => d.replace(/-/g, " ")).join(" · ")}</p> : null}
        <div className="mt-3"><VeganRating value={item.veganRating} /></div>
        {item.summary ? <p className="mt-3 text-gray-700 line-clamp-3">{item.summary}</p> : null}
      </div>
    </Link>
  );
}
