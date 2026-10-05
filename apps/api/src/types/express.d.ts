import type { UserDto } from '@shop/shared';
import 'express-session';

declare global {
  namespace Express {
    interface User extends UserDto {
      id: UserDto['id'];
      email: UserDto['email'];
      name: UserDto['name'];
      image: UserDto['image'];
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    oauthState?: string;
  }
}

export {};
