import nodemailer from "nodemailer";

export interface SendOtpEmailParams {
  to: string;
  otp: string;
  userName?: string;
  intent: "signup" | "login";
}

export interface EmailDispatchResult {
  sent: boolean;
  provider?: "smtp" | "resend" | "supabase" | "none";
  error?: string;
}

/**
 * Production-ready email dispatcher supporting:
 * 1. Resend API (via fetch)
 * 2. Standard SMTP (Gmail, Brevo, SendGrid, Amazon SES via Nodemailer)
 */
export async function sendOtpEmail({
  to,
  otp,
  userName = "Supporter",
  intent,
}: SendOtpEmailParams): Promise<EmailDispatchResult> {
  const cleanEmail = to.trim().toLowerCase();
  const subject =
    intent === "signup"
      ? `Your Verification Code: ${otp} — Apni Madad Foundation`
      : `Your Sign In Code: ${otp} — Apni Madad Foundation`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #090d16 0%, #0f172a 100%); padding: 28px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; color: #ffffff; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0; font-size: 13px; color: #10b981; font-weight: 700; }
        .body { padding: 32px 28px; }
        .greeting { font-size: 15px; font-weight: 600; color: #334155; margin-bottom: 12px; }
        .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .otp-box { background: #f1f5f9; border: 2px dashed #059669; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #047857; font-family: 'Courier New', Courier, monospace; margin: 0; }
        .otp-expiry { font-size: 12px; color: #64748b; margin-top: 8px; }
        .security-note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #92400e; margin-top: 24px; line-height: 1.5; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; }
        .footer a { color: #059669; text-decoration: none; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>Apni Madad Foundation</h1>
          <p>शेखावाटी · 100% Direct Transparent Aid</p>
        </div>
        <div class="body">
          <div class="greeting">Hello ${userName},</div>
          <div class="text">
            ${
              intent === "signup"
                ? "Thank you for creating an account with Apni Madad Foundation. Use the 6-digit verification code below to verify your email and activate your account:"
                : "You requested a verification code to access your Apni Madad Foundation account. Please use the code below to complete your sign-in:"
            }
          </div>
          
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="otp-expiry">Valid for 10 minutes. Do not share this code with anyone.</div>
          </div>

          <div class="security-note">
            <strong>Security Notice:</strong> Apni Madad Foundation will never ask for your verification code, password, or bank OTP over the phone. If you did not request this, you can safely ignore this email.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Apni Madad Foundation (शेखावाटी). Zero Commission, Radical Transparency.<br>
          <a href="https://apnimadad-web.vercel.app">https://apnimadad-web.vercel.app</a>
        </div>
      </div>
    </body>
    </html>
  `;

  // Strategy 1: Resend API (if RESEND_API_KEY is available)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const fromEmail = process.env.RESEND_FROM || "Apni Madad Foundation <support@apnimadad.org>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [cleanEmail],
          subject,
          html: htmlContent,
        }),
      });

      if (res.ok) {
        return { sent: true, provider: "resend" };
      } else {
        const errorData = await res.text();
        console.warn("Resend API error:", errorData);
      }
    } catch (resendErr) {
      console.warn("Resend dispatch notice:", resendErr);
    }
  }

  // Strategy 2: SMTP / Nodemailer (supports Gmail, Brevo, SendGrid, Amazon SES, or custom SMTP)
  const smtpHost = process.env.SMTP_HOST || (process.env.GMAIL_USER ? "smtp.gmail.com" : null);
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const smtpPort = Number(process.env.SMTP_PORT) || 465;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Apni Madad Foundation" <${smtpUser}>`,
        to: cleanEmail,
        subject,
        html: htmlContent,
      });

      return { sent: true, provider: "smtp" };
    } catch (smtpErr) {
      console.warn("SMTP email dispatch notice:", smtpErr);
      return { sent: false, provider: "smtp", error: (smtpErr as Error).message };
    }
  }

  return {
    sent: false,
    provider: "none",
    error: "No active email transport configured in environment",
  };
}
