import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  calculateBasicNumber,
  calculateDestinyNumber,
  calculateNatalGrid,
  calculateMahadashaPeriods,
  getActiveMahadasha,
  calculatePersonalYearForBirthday,
  getActivePersonalYear,
  calculatePratyantarPeriods,
  getActivePratyantar,
  calculateDayLord,
  calculateAnnualGrid,
  calculateDailyGrid,
  calculateHundredYearTimeline,
  formatDate,
} from '../../../../shared/src/index.ts';
import { requireAuth } from '../../middleware/auth.ts';
import { requireEntitlement } from '../../middleware/entitlements.ts';

export const numerologyRouter = Router();

/**
 * POST /api/numerology/calculate
 * Generates the full numerology suite for a person and target date/year.
 */
numerologyRouter.post('/calculate', (req: Request, res: Response): void => {
  const { fullName, dateOfBirth, timeOfBirth, placeOfBirth, targetDate, targetYear } = req.body;

  if (!fullName || !dateOfBirth) {
    res.status(400).json({ error: 'INVALID_INPUT', message: 'fullName and dateOfBirth are required.' });
    return;
  }

  try {
    const natalResult = calculateNatalGrid({
      fullName,
      dateOfBirth,
      timeOfBirth,
      placeOfBirth,
    });

    // 100-year Mahadasha periods
    const mahadashaPeriods = calculateMahadashaPeriods(dateOfBirth, natalResult.basicNumber, 100);

    // Selected target date (default to today if omitted)
    const effectiveTargetDate = targetDate || formatDate(new Date());

    // Active Mahadasha for effective target date
    const activeMahadasha = getActiveMahadasha(mahadashaPeriods, effectiveTargetDate) || mahadashaPeriods[0];

    // Personal Year
    const activePersonalYear = targetYear
      ? calculatePersonalYearForBirthday(dateOfBirth, parseInt(String(targetYear), 10))
      : getActivePersonalYear(dateOfBirth, effectiveTargetDate);

    // Pratyantar periods for active Personal Year
    const pratyantarPeriods = calculatePratyantarPeriods(
      activePersonalYear.startDate,
      activePersonalYear.endDate,
      activePersonalYear.personalYearNumber
    );

    const activePratyantar = getActivePratyantar(pratyantarPeriods, effectiveTargetDate);

    // Day Lord
    const dayLord = activePratyantar && !activePratyantar.isBlank && activePratyantar.pratyantarNumber !== null
      ? calculateDayLord(effectiveTargetDate, activePratyantar.pratyantarNumber)
      : null;

    // Annual Grid
    const annualGrid = calculateAnnualGrid(
      natalResult.grid,
      activeMahadasha.number,
      activePersonalYear.personalYearNumber,
      activePersonalYear.startDate,
      activePersonalYear.endDate
    );

    // Daily Grid
    const dailyGrid = calculateDailyGrid(
      natalResult.grid,
      activeMahadasha.number,
      activePersonalYear.personalYearNumber,
      activePratyantar?.pratyantarNumber ?? null,
      dayLord?.dayLordNumber ?? null,
      effectiveTargetDate,
      dayLord?.weekday ?? 'Unknown'
    );

    res.json({
      success: true,
      data: {
        birthInput: { fullName, dateOfBirth, timeOfBirth, placeOfBirth },
        targetDate: effectiveTargetDate,
        natal: natalResult,
        mahadasha: {
          periods: mahadashaPeriods,
          active: activeMahadasha,
        },
        personalYear: activePersonalYear,
        pratyantar: {
          periods: pratyantarPeriods,
          active: activePratyantar,
        },
        dayLord,
        annualGrid,
        dailyGrid,
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: 'CALCULATION_ERROR', message: err.message });
  }
});

/**
 * POST /api/numerology/timeline
 * Generates the full 100-Year Timeline.
 * Protected by entitlement check 'allow_100_year_timeline'.
 */
numerologyRouter.post('/timeline', requireAuth, requireEntitlement('allow_100_year_timeline'), (req: Request, res: Response): void => {
  const { dateOfBirth, basicNumber } = req.body;

  if (!dateOfBirth) {
    res.status(400).json({ error: 'INVALID_INPUT', message: 'dateOfBirth is required.' });
    return;
  }

  try {
    const dayNum = parseInt(dateOfBirth.split('-')[2], 10);
    const resolvedBasicNumber = basicNumber || calculateBasicNumber(dayNum);
    const timeline = calculateHundredYearTimeline(dateOfBirth, resolvedBasicNumber);

    res.json({
      success: true,
      timeline,
    });
  } catch (err: any) {
    res.status(400).json({ error: 'CALCULATION_ERROR', message: err.message });
  }
});
