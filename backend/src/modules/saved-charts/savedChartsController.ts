import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../../database/connection.ts';
import { requireAuth } from '../../middleware/auth.ts';
import { requireEntitlement } from '../../middleware/entitlements.ts';
import { generateId } from '../../utils/security.ts';
import {
  calculateNatalGrid,
  calculateMahadashaPeriods,
  calculatePersonalYearForBirthday,
} from '../../../../shared/src/index.ts';

export const savedChartsRouter = Router();

/**
 * GET /api/charts
 * Lists all saved charts owned by the current user.
 */
savedChartsRouter.get('/', requireAuth, (req: Request, res: Response): void => {
  const db = getDb();
  const userId = req.user!.id;
  const search = req.query.search as string | undefined;

  let query = `
    SELECT id, person_name, date_of_birth, time_of_birth, place_of_birth,
           calculation_version, created_at, updated_at
    FROM saved_charts
    WHERE user_id = ?
  `;
  const params: any[] = [userId];

  if (search && search.trim()) {
    query += ' AND person_name LIKE ?';
    params.push(`%${search.trim()}%`);
  }

  query += ' ORDER BY created_at DESC';

  const charts = db.prepare(query).all(...params);
  res.json({ charts });
});

/**
 * GET /api/charts/:id
 * Retrieves full details and snapshot of a specific saved chart (ownership verified).
 */
savedChartsRouter.get('/:id', requireAuth, (req: Request, res: Response): void => {
  const db = getDb();
  const userId = req.user!.id;
  const chartId = req.params.id;

  const chart = db.prepare(`
    SELECT * FROM saved_charts WHERE id = ? AND user_id = ?
  `).get(chartId, userId) as any;

  if (!chart) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Chart not found or unauthorized.' });
    return;
  }

  res.json({
    chart: {
      ...chart,
      chartSnapshot: JSON.parse(chart.chart_snapshot_json),
    },
  });
});

/**
 * POST /api/charts
 * Saves a new numerology chart snapshot.
 * Enforces subscription limits via requireEntitlement('save_chart').
 */
savedChartsRouter.post('/', requireAuth, requireEntitlement('save_chart'), (req: Request, res: Response): void => {
  const { personName, dateOfBirth, timeOfBirth, placeOfBirth, chartSnapshot } = req.body;

  if (!personName || !dateOfBirth) {
    res.status(400).json({ error: 'INVALID_INPUT', message: 'personName and dateOfBirth are required.' });
    return;
  }

  const db = getDb();
  const userId = req.user!.id;
  const chartId = generateId();
  const nowIso = new Date().toISOString();

  // If chartSnapshot is not provided, calculate it using the numerology engine
  let snapshotToStore = chartSnapshot;
  if (!snapshotToStore) {
    const natal = calculateNatalGrid({ fullName: personName, dateOfBirth, timeOfBirth, placeOfBirth });
    const mahadashas = calculateMahadashaPeriods(dateOfBirth, natal.basicNumber, 100);
    const birthYear = parseInt(dateOfBirth.split('-')[0], 10);
    const personalYear = calculatePersonalYearForBirthday(dateOfBirth, birthYear);
    snapshotToStore = {
      natal,
      mahadashas,
      personalYear,
    };
  }

  db.prepare(`
    INSERT INTO saved_charts (
      id, user_id, person_name, date_of_birth, time_of_birth, place_of_birth,
      calculation_version, chart_snapshot_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, '1.0', ?, ?, ?)
  `).run(
    chartId,
    userId,
    personName.trim(),
    dateOfBirth,
    timeOfBirth || null,
    placeOfBirth || null,
    JSON.stringify(snapshotToStore),
    nowIso,
    nowIso
  );

  res.status(201).json({
    success: true,
    message: 'Chart saved successfully.',
    chartId,
  });
});

/**
 * PUT /api/charts/:id
 * Renames or updates a saved chart.
 */
