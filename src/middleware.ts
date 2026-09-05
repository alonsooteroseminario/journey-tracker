import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/cron(.*)",
  "/api/health",
  // Instagram's Graph API fetches image_url unauthenticated
  "/api/social-assets/(.*)",
  "/api/mcp/health",
  "/api/prompt-wallets/shared/(.*)",
  "/wallet/share/(.*)",
  // Signed-out visitors get the landing page here, not a sign-in redirect
  "/wallet",
  "/marketplace(.*)",
  // Search-surface pages and the lead magnet. Public or they cannot be crawled.
  "/how-to-organize-ai-prompts",
  "/prompt-library-vs-chat-history",
  "/prompt-manager-alternatives",
  "/prompt-pack",
  "/api/email-subscribe",
  "/robots.txt",
  "/sitemap.xml",
  "/api/marketplace(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
