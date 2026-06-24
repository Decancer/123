import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "replace-this-with-a-real-secret-in-production"
);

// 哪些路径不需要登录（浏览内容公开，写操作需登录）
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/verify-email",
  "/posts",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/register",
  "/api/auth/delete",
  "/api/auth/resend-verification",
  "/api/posts",
  "/api/comments",
  "/api/profile",
  "/api/chat-room",
  "/api/messages",
  "/api/users",
  "/_next",
  "/favicon.ico",
];

// 页面路径（不依赖 API，直接可访问）
const PUBLIC_PAGES = ["/chat-room", "/features", "/dressing-room", "/users", "/messages", "/icon.svg"];

function isPublicPath(pathname: string) {
  if (
    pathname === "/" ||
    pathname.startsWith("/posts") ||
    pathname.startsWith("/_next")
  ) {
    return true;
  }
  if (PUBLIC_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return true;
  }
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公开路径直接放行
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 检查 JWT cookie
  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    // Token 过期或无效，清除 cookie 并重定向
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set("auth-token", "", { maxAge: 0, path: "/" });
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - 静态资源 (svg/png/jpg/gif/ico/webp/woff2/ttf/moc/mtn/bundle/asset/json)
     * - Next.js 内部路由
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|ico|webp|woff2?|ttf|eot|moc|mtn|bundle|asset|json)$).*)",
  ],
};
