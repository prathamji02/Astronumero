import { describe, it, before, after } from 'node:test';
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

  it('allows Admin to register a new paid client via POST /api/admin/users/create', async () => {
    // 1. Login as Admin
    const adminLogin = await testRequest(app, 'POST', '/api/auth/admin/login', {
      body: {
        email: 'pratham.garg2801@gmail.com',
        password: 'AdminAstro2026!Secure',
      },
    });
    assert.equal(adminLogin.status, 200);
    const adminToken = adminLogin.body.sessionToken;

    // 2. Register new paid client
    const clientEmail = `paid_client_${Date.now()}@example.com`;
    const regRes = await testRequest(app, 'POST', '/api/admin/users/create', {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        fullName: 'Rohan Sharma',
        email: clientEmail,
        planSlug: 'pro-monthly',
        durationDays: 30,
        paymentNote: 'Paid via UPI ref #998877',
      },
    });

    assert.equal(regRes.status, 200);
    assert.equal(regRes.body.success, true);
    assert.equal(regRes.body.user.fullName, 'Rohan Sharma');
    assert.equal(regRes.body.user.email, clientEmail);
    assert.equal(regRes.body.user.planName, 'Numerology Pro Monthly');

    // 3. Register existing client again - MUST return 400 error USER_EXISTS
    const reRegRes = await testRequest(app, 'POST', '/api/admin/users/create', {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        fullName: 'Rohan Sharma Duplicate',
        email: clientEmail,
        planSlug: 'premium-annual',
        durationDays: 365,
        paymentNote: 'Renewed Annual Plan',
      },
    });

    assert.equal(reRegRes.status, 400);
    assert.equal(reRegRes.body.error, 'USER_EXISTS');
    assert.ok(reRegRes.body.message.includes('already registered'));

    // 4. Verify all registered users are listed in User Accounts Management
    const usersListRes = await testRequest(app, 'GET', '/api/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(usersListRes.status, 200);
    assert.ok(Array.isArray(usersListRes.body.users));
    const foundUser = usersListRes.body.users.find((u: any) => u.email === clientEmail);
    assert.ok(foundUser);
    assert.equal(foundUser.full_name, 'Rohan Sharma');
    assert.equal(foundUser.current_plan_name, 'Numerology Pro Monthly');

    // 5. Verify Active OTPs feed endpoint
    const otpsRes = await testRequest(app, 'GET', '/api/admin/active-otps', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(otpsRes.status, 200);
    assert.ok(Array.isArray(otpsRes.body.otps));
    assert.ok(otpsRes.body.otps.length > 0);
  });
});

after(() => {
  const db = getDb();
  db.exec("DELETE FROM users WHERE email LIKE '%example.com%' OR email LIKE '%test%'");
  db.exec("DELETE FROM user_subscriptions WHERE user_id NOT IN (SELECT id FROM users)");
  db.exec("DELETE FROM auth_sessions WHERE user_id NOT IN (SELECT id FROM users)");
  db.exec("DELETE FROM user_profiles WHERE user_id NOT IN (SELECT id FROM users)");
  db.exec("DELETE FROM saved_charts WHERE user_id NOT IN (SELECT id FROM users)");
  db.exec("DELETE FROM otp_codes WHERE identifier LIKE '%example.com%' OR identifier LIKE '%test%'");
  db.exec("DELETE FROM sent_emails WHERE recipient_email LIKE '%example.com%' OR recipient_email LIKE '%test%'");
});
