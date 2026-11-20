import { NextRequest, NextResponse } from "next/server";
import { ensureAdminSchema } from "@/lib/admin/schema";
import { cleanSlug, leadFromRequest, parseLead } from "@/lib/leads/attribution";
import { recordLead } from "@/lib/leads/record";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const fromBody = parseLead(
    `${cleanSlug(body.source) || ""}|${cleanSlug(body.campaign) || ""}`
  );
  const lead = leadFromRequest(request) || fromBody;
  if (!lead) return NextResponse.json({ ok: false });

  const path = typeof body.path === "string" ? body.path : "/";
  try {
    await ensureAdminSchema();
    await recordLead(lead, "visit", { path });
  } catch (err) {
    console.error("[lead visit]", err);
  }
  return NextResponse.json({ ok: true });
}
