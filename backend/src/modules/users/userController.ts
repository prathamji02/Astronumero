import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../../database/connection.ts';
import { requireAuth } from '../../middleware/auth.ts';
import { getUserActiveSubscription } from '../../middleware/entitlements.ts';
import { calculateBasicNumber, calculateDestinyNumber } from '../../../../shared/src/index.ts';

export const userRouter = Router();

/**
 * GET /api/user/profile
 * Retrieves complete profile, birth information, and subscription overview for the current user.
 */
userRouter.get('/profile', requireAuth, (req: Request, res: Response): void => {
  const db = getDb();
  const userId = req.user!.id;

  const user = db.prepare(`
    SELECT id, email, mobile, full_name, role, status, is_verified, created_at, updated_at
    FROM users WHERE id = ?
  `).get(userId) as any;

  const profile = db.prepare(`
    SELECT date_of_birth, time_of_birth, place_of_birth, basic_number, destiny_number,
           profile_photo_url, timezone, language, updated_at
    FROM user_profiles WHERE user_id = ?
  `).get(userId) as any;

  const subscription = getUserActiveSubscription(userId);

  // Saved chart count
  const chartStats = db.prepare(`
    SELECT COUNT(*) as total_saved_charts FROM saved_charts WHERE user_id = ?
  `).get(userId) as { total_saved_charts: number };

  // Recent 5 saved charts
  const recentCharts = db.prepare(`
    SELECT id, person_name, date_of_birth, time_of_birth, place_of_birth, created_at
    FROM saved_charts
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 5
  `).all(userId);

  // Active session info
  const sessionInfo = {
    id: req.session!.id,
    deviceInfo: req.session!.deviceInfo,
    ipAddress: req.session!.ipAddress,
    createdAt: req.session!.createdAt,
    expiresAt: req.session!.expiresAt,
  };

  res.json({
    user,
    profile,
    subscription,
    chartStats,
    recentCharts,
    activeSession: sessionInfo,
  });
});

/**
 * PUT /api/user/profile
 * Updates personal details (full name, timezone, language, profile photo).
 */
userRouter.put('/profile', requireAuth, (req: Request, res: Response): void => {
  const { fullName, timezone, language, profilePhotoUrl } = req.body;
  const db = getDb();
  const userId = req.user!.id;
  const nowIso = new Date().toISOString();

  if (fullName && typeof fullName === 'string') {
    db.prepare('UPDATE users SET full_name = ?, updated_at = ? WHERE id = ?').run(fullName.trim(), nowIso, userId);
  }

  db.prepare(`
    UPDATE user_profiles
    SET timezone = COALESCE(?, timezone),
        language = COALESCE(?, language),
        profile_photo_url = COALESCE(?, profile_photo_url),
        updated_at = ?
    WHERE user_id = ?
  `).run(timezone || null, language || null, profilePhotoUrl || null, nowIso, userId);

  res.json({ success: true, message: 'Profile updated successfully.' });
});

/**
 * PUT /api/user/birth-details
 * Updates birth information and recalculates Basic and Destiny numbers according to Section 6.2.
 * Does not overwrite existing historical saved charts.
 */
userRouter.put('/birth-details', requireAuth, (req: Request, res: Response): void => {
  const { dateOfBirth, timeOfBirth, placeOfBirth } = req.body;

  if (!dateOfBirth || typeof dateOfBirth !== 'string') {
    res.status(400).json({ error: 'INVALID_INPUT', message: 'Valid date of birth (YYYY-MM-DD) is required.' });
    return;
  }

  // Validate format YYYY-MM-DD
  const parts = dateOfBirth.split('-');
  if (parts.length !== 3) {
    res.status(400).json({ error: 'INVALID_INPUT', message: 'Date of birth must be in YYYY-MM-DD format.' });
    return;
  }

  const dayNum = parseInt(parts[2], 10);
  let basicNumber: number;
  let destinyNumber: number;

  try {
    basicNumber = calculateBasicNumber(dayNum);
    destinyNumber = calculateDestinyNumber(dateOfBirth);
  } catch (err: any) {
    res.status(400).json({ error: 'CALCULATION_ERROR', message: err.message });
    return;
  }

  const db = getDb();
  const userId = req.user!.id;
  const nowIso = new Date().toISOString();

  db.prepare(`
    UPDATE user_profiles
    SET date_of_birth = ?,
        time_of_birth = ?,
        place_of_birth = ?,
        basic_number = ?,
        destiny_number = ?,
        updated_at = ?
    WHERE user_id = ?
  `).run(
    dateOfBirth,
    timeOfBirth || null,
    placeOfBirth || null,
    basicNumber,
    destinyNumber,
    nowIso,
    userId
  );

  res.json({
    success: true,
    message: 'Birth details updated and numerology numbers recalculated.',
    data: {
      dateOfBirth,
      timeOfBirth,
      placeOfBirth,
      basicNumber,
      destinyNumber,
    },
  });
});
