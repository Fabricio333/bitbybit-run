import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { Pixelify_Sans, Nunito_Sans } from "next/font/google";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/lib/contexts/theme-context";
import { Navbar } from "@/components/layout/navbar/navbar";
import { SiteFooter } from "@/components/layout/footer/site-footer";
import { FakeAds } from "@/components/layout/fake-ads/fake-ads";
import { SignerProviderClient } from "@/components/auth/signer-provider-client";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { getSession } from "@/lib/auth";
import { getUserByPubkey } from "@/lib/creator/users";
import type { SessionUser } from "@/lib/contexts/signer-context";
import { cn } from "@/lib/utils";
import "@/styles/globals.scss";

/**
 * Read the session from the request cookie and resolve the user row so
 * the navbar renders the correct signed-in/out state on first paint
 * instead of flashing the anonymous state until the client-side
 * `/api/auth/session` fetch resolves. Best-effort: a DB hiccup falls
 * back to a session with no user row rather than failing the layout.
 */
async function resolveInitialSession(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;
  try {
    const user = await getUserByPubkey(session.pubkey);
    return {
      pubkey: session.pubkey,
      locale: session.locale,
      signer_type: session.signer_type,
      user:
        user && user.active
          ? {
              id: user.id,
              slug: user.slug,
              display_name: user.display_name,
              avatar_url: user.avatar_url,
              lud16: user.lud16,
            }
          : null,
    };
  } catch {
    return {
      pubkey: session.pubkey,
      locale: session.locale,
      signer_type: session.signer_type,
      user: null,
    };
  }
}

const pixel = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#dd7a3c",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: {
      default: t("siteTitle"),
      template: `%s · ${t("siteName")}`,
    },
    description: t("description"),
    applicationName: t("siteName"),
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: t("siteName"),
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "es" | "en")) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: "metadata" });
  const initialSession = await resolveInitialSession();

  return (
    <html
      lang={locale}
      className={cn(pixel.variable, nunitoSans.variable)}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <SignerProviderClient initialSession={initialSession}>
              <ServiceWorkerRegister />
              <a href="#main" className="skip-link">
                {t("skipToContent")}
              </a>
              <Navbar />
              <main id="main">{children}</main>
              <FakeAds />
              <SiteFooter />
            </SignerProviderClient>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
