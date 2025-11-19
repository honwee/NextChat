/**
 * 管理后台 API - 获取对话消息列表
 * 路由：GET /api/admin/conversations/[id]/messages
 */

import { NextRequest } from "next/server";
import { withAdmin, successResponse, errorResponse } from "@/app/lib/api-utils";
import { db } from "@/app/lib/db";

export const runtime = "nodejs";

/**
 * 获取指定对话的所有消息
 */
export const GET = withAdmin(async (request: NextRequest, { params }: any) => {
  try {
    const conversationId = params?.id;

    if (!conversationId) {
      return errorResponse("对话ID不能为空", 400);
    }

    // 获取对话信息
    const conversation = await db.getConversationById(conversationId);
    if (!conversation) {
      return errorResponse("对话不存在", 404);
    }

    // 获取对话的所有消息
    const messages = await db.getMessagesByConversationId(conversationId);

    // 获取用户信息
    const user = await db.getUserById(conversation.user_id);

    return successResponse({
      conversation: {
        ...conversation,
        user_name: user?.name || "未知用户",
      },
      messages,
      total: messages.length,
    });
  } catch (error) {
    console.error("获取对话消息失败:", error);
    return errorResponse("服务器内部错误", 500);
  }
});
