import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "cinebook_jwt_super_secure_secret_key_2026_xyz_production";
export const AUTH_COOKIE_NAME = "cinebook_token";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: "USER" | "ADMIN";
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signJwtToken(user: SessionUser): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyJwtToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      sub: string;
      email: string;
      fullName: string;
      role: "USER" | "ADMIN";
    };
    return {
      id: decoded.sub,
      email: decoded.email,
      fullName: decoded.fullName,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

/**
 * Extracts the session user from incoming server cookies or Authorization header.
 */
export async function getSessionUser(req?: NextRequest): Promise<SessionUser | null> {
  let token: string | undefined;

  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    }
  } else {
    const cookieStore = cookies();
    token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  }

  if (!token) return null;
  return verifyJwtToken(token);
}

/**
 * Enforces authenticated session; returns user or throws response.
 */
export async function requireAuth(req?: NextRequest): Promise<SessionUser> {
  const user = await getSessionUser(req);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

/**
 * Enforces ADMIN role; returns user or throws response.
 */
export async function requireAdmin(req?: NextRequest): Promise<SessionUser> {
  const user = await requireAuth(req);
  if (user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}
