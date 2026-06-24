const crypto = require("crypto");
const {
  calculatePlanEndDate,
  DEFAULT_SUBSCRIPTION_PLANS,
  getMonthKey,
  verifyRazorpaySignature,
} = require("../../services/subscription.service");

describe("subscription service helpers", () => {
  test("getMonthKey returns YYYY-MM", () => {
    expect(getMonthKey(new Date("2026-05-28T12:00:00.000Z"))).toBe("2026-05");
  });

  test("calculatePlanEndDate supports monthly and yearly validity", () => {
    expect(
      calculatePlanEndDate({ duration: 6, durationType: "months" }, new Date("2026-05-01T00:00:00.000Z"))
        .toISOString()
        .slice(0, 10)
    ).toBe("2026-11-01");

    expect(
      calculatePlanEndDate({ duration: 1, durationType: "year" }, new Date("2026-05-01T00:00:00.000Z"))
        .toISOString()
        .slice(0, 10)
    ).toBe("2027-05-01");
  });

  test("verifyRazorpaySignature validates HMAC from backend secret", () => {
    const secret = "test_secret";
    const orderId = "order_123";
    const paymentId = "pay_123";
    const signature = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");

    expect(verifyRazorpaySignature({ orderId, paymentId, signature, secret })).toBe(true);
    expect(verifyRazorpaySignature({ orderId, paymentId, signature: "bad", secret })).toBe(false);
  });

  test("default plans match production recruiter pricing", () => {
    expect(DEFAULT_SUBSCRIPTION_PLANS).toEqual([
      expect.objectContaining({ price: 599, jobPostLimit: 10, duration: 1, durationType: "month", isUnlimited: false }),
      expect.objectContaining({ price: 1199, jobPostLimit: 50, duration: 1, durationType: "month", isUnlimited: false }),
      expect.objectContaining({ price: 4999, duration: 6, durationType: "months", isUnlimited: true }),
      expect.objectContaining({ price: 12999, duration: 1, durationType: "year", isUnlimited: true }),
    ]);
  });
});
