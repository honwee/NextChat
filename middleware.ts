/**
 * Next.js 中间件
 * 用于保护需要认证的路由
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromCookie, extractTokenFromHeader } from './app/lib/jwt';

// 需要认证的路由前缀
const PROTECTED_ROUTES = [
  '/api/chat',
  '/api/user',
  '/api/conversation',
];

// 需要管理员权限的路由前缀
const ADMIN_ROUTES = [
  '/admin',
  '/api/admin',
];

// 公开路由（无需认证）
const PUBLIC_ROUTES = [
  '/api/auth',
  '/login',
  '/api/health',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 检查是否为公开路由
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 提取 Token
  const cookieToken = extractTokenFromCookie(request.headers.get('cookie'));
  const headerToken = extractTokenFromHeader(request.headers.get('authorization'));
  const token = cookieToken || headerToken;

  // 检查是否需要认证
  const requiresAuth = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const requiresAdmin = ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  if (requiresAuth || requiresAdmin) {
    if (!token) {
      // 未提供 Token，返回 401
      return new NextResponse(
        JSON.stringify({ error: '未授权访问，请先登录' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 在 Edge Runtime 下不做签名验证，只转发 token 供服务端路由自行校验
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-token', token);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

// 配置中间件匹配路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     * - public 文件夹中的文件
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth/feishu).*)',
    '/api/:path*',
    '/admin/:path*',
  ],
};
