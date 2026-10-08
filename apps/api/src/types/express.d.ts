import type { UserDto } from '@shop/shared';
import 'express-session';

declare global {
  namespace Express {
    interface User extends UserDto {}
  }
}

declare module 'express-session' {
  interface SessionData {
    oauthState?: string;
  }
}

export {};
