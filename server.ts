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

const db = admin.firestore();
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
    const { token, userId, email } = req.body;
    if (!token || !userId) return res.status(400).send("Token and userId required");

    try {
      await db.collection("fcm_tokens").doc(userId).set({
        token,
        email,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving FCM token:", error);
      res.status(500).send("Error saving token");
    }
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
      console.error("Email cron job error:", error);
    }
  });

  // Morning Push (8:00 AM)
  cron.schedule("0 8 * * *", async () => {
    console.log("Sending morning push notifications...");
    const messages = [
      "Good morning mama ☀️ Time to take your prenatal vitamins.",
      "Hydration check 💧 Remember to drink water today for you and baby.",
      "Today’s pregnancy tip is ready in Nestly."
    ];
    const body = messages[Math.floor(Math.random() * messages.length)];
    await broadcastPush({
      title: "Morning Reminder 🌅",
      body,
      url: "/?tab=dashboard"
    });
  });

  // Night Push (9:00 PM)
  cron.schedule("0 21 * * *", async () => {
    console.log("Sending night push notifications...");
    const messages = [
      "How are you feeling today? Track your symptoms in Nestly.",
      "Relax mama 🌙 Gentle stretching can help you sleep better tonight.",
      "Remember to take a moment for yourself today."
    ];
    const body = messages[Math.floor(Math.random() * messages.length)];
    await broadcastPush({
      title: "Evening Check-in 🌙",
      body,
      url: "/?tab=journal"
    });
  });

  // Weekly Email (Mondays at 10:00 AM)
  cron.schedule("0 10 * * 1", async () => {
    console.log("Processing weekly emails...");
    try {
      const usersSnapshot = await db.collection('users').get();
      const now = new Date();

      for (const doc of usersSnapshot.docs) {
        const userData = doc.data();
        if (!userData.email || userData.emailNotifications === false) continue;

        let subject = "Your Nestly Weekly Update ❤️";
        let body = "";

        if (userData.lifecycleStage === 'PREGNANCY' && userData.lmpDate) {
          const lmpDate = new Date(userData.lmpDate);
          const weeks = Math.floor((now.getTime() - lmpDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
          subject = `Week ${weeks} of your Pregnancy Journey 🤰`;
          body = `Hi ${userData.name || 'Mama'}, you are now ${weeks} weeks along! Your baby is growing fast. Check Nestly for this week's tips and baby size update.`;
        } else if (userData.lifecycleStage === 'NEWBORN' || userData.lifecycleStage === 'INFANT') {
          subject = "Your Baby's Development This Week 👶";
          body = `Hi ${userData.name || 'Mama'}, we hope you and your little one are doing well. Check Nestly for new milestones and tracking tips for this week.`;
        } else {
          body = `Hi ${userData.name || 'Mama'}, here's your weekly check-in from Nestly. We're here to support you on your journey!`;
        }

        await sendEmail(userData.email, subject, body);
      }
    } catch (error) {
      console.error("Error sending weekly emails:", error);
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

async function broadcastPush(payload: { title: string, body: string, url: string }) {
  try {
    const tokensRef = db.collection("fcm_tokens");
    const snapshot = await tokensRef.get();
    
    if (snapshot.empty) return;

    const tokens = snapshot.docs.map(doc => doc.data().token);
    
    // FCM multicast send
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body
      },
      data: {
        url: payload.url
      }
    });

    console.log(`Successfully sent ${response.successCount} push notifications.`);
    
    // Cleanup invalid tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });
      
      // Remove failed tokens from DB
      for (const token of failedTokens) {
        const tokenSnap = await tokensRef.where("token", "==", token).get();
        tokenSnap.forEach(doc => doc.ref.delete());
      }
    }
  } catch (error) {
    console.error("Error broadcasting push:", error);
  }
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
