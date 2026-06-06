import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button/button";
import { FAKE_AD_IDS } from "@/lib/fake-ads/ads";
import { routing } from "@/i18n/routing";
import styles from "./page.module.scss";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// Pre-render one gag page per known ad slug, per locale. Unknown slugs still
// resolve at runtime (dynamicParams) and fall back to a generic gag.
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    FAKE_AD_IDS.map((slug) => ({ locale, slug }))
  );
}

/** Resolve a gag field for the slug, falling back to the generic one. */
function gagKey(
  t: Awaited<ReturnType<typeof getTranslations>>,
  slug: string,
  field: "headline" | "body"
) {
  const key = `gag.${slug}.${field}`;
  return t.has(key) ? t(key) : t(`gag.fallback.${field}`);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "fakeAds" });
  return {
    title: gagKey(t, slug, "headline"),
    // Don't let the joke pages pollute search results.
    robots: { index: false, follow: false },
  };
}

export default async function GotchaPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("fakeAds");

  return (
    <div className={styles.page}>
      <span className={styles.fish} aria-hidden="true">
        🎣
      </span>
      <p className={styles.kicker}>{t("gagKicker")}</p>
      <h1 className={styles.headline}>{gagKey(t, slug, "headline")}</h1>
      <p className={styles.body}>{gagKey(t, slug, "body")}</p>
      <p className={styles.disclaimer}>{t("gagDisclaimer")}</p>

      <div className={styles.actions}>
        <Button href="/" size="lg">
          {t("gagBackHome")}
        </Button>
        <Button href="/how-to-play" variant="outline" size="lg">
          {t("gagLearn")}
        </Button>
      </div>
    </div>
  );
}
