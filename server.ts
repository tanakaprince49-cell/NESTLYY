import express from "express";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import cron from "node-cron";
import * as admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
    : undefined;

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    admin.initializeApp();
  }
}

const messaging = admin.messaging();
const resend = new Resend(process.env.RESEND_API_KEY);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Authentication Middleware
  const authenticate = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const idToken = authHeader.split("Bearer ")[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      req.user = decodedToken;
      next();
    } catch (error) {
      console.error("Auth Error:", error);
      res.status(401).json({ error: "Invalid token" });
    }
  };

  const adminOnly = (req: any, res: any, next: any) => {
    if (req.user && req.user.email === 'tanakaprince49@gmail.com') {
      next();
    } else {
      res.status(403).json({ error: "Forbidden: Admin only" });
    }
  };

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy OpenRouter Chat (Secure Backend)
  app.post("/api/ava", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages are required" });
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://nestly.app",
          "X-Title": "Ava AI",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: [
            {
              role: "system",
              content: `You are Ava, a pregnancy companion.
Be VERY concise.
Max 2-3 short sentences.
Warm but direct.
No long explanations.
CRITICAL: You are not a doctor. Never provide medical diagnoses or prescribe treatments. Always advise consulting a healthcare professional for medical concerns.`,
            },
            ...messages,
          ],
          temperature: 0.5,
          max_tokens: 120,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("OpenRouter Error:", err);
        return res.status(500).json({ error: err });
      }

      const data = await response.json();
      const reply = data.choices[0].message.content;

      return res.status(200).json({ reply });
    } catch (error) {
      console.error("Proxy Error:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });

  // Store FCM Token
  app.post("/api/push/token", authenticate, async (req, res) => {
    // Disabled as per request to keep Firebase for Auth only
    res.json({ success: true, message: "FCM token storage disabled (Local only mode)" });
  });

  // Admin Broadcast Push
  app.post("/api/admin/broadcast", authenticate, adminOnly, async (req, res) => {
    const { title, body, url } = req.body;
    if (!title || !body) return res.status(400).send("Title and body required");

    // Broadcast is disabled because tokens are not stored in a central database
    res.status(501).send("Broadcasts are disabled in Local-only mode.");
  });

  // Unsubscribe endpoint
  app.get("/api/unsubscribe", async (req, res) => {
    res.send(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>Local Mode Active</h1>
            <p>Nestly is currently in Local-only mode. Email notifications are managed within the app settings.</p>
            <a href="/">Return to Nestly</a>
          </body>
        </html>
      `);
  });

  // Daily Email Cron Job (Disabled in Local-only mode)
  /*
  cron.schedule("0 9 * * *", async () => {
    ...
  });
  */

  // Weekly Email (Disabled in Local-only mode)
  /*
  cron.schedule("0 10 * * 1", async () => {
    ...
  });
  */

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

async function sendEmail(to: string, subject: string, body: string) {
  try {
    await resend.emails.send({
      from: "Nestly <updates@nestly.run.app>",
      to: to,
      subject: subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
          <h2 style="color: #e11d48;">Nestly Update</h2>
          <p style="font-size: 16px; color: #333;">${body}</p>
          <p style="font-weight: bold; color: #e11d48;">— Nestly 🌱</p>
        </div>
      `
    });
    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
  }
}

startServer();
