import type { NextRequest } from "next/server";

/** First-touch cookie. Value is `source|campaign`. */
export const LEAD_COOKIE = "iedf_lead";
export const LEAD_MAX_AGE = 60 * 60 * 24 * 90;

export type Lead = { source: string; campaign: string };

const SLUG = /^[a-z0-9-]{2,40}$/;

/** The influencer's two channels for the inauguration and ISAC appeal. */
export const influencerChannels = [
  { source: "facebook", label: "Influencer · Facebook" },
  { source: "tiktok", label: "Influencer · TikTok" },
] as const;

export const inaugurationCampaign = "inauguration";

export function cleanSlug(value: string | null | undefined) {
  const slug = (value || "").trim().toLowerCase();
  return SLUG.test(slug) ? slug : null;
}

export function parseLead(value: string | null | undefined): Lead | null {
  if (!value) return null;
  const [source, campaign] = value.split("|");
  const cleanSource = cleanSlug(source);
  const cleanCampaign = cleanSlug(campaign);
  if (!cleanSource || !cleanCampaign) return null;
  return { source: cleanSource, campaign: cleanCampaign };
}

export function serializeLead(lead: Lead) {
  return `${lead.source}|${lead.campaign}`;
}

export function leadFromRequest(request: NextRequest): Lead | null {
  return parseLead(request.cookies.get(LEAD_COOKIE)?.value);
}

export function channelLabel(source: string) {
  return influencerChannels.find((channel) => channel.source === source)?.label || source;
}

export function campaignLabel(campaign: string) {
  if (campaign === inaugurationCampaign) {
    return "Inauguration and Ikeduru Skills Acquisition Centre";
  }
  return campaign;
}
