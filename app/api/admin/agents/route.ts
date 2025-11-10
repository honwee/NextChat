/**
 * 管理后台 API - 智能体管理
 * 路由：/api/admin/agents
 */

import { NextRequest } from "next/server";
import {
  withAdmin,
  successResponse,
  errorResponse,
  validateParams,
} from "@/app/lib/api-utils";
import { db } from "@/app/lib/db";

export const runtime = "nodejs";

/**
 * 获取智能体列表
 */
export const GET = withAdmin(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    // 获取智能体列表
    const agents = await db.getAgents(includeInactive);

    return successResponse({
      agents,
      total: agents.length,
    });
  } catch (error) {
    console.error("获取智能体列表失败:", error);
    return errorResponse("服务器内部错误", 500);
  }
});

/**
 * 创建新智能体
 */
export const POST = withAdmin(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json();

    // 验证参数
    const validation = validateParams(body, ["name", "dashscope_app_id"]);
    if (!validation.valid) {
      return errorResponse(
        `缺少必要参数: ${validation.missing?.join(", ")}`,
        400,
      );
    }

    // 创建智能体
    const agent = await db.createAgent({
      name: body.name,
      dashscope_app_id: body.dashscope_app_id,
      description: body.description,
      system_prompt: body.system_prompt,
      is_active: body.is_active !== undefined ? body.is_active : true,
      created_by: user.userId,
    });

    if (!agent) {
      return errorResponse("创建智能体失败", 500);
    }

    return successResponse(agent);
  } catch (error) {
    console.error("创建智能体失败:", error);
    return errorResponse("服务器内部错误", 500);
  }
});
