ALTER TABLE "product" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "cost" SET DATA TYPE integer;