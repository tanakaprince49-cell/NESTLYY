export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // FCM token storage disabled — local-only mode
  res.json({ success: true, message: "FCM token storage disabled (Local only mode)" });
}
