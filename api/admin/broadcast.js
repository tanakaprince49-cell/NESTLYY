const ADMIN_UIDS = (process.env.ADMIN_UIDS || "").split(",").filter(Boolean);
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  try {
    const { initializeApp, cert, getApps } = await import("firebase-admin/app");
    const { getAuth } = await import("firebase-admin/auth");
    const { getFirestore } = await import("firebase-admin/firestore");

    if (!getApps().length) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : undefined;
      initializeApp(serviceAccount ? { credential: cert(serviceAccount) } : {});
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decoded = await getAuth().verifyIdToken(idToken);

    if (!ADMIN_UIDS.includes(decoded.uid)) {
      return res.status(403).json({ error: "Not an admin" });
    }

    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: "Missing title or body" });
    }

    const db = getFirestore();
    const snapshot = await db.collection("pushTokens").get();
    const tokens = snapshot.docs
      .map((doc) => doc.data().token)
      .filter((t) => t && t.startsWith("ExponentPushToken"));

    if (tokens.length === 0) {
      return res.json({ success: true, sent: 0, message: "No tokens registered" });
    }

    let sent = 0;
    for (let i = 0; i < tokens.length; i += 100) {
      const chunk = tokens.slice(i, i + 100);
      const messages = chunk.map((token) => ({
        to: token,
        title,
        body,
        sound: "default",
      }));

      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Encoding": "gzip, deflate",
        },
        body: JSON.stringify(messages),
      });

      if (response.ok) {
        const result = await response.json();
        const tickets = result.data || [];
        sent += tickets.filter((t) => t.status === "ok").length;
      }
    }

    res.json({ success: true, sent, total: tokens.length });
  } catch {
    res.status(500).json({ error: "Broadcast failed" });
  }
}
