/**
 * 飞书 OAuth 2.0 授权跳转 API
 * 路由：/api/auth/feishu/login
 */

import { NextRequest, NextResponse } from "next/server";
import { createFeishuService } from "@/app/lib/feishu";
import { errorResponse } from "@/app/lib/api-utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // 创建飞书服务实例
    const feishuService = await createFeishuService();
    if (!feishuService) {
      return errorResponse("飞书配置错误", 500);
    }

    // 生成随机 state（用于防止 CSRF 攻击）
    const state = Math.random().toString(36).substring(7);

    // 生成授权 URL
    const authUrl = feishuService.getAuthorizationUrl(state);

    // 重定向到飞书授权页面
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("飞书登录跳转失败:", error);
    return errorResponse("服务器内部错误", 500);
  }
}
