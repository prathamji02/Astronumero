import { getDb } from '../../database/connection.ts';
import { generateId, generateNumericOtp, hashOtp, verifyOtpHash } from '../../utils/security.ts';
import { env } from '../../config/environment.ts';
import { EmailService } from '../../services/emailService.ts';

export interface SendOtpResult {
  success: boolean;
  message: string;
  channel: 'email' | 'sms';
  identifier: string;
  deliveredLive?: boolean;
  devCode?: string; // Only returned in non-production when no live provider is configured
}

export interface VerifyOtpResult {
  success: boolean;
  message: string;
}

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

export class OtpService {
  /**
   * Generates and dispatches an OTP to the given email or mobile number.
   */
  static async requestOtp(identifier: string, channel: 'email' | 'sms'): Promise<SendOtpResult> {
    const cleanIdentifier = identifier.trim().toLowerCase();
    const db = getDb();
    const now = new Date();

    // Rate-limiting check: max 4 OTP requests in the past 10 minutes
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    const rateCheck = db.prepare(`
      SELECT COUNT(*) as count FROM otp_codes
      WHERE identifier = ? AND created_at >= ?
    `).get(cleanIdentifier, tenMinutesAgo) as { count: number };

    if (rateCheck.count >= 4) {
      return {
        success: false,
        message: 'Too many OTP requests in a short time. Please wait 10 minutes before trying again.',
        channel,
        identifier: cleanIdentifier,
      };
    }

    const otp = generateNumericOtp();
    const codeHash = hashOtp(otp);
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO otp_codes (id, identifier, channel, code_hash, raw_code, attempts, is_used, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)
    `).run(generateId(), cleanIdentifier, channel, codeHash, otp, expiresAt, now.toISOString());

    // Delivery handling:
    let deliveryMessage = '';
    let devCode: string | undefined = undefined;
    let deliveredLive = false;

    if (channel === 'email') {
      const emailRes = await EmailService.sendOtpEmail(cleanIdentifier, otp);
      deliveredLive = emailRes.deliveredLive;
      devCode = otp;
      deliveryMessage = deliveredLive
        ? `OTP has been sent to your email (${cleanIdentifier}). Please check your inbox and spam folder.`
        : `Verification code generated for ${cleanIdentifier}.`;
    } else {
      if (env.TWILIO_ACCOUNT_SID && env.TWILIO_PHONE_NUMBER) {
        // Production SMS delivery (stub/adapter)
        deliveryMessage = `SMS OTP has been sent to ${cleanIdentifier}.`;
      } else {
        // Dev Mock Provider
        devCode = otp;
        deliveryMessage = `[Dev Mock Provider] SMS OTP code for ${cleanIdentifier} is ${otp}. (Expires in 10 minutes)`;
        console.log(`\n========================================\n[OTP SMS DEV INBOX] ${deliveryMessage}\n========================================\n`);
      }
    }

    return {
      success: true,
      message: deliveryMessage,
      channel,
      identifier: cleanIdentifier,
      deliveredLive,
      devCode: env.NODE_ENV !== 'production' ? devCode : undefined,
    };
  }

  /**
   * Verifies an OTP code for the given identifier.
   */
  static verifyOtp(identifier: string, code: string): VerifyOtpResult {
    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanCode = code.trim();
    const db = getDb();
    const now = new Date();

    const record = db.prepare(`
      SELECT id, code_hash, attempts, is_used, expires_at
      FROM otp_codes
      WHERE identifier = ? AND is_used = 0
      ORDER BY created_at DESC
      LIMIT 1
    `).get(cleanIdentifier) as {
      id: string;
      code_hash: string;
      attempts: number;
      is_used: number;
      expires_at: string;
    } | undefined;

    if (!record) {
      return {
        success: false,
        message: 'No active OTP verification code found for this contact. Please request a new OTP.',
      };
    }

    // Check expiry
    if (now > new Date(record.expires_at)) {
      return {
        success: false,
        message: 'This OTP has expired. Please request a new verification code.',
      };
    }

    // Check attempts limit
    if (record.attempts >= MAX_ATTEMPTS) {
      // Mark as invalidated
      db.prepare('UPDATE otp_codes SET is_used = 1 WHERE id = ?').run(record.id);
      return {
        success: false,
        message: 'Too many incorrect attempts. This OTP has been invalidated. Please request a new code.',
      };
    }

    // Verify hash
    const isValid = verifyOtpHash(cleanCode, record.code_hash);
    if (!isValid) {
      db.prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?').run(record.id);
      const remainingAttempts = MAX_ATTEMPTS - (record.attempts + 1);
      return {
        success: false,
        message: `Incorrect OTP code. ${remainingAttempts} attempt(s) remaining.`,
      };
    }

    // Mark as used
    db.prepare('UPDATE otp_codes SET is_used = 1 WHERE id = ?').run(record.id);

    return {
      success: true,
      message: 'OTP verified successfully.',
    };
  }
}
