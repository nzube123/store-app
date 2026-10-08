import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from '@shop/database';

const server = app.listen(env.port, () => {
  console.info(`Cedar & Loom API listening on port ${env.port}`);
});

async function shutdown(signal: string): Promise<void> {
  console.info(`${signal} received; shutting down gracefully.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
