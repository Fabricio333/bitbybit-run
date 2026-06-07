ALTER TABLE "matches" ADD COLUMN "nostr_id" varchar(80) NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_nostr_id_unique" UNIQUE("nostr_id");