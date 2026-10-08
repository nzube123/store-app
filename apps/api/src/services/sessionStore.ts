import type { PrismaClient, Prisma } from '@shop/database';
import session from 'express-session';
import type { SessionData } from 'express-session';

export class PrismaSessionStore extends session.Store {
  constructor(private readonly database: PrismaClient) {
    super();
  }

  get(sid: string, callback: (error: unknown, session?: SessionData | null) => void): void {
    void this.database.session.findUnique({ where: { sid } })
      .then((stored) => {
        if (!stored || stored.expiresAt <= new Date()) {
          if (stored) void this.database.session.delete({ where: { sid } }).catch(() => undefined);
          callback(null, null);
          return;
        }
        callback(null, stored.data as unknown as SessionData);
      })
      .catch((error: unknown) => callback(error));
  }

  set(sid: string, value: SessionData, callback?: (error?: unknown) => void): void {
    const passportUser: unknown = (value as SessionData & { passport?: { user?: unknown } }).passport?.user;
    const userId = typeof passportUser === 'string' ? passportUser : null;
    const expiresAt = value.cookie.expires ? new Date(value.cookie.expires) : new Date(Date.now() + 86_400_000);
    void this.database.session.upsert({
      where: { sid },
      create: { sid, userId, data: value as unknown as Prisma.InputJsonValue, expiresAt },
      update: { userId, data: value as unknown as Prisma.InputJsonValue, expiresAt },
    }).then(() => callback?.()).catch((error: unknown) => callback?.(error));
  }

  override touch(sid: string, value: SessionData, callback?: (error?: unknown) => void): void {
    const expiresAt = value.cookie.expires ? new Date(value.cookie.expires) : new Date(Date.now() + 86_400_000);
    void this.database.session.updateMany({ where: { sid }, data: { expiresAt } })
      .then(() => callback?.()).catch((error: unknown) => callback?.(error));
  }

  destroy(sid: string, callback?: (error?: unknown) => void): void {
    void this.database.session.deleteMany({ where: { sid } })
      .then(() => callback?.()).catch((error: unknown) => callback?.(error));
  }
}
