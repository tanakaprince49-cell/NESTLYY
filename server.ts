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
// In this environment, we can initialize without explicit credentials if the project is provisioned
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const resend = new Resend(process.env.RESEND_API_KEY);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Unsubscribe endpoint
  app.get("/api/unsubscribe", async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).send("Email required");

    try {
      const usersRef = db.collection("users");
      const snapshot = await usersRef.where("email", "==", email).get();
      
      if (snapshot.empty) {
        return res.status(404).send("User not found");
      }

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { emailNotifications: false });
      });
      await batch.commit();

      res.send(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>Unsubscribed Successfully</h1>
            <p>You will no longer receive daily Nestly updates to ${email}.</p>
            <a href="/">Return to Nestly</a>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Unsubscribe error:", error);
      res.status(500).send("Error processing request");
    }
  });

  // Daily Email Cron Job (Runs at 9:00 AM every day)
  cron.schedule("0 9 * * *", async () => {
    console.log("Running daily email cron job...");
    try {
      const usersRef = db.collection("users");
      const snapshot = await usersRef.where("emailNotifications", "==", true).get();

      for (const doc of snapshot.docs) {
        const userData = doc.data();
        await sendDailyEmail(userData);
      }
      console.log(`Finished sending emails to ${snapshot.size} users.`);
    } catch (error) {
      console.error("Cron job error:", error);
    }
  });

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

async function sendDailyEmail(user: any) {
  const { email, name, lifecycleStage, lmpDate } = user;
  
  let updateText = "";
  let stageInfo = "";
  let tips = [];

  if (lifecycleStage === "PREGNANCY" && lmpDate) {
    const diff = new Date().getTime() - new Date(lmpDate).getTime();
    const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
    updateText = `Today you are in Week ${weeks} of your pregnancy.`;
    
    // Simple mock data for demo - in a real app this would come from a service
    if (weeks < 13) {
      stageInfo = "Your baby is developing vital organs and their heart is beating strongly.";
      tips = ["Stay hydrated", "Take your prenatal vitamins", "Rest when you feel tired"];
    } else if (weeks < 27) {
      stageInfo = "Your baby is growing quickly and you might start feeling those first kicks soon!";
      tips = ["Eat iron-rich foods", "Gentle stretching", "Talk to your baby"];
    } else {
      stageInfo = "Your baby is getting ready for the big day! Their lungs are maturing.";
      tips = ["Pack your hospital bag", "Practice breathing exercises", "Keep feet elevated"];
    }
  } else if (lifecycleStage === "POSTPARTUM") {
    updateText = "You are in your postpartum journey.";
    stageInfo = "Your body is healing and your baby is discovering the world through your touch and voice.";
    tips = ["Prioritize sleep", "Ask for help when needed", "Stay nourished"];
  } else {
    return; // Skip if no relevant stage
  }

  const unsubscribeUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/unsubscribe?email=${encodeURIComponent(email)}`;

  try {
    await resend.emails.send({
      from: "Nestly <updates@nestly.run.app>",
      to: email,
      subject: "Your Nestly Daily Update",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
          <h2 style="color: #e11d48;">Hi ${name},</h2>
          <p style="font-size: 16px; color: #333;">${updateText}</p>
          <p style="font-size: 16px; color: #555;">${stageInfo}</p>
          
          <div style="background: #fff1f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #be123c;">Today's Tips</h4>
            <ul style="margin-bottom: 0;">
              ${tips.map(tip => `<li>${tip}</li>`).join("")}
            </ul>
          </div>
          
          <p style="font-size: 14px; color: #777;">Keep going — you're doing great.</p>
          <p style="font-weight: bold; color: #e11d48;">— Nestly 🌱</p>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <div style="text-align: center; font-size: 12px; color: #999;">
            <p><a href="${process.env.APP_URL || 'http://localhost:3000'}" style="color: #e11d48;">Go to Dashboard</a></p>
            <p><a href="${unsubscribeUrl}" style="color: #999;">Unsubscribe</a> from these daily updates.</p>
          </div>
        </div>
      `
    });
    
    // Update last email sent timestamp
    await db.collection("users").doc(user.uid).update({
      lastEmailSent: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error(`Failed to send email to ${email}:`, error);
  }
}

startServer();
