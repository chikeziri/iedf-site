import { query } from "@/lib/db/client";
import type { Lead } from "@/lib/leads/attribution";

export async function recordLead(
  lead: Lead | null,
  kind: "visit" | "member" | "contact" | "newsletter" | "donation",
  details: { path?: string; email?: string; amount?: number } = {}
) {
  if (!lead) return;
  try {
    await query(
      `INSERT INTO lead_touches (source, campaign, kind, path, email, amount)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        lead.source,
        lead.campaign,
        kind,
        details.path?.slice(0, 255) || null,
        details.email?.slice(0, 255) || null,
        details.amount ?? null,
      ]
    );
  } catch (err) {
    console.error("[lead] record failed:", err);
  }
}

export function withLead<T extends object>(data: T, lead: Lead | null) {
  if (!lead) return data;
  return { ...data, leadSource: lead.source, leadCampaign: lead.campaign };
}
