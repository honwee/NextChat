/**
 * 测试登录 API
 * 仅用于开发环境，快速创建测试用户并登录
 * 路由：GET /api/auth/test-login
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { createSession } from "@/app/lib/auth";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // 仅在开发环境允许
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, error: "测试登录仅在开发环境可用" },
        { status: 403 },
      );
    }

    // 测试用户信息
    const testUsername = "test";
    const testPassword = "123456";
    const passwordHash = await bcrypt.hash(testPassword, 10);

    const testUser = {
      feishu_user_id: "test_user_001",
      name: testUsername,
      email: "test@example.com",
      avatar_url: null,
      is_active: true,
      password_hash: passwordHash,
    };

    // 检查用户是否存在
    let user = await db.getUserByFeishuId(testUser.feishu_user_id);

    if (!user) {
      // 创建测试用户
      user = await db.createUser(testUser);
      console.log("[Test Login] 创建测试用户:", {
        ...user,
        username: testUsername,
        password: testPassword,
      });
      console.log(
        `[Test Login] 测试账号: ${testUsername} / 密码: ${testPassword}`,
      );
    } else {
      // 更新现有用户的密码hash
      await db.updateUserPassword(user.id, passwordHash);
      console.log("[Test Login] 使用已存在的测试用户:", user);
      console.log(
        `[Test Login] 测试账号: ${testUsername} / 密码: ${testPassword}`,
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "创建用户失败" },
        { status: 500 },
      );
    }

    // 检查是否是管理员，如果不是则添加为超级管理员
    const adminRecord = await db.getAdminByUserId(user.id);
    if (!adminRecord) {
      const result = await db.createAdmin(user.id, "super_admin");
      console.log("[Test Login] 添加为超级管理员:", result);
    }

    // 创建会话
    const token = await createSession(
      user.id,
      user.feishu_user_id,
      user.email || undefined,
    );

    if (!token) {
      return NextResponse.json(
        { success: false, error: "创建会话失败" },
        { status: 500 },
      );
    }

    // 创建响应并设置 Cookie
    const response = NextResponse.redirect(new URL("/", request.url));

    response.cookies.set("jwt_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 天
      path: "/",
    });

    console.log("[Test Login] 登录成功，用户 ID:", user.id);
    console.log(
      `[Test Login] 现在可以使用账号 "${testUsername}" 和密码 "${testPassword}" 在登录页面登录`,
    );

    return response;
  } catch (error) {
    console.error("[Test Login] 错误:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    );
  }
}
