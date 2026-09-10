# Implementation Plan: Body Metrics

## Overview

Implementasi modul Body Metrics sebagai full-stack feature menggunakan Next.js App Router dengan TypeScript. Urutan task mengikuti pendekatan bottom-up: dependencies & tooling → database schema → auth → foundation layer (types, calculator, validation) → API route handlers → custom hook → komponen UI → integrasi halaman → property tests konsistensi data → integration tests. Semua kalkulasi berjalan sebagai pure functions di client-side; data persisten menggunakan PostgreSQL melalui Prisma ORM dan diakses melalui Next.js Route Handlers yang dilindungi NextAuth.js v5.

## Tasks

- [ ] 1. Setup dependencies dan konfigurasi tooling
  - [ ] 1.1 Install runtime dependencies
    - Jalankan: `npm install prisma @prisma/client next-auth@beta zod recharts date-fns bcryptjs`
    - Verifikasi versi yang terpasang setelah install
    - _Requirements: Design doc — Architecture decisions_
  - [ ] 1.2 Install dev dependencies
    - Jalankan: `npm install -D vitest @vitest/ui fast-check @testing-library/react @testing-library/user-event msw jsdom @vitest/coverage-v8 @types/bcryptjs`
    - _Requirements: Design doc — Testing Strategy_
  - [ ] 1.3 Konfigurasi Vitest di `vitest.config.ts` dan update `package.json` scripts
    - Buat `vitest.config.ts` di root project dengan environment `jsdom` dan `globals: true`
    - Tambahkan scripts `"test": "vitest run"` dan `"test:watch": "vitest"` ke `package.json`
    - _Requirements: Design doc — Test Runner_
  - [ ] 1.4 Inisialisasi Prisma
    - Jalankan: `npx prisma init`
    - Set `DATABASE_URL` di `.env` (PostgreSQL connection string)
    - Pastikan `.env` sudah masuk ke `.gitignore`
    - _Requirements: Design doc — Persistent storage_

- [ ] 2. Database schema dan Prisma setup
  - [ ] 2.1 Tulis `prisma/schema.prisma` dengan model User dan BodyMetricsEntry
    - Model `User`: `id` (CUID), `email` (unique), `name?`, `hashedPassword?`, `createdAt`, `updatedAt`, relasi `bodyMetrics BodyMetricsEntry[]`
    - Model `BodyMetricsEntry`: semua field sesuai design doc — `id`, `userId`, `measurementDate @db.Date`, `height`, `weight`, `gender`, semua circumference optional, `notes @db.VarChar(500)?`, `bodyFatPercentage?`, `bmi?`, `bodyCompositionCategory?`, `createdAt`, `updatedAt`
    - Tambahkan `@@unique([userId, measurementDate])` dan `@@index([userId, measurementDate(sort: Desc)])`
    - Tambahkan `onDelete: Cascade` pada relasi User
    - _Requirements: 6.1, 6.2, Design doc — Database Schema_
  - [ ] 2.2 Buat `src/lib/prisma.ts` — Prisma client singleton
    - Implementasikan global singleton pattern untuk menghindari multiple connections di development (hot reload)
    - Set `log: ['query', 'error', 'warn']` untuk development, `['error']` untuk production
    - _Requirements: Design doc — Prisma Client Singleton_
  - [ ] 2.3 Jalankan Prisma migration
    - Jalankan: `npx prisma migrate dev --name init`
    - Verifikasi tabel `users` dan `body_metrics_entries` terbuat di database
    - _Requirements: 6.1, 6.2_

