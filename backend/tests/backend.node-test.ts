import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.ts';
import { getDb } from '../src/database/connection.ts';
import { OtpService } from '../src/modules/auth/otpService.ts';
import { verifyPassword, generateSessionToken } from '../src/utils/security.ts';
import { testRequest } from './testClient.ts';

let app: any;

before(() => {
  getDb();
  app = createApp();
});

describe('1. Predefined Administrator Account & Authentication', () => {
  it('seeds Super Administrator with email pratham.garg2801@gmail.com', () => {
    const db = getDb();
    const admin = db.prepare('SELECT * FROM users WHERE email = ?').get('pratham.garg2801@gmail.com') as any;
    assert.ok(admin);
    assert.equal(admin.role, 'super_admin');
    assert.equal(admin.status, 'active');
    assert.ok(admin.password_hash);
    assert.equal(verifyPassword('AdminAstro2026!Secure', admin.password_hash), true);
  });

  it('authenticates Super Admin via /api/auth/admin/login with correct password', async () => {
    const res = await testRequest(app, 'POST', '/api/auth/admin/login', {
      body: {
        email: 'pratham.garg2801@gmail.com',
        password: 'AdminAstro2026!Secure',
        deviceInfo: 'Admin Test Terminal',
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.sessionToken);
    assert.equal(res.body.user.role, 'super_admin');
  });

  it('rejects Admin login with invalid password', async () => {
    const res = await testRequest(app, 'POST', '/api/auth/admin/login', {
      body: {
        email: 'pratham.garg2801@gmail.com',
        password: 'WrongPassword!',
      },
    });

    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'INVALID_CREDENTIALS');
  });
});

describe('2. OTP User Authentication & Registration', () => {
  const testEmail = `user_test_${Date.now()}@example.com`;
  let devCode: string;

  it('generates an OTP for a user email', async () => {
    const res = await testRequest(app, 'POST', '/api/auth/otp/request', {
      body: { identifier: testEmail, channel: 'email' },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.devCode);
    devCode = res.body.devCode;
  });

  it('fails verification when incorrect OTP is supplied', async () => {
    const res = await testRequest(app, 'POST', '/api/auth/otp/verify', {
      body: { identifier: testEmail, code: '000000' },
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'OTP_VERIFICATION_FAILED');
  });

  it('verifies correct OTP, auto-creates user and assigns Free Starter trial', async () => {
    const res = await testRequest(app, 'POST', '/api/auth/otp/verify', {
      body: {
        identifier: testEmail,
        code: devCode,
        fullName: 'Jane Numerologist',
        deviceInfo: 'Laptop A Chrome',
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.sessionToken);
    assert.equal(res.body.user.fullName, 'Jane Numerologist');
    assert.ok(res.body.subscription);
    assert.ok(res.body.subscription.planSlug);
  });
});

describe('3. Single-Device Login Enforcement (Section 4.2)', () => {
  const testUserEmail = `single_device_${Date.now()}@example.com`;
  let sessionTokenLaptopA: string;
  let sessionTokenMobileB: string;

  it('enforces single-device login: Laptop A is revoked when Mobile B logs in', async () => {
    // 1. Request OTP for Laptop
    const req1 = await OtpService.requestOtp(testUserEmail, 'email');
    assert.ok(req1.devCode);

    // 2. User logs in on Laptop A
    const loginLaptop = await testRequest(app, 'POST', '/api/auth/otp/verify', {
      body: {
        identifier: testUserEmail,
        code: req1.devCode,
        deviceInfo: 'Laptop A',
      },
    });
    sessionTokenLaptopA = loginLaptop.body.sessionToken;
    assert.ok(sessionTokenLaptopA);

    // Verify Laptop A can access /api/user/profile
    const checkLaptopA1 = await testRequest(app, 'GET', '/api/user/profile', {
      headers: { Authorization: `Bearer ${sessionTokenLaptopA}` },
    });
    assert.equal(checkLaptopA1.status, 200);

    // 3. User now logs in on Mobile B
    const req2 = await OtpService.requestOtp(testUserEmail, 'email');
    assert.ok(req2.devCode);
    const loginMobile = await testRequest(app, 'POST', '/api/auth/otp/verify', {
      body: {
        identifier: testUserEmail,
        code: req2.devCode,
        deviceInfo: 'Mobile B',
      },
    });
    sessionTokenMobileB = loginMobile.body.sessionToken;
    assert.ok(sessionTokenMobileB);

    // 4. Mobile B must be active
    const checkMobileB = await testRequest(app, 'GET', '/api/user/profile', {
      headers: { Authorization: `Bearer ${sessionTokenMobileB}` },
    });
    assert.equal(checkMobileB.status, 200);

    // 5. Laptop A must be terminated with SESSION_REVOKED
    const checkLaptopA2 = await testRequest(app, 'GET', '/api/user/profile', {
      headers: { Authorization: `Bearer ${sessionTokenLaptopA}` },
    });
    assert.equal(checkLaptopA2.status, 401);
    assert.equal(checkLaptopA2.body.error, 'SESSION_REVOKED');
  });
});

describe('4. Automatic Session Expiry (30 Days Strict - Section 4.3)', () => {
  it('rejects sessions that have exceeded the 30-day lifetime', async () => {
    const db = getDb();
    const admin = db.prepare('SELECT id FROM users WHERE email = ?').get('pratham.garg2801@gmail.com') as any;

    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    const expiredDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    const testExpiredToken = generateSessionToken();

    db.prepare(`
      INSERT INTO auth_sessions (id, user_id, session_token, is_active, created_at, expires_at)
      VALUES (?, ?, ?, 1, ?, ?)
    `).run(`expired_id_${Date.now()}`, admin.id, testExpiredToken, thirtyOneDaysAgo, expiredDate);

    const res = await testRequest(app, 'GET', '/api/user/profile', {
      headers: { Authorization: `Bearer ${testExpiredToken}` },
    });

    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'SESSION_EXPIRED');
  });
});

describe('5. Numerology Calculations & Saved Charts via API', () => {
  let userToken: string;

  before(async () => {
    const email = `chart_tester_${Date.now()}@example.com`;
    const req = await OtpService.requestOtp(email, 'email');
    const login = await testRequest(app, 'POST', '/api/auth/otp/verify', {
      body: { identifier: email, code: req.devCode, fullName: 'Chart Tester' },
    });
    userToken = login.body.sessionToken;
  });

  it('POST /api/numerology/calculate calculates full baseline DOB 1994-08-13', async () => {
    const res = await testRequest(app, 'POST', '/api/numerology/calculate', {
      body: {
        fullName: 'Pratham Master',
        dateOfBirth: '1994-08-13',
        targetDate: '2026-08-13',
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.natal.basicNumber, 4);
    assert.equal(res.body.data.natal.destinyNumber, 8);
    assert.equal(res.body.data.personalYear.personalYearNumber, 5);
    assert.equal(res.body.data.mahadasha.active.number, 9);
    assert.equal(res.body.data.dayLord.dayLordNumber, 8);
  });

  it('saves a chart and retrieves it', async () => {
    const saveRes = await testRequest(app, 'POST', '/api/charts', {
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        personName: 'Self Chart',
        dateOfBirth: '1994-08-13',
      },
    });

    assert.equal(saveRes.status, 201);
    assert.ok(saveRes.body.chartId);

    const listRes = await testRequest(app, 'GET', '/api/charts', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.equal(listRes.status, 200);
    assert.ok(listRes.body.charts.length >= 1);
    assert.equal(listRes.body.charts[0].person_name, 'Self Chart');
  });

  it('upgrades subscription to Pro and verifies entitlement unlock for 100-Year Timeline', async () => {
    const upgRes = await testRequest(app, 'POST', '/api/subscriptions/upgrade', {
      headers: { Authorization: `Bearer ${userToken}` },
      body: { planSlug: 'pro-monthly' },
    });

    assert.equal(upgRes.status, 200);
    assert.equal(upgRes.body.subscription.planSlug, 'pro-monthly');
    assert.equal(upgRes.body.subscription.allow100YearTimeline, true);

    // Timeline endpoint now succeeds for user
    const timelineRes = await testRequest(app, 'POST', '/api/numerology/timeline', {
      headers: { Authorization: `Bearer ${userToken}` },
      body: { dateOfBirth: '1994-08-13' },
    });

    assert.equal(timelineRes.status, 200);
    assert.equal(timelineRes.body.timeline.timelineYears.length, 100);
  });
});
