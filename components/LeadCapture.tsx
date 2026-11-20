"use client";

import { useEffect } from "react";
import {
  LEAD_COOKIE,
  LEAD_MAX_AGE,
  cleanSlug,
  inaugurationCampaign,
  parseLead,
  serializeLead,
} from "@/lib/leads/attribution";

function cookieValue() {
  const match = document.cookie.split("; ").find((part) => part.startsWith(`${LEAD_COOKIE}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

/** Remembers the influencer link that brought someone in, then counts the visit once per browser session. */
export function LeadCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = cleanSlug(params.get("src"));
    const campaign = cleanSlug(params.get("campaign")) || (source ? inaugurationCampaign : null);
    const existing = parseLead(cookieValue());

    if (source && campaign && !existing) {
      document.cookie = `${LEAD_COOKIE}=${encodeURIComponent(serializeLead({ source, campaign }))}; path=/; max-age=${LEAD_MAX_AGE}; samesite=lax`;
    }

    const lead = existing || (source && campaign ? { source, campaign } : null);
    if (!lead) return;
    if (sessionStorage.getItem("iedf_lead_visit")) return;
    sessionStorage.setItem("iedf_lead_visit", "1");

    fetch("/api/leads/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname, source: lead.source, campaign: lead.campaign }),
    }).catch(() => {
      sessionStorage.removeItem("iedf_lead_visit");
    });
  }, []);

  return null;
}
