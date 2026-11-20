/**
 * Local news stubs — shaped like the Sanity `newsPost` schema so a later
 * CMS fetch can replace this export without rewriting the News UI.
 *
 * Only milestone-true posts belong here (founding, inauguration, cluster
 * designation). Do not invent press coverage.
 */

export type NewsCategory = "announcement" | "press" | "event";

export type NewsPost = {
  slug: string;
  date: string; // ISO date
  category: NewsCategory;
  /** Message-key suffixes under the `news` namespace (title/summary/body). */
  messageKey: string;
  /** Optional path, without locale, for a page related to the story. */
  relatedHref?: string;
  relatedLabelKey?: string;
};

export const newsPosts: NewsPost[] = [
  {
    slug: "official-inauguration",
    date: "2026-11-20",
    category: "event",
    messageKey: "postOfficial",
    relatedHref: "/inauguration",
    relatedLabelKey: "postOfficialRelated",
  },
  {
    slug: "ikeduru-skills-acquisition-centre",
    date: "2026-11-20",
    category: "announcement",
    messageKey: "postIsac",
    relatedHref: "/donate",
    relatedLabelKey: "postIsacRelated",
  },
  {
    slug: "executives-inaugurated",
    date: "2026-04-01",
    category: "event",
    messageKey: "postInauguration",
  },
  {
    slug: "industrial-cluster-designated",
    date: "2025-06-01",
    category: "announcement",
    messageKey: "postCluster",
  },
  {
    slug: "iedf-founded",
    date: "2025-01-04",
    category: "announcement",
    messageKey: "postFounded",
  },
];

export function getNewsPost(slug: string) {
  return newsPosts.find((p) => p.slug === slug);
}
