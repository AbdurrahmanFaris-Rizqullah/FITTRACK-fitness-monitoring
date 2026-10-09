import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/users/:id — ambil satu user beserta body metrics terakhir
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id_user: id },
      include: {
        body_metrics: {
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ data: user }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data user" }, { status: 500 });
  }
}

// PUT /api/users/:id — update data user
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { username, tanggal_lahir, kelamin } = body;

    // Cek user ada
    const existing = await prisma.user.findUnique({ where: { id_user: id } });
    if (!existing) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    if (username !== undefined && (typeof username !== "string" || username.trim() === "")) {
      return NextResponse.json({ error: "username tidak boleh kosong" }, { status: 400 });
    }

    if (kelamin !== undefined && kelamin !== null && kelamin !== "PRIA" && kelamin !== "WANITA") {
      return NextResponse.json({ error: "kelamin harus PRIA atau WANITA" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id_user: id },
      data: {
        ...(username !== undefined && { username: username.trim() }),
        ...(tanggal_lahir !== undefined && { tanggal_lahir: tanggal_lahir ? new Date(tanggal_lahir) : null }),
        ...(kelamin !== undefined && { kelamin: kelamin ?? null }),
      },
    });

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Gagal mengupdate user" }, { status: 500 });
  }
}

// DELETE /api/users/:id — hapus user beserta semua body metrics-nya
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.user.findUnique({ where: { id_user: id } });
    if (!existing) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    // Hapus body_metrics dulu karena ada foreign key
    await prisma.bodyMetrics.deleteMany({ where: { user_id: id } });
    await prisma.user.delete({ where: { id_user: id } });

    return NextResponse.json({ message: "User berhasil dihapus" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus user" }, { status: 500 });
  }
}
