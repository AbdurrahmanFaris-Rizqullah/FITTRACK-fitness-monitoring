# Implementation Plan: Body Metrics

## Overview

Implementasi modul Body Metrics sebagai fitur client-side penuh menggunakan Next.js 16 dengan TypeScript. Urutan task mengikuti pendekatan bottom-up: foundation layer (types, kalkulasi, storage, validasi) terlebih dahulu, lalu state management, komponen UI, dan terakhir integrasi halaman. Semua kalkulasi berjalan sebagai pure functions; data persisten menggunakan localStorage.

## Tasks

- [ ] 1. Setup dependencies dan konfigurasi testing
  - [ ] 1.1 Install runtime dependencies: `zod`, `recharts`, `date-fns`
    - Jalankan: `npm install zod recharts date-fns`
    - Verifikasi versi: zod ^3.x, recharts ^2.x, date-fns ^3.x
    - _Requirements: 2.x (Zod untuk validasi), 4.x (Recharts untuk chart), design doc_
  - [ ] 1.2 Install dev dependencies: `vitest`, `@vitest/ui`, `fast-check`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`
    - Jalankan: `npm install -D vitest @vitest/ui fast-check @testing-library/react @testing-library/user-event jsdom @vitest/coverage-v8`
    - _Requirements: Design doc — Testing Strategy_
  - [ ] 1.3 Konfigurasi Vitest di `vitest.config.ts` dan update `package.json` scripts
    - Buat `vitest.config.ts` di root project dengan environment `jsdom`
    - Tambahkan scripts `"test": "vitest run"` dan `"test:watch": "vitest"` ke `package.json`
    - _Requirements: Design doc — Test Runner_

- [ ] 2. Foundation layer — Types, Calculator, Storage, Validation
  - [ ] 2.1 Buat `src/app/body-metrics/_lib/types.ts` dengan semua TypeScript interfaces dan types
    - Definisikan: `Gender`, `TimeRange`, `BodyCompositionCategory`, `BodyMetricsEntry`, `CalculationResult`, `CalculationError`, `CalculationOutput`, `BodyMetricsState`, `BodyMetricsFormData`, `StorageSchema`
    - Sesuaikan field-field dengan requirements (id: UUID v4, measurementDate: ISO 8601, semua circumference optional/required sesuai gender)
    - _Requirements: 1.x, 2.x, 3.x, 6.x_

  - [ ] 2.2 Buat `src/app/body-metrics/_lib/calculator.ts` dengan pure functions kalkulasi
    - Implementasikan: `calculateMaleBodyFat(height, neck, abdomen)` — formula US Navy pria
    - Implementasikan: `calculateFemaleBodyFat(height, neck, waist, hip)` — formula US Navy wanita
    - Implementasikan: `calculateBMI(weight, height)` — formula BMI
    - Implementasikan: `getCategory(gender, bodyFatPercentage)` — klasifikasi ACSM
    - Implementasikan: `roundHalfUp(value, decimals)` — half-up rounding
    - Guard: `abdomen <= neck` → return `CalculationError` INVALID_GEOMETRY
    - Guard: `(waist + hip - neck) <= 0` → return `CalculationError` INVALID_GEOMETRY
    - Guard: input nol/negatif/NaN → return `CalculationError` INVALID_INPUT
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.9_

  - [ ]* 2.3 Tulis property test untuk `calculator.ts` — Properties 6, 7, 8, 9
    - **Property 6: Male body fat formula correctness** — fc.float height/neck/abdomen, pre(abdomen > neck), bandingkan dengan expected formula
    - **Property 7: Female body fat formula correctness** — fc.float height/neck/waist/hip, pre((waist+hip-neck) > 0), bandingkan dengan expected formula
    - **Property 8: BMI formula correctness** — fc.float weight/height valid range, bandingkan dengan expected formula
    - **Property 9: Calculator determinism** — input yang sama selalu menghasilkan output identik
    - Tag setiap test: `// Feature: body-metrics, Property N: <text>`
    - File: `src/app/body-metrics/__tests__/calculator.property.test.ts`
    - _Requirements: 3.1, 3.2, 3.3, 3.7, 3.8_

  - [ ]* 2.4 Tulis unit tests untuk `calculator.ts` — boundary values dan error conditions
    - Test: `abdomen <= neck` → error INVALID_GEOMETRY
    - Test: `(waist + hip - neck) <= 0` → error INVALID_GEOMETRY
    - Test: input negatif/nol → error INVALID_INPUT
    - Test: nilai ACSM boundary (pria: 5.9, 6.0, 17.0, 17.1, 24.9, 25.0; wanita: analog)
    - Test: `roundHalfUp(2.345, 2) === 2.35`
    - File: `src/app/body-metrics/__tests__/calculator.unit.test.ts`
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.9_

  - [ ] 2.5 Buat `src/app/body-metrics/_lib/storage.ts` dengan localStorage adapter
    - Implementasikan: `storage.loadAll()` — baca dari key `body_metrics_data`, handle JSON parse error, handle SSR (`typeof window === 'undefined'`)
    - Implementasikan: `storage.save(entry, current)` — append + sort descending by date + persist
    - Implementasikan: `storage.update(id, data, current)` — update entry by id + persist
    - Implementasikan: `storage.delete(id, current)` — filter out by id + persist
    - Implementasikan: `persist()` internal function dengan StorageSchema `{ version: 1, entries, lastUpdated }`
    - Implementasikan: `migrate()` function untuk versioning
    - Handle `QuotaExceededError` saat persist
    - _Requirements: 6.2, 6.4, 6.5_

  - [ ]* 2.6 Tulis property test untuk `storage.ts` — Property 17
    - **Property 17: Persistence round-trip** — generate arbitrary BodyMetricsEntry, save ke storage mock, load kembali, verifikasi deep equal
    - Gunakan mock localStorage (jsdom environment menyediakan ini)
    - File: `src/app/body-metrics/__tests__/storage.property.test.ts`
    - _Requirements: 6.2_

  - [ ]* 2.7 Tulis unit tests untuk `storage.ts`
    - Test: save + loadAll → entry ada
    - Test: delete → entry hilang
    - Test: update → field ter-update, id sama
    - Test: corrupt localStorage JSON → return `[]` tanpa crash
    - Test: `typeof window === 'undefined'` (SSR) → return `[]`
    - File: `src/app/body-metrics/__tests__/storage.unit.test.ts`
    - _Requirements: 6.2, 6.5_

  - [ ] 2.8 Buat `src/app/body-metrics/_lib/validation.ts` dengan Zod schema
    - Definisikan `bodyMetricsSchema` dengan semua field sesuai requirements
    - Validasi `measurementDate`: format YYYY-MM-DD dan tidak di masa depan
    - Validasi `height`: numerik, 100–250 cm
    - Validasi `weight`: numerik, 20–300 kg
    - Validasi `gender`: enum `male | female`, wajib dipilih
    - Validasi `neckCircumference`: 20–60 cm, wajib
    - Validasi `abdomenCircumference`: 50–200 cm, wajib jika gender `male`
    - Validasi `waistCircumference`: 40–200 cm, wajib jika gender `female`
    - Validasi `hipCircumference`: 50–200 cm, wajib jika gender `female`
    - Validasi `thighCircumference`: 30–120 cm, opsional
    - Validasi `chestCircumference`: 50–200 cm, opsional
    - Validasi `notes`: max 500 karakter, opsional
    - Cross-field validation via `superRefine` untuk gender-specific required fields
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.7, 1.8, 1.9, 1.10, 1.11, 2.1–2.10_

  - [ ]* 2.9 Tulis property tests untuk `validation.ts` — Properties 1, 2, 3, 4, 5
    - **Property 1: Height range validation** — fc.float, accept iff 100 ≤ h ≤ 250
    - **Property 2: Weight range validation** — fc.float, accept iff 20 ≤ w ≤ 300
    - **Property 3: Non-numeric input rejection** — fc.string non-numeric, selalu error
    - **Property 4: Future date rejection** — generate tanggal di masa depan, selalu ditolak
    - **Property 5: Notes length constraint** — fc.string, accept iff length ≤ 500
    - File: `src/app/body-metrics/__tests__/validation.property.test.ts`
    - _Requirements: 1.2, 1.3, 1.5, 1.10, 1.11_

  - [ ]* 2.10 Tulis unit tests untuk `validation.ts`
    - Test: setiap field di batas valid/invalid (100, 99.9, 250, 250.1 untuk height, dst)
    - Test: tanggal hari ini → valid, tanggal besok → invalid
    - Test: gender `male` tanpa `abdomenCircumference` → error
    - Test: gender `female` tanpa `hipCircumference` → error
    - Test: notes tepat 500 karakter → valid, 501 karakter → invalid
    - File: `src/app/body-metrics/__tests__/validation.unit.test.ts`
    - _Requirements: 1.2, 1.3, 1.7, 1.8, 1.9, 1.10, 1.11, 2.7, 2.8, 2.9, 2.10_

