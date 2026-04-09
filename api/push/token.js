import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  try {
    const idToken = authHeader.split("Bearer ")[1];
    const decoded = await getAuth().verifyIdToken(idToken);
    const uid = decoded.uid;

    const { token, platform } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Missing push token" });
    }

    const db = getFirestore();
    await db.collection("pushTokens").doc(uid).set(
      {
        token,
        platform: platform || "android",
        userId: uid,
        email: decoded.email || null,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to store push token" });
  }
}
