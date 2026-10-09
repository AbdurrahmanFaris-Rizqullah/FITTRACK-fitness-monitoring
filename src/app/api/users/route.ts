import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/users — ambil semua user
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json({ data: users }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data user" }, { status: 500 });
  }
}

// POST /api/users — buat user baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, tanggal_lahir, kelamin } = body;

    if (!username || typeof username !== "string" || username.trim() === "") {
      return NextResponse.json({ error: "username wajib diisi" }, { status: 400 });
    }

    if (kelamin && kelamin !== "PRIA" && kelamin !== "WANITA") {
      return NextResponse.json({ error: "kelamin harus PRIA atau WANITA" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        tanggal_lahir: tanggal_lahir ? new Date(tanggal_lahir) : null,
        kelamin: kelamin ?? null,
      },
    });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal membuat user" }, { status: 500 });
  }
}