- [ ] 3. NextAuth.js v5 setup dan halaman autentikasi
  - [ ] 3.1 Buat `auth.ts` di root project — konfigurasi NextAuth v5
    - Import `NextAuth` dari `next-auth` dan `Credentials` dari `next-auth/providers/credentials`
    - Konfigurasi Credentials provider: authorize function dengan `prisma.user.findUnique` + `bcryptjs.compare`
    - Set `session.strategy: 'jwt'` dan definisikan `callbacks.jwt` + `callbacks.session` agar `session.user.id` tersedia
    - Export `{ handlers, auth, signIn, signOut }`
    - _Requirements: Design doc — Auth guard pattern_
  - [ ] 3.2 Buat `src/app/api/auth/[...nextauth]/route.ts`
    - Re-export `handlers` dari `auth.ts`: `export const { GET, POST } = handlers`
    - _Requirements: Design doc — NextAuth v5 setup_
  - [ ] 3.3 Buat `middleware.ts` di root project
    - Gunakan `auth` dari `auth.ts` sebagai middleware
    - Proteksi route: `/body-metrics` dan `/api/body-metrics/:path*`
    - Redirect unauthenticated user ke `/auth/login`
    - _Requirements: Design doc — Auth guard_
  - [ ] 3.4 Buat `src/app/api/auth/register/route.ts` untuk registrasi user baru
    - Validasi input (email, password, name) dengan Zod
    - Hash password dengan `bcryptjs.hash(password, 12)`
    - Buat user baru via `prisma.user.create`
    - Handle duplicate email: return `400` dengan pesan yang sesuai
    - Return `201` saat berhasil
    - _Requirements: Design doc — Auth_
  - [ ] 3.5 Buat `src/app/auth/login/page.tsx` — halaman login
    - Direktif `'use client'`
    - Form dengan field email dan password
    - Submit memanggil `signIn('credentials', { email, password, redirectTo: '/body-metrics' })`
    - Tampilkan error jika login gagal
    - Link ke halaman register
    - _Requirements: Design doc — Auth_
  - [ ] 3.6 Buat `src/app/auth/register/page.tsx` — halaman registrasi
    - Direktif `'use client'`
    - Form dengan field name, email, password, dan confirm password
    - Submit POST ke `/api/auth/register`, redirect ke `/auth/login` jika berhasil
    - Tampilkan error jika registrasi gagal (email sudah terdaftar, dll.)
    - Link ke halaman login
    - _Requirements: Design doc — Auth_

