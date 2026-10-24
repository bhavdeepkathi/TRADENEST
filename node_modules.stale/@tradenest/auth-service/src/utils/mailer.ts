import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from './logger';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const isAuthAvailable = !!(config.SMTP_USER && config.SMTP_PASS);
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
      ...(isAuthAvailable
        ? {
            auth: {
              user: config.SMTP_USER,
              pass: config.SMTP_PASS ? config.SMTP_PASS.replace(/\s+/g, '') : '',
            },
          }
        : {}),
      tls: {
        rejectUnauthorized: config.NODE_ENV === 'production',
      },
    });
  }
  return transporter;
}

export async function sendVerificationEmail(to: string, otp: string, firstName?: string): Promise<{ success: boolean; sentViaSmtp: boolean }> {
  const name = firstName || 'there';
  const hasSmtpConfigured = !!(config.SMTP_USER || config.SMTP_HOST !== 'localhost');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify your TRADENEST Account</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 540px; margin: 32px auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .logo { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
    .content { padding: 32px 24px; color: #334155; line-height: 1.6; }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
    .code-box { background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 18px 24px; text-align: center; margin: 24px 0; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; margin: 0; }
    .badge { display: inline-block; padding: 4px 10px; background-color: #fef3c7; color: #92400e; font-size: 12px; font-weight: 600; border-radius: 9999px; margin-top: 8px; }
    .note { font-size: 13px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
    .footer { background-color: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">TRADENEST</h1>
      <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 14px;">Next-Gen E-Commerce Marketplace</p>
    </div>
    <div class="content">
      <h2 class="title">Verify Your Email Address</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Thank you for creating an account with TRADENEST. To finish setting up your account and verify your email address, please enter the one-time verification code below:</p>
      
      <div class="code-box">
        <div class="otp-code">${otp}</div>
        <span class="badge">Valid for 5 minutes</span>
      </div>

      <p class="note">
        <strong>Security Notice:</strong> If you did not sign up for a TRADENEST account, please ignore this email or contact support if you have concerns. Never share this code with anyone.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} TRADENEST Marketplace Inc. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

  const text = `Hi ${name},\n\nYour TRADENEST verification code is: ${otp}\n\nThis code is valid for 5 minutes.\nIf you did not request this, please ignore this email.`;

  if (hasSmtpConfigured) {
    try {
      const client = getTransporter();
      const info = await client.sendMail({
        from: {
          name: 'TRADENEST',
          address: config.SMTP_USER || 'noreply@tradenest.local',
        },
        to,
        replyTo: config.SMTP_USER,
        subject: `Your TRADENEST Verification Code: ${otp}`,
        text,
        html,
      });
      logger.info(`✅ Verification email dispatched successfully to ${to}. ID: ${info.messageId} - ${info.response}`);
      return { success: true, sentViaSmtp: true };
    } catch (err: any) {
      logger.warn(`⚠️ Failed to send verification email via SMTP to ${to}: ${err?.message || err}. Falling back to dev logger.`);
      logger.info(`[FALLBACK DEV OTP] Registration OTP for ${to}: ${otp}`);
      return { success: true, sentViaSmtp: false };
    }
  } else {
    logger.info(`[DEV MODE - No SMTP configured] Registration OTP for ${to}: ${otp}`);
    return { success: true, sentViaSmtp: false };
  }
}
