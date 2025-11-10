/**
 * 对话 API - 创建新对话
 * 路由：POST /api/conversations
 */

import { NextRequest } from "next/server";
import {
  withAuth,
  successResponse,
  errorResponse,
  validateParams,
} from "@/app/lib/api-utils";
import { db } from "@/app/lib/db";

export const runtime = "nodejs";

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json();

    // 验证参数
    const validation = validateParams(body, ["title"]);
    if (!validation.valid) {
      return errorResponse(
        `缺少必要参数: ${validation.missing?.join(", ")}`,
        400,
      );
    }

    // 创建对话
    const conversation = await db.createConversation({
      user_id: user.userId,
      agent_id: body.agentId,
      title: body.title,
      model: body.model,
    });

    if (!conversation) {
      return errorResponse("创建对话失败", 500);
    }

    return successResponse(conversation);
  } catch (error) {
    console.error("创建对话失败:", error);
    return errorResponse("服务器内部错误", 500);
  }
});

/**
 * 获取用户的对话列表
 * 路由：GET /api/conversations
 */
export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // 获取对话列表
    const conversations = await db.getConversationsByUserId(
      user.userId,
      limit,
      offset,
    );

    return successResponse({
      conversations,
      total: conversations.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("获取对话列表失败:", error);
    return errorResponse("服务器内部错误", 500);
  }
});
