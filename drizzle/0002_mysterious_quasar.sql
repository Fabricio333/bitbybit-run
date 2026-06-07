CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"track_id" varchar(64) NOT NULL,
	"host_pubkey" varchar(64) NOT NULL,
	"started_at" timestamp,
	"finished_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"pubkey" varchar(64) NOT NULL,
	"position" integer NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"finish_time" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "matches_host_idx" ON "matches" USING btree ("host_pubkey");--> statement-breakpoint
CREATE INDEX "results_match_idx" ON "results" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "results_pubkey_idx" ON "results" USING btree ("pubkey");--> statement-breakpoint
CREATE UNIQUE INDEX "results_match_pubkey_idx" ON "results" USING btree ("match_id","pubkey");