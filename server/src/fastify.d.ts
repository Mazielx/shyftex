import type { JwtPayload } from './middleware/auth.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
    user: JwtPayload;
  }
}
