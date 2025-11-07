/**
 * 飞书 OAuth 2.0 回调 API
 * 路由：/api/auth/feishu/callback
 */

import { NextRequest, NextResponse } from "next/server";
import { createFeishuService } from "@/app/lib/feishu";
import { db } from "@/app/lib/db";
import { createSession } from "@/app/lib/auth";
import { errorResponse } from "@/app/lib/api-utils";

export const runtime = "nodejs"; // 使用 Node.js 运行时以支持数据库操作

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code) {
      return errorResponse("缺少授权码", 400);
    }

    // 创建飞书服务实例
    const feishuService = await createFeishuService();
    if (!feishuService) {
      return errorResponse("飞书配置错误", 500);
    }

    // 通过 code 获取用户信息
    const loginResult = await feishuService.loginWithCode(code);
    if (!loginResult) {
      return errorResponse("飞书登录失败", 401);
    }

    const { userInfo } = loginResult;

    // 查找或创建用户
    let user = await db.getUserByFeishuId(userInfo.union_id);

    if (!user) {
      // 创建新用户
      user = await db.createUser({
        feishu_user_id: userInfo.union_id,
        name: userInfo.name,
        email: userInfo.email || null,
        avatar_url: userInfo.picture || null,
        is_active: true,
      });

      if (!user) {
        return errorResponse("创建用户失败", 500);
      }

      console.log("新用户注册:", user.id, user.name);
    } else {
      // 更新用户信息
      const updatedUser = await db.updateUser(user.id, {
        name: userInfo.name,
        email: userInfo.email || null,
        avatar_url: userInfo.picture || null,
      });

      if (updatedUser) {
        user = updatedUser;
      }

      console.log("用户登录:", user.id, user.name);
    }

    // 创建会话
    const token = await createSession(
      user.id,
      user.feishu_user_id,
      user.email || undefined,
    );

    if (!token) {
      return errorResponse("创建会话失败", 500);
    }

    // 设置 Cookie 并重定向到主页
    const response = NextResponse.redirect(new URL("/", request.url));

    response.cookies.set("jwt_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 天
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("飞书回调处理失败:", error);
    return errorResponse("服务器内部错误", 500);
  }
}
