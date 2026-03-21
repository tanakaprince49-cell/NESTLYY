export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Broadcasts disabled — no central token storage in local-only mode
  res.status(501).json({ error: "Broadcasts are disabled in Local-only mode." });
}
