import tls from 'node:tls';
import net from 'node:net';
import { getDb } from '../database/connection.ts';
import { env } from '../config/environment.ts';
import { generateId } from '../utils/security.ts';

export interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  emailType?: 'welcome' | 'otp' | 'admin_custom' | 'general';
}

export interface SendResult {
  success: boolean;
  messageId: string;
  deliveredLive: boolean;
  error?: string;
}

/**
 * Lightweight, zero-dependency SMTP client using native Node TLS/Net sockets.
 * Supports TLS port 465 (Gmail, Outlook, custom SMTP) and fallback.
 */
async function sendViaSmtp(opts: EmailOptions): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
      resolve({ success: false, error: 'SMTP credentials not configured in environment.' });
      return;
    }

    const port = (env.SMTP_HOST.includes('gmail') && env.SMTP_PORT === 587) ? 465 : (env.SMTP_PORT || 465);
    const isTls = port === 465;
    const cleanPass = env.SMTP_PASS.replace(/\s+/g, '');

    let socket: tls.TLSSocket | net.Socket;
    let step = 0;
    let responseLog = '';

    const handleData = (data: Buffer) => {
      const msg = data.toString();
      responseLog += msg;

      try {
        if (msg.startsWith('220') && step === 0) {
          step = 1;
          socket.write(`EHLO talktonakshatra.com\r\n`);
        } else if ((msg.includes('250 ') || msg.includes('250-')) && step === 1) {
          step = 2;
          socket.write(`AUTH LOGIN\r\n`);
        } else if (msg.startsWith('334') && step === 2) {
          step = 3;
          // Send base64 username
          socket.write(Buffer.from(env.SMTP_USER.trim()).toString('base64') + '\r\n');
        } else if (msg.startsWith('334') && step === 3) {
          step = 4;
          // Send base64 clean password
          socket.write(Buffer.from(cleanPass).toString('base64') + '\r\n');
        } else if (msg.startsWith('235') && step === 4) {
          step = 5;
          const fromAddr = env.SMTP_USER.trim();
          socket.write(`MAIL FROM:<${fromAddr}>\r\n`);
        } else if (msg.startsWith('250') && step === 5) {
          step = 6;
          socket.write(`RCPT TO:<${opts.to}>\r\n`);
        } else if (msg.startsWith('250') && step === 6) {
          step = 7;
          socket.write(`DATA\r\n`);
        } else if (msg.startsWith('354') && step === 7) {
          step = 8;
          const fromAddr = `TalktoNakshatra <${env.SMTP_USER.trim()}>`;
          const rawMessage = [
            `From: ${fromAddr}`,
            `To: ${opts.toName ? `"${opts.toName}" <${opts.to}>` : opts.to}`,
            `Subject: ${opts.subject}`,
            `MIME-Version: 1.0`,
            `Content-Type: text/html; charset=UTF-8`,
            ``,
            opts.html,
            `.`,
          ].join('\r\n');
          socket.write(rawMessage + '\r\n');
        } else if (msg.startsWith('250') && step === 8) {
          step = 9;
          socket.write(`QUIT\r\n`);
          socket.end();
          resolve({ success: true });
        } else if (msg.startsWith('5') || msg.startsWith('4')) {
          socket.end();
          resolve({ success: false, error: `SMTP error: ${msg.trim()}` });
        }
      } catch (err: any) {
        socket.end();
        resolve({ success: false, error: err.message || 'SMTP exception' });
      }
    };

    try {
      if (isTls) {
        socket = tls.connect(port, env.SMTP_HOST, { rejectUnauthorized: false }, () => {});
      } else {
        socket = net.connect(port, env.SMTP_HOST, () => {});
      }

      socket.setTimeout(15000);
      socket.on('data', handleData);
      socket.on('error', (err) => {
        resolve({ success: false, error: `Socket error: ${err.message}` });
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve({ success: false, error: 'SMTP connection timed out' });
      });
    } catch (e: any) {
      resolve({ success: false, error: e.message || 'Connection failed' });
    }
  });
}

export class EmailService {
  /**
   * Primary dispatcher: Sends email via live SMTP if configured,
   * otherwise logs to Dev Inbox, and always records the email in `sent_emails` table.
   */
  static async sendEmail(opts: EmailOptions): Promise<SendResult> {
    const db = getDb();
    const id = generateId();
    const nowIso = new Date().toISOString();
    const hasSmtpConfig = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.SMTP_PASS.trim());

    let deliveredLive = false;
    let status: 'sent' | 'dev_mock' | 'failed' = 'sent';
    let errorMessage: string | undefined = undefined;

    if (hasSmtpConfig) {
      const res = await sendViaSmtp(opts);
      if (res.success) {
        deliveredLive = true;
        status = 'sent';
      } else {
        deliveredLive = false;
        status = 'failed';
        errorMessage = res.error;
        console.warn(`[EMAIL DISPATCH NOTICE] SMTP live sending failed: ${res.error}. Falling back to dev record.`);
      }
    } else {
      status = 'sent'; // Recorded in mail log
      console.log(`\n========================================\n[MAIL LOG / DEV INBOX]\nTo: ${opts.to}\nSubject: ${opts.subject}\nType: ${opts.emailType || 'general'}\n----------------------------------------\n${opts.text || opts.html.replace(/<[^>]*>?/gm, ' ').slice(0, 300)}...\n========================================\n`);
    }