- [ ] 4. Foundation layer — Types, Calculator, Validation
  - [ ] 4.1 Buat `src/app/body-metrics/_lib/types.ts` dengan semua TypeScript types
    - Definisikan: `Gender`, `TimeRange`, `BodyCompositionCategory`
    - Definisikan: `BodyMetricsEntry` — semua field termasuk `id: string` (CUID), `userId: string`, `measurementDate: string` (YYYY-MM-DD), semua circumference optional, calculated fields optional
    - Definisikan: `CalculationResult`, `CalculationError`, `CalculationOutput`
    - Definisikan: `ApiResponse<T>` — union type `{ success: true; data: T } | { success: false; error: string; fieldErrors?: Record<string, string[]> }`
    - Definisikan: `CreateEntryPayload` — payload untuk POST /api/body-metrics
    - Definisikan: `BodyMetricsState` — `{ entries, isLoading, error }`
    - Definisikan: `BodyMetricsFormData` — semua field sebagai string (form state)
    - **TIDAK ADA** `StorageSchema`, `QuotaExceededError`, atau localStorage-related types
    - _Requirements: 1.x, 2.x, 3.x, 6.x_

  - [ ] 4.2 Buat `src/app/body-metrics/_lib/calculator.ts` dengan pure functions kalkulasi
    - Implementasikan: `calculateMaleBodyFat(height, neck, abdomen)` — US Navy formula pria: `86.010 × log10(abdomen - neck) − 70.041 × log10(height) + 36.76`
    - Implementasikan: `calculateFemaleBodyFat(height, neck, waist, hip)` — US Navy formula wanita: `163.205 × log10(waist + hip - neck) − 97.684 × log10(height) − 78.387`
    - Implementasikan: `calculateBMI(weight, height)` — `weight / (height / 100)²`
    - Implementasikan: `getCategory(gender, bodyFatPercentage)` — klasifikasi ACSM
    - Implementasikan: `roundHalfUp(value, decimals)` — half-up rounding
    - Guard: `abdomen <= neck` → return `{ success: false, error: { type: 'INVALID_GEOMETRY', ... } }`
    - Guard: `(waist + hip - neck) <= 0` → return `{ success: false, error: { type: 'INVALID_GEOMETRY', ... } }`
    - Guard: input nol/negatif/NaN → return `{ success: false, error: { type: 'INVALID_INPUT', ... } }`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.9_

  - [ ]* 4.3 Tulis property tests untuk `calculator.ts` — Properties 6, 7, 8, 9
    - **Property 6: Male body fat formula correctness** — `fc.float` height/neck/abdomen, `fc.pre(abdomen > neck)`, bandingkan output dengan formula yang dihitung manual
    - **Property 7: Female body fat formula correctness** — `fc.float` height/neck/waist/hip, `fc.pre((waist+hip-neck) > 0)`, bandingkan dengan formula
    - **Property 8: BMI formula correctness** — `fc.float` weight `[1,500]` dan height `[50,300]`, bandingkan dengan `roundHalfUp(w / (h/100)², 2)`
    - **Property 9: Calculator determinism** — input identik selalu menghasilkan output identik (`{ numRuns: 200 }`)
    - Tag setiap test: `// Feature: body-metrics, Property N: <text>`
    - File: `src/app/body-metrics/__tests__/calculator.property.test.ts`
    - _Requirements: 3.1, 3.2, 3.3, 3.7, 3.8_

  - [ ]* 4.4 Tulis unit tests untuk `calculator.ts`
    - Test: `abdomen <= neck` → error INVALID_GEOMETRY
    - Test: `(waist + hip - neck) <= 0` → error INVALID_GEOMETRY
    - Test: input negatif/nol/NaN → error INVALID_INPUT
    - Test: nilai ACSM boundary pria (5.9 → underfat, 6.0 → normal, 17.0 → normal, 17.1 → overfat, 24.9 → overfat, 25.0 → obese)
    - Test: nilai ACSM boundary wanita (analog)
    - Test: `roundHalfUp(2.345, 2) === 2.35`
    - File: `src/app/body-metrics/__tests__/calculator.unit.test.ts`
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.9_

  - [ ] 4.5 Buat `src/app/body-metrics/_lib/validation.ts` — Zod schema untuk client DAN server
    - Definisikan `createEntrySchema` dengan semua field sesuai requirements
    - Validasi `measurementDate`: format YYYY-MM-DD, tidak di masa depan
    - Validasi `height`: numerik, 100–250 cm
    - Validasi `weight`: numerik, 20–300 kg
    - Validasi `gender`: enum `'male' | 'female'`, wajib
    - Validasi `neckCircumference`: 20–60 cm, wajib
    - Validasi `abdomenCircumference`: 50–200 cm, wajib jika gender `'male'`
    - Validasi `waistCircumference`: 40–200 cm, wajib jika gender `'female'`
    - Validasi `hipCircumference`: 50–200 cm, wajib jika gender `'female'`
    - Validasi `thighCircumference`: 30–120 cm, opsional
    - Validasi `chestCircumference`: 50–200 cm, opsional
    - Validasi `notes`: max 500 karakter, opsional
    - Definisikan `updateEntrySchema` sebagai partial dari `createEntrySchema` (untuk PATCH)
    - Definisikan helper `isPrismaUniqueConstraintError(e)` untuk deteksi error P2002
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.7, 1.8, 1.9, 1.10, 1.11, 2.1–2.10_

  - [ ]* 4.6 Tulis property tests untuk `validation.ts` — Properties 1, 2, 3, 4, 5
    - **Property 1: Height range validation** — `fc.float`, accept iff `100 ≤ h ≤ 250`
    - **Property 2: Weight range validation** — `fc.float`, accept iff `20 ≤ w ≤ 300`
    - **Property 3: Non-numeric input rejection** — `fc.string` non-numeric, selalu reject
    - **Property 4: Future date rejection** — generate tanggal masa depan via `fc.date`, selalu ditolak
    - **Property 5: Notes length constraint** — `fc.string`, accept iff `length ≤ 500`
    - File: `src/app/body-metrics/__tests__/validation.property.test.ts`
    - _Requirements: 1.2, 1.3, 1.5, 1.10, 1.11_

  - [ ]* 4.7 Tulis unit tests untuk `validation.ts`
    - Test: setiap field di boundary valid/invalid (100, 99.9, 250, 250.1 untuk height, dst.)
    - Test: tanggal hari ini → valid, tanggal besok → invalid
    - Test: gender `'male'` tanpa `abdomenCircumference` → error
    - Test: gender `'female'` tanpa `hipCircumference` → error
    - Test: notes tepat 500 karakter → valid, 501 karakter → invalid
    - File: `src/app/body-metrics/__tests__/validation.unit.test.ts`
    - _Requirements: 1.2, 1.3, 1.7, 1.8, 1.9, 1.10, 1.11, 2.7, 2.8, 2.9, 2.10_

- [ ] 5. Checkpoint — Verifikasi foundation layer
  - Jalankan `npm test` — semua tests di task 4 harus lulus.
  - Jalankan `npx tsc --noEmit` — tidak ada TypeScript error.
  - Tanyakan ke user jika ada pertanyaan sebelum melanjutkan.

