import { runDuePosts } from "@/lib/posts";
import { runRenewalReminders, runServiceRenewalReminders } from "@/lib/renewals";
import { runWeeklyDigest } from "@/lib/digest";
import { runSmmAgentCycle } from "@/lib/smm-executor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Scheduled runner. Vercel Cron calls this on a schedule (and, when CRON_SECRET
// is set, includes it as a Bearer token). An external free cron (cron-job.org)
// can call it too with the same header for finer-grained timing on Hobby plans.
// It publishes every due scheduled post and sends infra renewal reminders.
async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  }
  // Generate SMM agent content first so any freshly-due scheduled posts can
  // publish in the same pass; then publish everything due.
  const smm = await runSmmAgentCycle();
  const [posts, renewals, serviceRenewals, digest] = await Promise.all([
    runDuePosts(),
    runRenewalReminders(),
    runServiceRenewalReminders(),
    runWeeklyDigest(),
  ]);
  return Response.json({ ok: true, ...posts, ...smm, renewals, serviceRenewals, digest });
}

export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}
