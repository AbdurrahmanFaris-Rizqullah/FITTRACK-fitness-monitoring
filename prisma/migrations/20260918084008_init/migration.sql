-- CreateEnum
CREATE TYPE "Kelamin" AS ENUM ('PRIA', 'WANITA');

-- CreateTable
CREATE TABLE "User" (
    "id_user" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "tanggal_lahir" TIMESTAMP(3),
    "tb" DOUBLE PRECISION,
    "bb" DOUBLE PRECISION,
    "kelamin" "Kelamin",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "BodyMetrics" (
    "id_bm" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lingkar_leher" DOUBLE PRECISION,
    "lingkar_pinggang" DOUBLE PRECISION,
    "lingkar_pinggul" DOUBLE PRECISION,
    "body_fat" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BodyMetrics_pkey" PRIMARY KEY ("id_bm")
);

-- AddForeignKey
ALTER TABLE "BodyMetrics" ADD CONSTRAINT "BodyMetrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;
