import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { HowToPlayContent } from "@/components/how-to-play/how-to-play-content";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "howToPlay" });
  return { title: t("title") };
}

export default async function HowToPlayPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Container>
      <HowToPlayContent />
    </Container>
  );
}
