/**
 * JWT 认证工具
 * 提供 JWT Token 的生成、验证和解析功能
 */

import jwt from "jsonwebtoken";
import { db } from "./db";

// JWT 配置
const JWT_SECRET =
  process.env.JWT_SECRET || "LNqQ--H5H9YPD3dleGuGp01yqudTjSuK6_GcduIR0-A";
const JWT_EXPIRES_IN = "7d"; // Token 有效期：7天

export interface JWTPayload {
  userId: string;
  feishuUserId: string;
  email?: string;
  iat?: number;
  exp?: number;
}

/**
 * 生成 JWT Token
 */
export function generateToken(
  payload: Omit<JWTPayload, "iat" | "exp">,
): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * 验证 JWT Token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("Token 验证失败:", error);
    return null;
  }
}

/**
 * 解码 JWT Token（不验证签名）
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("Token 解码失败:", error);
    return null;
  }
}

/**
 * 从请求头中提取 Token
 */
export function extractTokenFromHeader(
  authHeader: string | null,
): string | null {
  if (!authHeader) {
    return null;
  }

  // 支持 "Bearer <token>" 格式
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return authHeader;
}

/**
 * 从 Cookie 中提取 Token
 */
export function extractTokenFromCookie(
  cookieHeader: string | null,
): string | null {
  if (!cookieHeader) {
    return null;
  }

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

/**
 * 创建会话（生成 Token 并保存到数据库）
 */
export async function createSession(
  userId: string,
  feishuUserId: string,
  email?: string,
): Promise<string | null> {
  try {
    // 生成 JWT Token
    const token = generateToken({ userId, feishuUserId, email });

    // 解码以获取过期时间
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded || !decoded.exp) {
      return null;
    }

    const expiresAt = new Date(decoded.exp * 1000);

    // 保存到数据库
    await db.createSession(userId, token, expiresAt);

    return token;
  } catch (error) {
    console.error("创建会话失败:", error);
    return null;
  }
}

/**
 * 验证会话（验证 Token 并检查数据库）
 */
export async function verifySession(token: string): Promise<JWTPayload | null> {
  // 验证 Token 签名和有效期
  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  // 检查数据库中是否存在该会话
  const session = await db.getSessionByToken(token);
  if (!session) {
    return null;
  }

  return payload;
}

/**
 * 销毁会话（删除数据库中的会话记录）
 */
export async function destroySession(token: string): Promise<boolean> {
  return await db.deleteSession(token);
}

/**
 * 检查用户是否为管理员
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return await db.isAdmin(userId);
}

/**
 * 检查用户是否为超级管理员
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  return await db.isSuperAdmin(userId);
}

/**
 * 获取用户角色
 */
export async function getUserRole(
  userId: string,
): Promise<"super_admin" | "admin" | "user"> {
  const role = await db.getAdminRole(userId);
  return role || "user";
}
