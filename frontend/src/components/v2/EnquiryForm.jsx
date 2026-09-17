import React, { useState } from "react";
import { v2BaseUrl } from "@/src/config/serverConfig";

export default function EnquiryForm({ productType, productId, itineraryId, departureId, packageId }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", whatsapp: "", guests: 2, message: "" });
  const [state, setState] = useState({ loading: false, message: "" });
  const submit = async (event) => {
    event.preventDefault();
    setState({ loading: true, message: "" });
    try {
      const res = await fetch(`${v2BaseUrl}/enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType, product: productId, itinerary: itineraryId, departure: departureId, package: packageId, customer: form, message: form.message }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Unable to send enquiry");
      setState({ loading: false, message: "Thank you. Your enquiry has been sent." });
      setForm({ name: "", email: "", phone: "", whatsapp: "", guests: 2, message: "" });
    } catch (error) {
      setState({ loading: false, message: error.message });
    }
  };
  return (
    <form onSubmit={submit} className="rounded-xl border p-5 bg-white space-y-3">
      <h3 className="text-xl font-semibold">Request availability</h3>
      <div className="grid md:grid-cols-2 gap-3">
        <input className="border rounded-lg p-3" required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="border rounded-lg p-3" required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="border rounded-lg p-3" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="border rounded-lg p-3" type="number" min="1" placeholder="Guests" value={form.guests} onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })} />
      </div>
      <textarea className="border rounded-lg p-3 w-full min-h-28" placeholder="Tell us the dates or trip you are interested in" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
      <button disabled={state.loading} className="rounded-lg bg-green-700 text-white px-5 py-3 font-semibold disabled:opacity-50">{state.loading ? "Sending…" : "Send enquiry"}</button>
      {state.message ? <p className="text-sm">{state.message}</p> : null}
    </form>
  );
}
