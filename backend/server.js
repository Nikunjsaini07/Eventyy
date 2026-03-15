import app from './src/app.js';
import { env } from './src/config/env.js';
import { prisma } from './src/config/prisma.js';
import { logger } from './src/config/logger.js';

const server = app.listen(env.port, () => {
  logger.info(`Server listening on port ${env.port}`);
});

const gracefulShutdown = async () => {
  logger.info('Received shutdown signal');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
