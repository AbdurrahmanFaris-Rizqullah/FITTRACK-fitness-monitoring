/*
  Warnings:

  - You are about to drop the column `bb` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `tb` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BodyMetrics" ADD COLUMN     "bb" DOUBLE PRECISION,
ADD COLUMN     "tb" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "bb",
DROP COLUMN "tb";
