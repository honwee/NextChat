/**
 * 管理后台 API - 对话记录查看（管理员可查看所有用户对话）
 * 路由：GET /api/admin/conversations
 */

import { NextRequest } from "next/server";
import { withAdmin, successResponse, errorResponse } from "@/app/lib/api-utils";
import { db } from "@/app/lib/db";

export const runtime = "nodejs";

/**
 * 获取所有对话列表
 */
export const GET = withAdmin(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    const userId = searchParams.get("userId");

    // 根据是否指定用户 ID 获取对话列表
    let conversations;
    if (userId) {
      conversations = await db.getConversationsByUserId(userId, limit, offset);
    } else {
      conversations = await db.getAllConversations(limit, offset);
    }

    // 获取每个对话的用户信息
    const conversationsWithUsers = await Promise.all(
      conversations.map(async (conv) => {
        const u = await db.getUserById(conv.user_id);
        return {
          ...conv,
          user: u
            ? {
                id: u.id,
                name: u.name,
                email: u.email,
              }
            : null,
        };
      }),
    );

    const total = await db.getConversationCount();

    return successResponse({
      conversations: conversationsWithUsers,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("获取对话列表失败:", error);
    return errorResponse("服务器内部错误", 500);
  }
});
