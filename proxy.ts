import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

let idx = 0;
const PUBLIC_PATHS = new Set(["/", "/privacy"]);

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;
  const queryParams = url.searchParams;
  const tokenRestorePassword = queryParams.get("token");
  const token =
    request.cookies.get("token")?.value || tokenRestorePassword || "";

  if (!token) {
    if (PUBLIC_PATHS.has(pathname)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  const headersDefault = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "x-app-key": `${process.env.NEXT_PUBLIC_APP_KEY}`,
  };

  let statusCode = 0;
  idx++;

  console.log({ idx, url: request.url, pathname });

  if (!tokenRestorePassword) {
    const data = await (
      await fetch(process.env.NEXT_PUBLIC_URL_API + "/auth/check-token", {
        method: "POST",
        headers: {
          ...headersDefault,
        },
      })
    ).json();

    statusCode = data.statusCode || 0;
  } else if (tokenRestorePassword) {
    const data = await (
      await fetch(
        process.env.NEXT_PUBLIC_URL_API + "/auth/check-token-restore-password",
        {
          method: "POST",
          headers: {
            ...headersDefault,
          },
          body: JSON.stringify({
            token: tokenRestorePassword,
          }),
        },
      )
    ).json();

    statusCode = data.statusCode || 0;
  }

  if (statusCode === 0) {
    if (pathname === "/" && !tokenRestorePassword) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  const searchParams = url.searchParams;
  if (searchParams.has("token")) {
    searchParams.delete("token");
    url.search = searchParams.toString();
    return NextResponse.redirect(new URL(url.pathname, request.url));
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon|manifest|images).*)",
  ],
};
