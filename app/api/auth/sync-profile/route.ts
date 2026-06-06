import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchKind0Profile } from "@/lib/nostr/profile";
import { syncUserFromKind0 } from "@/lib/creator/users";

/**
 * Manual "sync profile from Nostr". Re-fetches the signed-in user's
 * kind:0 metadata and overwrites name/avatar/lightning on their row —
 * Nostr is the source of truth (there's no in-app profile editor).
 */
export async function POST(): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const profile = await fetchKind0Profile(session.pubkey);
    const user = await syncUserFromKind0(session.pubkey, profile);
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        slug: user.slug,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        lud16: user.lud16,
      },
    });
  } catch (err) {
    console.warn(
      `[auth/sync-profile] failed for ${session.pubkey}:`,
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ error: "sync_failed" }, { status: 502 });
  }
}
