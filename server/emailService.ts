import Mailjet from "node-mailjet";

// Initialize Mailjet client (will be null if credentials not provided)
const mailjet =
  process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY
    ? new Mailjet({
        apiKey: process.env.MAILJET_API_KEY,
        apiSecret: process.env.MAILJET_SECRET_KEY,
      })
    : null;

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@choiros.app";
const FROM_NAME = process.env.FROM_NAME || "ChoirOS";

export interface SendEmailParams {
  to: string;
  toName: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}

/**
 * Send email using Mailjet or mock (for development)
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const { to, toName, subject, htmlContent, textContent } = params;

  // Mock mode (development)
  if (!mailjet) {
    console.log("\n📧 [EMAIL MOCK] Would send email:");
    console.log(`   To: ${toName} <${to}>`);
    console.log(`   Subject: ${subject}`);
    console.log(`   HTML Length: ${htmlContent.length} chars`);
    console.log(`   Text Length: ${textContent.length} chars`);
    console.log(`   Preview: ${textContent.substring(0, 100)}...`);
    return true;
  }

  // Real Mailjet send
  try {
    const result = await mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: FROM_EMAIL,
            Name: FROM_NAME,
          },
          To: [
            {
              Email: to,
              Name: toName,
            },
          ],
          Subject: subject,
          TextPart: textContent,
          HTMLPart: htmlContent,
        },
      ],
    });

    console.log(`✅ Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return false;
  }
}
