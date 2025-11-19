/**
 * 管理后台 API - 获取当前管理员信息
 * 路由：GET /api/admin/me
 */

import { NextRequest } from "next/server";
import { withAdmin, successResponse, errorResponse } from "@/app/lib/api-utils";
import { db } from "@/app/lib/db";

export const runtime = "nodejs";

/**
 * 获取当前登录的管理员信息
 */
export const GET = withAdmin(async (request: NextRequest, { user }) => {
  try {
    // 获取用户详细信息
    const userInfo = await db.getUserById(user.userId);

    if (!userInfo) {
      return errorResponse("用户不存在", 404);
    }

    return successResponse({
      user: {
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("获取管理员信息失败:", error);
    return errorResponse("服务器内部错误", 500);
  }
});
