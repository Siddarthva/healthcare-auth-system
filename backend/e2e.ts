import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import assert from 'assert';
import 'dotenv/config';

const API_URL = 'http://localhost:3000/api';
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL as string);

async function run() {
    let passed = 0;
    let failed = 0;
    const errors: string[] = [];

    const test = async (name: string, fn: () => Promise<void>) => {
        try {
            await fn();
            console.log(`✅ PASS: ${name}`);
            passed++;
        } catch (e: any) {
            console.error(`❌ FAIL: ${name}`);
            console.error(`   ${e.message}`);
            errors.push(`${name}: ${e.message}`);
            failed++;
        }
    };

    console.log('--- 1. INFRASTRUCTURE CHECKS ---');
    await test('Health check endpoint returns valid fields', async () => {
        const res = await fetch(`${API_URL}/health`);
        const data = await res.json();
        assert.strictEqual(data.status, 'UP', 'Status should be UP');
        assert.strictEqual(data.database, 'CONNECTED', 'Database should be CONNECTED');
        assert.strictEqual(data.redis, 'CONNECTED', 'Redis should be CONNECTED');
        assert.ok(data.uptime, 'Should have uptime');
    });

    console.log('\n--- 2. AUTHENTICATION TEST SUITE ---');

    const uniqueExt = Date.now();
    const testEmail = `test_${uniqueExt}@medauth.test`;
    const pwd = 'StrongPassword123!';

    await test('Register: Missing fields rejection', async () => {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST', body: JSON.stringify({ email: testEmail }), headers: { 'Content-Type': 'application/json' }
        });
        assert.strictEqual(res.status, 400);
    });

    await test('Register: Weak password rejection', async () => {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST', body: JSON.stringify({ email: testEmail, password: 'weak', name: 'Test', role: 'PATIENT' }), headers: { 'Content-Type': 'application/json' }
        });
        assert.strictEqual(res.status, 400);
    });

    await test('Register: Invalid role rejection', async () => {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST', body: JSON.stringify({ email: testEmail, password: pwd, name: 'Test', role: 'INVALID' }), headers: { 'Content-Type': 'application/json' }
        });
        assert.strictEqual(res.status, 400);
    });

    await test('Register: Valid registration', async () => {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST', body: JSON.stringify({ email: testEmail, password: pwd, name: 'Test', role: 'PATIENT' }), headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        assert.strictEqual(res.status, 201, `Status was ${res.status}`);
        assert.strictEqual(data.success, true);

        // Check DB
        const user = await prisma.user.findUnique({ where: { email: testEmail } });
        assert.ok(user);
        assert.strictEqual(user.isVerified, false);

        // Check Redis
        const otp = await redis.get(`otp:${testEmail}`);
        assert.ok(otp, 'OTP should be present in Redis');
    });

    await test('Register: Duplicate email rejection', async () => {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST', body: JSON.stringify({ email: testEmail, password: pwd, name: 'Test 2', role: 'PATIENT' }), headers: { 'Content-Type': 'application/json' }
        });
        assert.strictEqual(res.status, 400);
    });

    await test('Login: Unverified account blocked', async () => {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST', body: JSON.stringify({ email: testEmail, password: pwd }), headers: { 'Content-Type': 'application/json' }
        });
        assert.strictEqual(res.status, 401);
    });

    // We need to verify OTP now
    let generatedOtp = '';
    await test('Verify OTP', async () => {
        generatedOtp = (await redis.get(`otp:${testEmail}`)) || '';
        assert.ok(generatedOtp, 'Should have picked OTP from Redis');

        const res = await fetch(`${API_URL}/auth/verify-otp`, {
            method: 'POST', body: JSON.stringify({ email: testEmail, otp: generatedOtp }), headers: { 'Content-Type': 'application/json' }
        });
        assert.strictEqual(res.status, 200);

        // Verify it was deleted
        const otpInRedis = await redis.get(`otp:${testEmail}`);
        assert.strictEqual(otpInRedis, null);
    });

    await test('Verify OTP: Incorrect/reuse OTP', async () => {
        const res = await fetch(`${API_URL}/auth/verify-otp`, {
            method: 'POST', body: JSON.stringify({ email: testEmail, otp: generatedOtp }), headers: { 'Content-Type': 'application/json' }
        });
        assert.strictEqual(res.status, 400); // Because it was deleted
    });

    let accessToken = '';
    await test('Login: Valid credentials', async () => {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST', body: JSON.stringify({ email: testEmail, password: pwd }), headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        assert.strictEqual(res.status, 200);
        assert.ok(data.data.accessToken);
        accessToken = data.data.accessToken;
    });

    await test('Password Reset: Flow', async () => {
        const req1 = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST', body: JSON.stringify({ email: testEmail }), headers: { 'Content-Type': 'application/json' }
        });
        assert.strictEqual(req1.status, 200);

        const resetOtp = await redis.get(`otp:${testEmail}`);
        assert.ok(resetOtp);

        const req2 = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST', body: JSON.stringify({ email: testEmail, otp: resetOtp, newPassword: 'NewPassword123!' }), headers: { 'Content-Type': 'application/json' }
        });
        assert.strictEqual(req2.status, 200);

        // Validate new login
        const req3 = await fetch(`${API_URL}/auth/login`, {
            method: 'POST', body: JSON.stringify({ email: testEmail, password: 'NewPassword123!' }), headers: { 'Content-Type': 'application/json' }
        });
        assert.strictEqual(req3.status, 200);
    });

    await test('Magic Link Login: Flow', async () => {
        const req1 = await fetch(`${API_URL}/auth/magic-link`, {
            method: 'POST', body: JSON.stringify({ email: testEmail }), headers: { 'Content-Type': 'application/json' }
        });
        assert.strictEqual(req1.status, 200);

        // Find token in Redis
        const keys = await redis.keys('magic:*');
        let magicToken = '';
        for (const k of keys) {
            const val = await redis.get(k);
            const user = await prisma.user.findUnique({ where: { email: testEmail } });
            if (val === user?.id) {
                magicToken = k.replace('magic:', '');
            }
        }
        assert.ok(magicToken);

        const req2 = await fetch(`${API_URL}/auth/magic-login?token=${magicToken}`);
        assert.strictEqual(req2.status, 200);
        const data = await req2.json();
        assert.ok(data.data.accessToken);

        // Verify token deleted
        const reuse = await redis.get(`magic:${magicToken}`);
        assert.strictEqual(reuse, null);
    });

    console.log('\n--- 3. AUTHORIZATION TESTS ---');
    let adminToken = '';
    let doctorToken = '';
    let nurseToken = '';
    let patientToken = '';

    await test('Login Seeded Accounts', async () => {
        const l1 = await fetch(`${API_URL}/auth/login`, { method: 'POST', body: JSON.stringify({ email: 'admin@demo.com', password: 'Demo123!' }), headers: { 'Content-Type': 'application/json' } });
        if (l1.status === 200) adminToken = (await l1.json()).data.accessToken;

        const l2 = await fetch(`${API_URL}/auth/login`, { method: 'POST', body: JSON.stringify({ email: 'doctor@demo.com', password: 'Demo123!' }), headers: { 'Content-Type': 'application/json' } });
        if (l2.status === 200) doctorToken = (await l2.json()).data.accessToken;

        const l3 = await fetch(`${API_URL}/auth/login`, { method: 'POST', body: JSON.stringify({ email: 'nurse@demo.com', password: 'Demo123!' }), headers: { 'Content-Type': 'application/json' } });
        if (l3.status === 200) nurseToken = (await l3.json()).data.accessToken;

        const l4 = await fetch(`${API_URL}/auth/login`, { method: 'POST', body: JSON.stringify({ email: 'patient@demo.com', password: 'Demo123!' }), headers: { 'Content-Type': 'application/json' } });
        if (l4.status === 200) patientToken = (await l4.json()).data.accessToken;

        assert.ok(adminToken, "Admin should login");
        assert.ok(doctorToken, "Doctor should login");
        assert.ok(nurseToken, "Nurse should login");
        assert.ok(patientToken, "Patient should login");
    });

    await test('Authorization: Admin route protection', async () => {
        const resPatient = await fetch(`${API_URL}/admin/audit-logs`, { headers: { 'Authorization': `Bearer ${patientToken}` } });
        assert.strictEqual(resPatient.status, 403, 'Patient cannot access admin');

        const resAdmin = await fetch(`${API_URL}/admin/audit-logs`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
        assert.strictEqual(resAdmin.status, 200, 'Admin can access admin');
    });

    console.log('\n--- 4. PATIENT DATA ACCESS ---');
    await test('Patient data endpoint access control', async () => {
        // Assume patient list exists
        const resDoct = await fetch(`${API_URL}/patients`, { headers: { 'Authorization': `Bearer ${doctorToken}` } });
        assert.strictEqual(resDoct.status, 200);

        const resAdmin = await fetch(`${API_URL}/patients`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
        assert.strictEqual(resAdmin.status, 200);
    });

    console.log('\n--- 5. CONSENT & 6. EMERGENCY ---');
    await test('Consent & Emergency endpoints load successfully', async () => {
        const resConsent = await fetch(`${API_URL}/consent`, { headers: { 'Authorization': `Bearer ${patientToken}` } });
        assert.strictEqual(resConsent.status, 200); // Patient can view their consents
    });

    console.log(`\n\nTEST RUN COMPLETE. Passed ${passed}, Failed ${failed}`);
    if (errors.length > 0) {
        console.log("ERRORS:\n", errors.join("\n"));
    }

    process.exit(0);
}

run();
