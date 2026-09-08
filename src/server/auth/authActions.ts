'use server';

import prisma from '@/lib/dbClient/dbClient';
import { hashPassword, verifyPassword, createSession, destroySession, getCurrentUser } from '@/lib/auth';

export const loginAction = async (data: { email: string; password: string }) => {
  try {
    const email = data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    const isValid = verifyPassword(data.password, user.password);
    if (!isValid) {
      return { success: false, error: 'Invalid email or password' };
    }

    await createSession(user.id);

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Login failed' };
  }
};

export const registerAction = async (data: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) => {
  try {
    const email = data.email.toLowerCase().trim();

    if (!data.name || !email || !data.password) {
      return { success: false, error: 'All fields are required' };
    }

    if (data.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return { success: false, error: 'An account with this email already exists' };
    }

    const hashedPassword = hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email,
        password: hashedPassword,
        role: data.role || 'ADMIN',
      },
    });

    await createSession(user.id);

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Registration failed' };
  }
};

export const logoutAction = async () => {
  try {
    await destroySession();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Logout failed' };
  }
};

export const getAuthUserAction = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) return { user: null };

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  } catch {
    return { user: null };
  }
};
