export default function ProvenancePanel({ product }) {
  return <section className="max-w-3xl mt-5 rounded-xl border bg-white p-5 break-words">
    <h2 className="font-semibold text-lg">Source & provenance</h2>
    <dl className="mt-3 space-y-2 text-sm">
      <div><dt className="font-medium">Source type</dt><dd>{product.source || 'Not recorded'}</dd></div>
      <div><dt className="font-medium">Source URL</dt><dd>{product.sourceUrl || 'Not recorded'}</dd></div>
      <div><dt className="font-medium">Last checked</dt><dd>{product.lastCheckedAt ? new Date(product.lastCheckedAt).toLocaleString() : 'Not recorded'}</dd></div>
      <div><dt className="font-medium">Last verified</dt><dd>{product.verifiedAt ? new Date(product.verifiedAt).toLocaleString() : 'Not recorded'}</dd></div>
    </dl>
  </section>;
}
