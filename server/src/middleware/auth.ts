import type { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError, formatError } from '../utils/errors.js';

export interface JwtPayload {
  id: string;
  email: string;
  name: string;
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const token = extractToken(request);
    if (!token) {
      throw new UnauthorizedError('Missing authorization token');
    }

    const decoded = request.server.jwt.verify<JwtPayload>(token);
    const augmentedRequest = request as FastifyRequest & { userId: string; user: JwtPayload };
    augmentedRequest.userId = decoded.id;
    augmentedRequest.user = decoded;
  } catch (error) {
    const err = error instanceof UnauthorizedError ? error : new UnauthorizedError('Invalid or expired token');
    const response = formatError(err);
    await reply.status(401).send(response);
  }
}

function extractToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1] ?? null;
}
