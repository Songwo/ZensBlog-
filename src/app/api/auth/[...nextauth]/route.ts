import { handlers } from "@/lib/auth";
import type { NextRequest } from "next/server";

function toSignInErrorRedirect(request: NextRequest, reason: string) {
  const url = new URL("/auth/signin", request.url);
  url.searchParams.set("error", reason);
  return Response.redirect(url, 302);
}

export async function GET(request: NextRequest) {
  try {
    return await handlers.GET(request);
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (request.url.includes("/callback/github") || message.includes("callbackrouteerror")) {
      return toSignInErrorRedirect(request, "github_callback_failed");
    }
    return toSignInErrorRedirect(request, "auth_failed");
  }
}

export async function POST(request: NextRequest) {
  try {
    return await handlers.POST(request);
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (request.url.includes("/callback/github") || message.includes("callbackrouteerror")) {
      return toSignInErrorRedirect(request, "github_callback_failed");
    }
    return toSignInErrorRedirect(request, "auth_failed");
  }
}
