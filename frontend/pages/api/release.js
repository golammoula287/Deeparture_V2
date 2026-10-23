export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ service: 'deeparture-v2-frontend', commit: process.env.NEXT_PUBLIC_BUILD_COMMIT || null });
}
