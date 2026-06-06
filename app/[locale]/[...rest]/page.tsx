import { notFound } from "next/navigation";

// Catch-all for unknown localized paths. Calling notFound() here renders the
// localized not-found.tsx *inside* the [locale] layout (fonts, navbar, footer,
// next-intl provider) — without this, unmatched routes would fall back to
// Next's bare default 404. Explicit routes (e.g. /gotcha/[slug]) still win.
export default function CatchAllNotFound() {
  notFound();
}