- [ ] 6. API Route Handlers
  - [ ] 6.1 Buat `src/app/api/body-metrics/route.ts` — GET dan POST handler
    - **GET**: panggil `auth()`, return `401` jika no session; query `prisma.bodyMetricsEntry.findMany` dengan filter `userId: session.user.id` dan optional `from`/`to` dari query params; return `200 ApiResponse<BodyMetricsEntry[]>`
    - **POST**: panggil `auth()`, return `401` jika no session; parse body, validasi dengan `createEntrySchema.safeParse()`, return `400` jika gagal; `prisma.bodyMetricsEntry.create` dengan `{ ...validated.data, userId: session.user.id }`; handle Prisma P2002 → return `400 DUPLICATE_DATE`; return `201 ApiResponse<BodyMetricsEntry>`
    - _Requirements: 6.1, 6.2, Design doc — API Routes_

  - [ ] 6.2 Buat `src/app/api/body-metrics/[id]/route.ts` — PATCH dan DELETE handler
    - **PATCH**: `auth()` → `401`; `prisma.findUnique({ where: { id } })` → `404` jika tidak ada; cek `existing.userId !== session.user.id` → `403`; validasi body dengan `updateEntrySchema`; `prisma.update`; handle P2002 → `400 DUPLICATE_DATE`; return `200 ApiResponse<BodyMetricsEntry>`
    - **DELETE**: `auth()` → `401`; `findUnique` → `404`; ownership check → `403`; `prisma.delete`; return `204 No Content` (`new Response(null, { status: 204 })`)
    - _Requirements: 6.1, 6.2, Design doc — API Routes_

  - [ ]* 6.3 Tulis unit tests untuk API route handlers
    - Mock `auth()` dari `auth.ts` dan `prisma` dari `src/lib/prisma.ts` menggunakan `vi.mock()`
    - Test GET: 401 saat no session; 200 dengan data entries; filter `from`/`to` diapply
    - Test POST: 401 no session; 400 validation error; 400 DUPLICATE_DATE (P2002); 201 created
    - Test PATCH: 401 no session; 404 not found; 403 forbidden (userId mismatch); 400 validation; 400 DUPLICATE_DATE; 200 updated
    - Test DELETE: 401 no session; 404 not found; 403 forbidden; 204 no content; 500 on DB error
    - File: `src/app/body-metrics/__tests__/apiRoutes.unit.test.ts`
    - _Requirements: 6.1, 6.2, Design doc — API Routes_

