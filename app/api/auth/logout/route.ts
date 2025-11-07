/**
 * 退出登录 API
 * 路由：/api/auth/logout
 */

import { NextRequest } from "next/server";
import { extractTokenFromCookie, destroySession } from "@/app/lib/auth";
import { successResponse } from "@/app/lib/api-utils";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // 获取 Token
    const token = extractTokenFromCookie(request.headers.get("cookie"));

    if (token) {
      // 销毁会话
      await destroySession(token);
    }

    // 清除 Cookie
    const response = successResponse({ message: "退出登录成功" });
    response.cookies.delete("jwt_token");

    return response;
  } catch (error) {
    console.error("退出登录失败:", error);

    // 即使出错也清除 Cookie
    const response = successResponse({ message: "退出登录成功" });
    response.cookies.delete("jwt_token");

    return response;
  }
}
