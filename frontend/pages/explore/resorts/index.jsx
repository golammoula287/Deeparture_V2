import React, { useEffect, useState } from "react";
import ListingCard from "@/src/components/v2/ListingCard";
import { v2BaseUrl } from "@/src/config/serverConfig";

export default function ExploreResorts() {
  const [filters, setFilters] = useState({ destination: "", veganRatingMin: "", maxPrice: "", accessibility: "" });
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const params = new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== ""));
    setLoading(true);
    fetch(`${v2BaseUrl}/resorts?${params}`).then((r) => r.json()).then((j) => setData(j.data || { items: [], total: 0 })).finally(() => setLoading(false));
  }, [filters]);
  return <main className="max-w-7xl mx-auto px-4 py-10"><h1 className="text-4xl font-bold">Explore dive resorts</h1><div className="grid md:grid-cols-4 gap-3 my-6"><input className="border rounded-lg p-3" placeholder="Destination" onChange={(e) => setFilters({ ...filters, destination: e.target.value })} /><input className="border rounded-lg p-3" type="number" min="0" max="5" step="0.1" placeholder="Min vegan rating" onChange={(e) => setFilters({ ...filters, veganRatingMin: e.target.value })} /><input className="border rounded-lg p-3" type="number" placeholder="Max package price (USD)" onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} /><input className="border rounded-lg p-3" placeholder="Accessibility" onChange={(e) => setFilters({ ...filters, accessibility: e.target.value.toLowerCase() })} /></div><p className="mb-4 text-gray-600">{loading ? "Searching…" : `${data.total} resorts`}</p><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{data.items?.map((item) => <ListingCard key={item._id} item={item} type="resort" />)}</div></main>;
}
