/**
 * 管理后台 API - 数据统计
 * 路由：GET /api/admin/statistics
 */

import { NextRequest } from "next/server";
import { withAdmin, successResponse, errorResponse } from "@/app/lib/api-utils";
import { db } from "@/app/lib/db";

export const runtime = "nodejs";

export const GET = withAdmin(async (request: NextRequest, { user }) => {
  try {
    // 获取基础统计数据
    const statistics = await db.getStatistics();

    // 获取最近 7 天的对话趋势（简化版，实际需要按日期分组查询）
    // TODO: 实现更详细的时间序列统计

    return successResponse({
      ...statistics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("获取统计数据失败:", error);
    return errorResponse("服务器内部错误", 500);
  }
});
