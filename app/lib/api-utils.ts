/**
 * API 工具函数
 * 用于处理 API 请求和响应
 */

import { NextRequest, NextResponse } from "next/server";
import {
  verifySession,
  extractTokenFromCookie,
  extractTokenFromHeader,
  getUserRole,
} from "./auth";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 创建成功响应
 */
export function successResponse<T>(data: T, message?: string): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message,
  } as ApiResponse<T>);
}

/**
 * 创建错误响应
 */
export function errorResponse(error: string, status = 400): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
    } as ApiResponse,
    { status },
  );
}

/**
 * 从请求中获取当前用户信息
 */
export async function getCurrentUser(request: NextRequest): Promise<{
  userId: string;
  feishuUserId: string;
  email?: string;
} | null> {
  console.log("[getCurrentUser] 开始验证用户");

  // 首先尝试从请求头中获取（由中间件设置）
  const userId = request.headers.get("x-user-id");
  const feishuUserId = request.headers.get("x-feishu-user-id");

  if (userId && feishuUserId) {
    console.log("[getCurrentUser] 从请求头获取用户:", userId);
    return { userId, feishuUserId };
  }

  // 如果请求头中没有，尝试验证 Token
  const cookieHeader = request.headers.get("cookie");
  console.log(
    "[getCurrentUser] Cookie header:",
    cookieHeader?.substring(0, 100),
  );

  const cookieToken = extractTokenFromCookie(cookieHeader);
  console.log(
    "[getCurrentUser] Extracted cookie token:",
    cookieToken?.substring(0, 20) + "...",
  );

  const headerToken = extractTokenFromHeader(
    request.headers.get("authorization"),
  );
  const token = cookieToken || headerToken;

  if (!token) {
    console.log("[getCurrentUser] 未找到 token");
    return null;
  }

  console.log("[getCurrentUser] 验证 token...");
  const payload = await verifySession(token);
  if (!payload) {
    console.log("[getCurrentUser] Token 验证失败");
    return null;
  }

  console.log("[getCurrentUser] 用户验证成功:", payload.userId);
  return {
    userId: payload.userId,
    feishuUserId: payload.feishuUserId,
    email: payload.email,
  };
}

/**
 * 认证中间件装饰器
 */
export function withAuth(
  handler: (
    request: NextRequest,
    context: { user: { userId: string; feishuUserId: string; email?: string } },
  ) => Promise<NextResponse>,
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = await getCurrentUser(request);

    if (!user) {
      return errorResponse("未授权访问，请先登录", 401);
    }

    return handler(request, { user });
  };
}

/**
 * 管理员认证中间件装饰器
 */
export function withAdmin(
  handler: (
    request: NextRequest,
    context: {
      user: {
        userId: string;
        feishuUserId: string;
        email?: string;
        role: "admin" | "super_admin";
      };
    },
  ) => Promise<NextResponse>,
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = await getCurrentUser(request);

    if (!user) {
      return errorResponse("未授权访问，请先登录", 401);
    }

    const role = await getUserRole(user.userId);

    if (role === "user") {
      return errorResponse("需要管理员权限", 403);
    }

    return handler(request, {
      user: {
        ...user,
        role: role as "admin" | "super_admin",
      },
    });
  };
}

/**
 * 超级管理员认证中间件装饰器
 */
export function withSuperAdmin(
  handler: (
    request: NextRequest,
    context: {
      user: {
        userId: string;
        feishuUserId: string;
        email?: string;
        role: "super_admin";
      };
    },
  ) => Promise<NextResponse>,
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = await getCurrentUser(request);

    if (!user) {
      return errorResponse("未授权访问，请先登录", 401);
    }

    const role = await getUserRole(user.userId);

    if (role !== "super_admin") {
      return errorResponse("需要超级管理员权限", 403);
    }

    return handler(request, {
      user: {
        ...user,
        role: "super_admin",
      },
    });
  };
}

/**
 * 处理 API 错误
 */
export function handleApiError(error: any): NextResponse {
  console.error("API 错误:", error);

  if (error instanceof Error) {
    return errorResponse(error.message, 500);
  }

  return errorResponse("服务器内部错误", 500);
}

/**
 * 验证请求参数
 */
export function validateParams<T extends Record<string, any>>(
  params: any,
  required: (keyof T)[],
): { valid: boolean; missing?: string[] } {
  const missing: string[] = [];

  for (const key of required) {
    if (
      params[key] === undefined ||
      params[key] === null ||
      params[key] === ""
    ) {
      missing.push(key as string);
    }
  }

  if (missing.length > 0) {
    return { valid: false, missing };
  }

  return { valid: true };
}
