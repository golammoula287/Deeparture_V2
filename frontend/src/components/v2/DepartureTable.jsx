import React from "react";

const formatDate = (value) => value ? new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "";
const money = (amount, currency) => amount === null || amount === undefined ? "On request" : new Intl.NumberFormat("en", { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(amount);

export default function DepartureTable({ departures = [] }) {
  if (!departures.length) {
    return <div className="rounded-xl border p-5 bg-gray-50"><strong>Current departures are on request.</strong><p className="mt-1 text-gray-600">Send an enquiry and the operator can confirm dates, pricing and availability.</p></div>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-left min-w-[760px]">
        <thead className="bg-gray-50"><tr><th className="p-3">Dates</th><th className="p-3">Itinerary</th><th className="p-3">From</th><th className="p-3">Availability</th><th className="p-3">Offer</th></tr></thead>
        <tbody>
          {departures.map((d) => {
            const available = (d.availability || []).reduce((sum, a) => sum + Number(a.spacesAvailable || 0), 0);
            const offer = (d.effectivePrices || []).find((p) => p.offerName)?.offerName;
            return (
              <tr key={d._id} className="border-t align-top">
                <td className="p-3">{formatDate(d.startDate)} – {formatDate(d.endDate)}</td>
                <td className="p-3">{d.itinerary?.name || ""}</td>
                <td className="p-3 font-semibold">{money(d.effectiveMinPrice, d.effectiveCurrency)}</td>
                <td className="p-3">{d.status === "sold_out" ? "Sold out" : available ? `${available} spaces` : "On request"}</td>
                <td className="p-3">{offer || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