- [ ] 3. Checkpoint — Verifikasi foundation layer
  - Jalankan `npm test` — semua test di step 2 harus lulus.
  - Pastikan tidak ada TypeScript error (`npx tsc --noEmit`).
  - Tanyakan ke user jika ada pertanyaan sebelum melanjutkan.

- [ ] 4. Custom hook `useBodyMetrics`
  - [ ] 4.1 Buat `src/app/body-metrics/_hooks/useBodyMetrics.ts`
    - State: `{ entries: BodyMetricsEntry[], isLoading: boolean, error: string | null }`
    - `useEffect` → `storage.loadAll()` saat mount, set `isLoading: false`
    - `saveEntry(data: BodyMetricsFormData)`: cek duplikasi tanggal, jalankan kalkulasi, bangun entry (UUID v4 via `crypto.randomUUID()`), panggil `storage.save()`, update state, return `{ success, error? }`
    - `deleteEntry(id: string)`: panggil `storage.delete()`, update state, return `{ success }`
    - `updateEntry(id: string, data: BodyMetricsFormData)`: jalankan kalkulasi ulang, panggil `storage.update()`, update state, return `{ success }`
    - Gunakan `useCallback` untuk semua fungsi
    - Handle duplicate date → return `{ success: false, error: 'DUPLICATE_DATE' }`
    - Handle QuotaExceededError → return `{ success: false, error: 'QUOTA_EXCEEDED' }`
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

  - [ ]* 4.2 Tulis unit tests untuk `useBodyMetrics` hook
    - Test: inisialisasi dari localStorage saat mount
    - Test: `saveEntry` → entry muncul di state
    - Test: `deleteEntry` → entry hilang dari state
    - Test: `saveEntry` dengan tanggal duplikat → return `DUPLICATE_DATE`
    - Mock `storage` module
    - File: `src/app/body-metrics/__tests__/useBodyMetrics.test.ts`
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [ ] 5. Komponen InputForm
  - [ ] 5.1 Buat `src/app/body-metrics/_components/InputForm/FormField.tsx`
    - Props: `label`, `name`, `value`, `onChange`, `error?`, `type?`, `min?`, `max?`, `step?`, `required?`, `hint?`
    - Render label, input, dan pesan error di bawah field
    - Accessibility: `htmlFor` + `id` matching, `aria-describedby` untuk error message
    - _Requirements: 1.7, 1.8, 1.9, 1.10, 2.7_

  - [ ] 5.2 Buat `src/app/body-metrics/_components/InputForm/BasicInputSection.tsx`
    - Fields: `measurementDate` (date picker, default hari ini, max today), `height` (number, 100–250), `weight` (number, 20–300), `gender` (radio/select: Pria/Wanita, tanpa default), `notes` (textarea, max 500)
    - Gunakan `FormField` untuk setiap field
    - Tampilkan hitungan karakter untuk notes field
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 5.3 Buat `src/app/body-metrics/_components/InputForm/CircumferenceSection.tsx`
    - Fields kondisional berdasarkan `gender` prop:
      - Selalu tampil: `neckCircumference` (20–60 cm, wajib)
      - Jika `male`: `abdomenCircumference` (50–200 cm, wajib)
      - Jika `female`: `waistCircumference` (40–200 cm, wajib), `hipCircumference` (50–200 cm, wajib)
      - Selalu tampil (opsional): `thighCircumference` (30–120 cm), `chestCircumference` (50–200 cm)
    - Gunakan `FormField` untuk setiap field
    - Tampilkan section hanya jika gender sudah dipilih
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ] 5.4 Buat `src/app/body-metrics/_components/InputForm/InputForm.tsx`
    - State form lokal via `useState` dengan tipe `BodyMetricsFormData`
    - Submit handler: parse string → number, panggil `validation.bodyMetricsSchema.safeParse()`, tampilkan error per field jika gagal
    - Jika validasi sukses: panggil `onEntrySaved(entry)` callback
    - Tampilkan hasil kalkulasi (body fat %, BMI, kategori ACSM) setelah submit sukses
    - Handle duplicate date: tampilkan dialog pilihan Update/Batal
    - Notifikasi sukses: toast selama 3 detik dengan `measurementDate`
    - Scroll ke field pertama yang error via `useRef`
    - _Requirements: 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 2.7, 2.8, 2.9, 2.10, 3.9, 6.1, 6.3_

  - [ ]* 5.5 Tulis unit tests untuk komponen InputForm
    - Test: render field dasar (date, height, weight, gender)
    - Test: gender `male` → tampil `abdomenCircumference`, tidak tampil `waistCircumference`
    - Test: gender `female` → tampil `waistCircumference` + `hipCircumference`
    - Test: submit form kosong → pesan error per field wajib
    - Test: height di luar range → pesan error spesifik
    - Test: tanggal masa depan → pesan error spesifik
    - File: `src/app/body-metrics/__tests__/InputForm.test.tsx`
    - _Requirements: 1.1–1.11, 2.1–2.10_

