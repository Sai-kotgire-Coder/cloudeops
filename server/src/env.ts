// Loads .env into process.env before anything else runs. Must be the
// first import in index.ts (with zero imports of its own) -- ES module
// imports evaluate in dependency order, so a module with no dependencies
// that's imported first is guaranteed to finish before the next import
// (app.js, and everything it transitively imports) begins evaluating.
// Several modules read process.env at load time (the Sentry init, the
// nodemailer transporter), which would otherwise silently see undefined
// values in local dev. Vercel is unaffected either way -- it injects real
// env vars into process.env before the process starts, independent of
// dotenv entirely.
import dotenv from 'dotenv';
dotenv.config();
