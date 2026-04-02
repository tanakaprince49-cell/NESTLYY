import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import cron from "node-cron";
import * as admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin (graceful fallback for local dev)
let firebaseInitialized = false;
try {
  if (!admin.apps?.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
      : undefined;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      firebaseInitialized = true;
    } else {
      console.warn("[WARN] No FIREBASE_SERVICE_ACCOUNT set. Firebase Admin features disabled.");
    }
  }
} catch (e) {
  console.warn("[WARN] Firebase Admin init failed:", e);
}

const messaging = firebaseInitialized ? admin.messaging() : null;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Auth middleware — verifies Firebase ID token from Authorization header
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!firebaseInitialized) {
    return res.status(503).json({ error: "Auth service unavailable" });
  }
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    (req as any).user = await admin.auth().verifyIdToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// Admin middleware — checks if user UID is in ADMIN_UIDS env var
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  const adminUids = (process.env.ADMIN_UIDS || "").split(",").filter(Boolean);
  if (!user || !adminUids.includes(user.uid)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy OpenRouter Chat (Secure Backend)
  app.post("/api/ava", requireAuth, async (req, res) => {
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

  // Symptom Decoder AI Endpoint (Trust/Anxiety Reduction)
  app.post("/api/symptom-decode", requireAuth, async (req, res) => {
    try {
      const { symptoms, trimester } = req.body;
      if (!symptoms) return res.status(400).json({ error: "Symptoms are required" });

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://nestly.app",
          "X-Title": "Symptom Decoder",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: [
            {
              role: "system",
              content: `You are an expert pregnancy symptom decoder. Analyze the user's input and return a JSON object.
JSON Structure:
{
  "validation": "string (start with empathy and validation)",
  "safetyRating": "Green | Amber | Red",
  "explanation": "string (1-2 sentences of why this may be happening)",
  "action": "string (1 specific actionable tip)",
  "medicalNote": "string (when to call a doctor)"
}
Rules:
- Non-alarmist but realistic.
- Tailor to trimester: ${trimester}.
- Red safety = Heavy bleeding, severe cramping, no movement.
- Return ONLY the JSON object.
- CRITICAL: You are an AI, not a doctor. Always advise professional medical consultation for health concerns.`,
            },
            {
              role: "user",
              content: `I'm feeling: ${symptoms}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("OpenRouter Error:", err);
        return res.status(500).json({ error: err });
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const analysis = JSON.parse(content);

      return res.status(200).json(analysis);
    } catch (error) {
      console.error("Symptom Decoder Error:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });

  // Food Research AI Endpoint
  app.post("/api/food-research", async (req, res) => {
    try {
      const { foodName } = req.body;
      if (!foodName) {
        return res.status(400).json({ error: "Food name is required" });
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://nestly.app",
          "X-Title": "Food Research AI",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: [
            {
              role: "system",
              content: `You are a nutrition expert. Analyze the given food and return a JSON object.
The JSON must have:
- explanation: 1-2 lines of what the food is.
- calories: estimated number per typical serving.
- protein: estimated grams per typical serving.
- folate: estimated mcg per typical serving.
- iron: estimated mg per typical serving.
- calcium: estimated mg per typical serving.
Return ONLY the JSON.`,
            },
            {
              role: "user",
              content: `Analyze this food: ${foodName}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("OpenRouter Error:", err);
        return res.status(500).json({ error: err });
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const analysis = JSON.parse(content);

      return res.status(200).json(analysis);
    } catch (error) {
      console.error("Food Research Error:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });
  
  // Custom Plan AI Endpoint
  app.post("/api/custom-plan", requireAuth, async (req, res) => {
    try {
      const { trimester, dietPreference, additionalInfo } = req.body;
      if (!trimester || !dietPreference) {
        return res.status(400).json({ error: "Trimester and dietPreference are required" });
      }
  
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://nestly.app",
          "X-Title": "Nestly Custom Plan",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: [
            {
              role: "system",
              content: `You are a pregnancy health expert. Create a personalized daily plan and return a JSON object.
  The JSON must follow this structure exactly:
  {
    "nutrition": {
      "breakfast": ["string"],
      "lunch": ["string"],
      "dinner": ["string"],
      "snacks": ["string"],
      "nutrients": [{"name": "string", "importance": "string"}]
    },
    "fitness": {
      "exercises": ["string"],
      "safety": ["string"],
      "frequency": "string"
    },
    "routine": {
      "morning": ["string"],
      "afternoon": ["string"],
      "evening": ["string"]
    },
    "medical": {
      "upcoming": ["string"],
      "questions": ["string"]
    }
  }
  Tailor the response to the user's trimester: ${trimester} and diet preference: ${dietPreference}.
  If diet is Vegan, ensure no animal products. If Gluten-Free, ensure no gluten.
  Keep descriptions concise and actionable.`,
            },
            {
              role: "user",
              content: `Generate a plan for ${trimester} with a ${dietPreference} diet. ${additionalInfo || ''}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.4,
        }),
      });
  
      if (!response.ok) {
        const err = await response.text();
        console.error("OpenRouter Error:", err);
        return res.status(500).json({ error: err });
      }
  
      const data = await response.json();
      const content = data.choices[0].message.content;
      const plan = JSON.parse(content);
  
      return res.status(200).json(plan);
    } catch (error) {
      console.error("Custom Plan Error:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });

  // Store FCM Token
  app.post("/api/push/token", requireAuth, async (req, res) => {
    // Disabled as per request to keep Firebase for Auth only
    res.json({ success: true, message: "FCM token storage disabled (Local only mode)" });
  });

  // Admin Broadcast Push
  app.post("/api/admin/broadcast", requireAuth, requireAdmin, async (req, res) => {
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
  if (!resend) {
    console.warn("[WARN] Email sending disabled - no RESEND_API_KEY");
    return;
  }
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
