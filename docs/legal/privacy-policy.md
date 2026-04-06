# Privacy Policy

**Effective Date:** [DATE]
**App:** Nestly Pregnancy Companion
**Operator:** [FULL NAME / BUSINESS NAME], [ADDRESS], Zimbabwe
**Contact:** supportnestly@gmail.com
**Data Protection Officer:** [DPO NAME, if appointed] -- [DPO CONTACT EMAIL]

---

## 1. Who We Are

Nestly ("we", "us", "our") is a pregnancy tracking and baby care application operated from Zimbabwe. This privacy policy explains how we collect, use, store, and protect your personal information in accordance with the Cyber and Data Protection Act [Chapter 12:07] of Zimbabwe.

(If you are located in another African jurisdiction, additional protections may apply, including POPIA in South Africa, NDPR in Nigeria, or the Data Protection Act in Kenya.)

---

## 2. Information We Collect

### 2.1 Account Information
- Name, email address, and profile picture (via Firebase Authentication)
- Authentication method (Google, email/password, or anonymous)
- Unique user identifier

### 2.2 Health and Pregnancy Data (Sensitive Personal Data)
- Pregnancy profile (due date, lifecycle stage, baby count)
- Symptom logs, weight, blood pressure, and vitals
- Baby data: feeding records, sleep cycles, diaper logs, growth measurements, bath and tummy time logs
- Kick counts, contraction timing, medication and vitamin logs
- Journal entries

This data is classified as **sensitive personal data** under Zimbabwean law (section 12, CDPA) and requires your **explicit written consent** before collection. You will be asked to provide this consent through an in-app consent screen before any health data is collected.

### 2.3 AI Conversation Data
- Messages you send to Ava, our AI companion
- These messages are sent to a third-party AI service for processing (see Section 5)

### 2.4 Community Data (Village Hub)
- Posts, comments, and likes you create in community groups ("nests")
- Your display name and profile picture as shown to other community members
- Nest memberships

### 2.5 Media
- Profile pictures are stored locally on your device (localStorage) and embedded in Village Hub posts/comments when you post
- Memories photos are stored locally on your device (localStorage)
- Village Hub post media (images) are currently stored as embedded data in Firestore

### 2.6 Technical Data
- Push notification tokens
- Device type and browser information (collected automatically)

---

## 3. Legal Basis for Processing

We process your personal data on the following bases:

- **Explicit written consent:** Health data, AI conversations, and community participation require your explicit written consent before processing. You will be presented with a clear consent screen ("I give my written consent to...") before any sensitive data is collected. You may withdraw consent at any time (see Section 8).
- **Contract:** Account data is processed to provide the service you signed up for.
- **Legitimate interest:** Technical data for security and service operation.

---

## 4. How We Use Your Data

- To provide personalised pregnancy tracking and baby care features
- To display your dashboard, growth charts, and health summaries
- To generate AI-powered responses through Ava (general information only, not medical advice)
- To generate nutrition and fitness plans
- To enable community interaction in Village Hub
- To send push notifications you have opted into
- To allow you to export health reports
- To provide article recommendations based on your lifecycle stage

We do **not** use your data for advertising. We do **not** sell your data to any third party.

We practice **data minimisation**: we only collect data that is necessary for the features you use, and we do not retain data longer than needed for its stated purpose.

---

## 5. Third-Party Services

We use the following third-party services that process your data:

| Service | Provider | Purpose | Data Shared | Server Location |
|---------|----------|---------|-------------|-----------------|
| Firebase Authentication | Google (USA) | User login and identity | Email, name, auth tokens | USA |
| Cloud Firestore | Google (USA) | Village Hub data storage | Posts, comments, likes, memberships | USA |
| OpenRouter / DeepSeek | OpenRouter (USA) / DeepSeek | AI chat (Ava) | Chat messages | USA / varies |
| Google Gemini API | Google (USA) | Food nutrition research | Food queries | USA |
| Vercel | Vercel Inc. (USA) | App hosting | HTTP requests | USA |
| Resend | Resend Inc. (USA) | Transactional email | Email address | USA |

---

## 6. International Data Transfers

Your data is transferred to servers located outside Zimbabwe, primarily in the United States. As required by the Cyber and Data Protection Act:

- We have conducted a Data Protection Impact Assessment (DPIA) for these transfers
- We have entered into appropriate data-sharing agreements with all listed third-party providers
- Transfers rely on your explicit written consent and the contractual safeguards maintained by the service providers
- POTRAZ has been notified of these international transfers

