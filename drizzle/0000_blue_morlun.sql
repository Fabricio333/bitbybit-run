CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pubkey" varchar(64) NOT NULL,
	"slug" varchar(40) NOT NULL,
	"display_name" varchar(80) NOT NULL,
	"bio" text,
	"avatar_url" text,
	"banner_url" text,
	"locale" varchar(2) DEFAULT 'es' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_pubkey_unique" UNIQUE("pubkey"),
	CONSTRAINT "users_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "users_pubkey_idx" ON "users" USING btree ("pubkey");--> statement-breakpoint
CREATE UNIQUE INDEX "users_slug_idx" ON "users" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "users_active_idx" ON "users" USING btree ("active");