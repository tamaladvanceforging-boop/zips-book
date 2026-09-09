import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import prisma from '@/lib/dbClient/dbClient';

const SESSION_COOKIE_NAME = 'zips_session_token';
const SESSION_DURATION_DAYS = 30;

export const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
};

export const verifyPassword = (password: string, storedHash: string): boolean => {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
};

export const createSession = async (userId: string) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return session;
};

export const destroySession = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    try {
      await prisma.session.deleteMany({ where: { token } });
    } catch {
      // Ignore if already deleted
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
};

export const getCurrentUser = async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) return null;

    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            companies: {
              include: {
                company: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }

    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } });
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }

    return session.user;
  } catch {
    return null;
  }
};
