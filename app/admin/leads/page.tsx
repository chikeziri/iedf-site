"use client";

import { useEffect, useState } from "react";

type Channel = {
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
};

type LeadRow = {
  id: number;
  source: string;
  campaign: string;
  kind: string;
  email?: string | null;
  amount?: string | number | null;
  created_at?: string;
};

type ShareLink = { label: string; home: string; donate: string; membership: string };

export default function AdminLeadsPage() {
  const [channels, setChannels] = useState<Channel[] | null>(null);
  const [recent, setRecent] = useState<LeadRow[]>([]);
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/leads")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Could not load leads.");
        setChannels(body.channels);
        setRecent(body.recent);
        setLinks(body.links);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  async function copy(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(url);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-4xl italic">Leads</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
        People who open the influencer&apos;s Facebook or TikTok link are counted here when they visit, join, write in, subscribe, or donate. The first link they open is the one that stays with them.
      </p>
      {error && <p className="mt-6 text-sm text-gold-pale">{error}</p>}

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {channels?.map((channel) => (
          <article key={`${channel.source}-${channel.campaign}`} className="glass rounded-3xl p-6">
            <p className="font-data text-[10px] uppercase tracking-[0.22em] text-gold-bright">{channel.label}</p>
            <p className="mt-1 text-sm text-ink-muted">{channel.campaignLabel}</p>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-ink-faint">Visits</dt>
                <dd className="font-display text-3xl text-ink">{channel.visits}</dd>
              </div>
              <div>
                <dt className="text-ink-faint">Membership</dt>
                <dd className="font-display text-3xl text-ink">{channel.members}</dd>
              </div>
              <div>
                <dt className="text-ink-faint">Messages</dt>
                <dd className="font-display text-3xl text-ink">{channel.contacts}</dd>
              </div>
              <div>
                <dt className="text-ink-faint">Donations</dt>
                <dd className="font-display text-3xl text-ink">{channel.donations}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-gold-pale">
              ₦{channel.amount.toLocaleString("en-NG", { maximumFractionDigits: 0 })} donated
              {channel.newsletter > 0 ? ` · ${channel.newsletter} newsletter` : ""}
            </p>
          </article>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl italic">Links for the influencer</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Give him these exact addresses. A normal link, without <span className="text-ink">src</span>, is not counted.
        </p>
        <div className="mt-4 space-y-4">
          {links.map((link) => (
            <div key={link.label} className="rounded-2xl border border-gold/15 p-4">
              <p className="font-data text-[10px] uppercase tracking-[0.2em] text-gold-bright">{link.label}</p>
              {([
                ["Home", link.home],
                ["Donate", link.donate],
                ["Membership", link.membership],
              ] as const).map(([name, url]) => (
                <div key={url} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="break-all text-sm text-ink">
                    <span className="text-ink-faint">{name}: </span>
                    {url}
                  </p>
                  <button
                    type="button"
                    onClick={() => copy(url)}
                    className="shrink-0 rounded-full border border-gold/30 px-3 py-1 text-xs text-gold-pale"
                  >
                    {copied === url ? "Copied" : "Copy"}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl italic">Recent leads</h2>
        <div className="mt-4 space-y-3">
          {recent.length === 0 && <p className="text-sm text-ink-muted">No memberships, messages, or donations from a tracked link yet.</p>}
          {recent.map((row) => (
            <article key={row.id} className="glass rounded-2xl p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm text-ink">{row.email || "—"}</p>
                <time className="font-data text-[11px] text-ink-faint">
                  {row.created_at ? new Date(row.created_at).toLocaleString() : ""}
                </time>
              </div>
              <p className="mt-1 text-sm text-ink-muted">
                {row.source} · {row.campaign} · {row.kind}
                {row.amount != null ? ` · ₦${Number(row.amount).toLocaleString("en-NG")}` : ""}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
