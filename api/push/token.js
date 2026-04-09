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
    const uid = decoded.uid;

    const { token, platform } = req.body;
    if (!token || !token.startsWith("ExponentPushToken")) {
      return res.status(400).json({ error: "Invalid push token format" });
    }

    const db = getFirestore();
    await db.collection("pushTokens").doc(uid).set(
      {
        token,
        platform: platform || "android",
        userId: uid,
        email: decoded.email || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to store push token" });
  }
}