- [ ] 7. Custom hook `useBodyMetrics`
  - [ ] 7.1 Buat `src/app/body-metrics/_hooks/useBodyMetrics.ts`
    - Direktif `'use client'`
    - State: `{ entries: BodyMetricsEntry[], isLoading: boolean, error: string | null }`
    - `useEffect` saat mount: `fetch('/api/body-metrics')`, set `isLoading: false`; jika response `401` → `window.location.href = '/auth/login'`; update state dengan data atau error
    - `saveEntry(payload: CreateEntryPayload)`: POST ke `/api/body-metrics`, update state jika sukses (prepend + sort descending), return `{ success, error? }`
    - `deleteEntry(id: string)`: DELETE ke `/api/body-metrics/${id}`, update state jika `204`, return `{ success }`
    - `updateEntry(id, payload)`: PATCH ke `/api/body-metrics/${id}`, update state jika sukses (replace entry), return `{ success }`
    - Gunakan `useCallback` untuk semua mutation functions
    - **Tidak ada** localStorage, `storage.ts`, `StorageSchema`, atau `QuotaExceededError`
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

  - [ ]* 7.2 Tulis integration tests untuk `useBodyMetrics` dengan MSW
    - Setup MSW server (`setupServer`) dengan handlers untuk semua 4 endpoints
    - Test: mount hook → GET dipanggil, entries ter-load, `isLoading` jadi `false`
    - Test: `saveEntry` → POST dipanggil → entry muncul di state (sorted descending)
    - Test: `deleteEntry` → DELETE dipanggil → entry hilang dari state
    - Test: `updateEntry` → PATCH dipanggil → entry ter-update di state
    - Test: GET return `401` → `window.location.href` di-set ke `/auth/login`
    - Test: network error → `error` state ter-set dengan pesan "Gagal memuat data"
    - File: `src/app/body-metrics/__tests__/useBodyMetrics.integration.test.ts`
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [ ] 8. Komponen InputForm
  - [ ] 8.1 Buat `src/app/body-metrics/_components/InputForm/FormField.tsx`
    - Props: `label`, `name`, `value`, `onChange`, `error?`, `type?`, `min?`, `max?`, `step?`, `required?`, `hint?`
    - Render label, input, dan pesan error di bawah field
    - Accessibility: `htmlFor` + `id` matching, `aria-describedby` untuk error message, `aria-invalid` saat ada error
    - _Requirements: 1.7, 1.8, 1.9, 1.10, 2.7_

  - [ ] 8.2 Buat `src/app/body-metrics/_components/InputForm/BasicInputSection.tsx`
    - Fields: `measurementDate` (date input, default hari ini, `max={today}`), `height` (number, 100–250), `weight` (number, 20–300), `gender` (radio: Pria/Wanita, tanpa nilai default), `notes` (textarea, max 500, tampilkan hitungan karakter)
    - Gunakan `FormField` untuk setiap field
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 8.3 Buat `src/app/body-metrics/_components/InputForm/CircumferenceSection.tsx`
    - Fields kondisional berdasarkan `gender` prop:
      - Selalu tampil: `neckCircumference` (20–60 cm, wajib)
      - Jika `male`: `abdomenCircumference` (50–200 cm, wajib)
      - Jika `female`: `waistCircumference` (40–200 cm, wajib), `hipCircumference` (50–200 cm, wajib)
      - Selalu tampil (opsional): `thighCircumference` (30–120 cm), `chestCircumference` (50–200 cm)
    - Tampilkan section hanya jika gender sudah dipilih
    - Gunakan `FormField` untuk setiap field
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ] 8.4 Buat `src/app/body-metrics/_components/InputForm/InputForm.tsx`
    - Direktif `'use client'`
    - Props: `onEntrySaved: (entry: BodyMetricsEntry) => void`
    - State form lokal via `useState` dengan tipe `BodyMetricsFormData`
    - Submit handler: parse string → number, panggil `createEntrySchema.safeParse()`, tampilkan error per field jika gagal, scroll ke field pertama yang error via `useRef`
    - Jika validasi sukses: jalankan calculator (male/female sesuai gender), bangun `CreateEntryPayload`, panggil `onEntrySaved`
    - Tampilkan hasil kalkulasi (body fat %, BMI, kategori ACSM) setelah validasi client sukses
    - Handle duplicate date (`DUPLICATE_DATE`): tampilkan dialog pilihan "Perbarui" / "Batal"
    - Notifikasi sukses: toast selama 3 detik dengan `measurementDate` (Requirement 6.3)
    - Handle calculator geometry error: tampilkan toast error, jangan kirim ke API
    - _Requirements: 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 2.7, 2.8, 2.9, 2.10, 3.9, 6.1, 6.3_

  - [ ]* 8.5 Tulis unit tests untuk komponen InputForm
    - Test: render field dasar (date, height, weight, gender)
    - Test: gender `'male'` → tampil `abdomenCircumference`, tidak tampil `waistCircumference`
    - Test: gender `'female'` → tampil `waistCircumference` + `hipCircumference`
    - Test: submit form kosong → pesan error per field wajib
    - Test: height di luar range → pesan error "Tinggi badan harus antara 100 cm dan 250 cm"
    - Test: tanggal masa depan → pesan error "Tanggal pengukuran tidak boleh di masa depan"
    - File: `src/app/body-metrics/__tests__/InputForm.test.tsx`
    - _Requirements: 1.1–1.11, 2.1–2.10_

