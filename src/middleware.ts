import { betterFetch } from "@better-fetch/fetch";
import { NextResponse, type NextRequest } from "next/server";
import type { Session } from "@/lib/auth";

const publicRoutes = ["/login", "/signup"];
const authPrefix = "/api/auth";

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (publicRoutes.includes(pathname) || pathname.startsWith(authPrefix)) {
        return NextResponse.next();
    }

    const { data: session } = await betterFetch<Session>(
        "/api/auth/get-session",
        {
            baseURL: request.nextUrl.origin,
            headers: {
                //get the cookie from the request
                cookie: request.headers.get("cookie") || "",
            },
        },
    );

    if (!session) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
