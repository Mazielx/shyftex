import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { db } from '../services/database.js';
import { formatResponse, formatError, ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors.js';
import type { JwtPayload } from '../middleware/auth.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, schemas } from '../middleware/validation.js';

export default async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/v1/auth/register', {
    preHandler: [validateBody(schemas.register)],
  }, async (request, reply) => {
    try {
      const { email, password, name } = request.body as {
        email: string;
        password: string;
        name: string;
      };

      const existing = await db.users.findByEmail(email);
      if (existing) {
        throw new ConflictError('An account with this email already exists');
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await db.users.create({
        id: uuid(),
        email,
        passwordHash,
        name,
      });

      const tokenPayload: JwtPayload = { id: user.id, email: user.email, name: user.name };
      const token = app.jwt.sign(tokenPayload, { expiresIn: '24h' });
      const refreshToken = app.jwt.sign(tokenPayload, { expiresIn: '7d' });

      return reply.status(201).send(formatResponse({
        user: { id: user.id, email: user.email, name: user.name },
        token,
        refreshToken,
      }));
    } catch (error) {
      if (error instanceof ConflictError) {
        return reply.status(409).send(formatError(error));
      }
      return reply.status(500).send(formatError(error));
    }
  });

  app.post('/api/v1/auth/login', {
    preHandler: [validateBody(schemas.login)],
  }, async (request, reply) => {
    try {
      const { email, password } = request.body as { email: string; password: string };

      const user = await db.users.findByEmail(email);
      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const tokenPayload: JwtPayload = { id: user.id, email: user.email, name: user.name };
      const token = app.jwt.sign(tokenPayload, { expiresIn: '24h' });
      const refreshToken = app.jwt.sign(tokenPayload, { expiresIn: '7d' });

      return reply.send(formatResponse({
        user: { id: user.id, email: user.email, name: user.name },
        token,
        refreshToken,
      }));
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return reply.status(401).send(formatError(error));
      }
      return reply.status(500).send(formatError(error));
    }
  });

  app.post('/api/v1/auth/refresh', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    try {
      const user = await db.users.findById(request.userId);
      if (!user) {
        throw new NotFoundError('User', request.userId);
      }

      const tokenPayload: JwtPayload = { id: user.id, email: user.email, name: user.name };
      const token = app.jwt.sign(tokenPayload, { expiresIn: '24h' });
      const refreshToken = app.jwt.sign(tokenPayload, { expiresIn: '7d' });

      return reply.send(formatResponse({ token, refreshToken }));
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.status(404).send(formatError(error));
      }
      return reply.status(500).send(formatError(error));
    }
  });

  app.get('/api/v1/auth/me', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    try {
      const user = await db.users.findById(request.userId);
      if (!user) {
        throw new NotFoundError('User', request.userId);
      }

      return reply.send(formatResponse({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      }));
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.status(404).send(formatError(error));
      }
      return reply.status(500).send(formatError(error));
    }
  });
}
