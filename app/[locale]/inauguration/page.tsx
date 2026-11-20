import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/PageHero";
import { AccentLine } from "@/lib/accent";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Official Inauguration",
  description:
    "Invitation to the official inauguration of IEDF and the launch of the ₦500 million fundraising initiative for the Ikeduru Skills Acquisition Centre. Monday 4 January 2027, 12 noon, Sunnyside Hotels, Amaimo.",
};

export default async function InaugurationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "inauguration" });

  const facts = [
    { label: t("dateLabel"), value: t("date") },
    { label: t("timeLabel"), value: t("time") },
    { label: t("venueLabel"), value: t("venue") },
  ];

  return (
    <>
      <PageHero
        eyebrow={t("eyebrow")}
        title={<AccentLine text={t("heroTitle")} accent={t("heroTitleAccent")} />}
        subline={t("heroSubline")}
      />

      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_1.1fr] lg:gap-14">
          <Reveal>
            <figure className="glass overflow-hidden rounded-[2rem] p-3 sm:p-4">
              <Image
                src="/images/inauguration-invitation.jpg"
                alt={t("imageAlt")}
                width={676}
                height={1024}
                priority
                className="h-auto w-full rounded-[1.4rem]"
              />
            </figure>
          </Reveal>

          <Reveal delay={0.08}>
            <p className="font-display text-2xl italic leading-snug text-ink sm:text-3xl">
              {t("request")}
            </p>
            <h2 className="mt-4 text-4xl leading-[1.08] sm:text-5xl">
              <AccentLine text={t("eventTitle")} accent={t("eventAccent")} />
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-ink-muted">{t("appeal")}</p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{t("partner")}</p>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {facts.map((fact) => (
                <div key={fact.label} className="glass rounded-2xl px-4 py-4">
                  <div className="font-data text-[10px] uppercase tracking-[0.22em] text-gold-bright">
                    {fact.label}
                  </div>
                  <p className="mt-2 text-sm leading-snug text-ink">{fact.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-gold/20 bg-gold/10 px-5 py-5">
              <div className="font-data text-[10px] uppercase tracking-[0.22em] text-gold-bright">
                {t("keynoteLabel")}
              </div>
              <p className="mt-2 font-display text-2xl italic text-ink">{t("keynote")}</p>
            </div>

            <div className="mt-6">
              <div className="font-data text-[10px] uppercase tracking-[0.22em] text-gold-bright">
                {t("guestsLabel")}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <p className="text-sm leading-relaxed text-ink">
                  {t("president")}
                  <span className="mt-1 block text-ink-faint">{t("presidentRole")}</span>
                </p>
                <p className="text-sm leading-relaxed text-ink">
                  {t("secretary")}
                  <span className="mt-1 block text-ink-faint">{t("secretaryRole")}</span>
                </p>
              </div>
            </div>

            <p className="mt-6 text-sm italic text-ink-muted">{t("presence")}</p>

            <div className="mt-8">
              <Button href={`/${locale}/donate`} size="lg">
                {t("ctaGive")}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
