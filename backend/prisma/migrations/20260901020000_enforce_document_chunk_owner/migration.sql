/*
  Enforces DocumentChunk.userId at the database level.

  DocumentChunk.userId is denormalized from Injury.userId so retrieval can
  filter by user without joining through Injury on every query. The original
  foreign key only covered injuryId, so nothing stopped a chunk's userId from
  disagreeing with the injury it points at -- a bug anywhere in the write path
  could insert a chunk whose userId names a different user than the injury's
  real owner, and retrieval trusts DocumentChunk.userId on its own, so that
  row would then surface in another user's answers.

  This adds a compound unique key on Injury(id, userId) and repoints the
  foreign key at (injuryId, userId) so Postgres rejects any insert or update
  where they disagree.
*/

-- CreateIndex
CREATE UNIQUE INDEX "Injury_id_userId_key" ON "Injury"("id", "userId");

-- DropForeignKey
ALTER TABLE "DocumentChunk" DROP CONSTRAINT "DocumentChunk_injuryId_fkey";

-- AddForeignKey
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_injuryId_userId_fkey" FOREIGN KEY ("injuryId", "userId") REFERENCES "Injury"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
