import { NextRequest, NextResponse } from "next/server";
import { adminNotConfigured, adminSessionToken, isAdminRequest, unauthorized } from "@/lib/admin/auth";
import { ensureAdminSchema } from "@/lib/admin/schema";
import { query } from "@/lib/db/client";
import { campaignLabel, channelLabel, influencerChannels, inaugurationCampaign } from "@/lib/leads/attribution";

type CountRow = { source: string; campaign: string; kind: string; n: string; amount: string | null };

export async function GET(request: NextRequest) {
  if (!adminSessionToken()) return adminNotConfigured();
  if (!isAdminRequest(request)) return unauthorized();

  try {
    await ensureAdminSchema();
    const counts = await query<CountRow>(
      `SELECT source, campaign, kind, COUNT(*) AS n, SUM(amount) AS amount
       FROM lead_touches
       GROUP BY source, campaign, kind`
    );
    const recent = await query(
      `SELECT id, source, campaign, kind, path, email, amount, created_at
       FROM lead_touches
       WHERE kind <> 'visit'
       ORDER BY created_at DESC
       LIMIT 40`
    );

    const groups = new Map<string, {
      source: string;
      campaign: string;
      label: string;
      campaignLabel: string;
      visits: number;
      members: number;
      contacts: number;
      newsletter: number;
      donations: number;
      amount: number;
    }>();

    for (const channel of influencerChannels) {
      const key = `${channel.source}|${inaugurationCampaign}`;
      groups.set(key, {
        source: channel.source,
        campaign: inaugurationCampaign,
        label: channel.label,
        campaignLabel: campaignLabel(inaugurationCampaign),
        visits: 0,
        members: 0,
        contacts: 0,
        newsletter: 0,
        donations: 0,
        amount: 0,
      });
    }

    for (const row of counts.rows) {
      const key = `${row.source}|${row.campaign}`;
      const group = groups.get(key) || {
        source: row.source,
        campaign: row.campaign,
        label: channelLabel(row.source),
        campaignLabel: campaignLabel(row.campaign),
        visits: 0,
        members: 0,
        contacts: 0,
        newsletter: 0,
        donations: 0,
        amount: 0,
      };
      const n = Number(row.n) || 0;
      if (row.kind === "visit") group.visits += n;
      if (row.kind === "member") group.members += n;
      if (row.kind === "contact") group.contacts += n;
      if (row.kind === "newsletter") group.newsletter += n;
      if (row.kind === "donation") {
        group.donations += n;
        group.amount += Number(row.amount) || 0;
      }
      groups.set(key, group);
    }

    const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://iedf.org.ng").replace(/\/$/, "");
    const links = influencerChannels.map((channel) => ({
      label: channel.label,
      home: `${site}/en?src=${channel.source}&campaign=${inaugurationCampaign}`,
      donate: `${site}/en/donate?src=${channel.source}&campaign=${inaugurationCampaign}`,
      membership: `${site}/en/join-us?src=${channel.source}&campaign=${inaugurationCampaign}`,
    }));

    return NextResponse.json({ channels: [...groups.values()], recent: recent.rows, links });
  } catch (err) {
    console.error("[admin leads]", err);
    return NextResponse.json({ error: "Could not load lead tracking." }, { status: 500 });
  }
}