- [ ] 6. Komponen TrendChart
  - [ ] 6.1 Buat `src/app/body-metrics/_components/TrendChart/TimeRangeSelector.tsx`
    - 4 tombol/tab: Harian (7 hari), Mingguan (12 minggu), Bulanan (12 bulan), Tahunan (5 tahun)
    - Props: `value: TimeRange`, `onChange: (range: TimeRange) => void`
    - Tandai opsi aktif secara visual
    - _Requirements: 4.3, 4.4_

  - [ ] 6.2 Buat `src/app/body-metrics/_components/TrendChart/EmptyChartState.tsx`
    - Tampilkan pesan "Tidak ada data untuk rentang waktu yang dipilih"
    - Props: `timeRange: TimeRange` (opsional, untuk pesan kontekstual)
    - _Requirements: 4.5_

  - [ ] 6.3 Buat fungsi `filterByTimeRange` di `src/app/body-metrics/_lib/` atau di dalam TrendChart
    - Filter entries berdasarkan `TimeRange` menggunakan `date-fns`: `subDays`, `subWeeks`, `subMonths`, `subYears`
    - Sort hasil ascending by `measurementDate`
    - _Requirements: 4.4_

  - [ ]* 6.4 Tulis property test untuk `filterByTimeRange` — Properties 11, 12
    - **Property 11: Chart data sorted ascending** — semua titik data terurut ascending by date
    - **Property 12: Time range filter correctness** — tidak ada entry di luar window, semua entry dalam window muncul
    - File: `src/app/body-metrics/__tests__/filterByTimeRange.property.test.ts`
    - _Requirements: 4.1, 4.2, 4.4_

  - [ ] 6.5 Buat `src/app/body-metrics/_components/TrendChart/TrendChart.tsx`
    - Direktif `'use client'`
    - Gunakan `ResponsiveContainer`, `LineChart`, `Line`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend` dari Recharts
    - Dua line: `bodyFatPercentage` (warna biru) dan `weight` (warna hijau)
    - Format label sumbu X sesuai `TimeRange`: DD/MM (daily), Minggu ke-N (weekly), Jan–Des (monthly), YYYY (yearly)
    - Skala sumbu Y: auto-scale dengan padding 10% di atas dan bawah nilai min/max
    - Tooltip: tampilkan nilai + `measurementDate`
    - Jika filtered entries < 2: tampilkan `EmptyChartState` (atau single point marker jika tepat 1 entry)
    - Single data point (exactly 1 entry): render sebagai dot marker dengan label nilai, bukan garis
    - Auto-update saat `entries` prop berubah (React reaktif secara default)
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

  - [ ]* 6.6 Tulis unit tests untuk `TrendChart`
    - Test: tidak ada data → render `EmptyChartState`
    - Test: satu data point → render marker, bukan garis
    - Test: ganti `timeRange` → data difilter ulang
    - File: `src/app/body-metrics/__tests__/TrendChart.test.tsx`
    - _Requirements: 4.1, 4.4, 4.5, 4.9_

- [ ] 7. Komponen HistoryView
  - [ ] 7.1 Buat `src/app/body-metrics/_components/HistoryView/DeleteConfirmDialog.tsx`
    - Props: `entry: BodyMetricsEntry`, `onConfirm: () => void`, `onCancel: () => void`, `isOpen: boolean`
    - Tampilkan `measurementDate` dari entry yang akan dihapus di dalam dialog
    - Tombol "Hapus" (destructive) dan "Batal"
    - Accessible: focus trap, `role="dialog"`, `aria-labelledby`
    - _Requirements: 5.5_

  - [ ] 7.2 Buat `src/app/body-metrics/_components/HistoryView/EntryDetailModal.tsx`
    - Props: `entry: BodyMetricsEntry | null`, `onClose: () => void`, `isOpen: boolean`
    - Tampilkan semua field lengkap: semua circumference + notes + body fat % + BMI + kategori
    - Handle error saat entry null atau loading gagal: tampilkan error state di area detail, list tidak berubah
    - Accessible: `role="dialog"`, `aria-modal="true"`, close button
    - _Requirements: 5.4, 5.10_

  - [ ] 7.3 Buat `src/app/body-metrics/_components/HistoryView/HistoryTable.tsx`
    - Props: `entries: BodyMetricsEntry[]`, `onSelect: (entry) => void`, `onDeleteRequest: (entry) => void`
    - Kolom: Measurement Date, Weight (kg), Body Fat % (jika tersedia), BMI
    - Setiap baris clickable → `onSelect`
    - Tombol hapus per baris → `onDeleteRequest`
    - _Requirements: 5.1, 5.2_

  - [ ] 7.4 Buat `src/app/body-metrics/_components/HistoryView/HistoryView.tsx`
    - Props: `entries: BodyMetricsEntry[]`, `onDelete: (id: string) => Promise<void>`, `onSelect: (entry) => void`
    - Sort entries descending by `measurementDate` sebelum render
    - Pagination: 20 entry per halaman, tampilkan kontrol prev/next jika total > 20
    - Tampilkan jumlah total entry
    - Empty state: pesan "Belum ada data pengukuran. Mulai tambahkan data pertama Anda." + link ke form
    - Kelola state: `selectedEntry`, `entryToDelete`, `currentPage`
    - Render `HistoryTable`, `EntryDetailModal`, `DeleteConfirmDialog`
    - Setelah delete berhasil: update tampilan dalam ≤1 detik
    - Handle delete error: tampilkan pesan error, pertahankan entry di list
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_

  - [ ]* 7.5 Tulis property tests untuk `HistoryView` — Properties 13, 14, 15
    - **Property 13: History view sorted descending** — semua entries selalu diurutkan newest-first
    - **Property 14: History view data completeness** — setiap entry dengan semua field harus menampilkan keempat kolom
    - **Property 15: Pagination invariant** — halaman ke-k berisi `min(N - k×20, 20)` entries
    - File: `src/app/body-metrics/__tests__/HistoryView.property.test.ts`
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 7.6 Tulis unit tests untuk `HistoryView`
    - Test: empty state saat entries kosong
    - Test: pagination muncul saat entries > 20
    - Test: klik delete → dialog konfirmasi muncul dengan `measurementDate`
    - Test: konfirmasi delete → `onDelete` dipanggil, entry hilang
    - Test: delete error → pesan error, entry tetap ada
    - File: `src/app/body-metrics/__tests__/HistoryView.test.tsx`
    - _Requirements: 5.3, 5.5, 5.6, 5.7, 5.8, 5.9_

- [ ] 8. Checkpoint — Verifikasi semua komponen individual
  - Jalankan `npm test` — semua test harus lulus.
  - Pastikan tidak ada TypeScript error (`npx tsc --noEmit`).
  - Tanyakan ke user jika ada pertanyaan sebelum melanjutkan.

- [ ] 9. Root client component dan halaman Next.js
  - [ ] 9.1 Buat `src/app/body-metrics/_components/BodyMetricsClient.tsx`
    - Direktif `'use client'`
    - Panggil `useBodyMetrics()` untuk mendapatkan `entries`, `isLoading`, `error`, `saveEntry`, `deleteEntry`, `updateEntry`
    - State lokal: `timeRange: TimeRange` (default `'weekly'`)
    - Render: `InputForm`, `TrendChart`, `HistoryView` dengan props yang sesuai
    - Propagate `onEntrySaved` ke `InputForm` → memanggil `saveEntry`
    - Propagate `onDelete` ke `HistoryView` → memanggil `deleteEntry`
    - Loading state: tampilkan skeleton saat `isLoading === true`
    - Error state: tampilkan pesan error global jika `error !== null`
    - _Requirements: 4.8, 6.4_

  - [ ] 9.2 Buat `src/app/body-metrics/page.tsx` sebagai Server Component
    - Export metadata: `title: 'Body Metrics | Fitness Monitoring'`, `description`
    - Render `BodyMetricsClient` sebagai satu-satunya child
    - Tidak ada data fetching (semua client-side)
    - _Requirements: Design doc — Architecture_

  - [ ] 9.3 Buat `src/app/body-metrics/loading.tsx` sebagai loading skeleton
    - Tampilkan skeleton untuk form input, chart area, dan tabel history
    - Gunakan Tailwind animate-pulse classes
    - _Requirements: Design doc — Hierarki Komponen_

  - [ ] 9.4 Buat `src/app/body-metrics/error.tsx` sebagai error boundary
    - Direktif `'use client'` (Next.js error boundary requirement)
    - Tampilkan pesan error yang user-friendly dengan tombol "Coba Lagi" (`reset()`)
    - _Requirements: Design doc — Error Boundary_

- [ ] 10. Property tests untuk konsistensi data — Properties 16, 17, 18
  - [ ] 10.1 Tulis property test untuk measurement date uniqueness — Property 16
    - **Property 16: Measurement date uniqueness** — setelah save entry dengan tanggal duplikat, storage tidak pernah mengandung dua entry dengan `measurementDate` yang sama
    - Gunakan `useBodyMetrics` hook atau langsung test `storage` module
    - File: `src/app/body-metrics/__tests__/dateUniqueness.property.test.ts`
    - _Requirements: 6.1_

  - [ ] 10.2 Tulis property test untuk persistence round-trip — Property 17
    - **Property 17: Persistence round-trip** — generate arbitrary entry, save, loadAll, verifikasi deep equal
    - File: `src/app/body-metrics/__tests__/persistence.property.test.ts`
    - _Requirements: 6.2_

  - [ ] 10.3 Tulis property test untuk History-Chart consistency — Property 18
    - **Property 18: History-Chart consistency** — setelah setiap operasi save/delete, set entry ID di History sama dengan set entry ID di Chart data
    - Render `BodyMetricsClient` dengan mock storage, lakukan operasi, verifikasi konsistensi
    - File: `src/app/body-metrics/__tests__/historyChartConsistency.property.test.ts`
    - _Requirements: 6.4_

- [ ] 11. Integration tests end-to-end
  - [ ]* 11.1 Tulis integration tests skenario utama
    - Skenario 1: Isi form lengkap (pria) → submit → verifikasi entry muncul di HistoryView dan TrendChart
    - Skenario 2: Isi form lengkap (wanita) → submit → verifikasi kalkulasi body fat % tampil
    - Skenario 3: Submit form dengan tanggal duplikat → dialog muncul → pilih Update → verifikasi data ter-update
    - Skenario 4: Delete entry dari HistoryView → konfirmasi → verifikasi hilang dari History dan Chart
    - Skenario 5: localStorage corrupt → app tidak crash, tampilkan empty state
    - File: `src/app/body-metrics/__tests__/integration.test.tsx`
    - _Requirements: 1.6, 4.8, 5.5, 5.6, 6.1, 6.4_

- [ ] 12. Final checkpoint — Verifikasi keseluruhan
  - Jalankan `npm test` — semua test (unit, property, integration) harus lulus.
  - Pastikan tidak ada TypeScript error (`npx tsc --noEmit`).
  - Pastikan tidak ada ESLint error (`npm run lint`).
  - Tanyakan ke user jika ada pertanyaan.

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirement spesifik untuk traceability
- Checkpoint di task 3 dan 8 memastikan validasi inkremental
- Property tests menggunakan fast-check dengan minimum 100 iterasi per property
- Unit tests menggunakan Vitest + @testing-library/react
- Semua komponen interaktif menggunakan direktif `'use client'`; `page.tsx` adalah Server Component
- Storage menggunakan key tunggal `body_metrics_data` di localStorage
- Tidak ada API route yang dibutuhkan — semua operasi client-side

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.5", "2.8"] },
    { "id": 3, "tasks": ["2.3", "2.4", "2.6", "2.7", "2.9", "2.10"] },
    { "id": 4, "tasks": ["4.1"] },
    { "id": 5, "tasks": ["4.2", "5.1"] },
    { "id": 6, "tasks": ["5.2", "5.3", "6.1", "6.2", "6.3", "7.1", "7.2", "7.3"] },
    { "id": 7, "tasks": ["5.4", "6.4", "7.4"] },
    { "id": 8, "tasks": ["5.5", "6.5", "6.6", "7.5", "7.6"] },
    { "id": 9, "tasks": ["9.1"] },
    { "id": 10, "tasks": ["9.2", "9.3", "9.4"] },
    { "id": 11, "tasks": ["10.1", "10.2", "10.3"] },
    { "id": 12, "tasks": ["11.1"] }
  ]
}
```
