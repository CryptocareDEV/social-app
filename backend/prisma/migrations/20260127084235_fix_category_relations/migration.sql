-- AddForeignKey
ALTER TABLE "CommunityCategory" ADD CONSTRAINT "CommunityCategory_categoryKey_fkey" FOREIGN KEY ("categoryKey") REFERENCES "Category"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
