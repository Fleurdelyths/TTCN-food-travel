import "server-only";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";

export type UserRole = "USER" | "ADMIN";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
}

const COOKIE_NAME = "ttcn_auth_token";
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET chưa được cấu hình hoặc có ít hơn 32 ký tự.");
  }
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: Pick<AuthUser, "id">): string {
  return jwt.sign({ userId: user.id }, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as { userId?: unknown };
    if (typeof payload.userId !== "number") return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  // Đọc lại role từ database để quyền thay đổi có hiệu lực ngay lập tức.
  const [rows]: any = await pool.execute(
    "SELECT id, name, email, role, avatar FROM users WHERE id = ? LIMIT 1",
    [payload.userId],
  );

  if (!rows || rows.length === 0) return null;
  return rows[0] as AuthUser;
}

export async function requireAdmin(): Promise<AuthUser | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
