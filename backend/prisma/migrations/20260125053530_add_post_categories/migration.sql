-- CreateTable
CREATE TABLE "PostCategory" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,

    CONSTRAINT "PostCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostCategory_categoryKey_idx" ON "PostCategory"("categoryKey");

-- CreateIndex
CREATE UNIQUE INDEX "PostCategory_postId_categoryKey_key" ON "PostCategory"("postId", "categoryKey");

-- AddForeignKey
ALTER TABLE "PostCategory" ADD CONSTRAINT "PostCategory_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostCategory" ADD CONSTRAINT "PostCategory_categoryKey_fkey" FOREIGN KEY ("categoryKey") REFERENCES "Category"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
