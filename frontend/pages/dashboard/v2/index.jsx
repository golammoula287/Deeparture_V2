import React, { useEffect, useMemo, useState } from "react";
import { v2BaseUrl } from "@/src/config/serverConfig";

const IMPORTS = [
  ["itineraries", "Itineraries + base cabin pricing"],
  ["departures", "Departures + availability + offers"],
  ["resort_packages", "Resort packages"],
  ["resort_availability", "Resort availability"],
];

const authHeaders = () => ({ Authorization: typeof window !== "undefined" ? (localStorage.getItem("access-token") || "") : "" });

export default function V2Dashboard() {
  const [organisations, setOrganisations] = useState([]);
  const [organisationId, setOrganisationId] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [importType, setImportType] = useState("departures");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${v2BaseUrl}/organisations/mine`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((j) => {
        const values = (j.data || []).map((entry) => entry.organisation || entry);
        setOrganisations(values);
        if (values[0]?._id) setOrganisationId(values[0]._id);
      });
  }, []);

  useEffect(() => {
    if (!organisationId) return;
    fetch(`${v2BaseUrl}/organisations/${organisationId}/dashboard`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((j) => setDashboard(j.data));
  }, [organisationId]);

  const selected = useMemo(() => organisations.find((o) => o._id === organisationId), [organisations, organisationId]);

  const upload = async (event) => {
    event.preventDefault();
    if (!file || !organisationId) return;
    setMessage("Uploading…");
    const form = new FormData();
    form.append("file", file);
    const response = await fetch(`${v2BaseUrl}/organisations/${organisationId}/import/${importType}`, { method: "POST", headers: authHeaders(), body: form });
    const json = await response.json();
    setMessage(response.ok ? `${json.data?.imported || 0} records imported.` : json.message || "Import failed");
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap gap-4 items-end justify-between">
        <div><h1 className="text-3xl font-bold">Deeparture V2</h1><p className="text-gray-600 mt-1">Manage liveaboards and resorts from one operator organisation.</p></div>
        <label className="text-sm">Organisation<select className="block border rounded-lg p-2 mt-1 min-w-64" value={organisationId} onChange={(e) => setOrganisationId(e.target.value)}>{organisations.map((o) => <option key={o._id} value={o._id}>{o.name}</option>)}</select></label>
      </div>

      {selected ? <div className="mt-6 rounded-xl border p-4 bg-white"><strong>{selected.name}</strong><span className="ml-3 text-sm text-gray-500">{selected.status}</span></div> : null}

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <div className="rounded-xl border bg-white p-5"><div className="text-gray-500">Liveaboards</div><div className="text-3xl font-bold mt-1">{dashboard?.vessels?.length || 0}</div></div>
        <div className="rounded-xl border bg-white p-5"><div className="text-gray-500">Resorts</div><div className="text-3xl font-bold mt-1">{dashboard?.resorts?.length || 0}</div></div>
        <div className="rounded-xl border bg-white p-5"><div className="text-gray-500">Recent enquiries</div><div className="text-3xl font-bold mt-1">{dashboard?.enquiries?.length || 0}</div></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <section className="rounded-xl border bg-white p-5"><h2 className="text-xl font-semibold">Liveaboards</h2><div className="mt-3 space-y-2">{dashboard?.vessels?.map((v) => <div key={v._id} className="border rounded-lg p-3 flex justify-between"><span>{v.name}</span><span className="text-sm text-gray-500">{v.listingStatus}</span></div>)}{!dashboard?.vessels?.length ? <p className="text-gray-500">No V2 liveaboards yet.</p> : null}</div></section>
        <section className="rounded-xl border bg-white p-5"><h2 className="text-xl font-semibold">Resorts</h2><div className="mt-3 space-y-2">{dashboard?.resorts?.map((r) => <div key={r._id} className="border rounded-lg p-3 flex justify-between"><span>{r.name}</span><span className="text-sm text-gray-500">{r.listingStatus}</span></div>)}{!dashboard?.resorts?.length ? <p className="text-gray-500">No V2 resorts yet.</p> : null}</div></section>
      </div>

      <section className="rounded-xl border bg-white p-5 mt-8 max-w-2xl"><h2 className="text-xl font-semibold">Bulk upload</h2><p className="text-gray-600 mt-1">Upload CSV or XLSX instead of editing departures or packages one-by-one.</p><form onSubmit={upload} className="mt-4 space-y-3"><select className="border rounded-lg p-3 w-full" value={importType} onChange={(e) => setImportType(e.target.value)}>{IMPORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><input required className="block border rounded-lg p-3 w-full" type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} /><button className="bg-green-700 text-white rounded-lg px-5 py-3 font-semibold">Upload</button>{message ? <p className="text-sm">{message}</p> : null}</form></section>
    </div>
  );
}