By using Nestly, you consent to the transfer of your data to these services. You may withdraw this consent at any time by deleting your account.

---

## 7. Data Storage and Security

### 7.1 Where Your Data Is Stored
- **Most personal health data** (pregnancy logs, baby tracking, vitals, journal) is stored **locally on your device** in your browser's localStorage. This data does not leave your device unless you export it.
- **Village Hub data** (posts, comments, likes, memberships) is stored in Google Cloud Firestore.
- **AI conversations** are processed in real time and are not permanently stored on our servers.

### 7.2 Security Measures
- All data transmitted between your device and our servers is encrypted using TLS/HTTPS
- Firebase Authentication secures access to your account
- Firestore security rules restrict data access to authorised users only
- localStorage data is scoped to your user account

---

## 8. Your Rights

Under the Cyber and Data Protection Act, you have the right to:

- **Access** your personal data and receive a copy
- **Rectify** inaccurate data
- **Delete** your account and all associated data
- **Restrict** processing of your data
- **Object** to processing of your data
- **Data portability** -- receive your data in a structured format
- **Withdraw consent** at any time without affecting the lawfulness of prior processing
- **Lodge a complaint** with POTRAZ (Postal and Telecommunications Regulatory Authority of Zimbabwe)

To exercise any of these rights, contact us at supportnestly@gmail.com. We will respond within 30 days.

To delete your locally stored data, clear your browser's localStorage for the Nestly domain. To delete your Firestore data (Village Hub), contact us or use the account deletion feature in the app.

---

## 9. Data Retention

- **localStorage data** remains on your device until you clear it or delete your account.
- **Firestore data** (Village Hub) is retained while your account is active. Upon account deletion, all associated data is deleted within 30 days.
- **AI conversation data** is not permanently stored by us. Third-party AI providers may retain data according to their own policies.

---

## 10. Children's Data

Nestly allows parents and caregivers to track baby and toddler health data. This data is entered and managed by the parent or legal guardian on behalf of the child.

- We do not knowingly collect data directly from children under 18
- Baby data (name, birthdate, growth, feeding, health logs) is treated as sensitive personal data
- The parent or legal guardian provides consent for the collection and processing of their child's data
- Parents may request deletion of all child-related data at any time

---

## 11. AI-Generated Content

Nestly uses artificial intelligence (Ava chatbot and nutrition planning) to provide general information. Important disclosures:

- AI responses are generated by third-party language models (DeepSeek, Google Gemini)
- **AI-generated content is not medical advice** and should never replace consultation with a qualified healthcare professional
- We do not guarantee the accuracy of AI-generated content
- Your chat messages are sent to third-party AI services for processing
- You have the right not to be subject to decisions based solely on automated processing. If you disagree with AI-generated advice, disregard it and consult a healthcare provider.

---

## 12. Village Hub (Community Features)

When you participate in Village Hub:

- Your display name, profile picture, posts, comments, and likes are **visible to other members** of the nests you join
- Community content is stored in Cloud Firestore, not locally on your device
- You are responsible for the personal information you choose to share in posts and comments
- Do not share sensitive health information in community posts unless you are comfortable with other members seeing it
- Other members cannot access your private health tracking data

---

## 13. Push Notifications

If you enable push notifications:

- We collect a device token through Firebase Cloud Messaging
- This token is used solely to deliver notifications you have opted into
- You can disable push notifications at any time through your device or browser settings

---

## 14. Data Breach Notification

In the event of a personal data breach that poses a risk to your rights:

- We will notify POTRAZ **within 24 hours** of becoming aware of the breach
- If the breach is likely to result in a high risk to your rights and freedoms, we will notify you **within 72 hours**
- Notification will include the nature of the breach, likely consequences, and measures taken

---

## 15. Changes to This Policy

We may update this privacy policy from time to time. When we do:

- The updated policy will be posted in the app with a new effective date
- For significant changes, we will notify you via push notification or in-app notice
- Continued use of the app after changes constitutes acceptance of the updated policy

---

## 16. Contact

For questions, data requests, or complaints:

**Email:** supportnestly@gmail.com

You also have the right to lodge a complaint with:
**POTRAZ** -- Postal and Telecommunications Regulatory Authority of Zimbabwe
Website: www.potraz.gov.zw

---

This policy is governed primarily by the laws of Zimbabwe. Depending on your location, you may have additional rights under local data protection laws (e.g. POPIA in South Africa, NDPR in Nigeria, Kenya Data Protection Act).

---

Nestly Pregnancy Companion (c) 2026
