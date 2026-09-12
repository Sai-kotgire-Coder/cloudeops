import './env.js';
import app from './app.js';
import { verifyEmailConfig } from './lib/emailService.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Verify email configuration
  await verifyEmailConfig();
});
