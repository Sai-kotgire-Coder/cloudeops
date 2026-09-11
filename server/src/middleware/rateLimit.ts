import rateLimit from 'express-rate-limit';

// For endpoints that check a secret (password, OTP code) -- throttles
// brute-force guessing without meaningfully affecting a legitimate user
// who mistypes a password or code a few times.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in a few minutes.' }
});

// For endpoints that send an email (registration, resend OTP, forgot
// password) -- throttles email-bombing a target address, which is a
// separate abuse vector from credential guessing.
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});
