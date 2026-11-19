import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../../database/connection.ts';
import { EmailService } from '../../services/emailService.ts';

export const adminCommsRouter = Router();

/**
 * GET /api/admin/active-otps
 * Retrieves recent OTP verification requests for real-time monitoring and fast client assistance.
 */
adminCommsRouter.get('/active-otps', (_req: Request, res: Response): void => {
  const db = getDb();
  const otps = db.prepare(`
    SELECT id, identifier, channel, raw_code as code, is_used, attempts, expires_at, created_at
    FROM otp_codes
    ORDER BY created_at DESC
    LIMIT 20
  `).all() as any[];

  const now = new Date();
  const formatted = otps.map((o) => ({
    id: o.id,
    identifier: o.identifier,
    channel: o.channel,
    code: o.code || '******',
    isUsed: Boolean(o.is_used),
    isExpired: now > new Date(o.expires_at),
    attempts: o.attempts,
    expiresAt: o.expires_at,
    createdAt: o.created_at,
  }));

  res.json({ otps: formatted });
});

/**
 * GET /api/admin/audit-logs
 * Retrieves paginated audit logs.
 */
adminCommsRouter.get('/audit-logs', (req: Request, res: Response): void => {
  const db = getDb();
  const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100);

  const logs = db.prepare(`
    SELECT id, actor_user_id, actor_email, action, target_type, target_id, details_json, ip_address, created_at
    FROM audit_logs
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);

  res.json({ logs });
});

/**
 * GET /api/admin/emails
 * Retrieves sent emails history for the Admin Mail Tab.
 */
adminCommsRouter.get('/emails', (_req: Request, res: Response): void => {
  const db = getDb();
  const emails = db.prepare(`
    SELECT id, recipient_email, recipient_name, subject, body_html, body_text, email_type, status, error_message, created_at
    FROM sent_emails
    ORDER BY created_at DESC
    LIMIT 100
  `).all();

  res.json({ emails });
});

/**
 * POST /api/admin/emails/send
 * Allows Admin to compose and dispatch custom emails.
 */
adminCommsRouter.post('/emails/send', async (req: Request, res: Response): Promise<void> => {
  const cleanTo = (req.body.to || req.body.recipientEmail || '').trim().toLowerCase();
  const toName = (req.body.toName || '').trim();
  const cleanSubject = (req.body.subject || '').trim();
  const cleanMsg = (req.body.message || req.body.textContent || '').trim();

  if (!cleanTo || !cleanSubject || !cleanMsg) {
    res.status(400).json({ error: 'INVALID_INPUT', message: 'Recipient email, subject, and message are required.' });
    return;
  }

  const formattedHtml = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #0c0214; color: #f1f5f9; padding: 25px;">
  <div style="max-width: 580px; margin: 0 auto; background: #170826; border: 1px solid #3b185f; border-radius: 16px; overflow: hidden; padding: 25px;">
    <h2 style="color: #fde047; margin-top: 0; border-bottom: 2px solid #eab308; padding-bottom: 12px;">✨ TalktoNakshatra</h2>
    <div style="font-size: 14px; line-height: 1.6; color: #cbd5e1; white-space: pre-wrap; margin: 20px 0;">${cleanMsg}</div>
    <div style="border-top: 1px solid #3b185f; padding-top: 15px; font-size: 11px; color: #94a3b8;">
      Sent from TalktoNakshatra Administrative Console.
    </div>
  </div>
</body>
</html>
  `;

  await EmailService.sendEmail({
    to: cleanTo,
    toName: toName || undefined,
    subject: cleanSubject,
    html: formattedHtml,
    text: cleanMsg,
    emailType: 'admin_custom',
  });

  res.json({
    success: true,
    message: `Email dispatched to ${cleanTo} successfully.`,
  });
});