    // Save in sent_emails table for Admin inspection and audit
    try {
      db.prepare(`
        INSERT INTO sent_emails (id, recipient_email, recipient_name, subject, body_html, body_text, email_type, status, error_message, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        opts.to.toLowerCase().trim(),
        opts.toName?.trim() || null,
        opts.subject,
        opts.html,
        opts.text || null,
        opts.emailType || 'general',
        status,
        errorMessage || null,
        nowIso
      );
    } catch (dbErr) {
      console.error('[DATABASE ERROR] Failed to record sent email:', dbErr);
    }

    return {
      success: true,
      messageId: id,
      deliveredLive,
      error: errorMessage,
    };
  }

  /**
   * Sends an automated welcome email when a user is registered.
   */
  static async sendWelcomeEmail(toEmail: string, toName: string, planName: string, expiryDateDDMMYYYY: string): Promise<SendResult> {
    const subject = `Welcome to TalktoNakshatra — Your Account & Access Details`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0c0214; color: #e2e8f0; margin: 0; padding: 20px; }
    .card { max-width: 580px; margin: 0 auto; background: #170826; border: 1px solid #3b185f; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #260a3d 0%, #150324 100%); padding: 30px 20px; text-align: center; border-bottom: 2px solid #eab308; }
    .brand { font-size: 24px; font-weight: 800; color: #fef08a; letter-spacing: 1px; margin: 0; }
    .tagline { font-size: 11px; color: #cbd5e1; text-transform: uppercase; tracking-wider; margin-top: 5px; }
    .content { padding: 30px 25px; line-height: 1.6; font-size: 14px; color: #cbd5e1; }
    .badge { display: inline-block; background: #2e1065; color: #facc15; border: 1px solid #7e22ce; padding: 4px 12px; border-radius: 8px; font-weight: bold; font-size: 13px; }
    .steps { background: #0f031b; border: 1px solid #2e1065; border-radius: 12px; padding: 18px 20px; margin: 20px 0; }
    .steps ol { margin: 0; padding-left: 20px; }
    .steps li { margin-bottom: 10px; color: #f1f5f9; }
    .footer { text-align: center; padding: 20px; font-size: 11px; color: #64748b; border-top: 1px solid #260a3d; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 class="brand">✨ TalktoNakshatra</h1>
      <div class="tagline">Vedic Numerology & Astro Platform</div>
    </div>
    <div class="content">
      <p>Namaste <strong>${toName || 'Valued Client'}</strong>,</p>
      <p>Welcome to <strong>TalktoNakshatra</strong>! Your subscription account has been registered and activated successfully.</p>
      
      <p><strong>Your Plan Details:</strong></p>
      <ul>
        <li>Subscription Plan: <span class="badge">${planName}</span></li>
        <li>Active Through: <strong>${expiryDateDDMMYYYY}</strong></li>
        <li>Access: <strong>Full Unlocked Access</strong> (Natal, Mahadasha, Personal Year, Monthly Pratyantar, Daily Grids, 100-Year Projections, & Saved Charts).</li>
      </ul>

      <div class="steps">
        <h4 style="margin: 0 0 10px 0; color: #fde047;">How to Log In (Fast & Secure Passwordless Access):</h4>
        <ol>
          <li>Open our website: <strong>TalktoNakshatra</strong></li>
          <li>Click the <strong>Sign In</strong> button at the top right.</li>
          <li>Enter your registered email: <strong>${toEmail}</strong></li>
          <li>Enter the 6-digit OTP code sent to your inbox. You never have to remember a password!</li>
        </ol>
      </div>

      <p>Once logged in, you can calculate and save unlimited charts, inspect birth numbers, and track planetary shifts.</p>
      <p>If you have any questions or need guidance, simply reply to this email or contact support.</p>

      <p style="margin-top: 25px;">Warm regards,<br><strong>TalktoNakshatra Team</strong></p>
    </div>
    <div class="footer">
      © 2026 TalktoNakshatra. All rights reserved. Confidential and personalized numerology software.
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: toEmail,
      toName,
      subject,
      html,
      text: `Welcome to TalktoNakshatra! Your ${planName} plan is active through ${expiryDateDDMMYYYY}. To login, visit TalktoNakshatra, click Sign In, enter ${toEmail}, and enter the OTP sent to your inbox.`,
      emailType: 'welcome',
    });
  }

  /**
   * Sends an OTP verification email.
   */
  static async sendOtpEmail(toEmail: string, otpCode: string): Promise<SendResult> {
    const subject = `Your TalktoNakshatra Login Verification Code: ${otpCode}`;

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #0c0214; color: #f1f5f9; padding: 25px;">
  <div style="max-width: 500px; margin: 0 auto; background: #180928; border: 1px solid #4a1d96; border-radius: 16px; padding: 25px; text-align: center;">
    <h2 style="color: #fde047; margin-bottom: 5px;">✨ TalktoNakshatra</h2>
    <p style="font-size: 13px; color: #94a3b8; margin-top: 0;">Login Verification Code</p>
    <p style="font-size: 14px; margin: 20px 0;">Use the 6-digit code below to sign in to your TalktoNakshatra account:</p>
    <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #38bdf8; background: #0c0214; padding: 15px; border-radius: 12px; border: 1px dashed #7e22ce; margin: 20px 0; font-family: monospace;">
      ${otpCode}
    </div>
    <p style="font-size: 12px; color: #a855f7;">This code is valid for 10 minutes. For your security, do not share it with anyone.</p>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: toEmail,
      subject,
      html,
      text: `Your TalktoNakshatra login verification code is: ${otpCode} (Expires in 10 minutes).`,
      emailType: 'otp',
    });
  }
}
