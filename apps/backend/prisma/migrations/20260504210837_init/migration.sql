-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "shutdownRitualTime" TEXT NOT NULL DEFAULT '21:00',
    "weeklyReviewDay" INTEGER NOT NULL DEFAULT 0,
    "fontSize" TEXT NOT NULL DEFAULT 'medium',
    "highContrast" BOOLEAN NOT NULL DEFAULT false,
    "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
    "dyslexiaFont" BOOLEAN NOT NULL DEFAULT false,
    "checkInReminders" BOOLEAN NOT NULL DEFAULT true,
    "shutdownRitual" BOOLEAN NOT NULL DEFAULT true,
    "weeklyReview" BOOLEAN NOT NULL DEFAULT true,
    "insightAlerts" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emotional_checkins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "energyLevel" INTEGER NOT NULL,
    "valence" TEXT NOT NULL,
    "feelingLabel" TEXT,
    "bodySensationNote" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emotional_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "linkedCheckIns" TEXT[],
    "aiPromptUsed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insights" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "dataPoints" TEXT[],
    "dismissedAt" TIMESTAMP(3),
    "actedUponAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'daily',
    "streak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "deadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "parentGoalId" TEXT,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "goalId" TEXT,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "estimatedDuration" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "contextRequirements" TEXT[],

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dopamine_menu_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instructions" TEXT[],
    "estimatedDuration" INTEGER NOT NULL,
    "effectivenessScore" DOUBLE PRECISION,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "dopamine_menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_checkins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bodyScan" JSONB NOT NULL,
    "emotionWheelFeeling" TEXT NOT NULL,
    "emotionWheelValence" TEXT NOT NULL,
    "aiHypothesis" TEXT,
    "reflectionRating" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "body_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "somatic_mappings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sensationPattern" JSONB NOT NULL,
    "predictedEmotion" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "occurrences" INTEGER NOT NULL DEFAULT 1,
    "lastValidatedAt" TIMESTAMP(3),

    CONSTRAINT "somatic_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sleep_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "durationHours" DOUBLE PRECISION NOT NULL,
    "qualityScore" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',

    CONSTRAINT "sleep_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spaces" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "space_scans" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "beforePhotoUri" TEXT NOT NULL,
    "afterPhotoUri" TEXT,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "space_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detected_items" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "decision" TEXT NOT NULL DEFAULT 'undecided',
    "decidedAt" TIMESTAMP(3),
    "estimatedValueCents" INTEGER,
    "category" TEXT,

    CONSTRAINT "detected_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capture_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'app',
    "classificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "classifiedModule" TEXT,
    "classifiedType" TEXT,
    "classifiedConfidence" DOUBLE PRECISION,
    "tags" TEXT[],

    CONSTRAINT "capture_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "area" TEXT,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "taskIds" TEXT[],

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "paraCategory" TEXT NOT NULL,
    "tags" TEXT[],
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "relatedProjectIds" TEXT[],

    CONSTRAINT "knowledge_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE INDEX "emotional_checkins_userId_timestamp_idx" ON "emotional_checkins"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "journal_entries_userId_createdAt_idx" ON "journal_entries"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "insights_userId_createdAt_idx" ON "insights"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "habits_userId_idx" ON "habits"("userId");

-- CreateIndex
CREATE INDEX "goals_userId_status_idx" ON "goals"("userId", "status");

-- CreateIndex
CREATE INDEX "tasks_userId_completed_idx" ON "tasks"("userId", "completed");

-- CreateIndex
CREATE INDEX "dopamine_menu_items_userId_category_idx" ON "dopamine_menu_items"("userId", "category");

-- CreateIndex
CREATE INDEX "body_checkins_userId_timestamp_idx" ON "body_checkins"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "somatic_mappings_userId_idx" ON "somatic_mappings"("userId");

-- CreateIndex
CREATE INDEX "sleep_logs_userId_date_idx" ON "sleep_logs"("userId", "date");

-- CreateIndex
CREATE INDEX "spaces_userId_idx" ON "spaces"("userId");

-- CreateIndex
CREATE INDEX "space_scans_spaceId_scannedAt_idx" ON "space_scans"("spaceId", "scannedAt");

-- CreateIndex
CREATE INDEX "detected_items_scanId_idx" ON "detected_items"("scanId");

-- CreateIndex
CREATE INDEX "capture_items_userId_classificationStatus_idx" ON "capture_items"("userId", "classificationStatus");

-- CreateIndex
CREATE INDEX "projects_userId_status_idx" ON "projects"("userId", "status");

-- CreateIndex
CREATE INDEX "knowledge_items_userId_paraCategory_idx" ON "knowledge_items"("userId", "paraCategory");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emotional_checkins" ADD CONSTRAINT "emotional_checkins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dopamine_menu_items" ADD CONSTRAINT "dopamine_menu_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_checkins" ADD CONSTRAINT "body_checkins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "somatic_mappings" ADD CONSTRAINT "somatic_mappings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sleep_logs" ADD CONSTRAINT "sleep_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_scans" ADD CONSTRAINT "space_scans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_scans" ADD CONSTRAINT "space_scans_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detected_items" ADD CONSTRAINT "detected_items_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "space_scans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capture_items" ADD CONSTRAINT "capture_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
