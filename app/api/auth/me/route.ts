/**
 * 获取当前用户信息 API
 * 路由：/api/auth/me
 */

import { NextRequest } from "next/server";
import { withAuth, successResponse, errorResponse } from "@/app/lib/api-utils";
import { db } from "@/app/lib/db";
import { getUserRole } from "@/app/lib/auth";

export const runtime = "nodejs";

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    // 获取用户详细信息
    const userInfo = await db.getUserById(user.userId);

    if (!userInfo) {
      return errorResponse("用户不存在", 404);
    }

    // 获取用户角色
    const role = await getUserRole(user.userId);

    return successResponse({
      id: userInfo.id,
      feishuUserId: userInfo.feishu_user_id,
      name: userInfo.name,
      email: userInfo.email,
      avatarUrl: userInfo.avatar_url,
      isActive: userInfo.is_active,
      role,
      createdAt: userInfo.created_at,
    });
  } catch (error) {
    console.error("获取用户信息失败:", error);
    return errorResponse("服务器内部错误", 500);
  }
});
