import { createApp } from './app.ts';
import { env } from './config/environment.ts';
import { getDb } from './database/connection.ts';

async function bootstrap() {
  console.log('[BOOTSTRAP] Initializing database schema and security policies...');
  // Force DB initialization and super admin seeding
  getDb();

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Astro Premium Numerology Backend Running on port ${env.PORT}`);
    console.log(`📡 API Base: ${env.API_BASE_URL}`);
    console.log(`🔐 Single-Device Login & 30-Day Expiry Enforced`);
    console.log(`👑 Predefined Super Admin: pratham.garg2801@gmail.com`);
    console.log(`======================================================\n`);
  });
}

bootstrap().catch((err) => {
  console.error('[FATAL BOOTSTRAP ERROR]', err);
  process.exit(1);
});
