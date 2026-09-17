import React, { useState } from "react";
import { useRouter } from "next/router";
import { v2BaseUrl } from "@/src/config/serverConfig";

export default function ClaimOperator() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", password: "", phone: "", whatsapp: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`${v2BaseUrl}/claims/accept`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: router.query.token, ...form }) });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || "Unable to claim account");
      setMessage("Account claimed. You can now sign in to manage your existing Deeparture listings.");
      setTimeout(() => router.push("/login"), 1200);
    } catch (error) { setMessage(error.message); } finally { setLoading(false); }
  };
  return <main className="max-w-xl mx-auto px-4 py-16"><h1 className="text-3xl font-bold">Claim your Deeparture operator account</h1><p className="mt-3 text-gray-600">Your existing vessel and resort listings will remain attached to the operator organisation after activation.</p><form onSubmit={submit} className="mt-8 space-y-4 rounded-xl border p-6"><input required className="border rounded-lg p-3 w-full" placeholder="Your name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /><input required minLength="8" type="password" className="border rounded-lg p-3 w-full" placeholder="Choose a password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><input className="border rounded-lg p-3 w-full" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><input className="border rounded-lg p-3 w-full" placeholder="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /><button disabled={!router.query.token || loading} className="bg-green-700 text-white rounded-lg px-5 py-3 font-semibold disabled:opacity-50">{loading ? "Activating…" : "Claim account"}</button>{message ? <p>{message}</p> : null}</form></main>;
}
