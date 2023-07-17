import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/", "/channel"],
};

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get("authorization");

  if (basicAuth) {
    const authValue = basicAuth.split(" ")[1];
    const [user, pwd] = atob(authValue).split(":");

    if (
      user === process.env.BASIC_AUTH_USER &&
      pwd === process.env.BASIC_AUTH_PASS
    ) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Auth Required.", {
    status: 401,
    headers: {
      "WWW-authenticate": 'Basic realm="Secure Area"',
    },
  });
}
