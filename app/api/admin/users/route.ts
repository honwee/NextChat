/**
 * 管理后台 API - 用户管理
 * 路由：GET /api/admin/users
 */

import { NextRequest } from "next/server";
import { withAdmin, successResponse, errorResponse } from "@/app/lib/api-utils";
import { db } from "@/app/lib/db";

export const runtime = "nodejs";

/**
 * 获取用户列表
 */
export const GET = withAdmin(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // 获取用户列表
    const users = await db.listUsers(limit, offset);

    // 获取每个用户的角色
    const usersWithRoles = await Promise.all(
      users.map(async (u) => {
        const role = await db.getAdminRole(u.id);
        return {
          ...u,
          role: role || "user",
        };
      }),
    );

    const total = await db.getUserCount();

    return successResponse({
      users: usersWithRoles,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("获取用户列表失败:", error);
    return errorResponse("服务器内部错误", 500);
  }
});