- [ ] 9. Komponen TrendChart
  - [ ] 9.1 Buat `src/app/body-metrics/_components/TrendChart/TimeRangeSelector.tsx`
    - 4 tombol/tab: Harian (7 hari), Mingguan (12 minggu), Bulanan (12 bulan), Tahunan (5 tahun)
    - Props: `value: TimeRange`, `onChange: (range: TimeRange) => void`
    - Tandai opsi aktif secara visual
    - _Requirements: 4.3, 4.4_

  - [ ] 9.2 Buat `src/app/body-metrics/_components/TrendChart/EmptyChartState.tsx`
    - Tampilkan pesan "Tidak ada data untuk rentang waktu yang dipilih"
    - Props: `timeRange: TimeRange` (untuk pesan kontekstual)
    - _Requirements: 4.5_

  - [ ] 9.3 Buat fungsi `filterByTimeRange` di `src/app/body-metrics/_lib/chartUtils.ts`
    - Filter entries berdasarkan `TimeRange`: `daily` = 7 hari, `weekly` = 84 hari (12 minggu), `monthly` = 365 hari, `yearly` = 5 × 365 hari
    - Sort hasil ascending by `measurementDate` (gunakan `String.localeCompare`)
    - Return tipe `BodyMetricsEntry[]`
    - _Requirements: 4.4_

  - [ ]* 9.4 Tulis property tests untuk `filterByTimeRange` — Properties 11, 12
    - **Property 11: Chart data sorted ascending** — untuk semua dataset, semua titik data terurut ascending by `measurementDate`
    - **Property 12: Time range filter correctness** — tidak ada entry di luar window, semua entry dalam window muncul
    - File: `src/app/body-metrics/__tests__/chartUtils.property.test.ts`
    - _Requirements: 4.1, 4.2, 4.4_

  - [ ] 9.5 Buat `src/app/body-metrics/_components/TrendChart/TrendChart.tsx`
    - Direktif `'use client'`
    - Gunakan `ResponsiveContainer`, `LineChart`, `Line`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend` dari Recharts
    - Dua line: `bodyFatPercentage` (warna biru) dan `weight` (warna hijau)
    - Format label sumbu X sesuai `TimeRange`: `DD/MM` (daily), `Minggu ke-N` (weekly), nama bulan singkat (monthly), `YYYY` (yearly)
    - Sumbu Y: auto-scale dengan padding 10% di atas/bawah nilai min/max
    - Tooltip: tampilkan nilai + `measurementDate`
    - Single data point (exactly 1 entry): render sebagai dot marker dengan label nilai, bukan garis
    - Jika filtered entries kosong: tampilkan `EmptyChartState`
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

  - [ ]* 9.6 Tulis unit tests untuk `TrendChart`
    - Test: tidak ada data → render `EmptyChartState`
    - Test: satu data point → render marker, bukan garis
    - Test: ganti `timeRange` → data difilter ulang
    - File: `src/app/body-metrics/__tests__/TrendChart.test.tsx`
    - _Requirements: 4.1, 4.4, 4.5, 4.9_

- [ ] 10. Komponen HistoryView
  - [ ] 10.1 Buat `src/app/body-metrics/_components/HistoryView/DeleteConfirmDialog.tsx`
    - Props: `entry: BodyMetricsEntry`, `onConfirm: () => void`, `onCancel: () => void`, `isOpen: boolean`
    - Tampilkan `measurementDate` dari entry yang akan dihapus
    - Tombol "Hapus" (destructive) dan "Batal"
    - Accessible: focus trap, `role="dialog"`, `aria-labelledby`
    - _Requirements: 5.5_

  - [ ] 10.2 Buat `src/app/body-metrics/_components/HistoryView/EntryDetailModal.tsx`
    - Props: `entry: BodyMetricsEntry | null`, `onClose: () => void`, `isOpen: boolean`
    - Tampilkan semua field lengkap: semua circumference + notes + body fat % + BMI + kategori ACSM
    - Handle `entry === null`: tampilkan error state di area detail, list tidak berubah
    - Accessible: `role="dialog"`, `aria-modal="true"`, close button dengan `aria-label`
    - _Requirements: 5.4, 5.10_

  - [ ] 10.3 Buat `src/app/body-metrics/_components/HistoryView/HistoryTable.tsx`
    - Props: `entries: BodyMetricsEntry[]`, `onSelect: (entry: BodyMetricsEntry) => void`, `onDeleteRequest: (entry: BodyMetricsEntry) => void`
    - Kolom: Tanggal Pengukuran, Berat (kg), Body Fat % (ditampilkan jika tersedia), BMI
    - Setiap baris clickable → `onSelect`
    - Tombol hapus per baris → `onDeleteRequest`
    - _Requirements: 5.1, 5.2_

  - [ ] 10.4 Buat `src/app/body-metrics/_components/HistoryView/HistoryView.tsx`
    - Props: `entries: BodyMetricsEntry[]`, `onDelete: (id: string) => Promise<void>`, `onSelect: (entry: BodyMetricsEntry) => void`, `isLoading: boolean`
    - Sort entries descending by `measurementDate` sebelum render
    - Pagination: 20 entry per halaman, tampilkan kontrol prev/next jika total > 20
    - Tampilkan jumlah total entry
    - Empty state: pesan "Belum ada data pengukuran. Mulai tambahkan data pertama Anda." + link ke form
    - Kelola state: `selectedEntry`, `entryToDelete`, `currentPage`
    - Render `HistoryTable`, `EntryDetailModal`, `DeleteConfirmDialog`
    - Handle delete error: tampilkan toast error, pertahankan entry di list
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_

  - [ ]* 10.5 Tulis property tests untuk `HistoryView` — Properties 13, 14, 15
    - **Property 13: History view sorted descending** — untuk semua dataset, semua entries selalu diurutkan newest-first
    - **Property 14: History view data completeness** — setiap entry dengan `weight`, `bodyFatPercentage`, `bmi` harus menampilkan keempat kolom
    - **Property 15: Pagination invariant** — halaman ke-k berisi `min(N - k×20, 20)` entries
    - File: `src/app/body-metrics/__tests__/HistoryView.property.test.ts`
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 10.6 Tulis unit tests untuk `HistoryView`
    - Test: empty state saat entries kosong
    - Test: pagination muncul saat entries > 20
    - Test: klik delete → dialog konfirmasi muncul dengan `measurementDate`
    - Test: konfirmasi delete → `onDelete` dipanggil, entry hilang
    - Test: delete error → pesan error, entry tetap ada
    - File: `src/app/body-metrics/__tests__/HistoryView.test.tsx`
    - _Requirements: 5.3, 5.5, 5.6, 5.7, 5.8, 5.9_

- [ ] 11. Checkpoint — Verifikasi semua komponen individual
  - Jalankan `npm test` — semua tests harus lulus.
  - Jalankan `npx tsc --noEmit` — tidak ada TypeScript error.
  - Tanyakan ke user jika ada pertanyaan sebelum melanjutkan.

- [ ] 12. Root client component dan halaman Next.js
  - [ ] 12.1 Buat `src/app/body-metrics/_components/BodyMetricsClient.tsx`
    - Direktif `'use client'`
    - Panggil `useBodyMetrics()` — dapatkan `entries`, `isLoading`, `error`, `saveEntry`, `deleteEntry`, `updateEntry`
    - State lokal: `timeRange: TimeRange` (default `'weekly'`)
    - Render: `InputForm`, `TrendChart`, `HistoryView` dengan props yang sesuai
    - `onEntrySaved` → panggil `saveEntry`, jika `DUPLICATE_DATE` forward ke `InputForm` untuk dialog
    - `onDelete` → panggil `deleteEntry`
    - Loading state: tampilkan skeleton saat `isLoading === true`
    - Error state global: tampilkan pesan error jika `error !== null`
    - _Requirements: 4.8, 6.4_

  - [ ] 12.2 Buat `src/app/body-metrics/page.tsx` sebagai Server Component
    - Export `metadata`: `{ title: 'Body Metrics | Fitness Monitoring', description: '...' }`
    - Render `BodyMetricsClient` sebagai satu-satunya child
    - Import `auth()` untuk pre-check session (redirect jika tidak ada, walaupun middleware sudah guard)
    - _Requirements: Design doc — Architecture_

  - [ ] 12.3 Buat `src/app/body-metrics/loading.tsx` — loading skeleton
    - Skeleton untuk form input, chart area, dan tabel history
    - Gunakan Tailwind `animate-pulse` classes
    - _Requirements: Design doc — Hierarki Komponen_

  - [ ] 12.4 Buat `src/app/body-metrics/error.tsx` — error boundary
    - Direktif `'use client'`
    - Tampilkan pesan error user-friendly dengan tombol "Coba Lagi" yang memanggil `reset()`
    - _Requirements: Design doc — Error Boundary_

- [ ] 13. Property tests untuk konsistensi data
  - [ ]* 13.1 Tulis property test untuk measurement date uniqueness — Property 16
    - **Property 16: Measurement date uniqueness per user** — mock POST handler untuk simulasi DB constraint; untuk setiap sequence insert termasuk duplikat, state `entries` tidak pernah mengandung dua entry dengan `measurementDate` yang sama
    - Verifikasi bahwa `saveEntry` return `{ success: false, error: 'DUPLICATE_DATE' }` saat duplikasi
    - Gunakan MSW untuk mock API response dengan `400 DUPLICATE_DATE`
    - File: `src/app/body-metrics/__tests__/dateUniqueness.property.test.ts`
    - _Requirements: 6.1_

  - [ ]* 13.2 Tulis property test untuk API persistence round-trip — Property 17
    - **Property 17: API persistence round-trip** — mock POST `/api/body-metrics` dan GET `/api/body-metrics`; generate arbitrary `CreateEntryPayload`, POST, verifikasi response GET mengandung entry yang deep equal ke payload yang dikirim (tidak ada field yang hilang atau termutasi)
    - Gunakan MSW untuk mock handlers
    - File: `src/app/body-metrics/__tests__/persistence.property.test.ts`
    - _Requirements: 6.2_

  - [ ]* 13.3 Tulis property test untuk History-Chart consistency — Property 18
    - **Property 18: History-Chart consistency** — setelah setiap operasi save/delete, set entry ID di `HistoryView` harus sama dengan set entry ID di `TrendChart` data
    - Render `BodyMetricsClient` dengan MSW mock, lakukan sequence operasi, verifikasi konsistensi
    - File: `src/app/body-metrics/__tests__/historyChartConsistency.property.test.ts`
    - _Requirements: 6.4_

- [ ] 14. Integration tests end-to-end dengan MSW
  - [ ]* 14.1 Tulis integration tests skenario utama
    - Setup MSW server dengan handlers untuk semua endpoints (`GET`, `POST`, `PATCH`, `DELETE`)
    - Skenario 1: Isi form lengkap (pria) → submit → verifikasi POST dipanggil → entry muncul di HistoryView dan TrendChart
    - Skenario 2: Submit form dengan tanggal duplikat → API return `400 DUPLICATE_DATE` → dialog "Perbarui/Batal" muncul → pilih "Perbarui" → PATCH dipanggil → data ter-update
    - Skenario 3: Delete entry dari HistoryView → dialog konfirmasi muncul → konfirmasi → DELETE dipanggil → entry hilang dari History dan Chart
    - Skenario 4: GET return `401` → `window.location.href` diarahkan ke `/auth/login`
    - Skenario 5: Network error saat fetch → error state tampil, app tidak crash
    - Skenario 6: POST `500` → toast error "Terjadi kesalahan server", form tetap terbuka, state tidak berubah
    - File: `src/app/body-metrics/__tests__/integration.test.tsx`
    - _Requirements: 1.6, 4.8, 5.5, 5.6, 6.1, 6.4_

- [ ] 15. Final checkpoint — Verifikasi keseluruhan
  - Jalankan `npm test` — semua tests (unit, property, integration) harus lulus.
  - Jalankan `npx tsc --noEmit` — tidak ada TypeScript error.
  - Jalankan `npm run lint` — tidak ada ESLint error.
  - Tanyakan ke user jika ada pertanyaan.

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirement spesifik untuk traceability
- Checkpoint di task 5, 11, dan 15 memastikan validasi inkremental
- Property tests menggunakan fast-check dengan minimum 100 iterasi per property (200 untuk Property 9)
- Integration tests menggunakan MSW untuk mock HTTP — tidak ada real network calls dalam tests
- **Tidak ada localStorage** — semua state persisten melalui PostgreSQL via API routes
- Semua komponen interaktif menggunakan direktif `'use client'`; `page.tsx` adalah Server Component
- Setiap API route handler mengikuti pola: `auth()` check → validasi input → DB operation → return `ApiResponse<T>`
- `useBodyMetrics` hook adalah satu-satunya tempat di client yang memanggil `fetch()` ke API

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["2.3", "3.1"] },
    { "id": 4, "tasks": ["3.2", "3.3", "3.4", "3.5", "3.6"] },
    { "id": 5, "tasks": ["4.1"] },
    { "id": 6, "tasks": ["4.2", "4.5"] },
    { "id": 7, "tasks": ["4.3", "4.4", "4.6", "4.7"] },
    { "id": 8, "tasks": ["6.1", "6.2"] },
    { "id": 9, "tasks": ["6.3", "7.1"] },
    { "id": 10, "tasks": ["7.2", "8.1", "9.3", "10.1"] },
    { "id": 11, "tasks": ["8.2", "8.3", "9.1", "9.2", "10.2", "10.3"] },
    { "id": 12, "tasks": ["8.4", "9.5", "10.4"] },
    { "id": 13, "tasks": ["8.5", "9.4", "9.6", "10.5", "10.6"] },
    { "id": 14, "tasks": ["12.1"] },
    { "id": 15, "tasks": ["12.2", "12.3", "12.4"] },
    { "id": 16, "tasks": ["13.1", "13.2", "13.3"] },
    { "id": 17, "tasks": ["14.1"] }
  ]
}
```