savedChartsRouter.put('/:id', requireAuth, (req: Request, res: Response): void => {
  const { personName, timeOfBirth, placeOfBirth } = req.body;
  const db = getDb();
  const userId = req.user!.id;
  const chartId = req.params.id;
  const nowIso = new Date().toISOString();

  const existing = db.prepare('SELECT id FROM saved_charts WHERE id = ? AND user_id = ?').get(chartId, userId);
  if (!existing) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Chart not found or unauthorized.' });
    return;
  }

  db.prepare(`
    UPDATE saved_charts
    SET person_name = COALESCE(?, person_name),
        time_of_birth = COALESCE(?, time_of_birth),
        place_of_birth = COALESCE(?, place_of_birth),
        updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(personName?.trim() || null, timeOfBirth || null, placeOfBirth || null, nowIso, chartId, userId);

  res.json({ success: true, message: 'Chart updated successfully.' });
});

/**
 * DELETE /api/charts/:id
 * Deletes a saved chart.
 */
savedChartsRouter.delete('/:id', requireAuth, (req: Request, res: Response): void => {
  const db = getDb();
  const userId = req.user!.id;
  const chartId = req.params.id;

  const result = db.prepare('DELETE FROM saved_charts WHERE id = ? AND user_id = ?').run(chartId, userId);
  if ((result.changes ?? 0) === 0) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Chart not found or unauthorized.' });
    return;
  }

  res.json({ success: true, message: 'Chart deleted successfully.' });
});

/**
 * POST /api/charts/compare
 * Compares two charts. Requires entitlement 'allow_comparison'.
 */
savedChartsRouter.post('/compare', requireAuth, requireEntitlement('allow_comparison'), (req: Request, res: Response): void => {
  const { chart1Id, chart2Id, directInput1, directInput2 } = req.body;
  const db = getDb();
  const userId = req.user!.id;

  let chart1Data: any;
  let chart2Data: any;

  if (chart1Id) {
    const c1 = db.prepare('SELECT * FROM saved_charts WHERE id = ? AND user_id = ?').get(chart1Id, userId) as any;
    if (!c1) {
      res.status(404).json({ error: 'NOT_FOUND', message: `Chart 1 (${chart1Id}) not found.` });
      return;
    }
    chart1Data = {
      personName: c1.person_name,
      dateOfBirth: c1.date_of_birth,
      natal: calculateNatalGrid({ fullName: c1.person_name, dateOfBirth: c1.date_of_birth }),
    };
  } else if (directInput1) {
    chart1Data = {
      personName: directInput1.personName,
      dateOfBirth: directInput1.dateOfBirth,
      natal: calculateNatalGrid({ fullName: directInput1.personName, dateOfBirth: directInput1.dateOfBirth }),
    };
  }

  if (chart2Id) {
    const c2 = db.prepare('SELECT * FROM saved_charts WHERE id = ? AND user_id = ?').get(chart2Id, userId) as any;
    if (!c2) {
      res.status(404).json({ error: 'NOT_FOUND', message: `Chart 2 (${chart2Id}) not found.` });
      return;
    }
    chart2Data = {
      personName: c2.person_name,
      dateOfBirth: c2.date_of_birth,
      natal: calculateNatalGrid({ fullName: c2.person_name, dateOfBirth: c2.date_of_birth }),
    };
  } else if (directInput2) {
    chart2Data = {
      personName: directInput2.personName,
      dateOfBirth: directInput2.dateOfBirth,
      natal: calculateNatalGrid({ fullName: directInput2.personName, dateOfBirth: directInput2.dateOfBirth }),
    };
  }

  if (!chart1Data || !chart2Data) {
    res.status(400).json({ error: 'INVALID_INPUT', message: 'Two charts or inputs must be provided for comparison.' });
    return;
  }

  // Calculate comparison metrics
  const c1Numbers = new Set(chart1Data.natal.finalNatalDigits.map((d: any) => d.value));
  const c2Numbers = new Set(chart2Data.natal.finalNatalDigits.map((d: any) => d.value));

  const commonNumbers = [...c1Numbers].filter((n) => c2Numbers.has(n));
  const chart1OnlyNumbers = [...c1Numbers].filter((n) => !c2Numbers.has(n));
  const chart2OnlyNumbers = [...c2Numbers].filter((n) => !c1Numbers.has(n));

  res.json({
    chart1: chart1Data,
    chart2: chart2Data,
    comparison: {
      isSameBasicNumber: chart1Data.natal.basicNumber === chart2Data.natal.basicNumber,
      isSameDestinyNumber: chart1Data.natal.destinyNumber === chart2Data.natal.destinyNumber,
      commonNumbers,
      chart1OnlyNumbers,
      chart2OnlyNumbers,
    },
  });
});
