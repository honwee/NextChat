/**
 * 对话详情 API
 * 路由：GET /api/conversations/[id]
 */

import { NextRequest } from "next/server";
import { withAuth, successResponse, errorResponse } from "@/app/lib/api-utils";
import { db } from "@/app/lib/db";

export const runtime = "nodejs";

interface RouteContext {
  params: {
    id: string;
  };
}

export const GET = withAuth(
  async (request: NextRequest, context: any & { user: any }) => {
    try {
      const conversationId = context.params.id;

      // 获取对话信息
      const conversation = await db.getConversationById(conversationId);

      if (!conversation) {
        return errorResponse("对话不存在", 404);
      }

      // 检查权限：只有对话所属用户可以访问
      if (conversation.user_id !== context.user.userId) {
        return errorResponse("无权访问此对话", 403);
      }

      // 获取对话消息
      const messages = await db.getMessagesByConversationId(conversationId);

      return successResponse({
        conversation,
        messages,
      });
    } catch (error) {
      console.error("获取对话详情失败:", error);
      return errorResponse("服务器内部错误", 500);
    }
  },
);

/**
 * 更新对话信息
 * 路由：PATCH /api/conversations/[id]
 */
export const PATCH = withAuth(
  async (request: NextRequest, context: any & { user: any }) => {
    try {
      const conversationId = context.params.id;
      const body = await request.json();

      // 获取对话信息
      const conversation = await db.getConversationById(conversationId);

      if (!conversation) {
        return errorResponse("对话不存在", 404);
      }

      // 检查权限
      if (conversation.user_id !== context.user.userId) {
        return errorResponse("无权修改此对话", 403);
      }

      // 更新对话
      const updatedConversation = await db.updateConversation(conversationId, {
        title: body.title,
        agent_id: body.agentId,
      });

      if (!updatedConversation) {
        return errorResponse("更新对话失败", 500);
      }

      return successResponse(updatedConversation);
    } catch (error) {
      console.error("更新对话失败:", error);
      return errorResponse("服务器内部错误", 500);
    }
  },
);

/**
 * 删除对话
 * 路由：DELETE /api/conversations/[id]
 */
export const DELETE = withAuth(
  async (request: NextRequest, context: any & { user: any }) => {
    try {
      const conversationId = context.params.id;

      // 获取对话信息
      const conversation = await db.getConversationById(conversationId);

      if (!conversation) {
        return errorResponse("对话不存在", 404);
      }

      // 检查权限
      if (conversation.user_id !== context.user.userId) {
        return errorResponse("无权删除此对话", 403);
      }

      // 删除对话（软删除）
      const success = await db.deleteConversation(conversationId);

      if (!success) {
        return errorResponse("删除对话失败", 500);
      }

      return successResponse({ message: "对话已删除" });
    } catch (error) {
      console.error("删除对话失败:", error);
      return errorResponse("服务器内部错误", 500);
    }
  },
);
