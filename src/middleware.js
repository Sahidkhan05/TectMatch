import { NextResponse } from "next/server";

export function middleware(request) {

    const token =
        request.cookies.get("sb-access-token");

    const protectedRoutes = [
        "/",
        "/jobs",
        "/resume-screening",
        "/saved-results"
    ];

    const isProtected = protectedRoutes.includes(request.nextUrl.pathname);
    const isAuthRoute = ["/auth/login", "/auth/signup"].includes(request.nextUrl.pathname);

    // If trying to access protected route without token, redirect to login
    if (isProtected && !token) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // If trying to access auth pages with token, redirect to dashboard
    if (isAuthRoute && token) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/",
        "/jobs",
        "/resume-screening",
        "/saved-results",
        "/auth/login",
        "/auth/signup"
    ]
};