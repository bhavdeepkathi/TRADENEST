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

export async function sendKycDecisionEmail(
  to: string,
  status: 'APPROVED' | 'REJECTED',
  firstName?: string,
  rejectionReason?: string
): Promise<{ success: boolean }> {
  const name = firstName || 'Seller';
  const hasSmtpConfigured = !!(config.SMTP_USER || config.SMTP_HOST !== 'localhost');

  const isApproved = status === 'APPROVED';
  const subject = isApproved
    ? '🎉 Congratulations! Your TRADENEST Seller Account is Approved'
    : 'TRADENEST Seller Account Verification Update';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 32px auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: ${isApproved ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}; padding: 32px 24px; text-align: center; color: #ffffff; }
    .logo { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
    .content { padding: 32px 24px; color: #334155; line-height: 1.6; }
    .title { font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
    .box { background-color: #f8fafc; border-radius: 8px; padding: 18px 20px; margin: 20px 0; border-left: 4px solid ${isApproved ? '#10b981' : '#ef4444'}; }
    .btn { display: inline-block; padding: 12px 28px; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; margin-top: 16px; }
    .footer { background-color: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">TRADENEST</h1>
      <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 14px;">Merchant Services</p>
    </div>
    <div class="content">
      <h2 class="title">${isApproved ? 'Seller Account Approved!' : 'KYC Review Notice'}</h2>
      <p>Hi <strong>${name}</strong>,</p>
      ${
        isApproved
          ? `<p>We are delighted to inform you that your seller application and KYC credentials have been reviewed and <strong>approved</strong> by the TRADENEST administration.</p>
             <div class="box">
               <p style="margin: 0; font-weight: 600; color: #065f46;">Your seller store is now active! You can now access your seller dashboard, manage inventory, list new products, and start receiving customer orders.</p>
             </div>
             <div style="text-align: center;">
               <a href="${config.CORS_ORIGIN || 'http://localhost:3000'}/seller/dashboard" class="btn" style="color: #ffffff;">Go to Seller Center &rarr;</a>
             </div>`
          : `<p>Your seller registration and KYC documents were reviewed by our compliance team. Unfortunately, the request could not be approved at this time.</p>
             <div class="box">
               <p style="margin: 0 0 8px 0; font-weight: 600; color: #991b1b;">Reason for rejection:</p>
               <p style="margin: 0; color: #475569;">${rejectionReason || 'Uploaded documentation was incomplete or invalid.'}</p>
             </div>
             <p>Please update your details and submit fresh documentation in your seller profile settings.</p>`
      }
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} TRADENEST Marketplace Inc. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

  const text = isApproved
    ? `Hi ${name},\n\nCongratulations! Your TRADENEST seller account has been approved. You can now login and start listing products at: ${config.CORS_ORIGIN || 'http://localhost:3000'}/seller/dashboard`
    : `Hi ${name},\n\nYour TRADENEST seller application was reviewed. Status: REJECTED. Reason: ${rejectionReason || 'Documentation rejected'}`;

  if (hasSmtpConfigured) {
    try {
      const client = getTransporter();
      await client.sendMail({
        from: {
          name: 'TRADENEST Support',
          address: config.SMTP_USER || 'noreply@tradenest.local',
        },
        to,
        replyTo: config.SMTP_USER,
        subject,
        text,
        html,
      });
      logger.info(`✅ KYC decision email sent to ${to} (${status})`);
      return { success: true };
    } catch (err: any) {
      logger.warn(`Failed to send KYC email to ${to}: ${err?.message}`);
      return { success: false };
    }
  }
  return { success: true };
}

export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  firstName?: string
): Promise<{ success: boolean; sentViaSmtp: boolean }> {
  const name = firstName || 'there';
  const hasSmtpConfigured = !!(config.SMTP_USER || config.SMTP_HOST !== 'localhost');
  const resetUrl = `http://localhost:3000/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(to)}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your TRADENEST Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 540px; margin: 32px auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .logo { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
    .content { padding: 32px 24px; color: #334155; line-height: 1.6; }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
    .code-box { background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 18px 24px; text-align: center; margin: 24px 0; }
    .token-text { font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #4f46e5; word-break: break-all; margin: 0; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; margin: 16px 0; }
    .note { font-size: 13px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
    .footer { background-color: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">TRADENEST</h1>
      <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 14px;">Account Security</p>
    </div>
    <div class="content">
      <h2 class="title">Reset Your Password</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>We received a request to reset your password for your TRADENEST account. You can reset it by clicking the button below or using your reset token:</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="btn">Reset Password</a>
      </div>

      <div class="code-box">
        <p style="font-size: 12px; color: #64748b; margin: 0 0 6px 0;">Or use this Reset Token directly:</p>
        <div class="token-text">${resetToken}</div>
      </div>

      <p class="note">
        <strong>Security Notice:</strong> This link and token are valid for 1 hour. If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} TRADENEST Marketplace Inc. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

  const text = `Hi ${name},\n\nYou requested a password reset for your TRADENEST account.\n\nReset your password here: ${resetUrl}\nOr use your reset token: ${resetToken}\n\nValid for 1 hour.\nIf you did not request this, please ignore this email.`;

  if (hasSmtpConfigured) {
    try {
      const client = getTransporter();
      await client.sendMail({
        from: {
          name: 'TRADENEST Security',
          address: config.SMTP_USER || 'noreply@tradenest.local',
        },
        to,
        replyTo: config.SMTP_USER,
        subject: 'Reset your TRADENEST password',
        text,
        html,
      });
      logger.info(`✅ Password reset email dispatched successfully to ${to}`);
      return { success: true, sentViaSmtp: true };
    } catch (err: any) {
      logger.warn(`⚠️ Failed to send password reset email via SMTP to ${to}: ${err?.message || err}. Falling back to dev logger.`);
      logger.info(`[FALLBACK DEV RESET TOKEN] Reset Token for ${to}: ${resetToken}`);
      return { success: true, sentViaSmtp: false };
    }
  } else {
    logger.info(`[DEV MODE - No SMTP configured] Password Reset Token for ${to}: ${resetToken}`);
    return { success: true, sentViaSmtp: false };
  }
}
