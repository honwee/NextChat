/**
 * JWT 轻量工具（无数据库依赖）
 * 仅提供 Token 的生成、验证、解码与提取
 * 注意：会话与数据库相关逻辑请使用 auth.ts
 */

import jwt from "jsonwebtoken";

// JWT 配置
const JWT_SECRET =
  process.env.JWT_SECRET || "LNqQ--H5H9YPD3dleGuGp01yqudTjSuK6_GcduIR0-A";
const JWT_EXPIRES_IN = "7d";

export interface JWTPayload {
  userId: string;
  feishuUserId: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export function generateToken(
  payload: Omit<JWTPayload, "iat" | "exp">,
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("Token 验证失败:", error);
    return null;
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("Token 解码失败:", error);
    return null;
  }
}

export function extractTokenFromHeader(
  authHeader: string | null,
): string | null {
  if (!authHeader) return null;
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return authHeader;
}

export function extractTokenFromCookie(
  cookieHeader: string | null,
): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );
  return cookies["jwt_token"] || null;
}
