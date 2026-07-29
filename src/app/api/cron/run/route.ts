import { runDuePosts } from "@/lib/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Scheduled runner. Vercel Cron calls this on a schedule (and, when CRON_SECRET
// is set, includes it as a Bearer token). An external free cron (cron-job.org)
// can call it too with the same header for finer-grained timing on Hobby plans.
// It publishes every scheduled post whose time has arrived.
async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  }
  const result = await runDuePosts();
  return Response.json({ ok: true, ...result });
}

export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}
