import { config } from './config';
import app from './app';
import { registerProcessHandlers } from './lib/process-handlers';
import { prisma } from './lib/prisma';
import { startJobs } from './lib/jobs';

registerProcessHandlers();

const server = app.listen(config.PORT, (error) => {
  if (error) {
    console.error(`Port ${config.PORT} açıla bilmədi: ${error.message}`);
    process.exit(1);
  }
  console.log(`Seyyar API: http://localhost:${config.PORT} (${config.NODE_ENV})`);
});

// Background jobs: expire unanswered requests, delete old tokens
const stopJobs = startJobs();

let shuttingDown = false;

function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) return;
  shuttingDown = true;
  stopJobs();
  console.log(`${signal} alındı — yeni request qəbul edilmir, açıq request-lər bitirilir...`);

  const forceExit = setTimeout(() => {
    console.error('10 saniyədə bitmədi — məcburi çıxış');
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  server.close(async () => {
    await prisma.$disconnect();
    console.log('Server və baza bağlantısı bağlandı. Çıxış.');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
