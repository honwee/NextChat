/**
 * 账号密码登录 API
 * 路由：POST /api/auth/password/login
 */

import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/app/lib/api-utils";
import { db } from "@/app/lib/db";
import { createSession } from "@/app/lib/auth";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawUsername = body?.username;
    const rawPassword = body?.password;
    const username = typeof rawUsername === "string" ? rawUsername.trim() : "";
    const password =
      typeof rawPassword === "string" ? rawPassword : String(rawPassword ?? "");

    // 验证参数
    if (!username || !password) {
      return errorResponse("账号和密码不能为空", 400);
    }

    // 查找用户（可以是邮箱或用户名）
    const user = await db.getUserByEmailOrUsername(username);

    if (!user) {
      return errorResponse("账号或密码错误", 401);
    }

    // 验证密码
    if (!user.password_hash) {
      return errorResponse("该账号未设置密码，请使用其他登录方式", 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return errorResponse("账号或密码错误", 401);
    }

    // 检查用户是否被禁用
    if (!user.is_active) {
      return errorResponse("账号已被禁用", 403);
    }

    // 创建会话（修正调用签名）
    const token = await createSession(
      user.id,
      user.feishu_user_id,
      user.email || undefined,
    );

    if (!token) {
      return errorResponse("创建会话失败", 500);
    }

    // 设置 Cookie
    const response = successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

    response.cookies.set("jwt_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("密码登录失败:", error);
    return errorResponse("登录失败，请稍后重试", 500);
  }
}
