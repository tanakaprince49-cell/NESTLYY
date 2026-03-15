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

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Store FCM Token
  app.post("/api/push/token", async (req, res) => {
    // Disabled as per request to keep Firebase for Auth only
    res.json({ success: true, message: "FCM token storage disabled (Local only mode)" });
  });

  // Admin Broadcast Push
  app.post("/api/admin/broadcast", async (req, res) => {
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
