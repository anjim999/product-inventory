const request = require("supertest");
const app = require("../server");
const db = require("../db");

// Mock email + OTP utils
jest.mock("../utils/mailer");
jest.mock("../utils/otp");

beforeAll(done => {
  db.serialize(() => {
    db.run("DELETE FROM users");
    db.run("DELETE FROM otps", () => done());
  });
});

// afterAll(done => db.close(done));

describe("AUTH API", () => {

  const TEST_EMAIL = "user@example.com";
  const TEST_PASSWORD = "secret123";
  const TEST_NAME = "Test User";
  const FIXED_OTP = "1234";

  // 1️⃣ REGISTER: Request OTP
  test("POST /api/auth/register-request-otp should generate OTP", async () => {
    const res = await request(app)
      .post("/api/auth/register-request-otp")
      .send({ email: TEST_EMAIL })
      .expect(200);

    expect(res.body.message).toMatch(/OTP generated/i);
  });

  // 2️⃣ REGISTER: Verify OTP + Create user
  test("POST /api/auth/register-verify should create user", async () => {
    // Insert OTP manually (mocking send email)
    await new Promise(resolve => {
      db.run(
        "INSERT INTO otps (email, code, purpose, expires_at, used) VALUES (?, ?, ?, ?, 0)",
        [TEST_EMAIL, FIXED_OTP, "REGISTER", new Date(Date.now() + 60000).toISOString()],
        resolve
      );
    });

    const res = await request(app)
      .post("/api/auth/register-verify")
      .send({
        name: TEST_NAME,
        email: TEST_EMAIL,
        otp: FIXED_OTP,
        password: TEST_PASSWORD
      })
      .expect(200);

    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe(TEST_EMAIL);
  });

  // 3️⃣ LOGIN: Valid credentials
  test("POST /api/auth/login should login successfully", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
      .expect(200);

    expect(res.body.message).toMatch(/login successful/i);
    expect(res.body).toHaveProperty("token");
  });

  // 4️⃣ LOGIN: Wrong password
  test("POST /api/auth/login should fail on wrong password", async () => {
    await request(app)
      .post("/api/auth/login")
      .send({
        email: TEST_EMAIL,
        password: "wrongpass"
      })
      .expect(400);
  });

  // 5️⃣ FORGOT PASSWORD - Request OTP
  test("POST /api/auth/forgot-password-request should return generic response", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password-request")
      .send({ email: TEST_EMAIL })
      .expect(200);

    expect(res.body.message).toMatch(/OTP has been sent/i);
  });

  // Insert reset OTP
  beforeAll(done => {
    db.run(
      "INSERT INTO otps (email, code, purpose, expires_at, used) VALUES (?, ?, ?, ?, 0)",
      [TEST_EMAIL, FIXED_OTP, "RESET", new Date(Date.now() + 60000).toISOString()],
      done
    );
  });

  // 6️⃣ FORGOT PASSWORD - Verify OTP + Reset
  test("POST /api/auth/forgot-password-verify should reset password", async () => {
    const NEW_PASS = "newpass123";

    const res = await request(app)
      .post("/api/auth/forgot-password-verify")
      .send({
        email: TEST_EMAIL,
        otp: FIXED_OTP,
        newPassword: NEW_PASS
      })
      .expect(200);

    expect(res.body.message).toMatch(/password reset successful/i);

    // Login with new password
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: TEST_EMAIL,
        password: NEW_PASS
      })
      .expect(200);

    expect(loginRes.body).toHaveProperty("token");
  });

});
