import type { JwtPayload } from './middleware/auth.js';

/**
 * Type the decoded JWT payload for @fastify/jwt.
 *
 * Augmenting `FastifyJWT` is the supported way to narrow the token payload.
 * Re-declaring `user` on `FastifyRequest` here would merge with the declaration
 * @fastify/jwt already owns and collapse both into a union, so `request.user`
 * would stop being assignable to `JwtPayload`.
 */
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by `authenticate()` after a successful token verification. */
    userId: string;
  }
}
