import { app } from './app.js';
import { prisma } from '@shop/database';

const port = Number(process.env.PORT ?? 5000);

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`API server running on port ${port}`);
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
