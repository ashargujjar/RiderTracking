import rateLimit from "express-rate-limit";

// Blunts brute-force/credential-stuffing attempts against the login routes —
// client/rider passwords are stored in plaintext (see model/client.model.ts),
// so throttling repeated guesses matters more here than elsewhere in the API.
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Try again later." },
});
