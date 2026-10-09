import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hitungUSNavy, kategoriBodyFat } from "@/lib/usnavy";

// GET /api/body-metrics/:id — ambil satu record beserta hasil kalkulasi
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const record = await prisma.bodyMetrics.findUnique({
      where: { id_bm: id },
      include: { user: true },
    });

    if (!record) {
      return NextResponse.json({ error: "Record tidak ditemukan" }, { status: 404 });
    }

    // Kembalikan kategori body fat bila body_fat tersimpan
    const kategori =
      record.body_fat && record.user.kelamin
        ? kategoriBodyFat(record.body_fat, record.user.kelamin)
        : null;

    return NextResponse.json(
      {
        data: record,
        kalkulasi: record.body_fat !== null
          ? { body_fat: record.body_fat, kategori }
          : { info: "Body fat belum terhitung untuk record ini" },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data body metrics" }, { status: 500 });
  }
}

// PUT /api/body-metrics/:id — update record, hitung ulang body_fat bila data berubah
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { tb, bb, lingkar_leher, lingkar_pinggang, lingkar_pinggul, catatan } = body;

    // Cek record ada
    const existing = await prisma.bodyMetrics.findUnique({
      where: { id_bm: id },
      include: { user: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Record tidak ditemukan" }, { status: 404 });
    }

    // Gabung nilai lama + nilai baru untuk kalkulasi ulang
    const merged = {
      tb:               tb               ?? existing.tb,
      lingkar_leher:    lingkar_leher    ?? existing.lingkar_leher,
      lingkar_pinggang: lingkar_pinggang ?? existing.lingkar_pinggang,
      lingkar_pinggul:  lingkar_pinggul  ?? existing.lingkar_pinggul,
    };

    const kelamin = existing.user.kelamin;
    let body_fat: number | null = existing.body_fat;
    let kategori: string | null = null;

    const bisaHitung =
      merged.tb && merged.lingkar_leher && merged.lingkar_pinggang && kelamin &&
      (kelamin === "PRIA" || (kelamin === "WANITA" && merged.lingkar_pinggul));

    if (bisaHitung) {
      const hasil = hitungUSNavy({
        kelamin: kelamin!,
        tb: merged.tb!,
        lingkar_leher: merged.lingkar_leher!,
        lingkar_pinggang: merged.lingkar_pinggang!,
        lingkar_pinggul: merged.lingkar_pinggul ?? undefined,
      });

      if (hasil.valid) {
        body_fat = hasil.body_fat;
        kategori = kategoriBodyFat(hasil.body_fat, kelamin!);
      }
    }

    const updated = await prisma.bodyMetrics.update({
      where: { id_bm: id },
      data: {
        ...(tb !== undefined && { tb }),
        ...(bb !== undefined && { bb }),
        ...(lingkar_leher !== undefined && { lingkar_leher }),
        ...(lingkar_pinggang !== undefined && { lingkar_pinggang }),
        ...(lingkar_pinggul !== undefined && { lingkar_pinggul }),
        ...(catatan !== undefined && { catatan }),
        body_fat,
      },
    });

    return NextResponse.json(
      {
        data: updated,
        kalkulasi: body_fat !== null
          ? { body_fat, kategori }
          : { info: "Data tidak cukup untuk kalkulasi US Navy" },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Gagal mengupdate body metrics" }, { status: 500 });
  }
}

// DELETE /api/body-metrics/:id — hapus satu record
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.bodyMetrics.findUnique({ where: { id_bm: id } });
    if (!existing) {
      return NextResponse.json({ error: "Record tidak ditemukan" }, { status: 404 });
    }

    await prisma.bodyMetrics.delete({ where: { id_bm: id } });

    return NextResponse.json({ message: "Record berhasil dihapus" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus body metrics" }, { status: 500 });
  }
}
