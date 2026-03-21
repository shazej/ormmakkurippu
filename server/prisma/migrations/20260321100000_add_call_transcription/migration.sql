-- CreateEnum
CREATE TYPE "TranscriptStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "call_transcripts" (
    "id" TEXT NOT NULL,
    "call_log_id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "status" "TranscriptStatus" NOT NULL DEFAULT 'PENDING',
    "transcript_text" TEXT,
    "error_message" TEXT,
    "confidence" DOUBLE PRECISION,
    "provider" TEXT,
    "language" TEXT,
    "audio_duration_sec" INTEGER,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_analyses" (
    "id" TEXT NOT NULL,
    "call_log_id" TEXT NOT NULL,
    "transcript_id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "key_points" JSONB NOT NULL DEFAULT '[]',
    "action_items" JSONB NOT NULL DEFAULT '[]',
    "decisions" JSONB NOT NULL DEFAULT '[]',
    "follow_ups" JSONB NOT NULL DEFAULT '[]',
    "sentiment_label" TEXT,
    "sentiment_confidence" DOUBLE PRECISION,
    "sentiment_rationale" TEXT,
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "error_message" TEXT,
    "provider" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "call_transcripts_call_log_id_key" ON "call_transcripts"("call_log_id");
CREATE INDEX "call_transcripts_owner_user_id_idx" ON "call_transcripts"("owner_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "call_analyses_call_log_id_key" ON "call_analyses"("call_log_id");
CREATE UNIQUE INDEX "call_analyses_transcript_id_key" ON "call_analyses"("transcript_id");
CREATE INDEX "call_analyses_owner_user_id_idx" ON "call_analyses"("owner_user_id");

-- AddForeignKey
ALTER TABLE "call_transcripts" ADD CONSTRAINT "call_transcripts_call_log_id_fkey"
    FOREIGN KEY ("call_log_id") REFERENCES "call_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "call_transcripts" ADD CONSTRAINT "call_transcripts_owner_user_id_fkey"
    FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_analyses" ADD CONSTRAINT "call_analyses_call_log_id_fkey"
    FOREIGN KEY ("call_log_id") REFERENCES "call_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "call_analyses" ADD CONSTRAINT "call_analyses_transcript_id_fkey"
    FOREIGN KEY ("transcript_id") REFERENCES "call_transcripts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "call_analyses" ADD CONSTRAINT "call_analyses_owner_user_id_fkey"
    FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
