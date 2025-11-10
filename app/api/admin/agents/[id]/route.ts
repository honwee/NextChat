/**
 * 管理后台 API - 单个智能体管理
 * 路由：/api/admin/agents/[id]
 */

import { NextRequest } from "next/server";
import { withAdmin, successResponse, errorResponse } from "@/app/lib/api-utils";
import { db } from "@/app/lib/db";

export const runtime = "nodejs";

/**
 * 获取智能体详情
 */
export const GET = withAdmin(
  async (request: NextRequest, context: any & { user: any }) => {
    try {
      const agentId = context.params.id;

      const agent = await db.getAgentById(agentId);

      if (!agent) {
        return errorResponse("智能体不存在", 404);
      }

      return successResponse(agent);
    } catch (error) {
      console.error("获取智能体详情失败:", error);
      return errorResponse("服务器内部错误", 500);
    }
  },
);

/**
 * 更新智能体
 */
export const PATCH = withAdmin(
  async (request: NextRequest, context: any & { user: any }) => {
    try {
      const agentId = context.params.id;
      const body = await request.json();

      const agent = await db.getAgentById(agentId);

      if (!agent) {
        return errorResponse("智能体不存在", 404);
      }

      // 更新智能体
      const updatedAgent = await db.updateAgent(agentId, {
        name: body.name,
        dashscope_app_id: body.dashscope_app_id,
        description: body.description,
        system_prompt: body.system_prompt,
        is_active: body.is_active,
      });

      if (!updatedAgent) {
        return errorResponse("更新智能体失败", 500);
      }

      return successResponse(updatedAgent);
    } catch (error) {
      console.error("更新智能体失败:", error);
      return errorResponse("服务器内部错误", 500);
    }
  },
);

/**
 * 删除智能体（软删除）
 */
export const DELETE = withAdmin(
  async (request: NextRequest, context: any & { user: any }) => {
    try {
      const agentId = context.params.id;

      const agent = await db.getAgentById(agentId);

      if (!agent) {
        return errorResponse("智能体不存在", 404);
      }

      // 软删除（设置为非活跃）
      const success = await db.deleteAgent(agentId);

      if (!success) {
        return errorResponse("删除智能体失败", 500);
      }

      return successResponse({ message: "智能体已删除" });
    } catch (error) {
      console.error("删除智能体失败:", error);
      return errorResponse("服务器内部错误", 500);
    }
  },
);
