import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hitungUSNavy, kategoriBodyFat } from "@/lib/usnavy";

// GET /api/body-metrics?user_id=xxx — ambil semua record body metrics milik user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json({ error: "user_id wajib disertakan sebagai query param" }, { status: 400 });
    }

    const records = await prisma.bodyMetrics.findMany({
      where: { user_id },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ data: records }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data body metrics" }, { status: 500 });
  }
}

// POST /api/body-metrics — tambah record baru, hitung body_fat otomatis bila data cukup
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      tb,
      bb,
      lingkar_leher,
      lingkar_pinggang,
      lingkar_pinggul,
      catatan,
    } = body;

    if (!user_id) {
      return NextResponse.json({ error: "user_id wajib diisi" }, { status: 400 });
    }

    // Ambil user untuk dapatkan kelamin
    const user = await prisma.user.findUnique({ where: { id_user: user_id } });
    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    // Kalkulasi US Navy bila data mencukupi
    let body_fat: number | null = null;
    let kategori: string | null = null;

    const bisaHitung =
      tb && lingkar_leher && lingkar_pinggang && user.kelamin &&
      (user.kelamin === "PRIA" || (user.kelamin === "WANITA" && lingkar_pinggul));

    if (bisaHitung) {
      const hasil = hitungUSNavy({
        kelamin: user.kelamin!,
        tb,
        lingkar_leher,
        lingkar_pinggang,
        lingkar_pinggul,
      });

      if (hasil.valid) {
        body_fat = hasil.body_fat;
        kategori = kategoriBodyFat(hasil.body_fat, user.kelamin!);
      }
    }

    const record = await prisma.bodyMetrics.create({
      data: {
        user_id,
        tb: tb ?? null,
        bb: bb ?? null,
        lingkar_leher: lingkar_leher ?? null,
        lingkar_pinggang: lingkar_pinggang ?? null,
        lingkar_pinggul: lingkar_pinggul ?? null,
        body_fat,
        catatan: catatan ?? null,
      },
    });

    return NextResponse.json(
      {
        data: record,
        kalkulasi: body_fat !== null
          ? { body_fat, kategori }
          : { info: "Data tidak cukup untuk kalkulasi US Navy. Pastikan tb, lingkar_leher, lingkar_pinggang sudah diisi dan kelamin user sudah diset." },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan body metrics" }, { status: 500 });
  }
}
