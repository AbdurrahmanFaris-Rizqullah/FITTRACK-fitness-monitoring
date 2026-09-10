# Requirements Document

## Introduction

Fitur Body Metrics adalah modul inti dalam aplikasi fitness monitoring yang memungkinkan pengguna melacak komposisi tubuh secara akurat menggunakan metode US Navy Body Fat Formula. Pengguna dapat memasukkan pengukuran tubuh harian (berat badan, lingkar leher, perut, pinggang, pinggul, dll.), melihat kalkulasi persentase lemak tubuh otomatis, serta memantau tren perubahan tubuh melalui grafik berbasis rentang waktu dan riwayat data historis.

---

## Glossary

- **Body_Metrics_System**: Sistem keseluruhan fitur Body Metrics dalam aplikasi fitness monitoring.
- **Input_Form**: Komponen antarmuka untuk memasukkan data pengukuran tubuh harian.
- **Calculator**: Modul kalkulasi yang menghitung persentase lemak tubuh menggunakan US Navy Body Fat Formula.
- **Chart**: Komponen visualisasi grafik tren data tubuh.
- **History_View**: Komponen tampilan riwayat semua entri pengukuran yang pernah diinput.
- **Entry**: Satu rekaman data pengukuran tubuh pada satu tanggal tertentu.
- **Body_Fat_Percentage**: Persentase lemak tubuh yang dihitung dari formula US Navy, dinyatakan dalam persen (%).
- **BMI**: Body Mass Index, dihitung dari berat badan (kg) dibagi kuadrat tinggi badan (m²).
- **Measurement_Date**: Tanggal saat pengukuran tubuh dilakukan, dalam format YYYY-MM-DD.
- **Height**: Tinggi badan pengguna dalam satuan sentimeter (cm).
- **Weight**: Berat badan pengguna dalam satuan kilogram (kg).
- **Neck_Circumference**: Lingkar leher dalam satuan sentimeter (cm).
- **Abdomen_Circumference**: Lingkar perut/pinggang dalam satuan sentimeter (cm), digunakan untuk perhitungan pria.
- **Waist_Circumference**: Lingkar pinggang dalam satuan sentimeter (cm), digunakan untuk perhitungan wanita.
- **Hip_Circumference**: Lingkar pinggul dalam satuan sentimeter (cm), wajib untuk pengguna perempuan.
- **Thigh_Circumference**: Lingkar paha dalam satuan sentimeter (cm), bersifat opsional.
- **Chest_Circumference**: Lingkar dada dalam satuan sentimeter (cm), bersifat opsional.
- **US_Navy_Formula**: Formula standar perhitungan persentase lemak tubuh dari US Navy.
- **Time_Range**: Rentang waktu yang dipilih pengguna untuk melihat grafik tren (harian, mingguan, bulanan, tahunan).

---

## Requirements

### Requirement 1: Input Data Pengukuran Tubuh Dasar

**User Story:** As a pengguna aplikasi fitness, I want to memasukkan data pengukuran tubuh harian termasuk tanggal, tinggi badan, berat badan, dan jenis kelamin, so that I can menyimpan rekaman kondisi tubuh saya secara rutin.

#### Acceptance Criteria

1. THE Input_Form SHALL menyediakan field input untuk Measurement_Date dalam format DD/MM/YYYY dengan nilai default tanggal hari ini.
2. THE Input_Form SHALL menyediakan field input untuk Height dalam satuan sentimeter (cm) dengan rentang nilai yang valid antara 100 cm hingga 250 cm, menerima nilai numerik dengan presisi maksimal 1 angka desimal.
3. THE Input_Form SHALL menyediakan field input untuk Weight dalam satuan kilogram (kg) dengan rentang nilai yang valid antara 20 kg hingga 300 kg, menerima nilai numerik dengan presisi maksimal 1 angka desimal.
4. THE Input_Form SHALL menyediakan pilihan Jenis Kelamin dengan dua opsi: Pria dan Wanita, tanpa nilai default (tidak ada pilihan yang dipilih secara awal).
5. THE Input_Form SHALL menyediakan field Catatan Ringkas bertipe teks bebas dengan panjang maksimal 500 karakter.
6. WHEN pengguna mengirimkan form dengan field wajib (Measurement_Date, Height, Weight, Jenis Kelamin) yang telah diisi lengkap dan valid, THE Input_Form SHALL menyimpan Entry ke penyimpanan data dan menampilkan notifikasi konfirmasi yang terlihat oleh pengguna.
7. IF pengguna mengirimkan form dengan satu atau lebih field wajib yang kosong, THEN THE Input_Form SHALL menampilkan pesan kesalahan di bawah setiap field wajib yang kosong dan menghentikan proses penyimpanan.
8. IF pengguna memasukkan nilai Height di luar rentang 100–250 cm, THEN THE Input_Form SHALL menampilkan pesan kesalahan "Tinggi badan harus antara 100 cm dan 250 cm" dan menghentikan proses penyimpanan.
9. IF pengguna memasukkan nilai Weight di luar rentang 20–300 kg, THEN THE Input_Form SHALL menampilkan pesan kesalahan "Berat badan harus antara 20 kg dan 300 kg" dan menghentikan proses penyimpanan.
10. IF pengguna memasukkan karakter non-numerik pada field Height atau Weight, THEN THE Input_Form SHALL menolak karakter tersebut dan menampilkan pesan kesalahan yang mengindikasikan bahwa hanya angka yang diperbolehkan.
11. IF pengguna memasukkan Measurement_Date yang melampaui tanggal hari ini, THEN THE Input_Form SHALL menampilkan pesan kesalahan "Tanggal pengukuran tidak boleh di masa depan" dan menghentikan proses penyimpanan.

---

### Requirement 2: Input Data Pengukuran Lingkar Tubuh (Advanced Input)

**User Story:** As a pengguna aplikasi fitness, I want to memasukkan data lingkar bagian tubuh (leher, perut, pinggang, pinggul), so that I can memperoleh kalkulasi persentase lemak tubuh yang akurat menggunakan metode US Navy.

#### Acceptance Criteria

1. THE Input_Form SHALL menyediakan field input untuk Neck_Circumference dalam satuan sentimeter (cm) dengan rentang nilai yang valid antara 20 cm hingga 60 cm, menerima nilai numerik dengan presisi maksimal 1 angka desimal.
2. WHEN pengguna memilih Jenis Kelamin Pria, THE Input_Form SHALL menyediakan field input untuk Abdomen_Circumference dalam satuan sentimeter (cm) dengan rentang nilai yang valid antara 50 cm hingga 200 cm, menerima nilai numerik dengan presisi maksimal 1 angka desimal.
3. WHEN pengguna memilih Jenis Kelamin Wanita, THE Input_Form SHALL menyediakan field input untuk Waist_Circumference dalam satuan sentimeter (cm) dengan rentang nilai yang valid antara 40 cm hingga 200 cm, menerima nilai numerik dengan presisi maksimal 1 angka desimal.
4. WHEN pengguna memilih Jenis Kelamin Wanita, THE Input_Form SHALL menyediakan field input wajib untuk Hip_Circumference dalam satuan sentimeter (cm) dengan rentang nilai yang valid antara 50 cm hingga 200 cm, menerima nilai numerik dengan presisi maksimal 1 angka desimal.
5. THE Input_Form SHALL menyediakan field input opsional untuk Thigh_Circumference dalam satuan sentimeter (cm) dengan rentang nilai yang valid antara 30 cm hingga 120 cm, menerima nilai numerik dengan presisi maksimal 1 angka desimal.
6. THE Input_Form SHALL menyediakan field input opsional untuk Chest_Circumference dalam satuan sentimeter (cm) dengan rentang nilai yang valid antara 50 cm hingga 200 cm, menerima nilai numerik dengan presisi maksimal 1 angka desimal.
7. IF pengguna memasukkan nilai lingkar tubuh di luar rentang valid yang ditentukan per field, THEN THE Input_Form SHALL menampilkan pesan kesalahan yang menyebutkan nama field dan rentang nilai yang diperbolehkan, serta menghentikan proses penyimpanan.
8. WHEN pengguna mengirimkan form tanpa mengisi Neck_Circumference, THE Input_Form SHALL menampilkan pesan kesalahan yang mengindikasikan bahwa Neck_Circumference wajib diisi dan menghentikan proses penyimpanan.
9. WHEN pengguna memilih Jenis Kelamin Pria dan mengirimkan form tanpa mengisi Abdomen_Circumference, THE Input_Form SHALL menampilkan pesan kesalahan yang mengindikasikan bahwa Abdomen_Circumference wajib diisi untuk pengguna pria dan menghentikan proses penyimpanan.
10. WHEN pengguna memilih Jenis Kelamin Wanita dan mengirimkan form tanpa mengisi Hip_Circumference, THE Input_Form SHALL menampilkan pesan kesalahan yang mengindikasikan bahwa Hip_Circumference wajib diisi untuk pengguna perempuan dan menghentikan proses penyimpanan.

---

### Requirement 3: Kalkulasi Body Fat Percentage dengan US Navy Formula

**User Story:** As a pengguna aplikasi fitness, I want body fat percentage saya dihitung otomatis dari data pengukuran yang saya masukkan, so that I can mengetahui komposisi lemak tubuh saya secara akurat tanpa harus menghitung manual.

#### Acceptance Criteria

1. WHEN pengguna Pria menyediakan data Height dalam rentang 100–250 cm, Neck_Circumference dalam rentang 20–80 cm, dan Abdomen_Circumference dalam rentang 50–200 cm yang valid, THE Calculator SHALL menghitung Body_Fat_Percentage menggunakan formula: `%Fat = 86.010 × log10(Abdomen_Circumference - Neck_Circumference) − 70.041 × log10(Height) + 36.76`.
2. WHEN pengguna Wanita menyediakan data Height dalam rentang 100–250 cm, Neck_Circumference dalam rentang 20–80 cm, Waist_Circumference dalam rentang 40–200 cm, dan Hip_Circumference dalam rentang 50–200 cm yang valid, THE Calculator SHALL menghitung Body_Fat_Percentage menggunakan formula: `%Fat = 163.205 × log10(Waist_Circumference + Hip_Circumference - Neck_Circumference) − 97.684 × log10(Height) − 78.387`.
3. THE Calculator SHALL membulatkan hasil Body_Fat_Percentage ke dua angka desimal menggunakan metode half-up rounding.
4. IF nilai Abdomen_Circumference kurang dari atau sama dengan Neck_Circumference pada perhitungan pria, THEN THE Calculator SHALL menolak perhitungan dan mengembalikan pesan error yang mengindikasikan bahwa lingkar perut harus lebih besar dari lingkar leher, tanpa mengubah data yang telah tersimpan.
5. IF nilai (Waist_Circumference + Hip_Circumference - Neck_Circumference) kurang dari atau sama dengan nol pada perhitungan wanita, THEN THE Calculator SHALL menolak perhitungan dan mengembalikan pesan error yang mengindikasikan kombinasi pengukuran tidak valid, tanpa mengubah data yang telah tersimpan.
6. IF salah satu atau lebih dari Height, Neck_Circumference, Abdomen_Circumference (pria), atau Waist_Circumference, Hip_Circumference (wanita) bernilai nol, negatif, atau bukan angka, THEN THE Calculator SHALL menolak perhitungan dan mengembalikan pesan error yang mengindikasikan field mana yang tidak valid, tanpa mengubah data yang telah tersimpan.
7. WHEN data Height dalam rentang 100–250 cm dan Weight dalam rentang 1–500 kg tersedia tanpa data lingkar tubuh, THE Calculator SHALL menghitung dan menampilkan nilai BMI menggunakan formula: `BMI = Weight / (Height / 100)²`, dibulatkan ke dua angka desimal.
8. FOR ALL kombinasi input valid pria dan wanita, perhitungan ulang Calculator dengan input yang sama SHALL menghasilkan nilai Body_Fat_Percentage yang identik (deterministic round-trip property).
9. WHEN kalkulasi Body_Fat_Percentage berhasil, THE Body_Metrics_System SHALL menampilkan hasil Body_Fat_Percentage dan kategori komposisi tubuh berdasarkan standar American College of Sports Medicine (ACSM): untuk Pria — Underfat (<6%), Normal (6–17%), Overfat (18–24%), Obese (≥25%); untuk Wanita — Underfat (<16%), Normal (16–29%), Overfat (30–36%), Obese (≥37%).

---

### Requirement 4: Tampilan Grafik Tren Body Fat dan Berat Badan

**User Story:** As a pengguna aplikasi fitness, I want to melihat grafik tren perubahan body fat percentage dan berat badan saya, so that I can memantau progres dan pola perubahan komposisi tubuh saya dari waktu ke waktu.

#### Acceptance Criteria

1. WHILE terdapat dua atau lebih Entry dengan Body_Fat_Percentage tersimpan, THE Chart SHALL menampilkan grafik garis tren Body_Fat_Percentage dengan titik data diurutkan berdasarkan Measurement_Date secara ascending.
2. WHILE terdapat dua atau lebih Entry dengan Weight tersimpan, THE Chart SHALL menampilkan grafik garis tren Weight dengan titik data diurutkan berdasarkan Measurement_Date secara ascending.
3. THE Body_Metrics_System SHALL menyediakan kontrol pemilihan Time_Range dengan empat opsi: Harian (7 hari terakhir), Mingguan (12 minggu terakhir), Bulanan (12 bulan terakhir), dan Tahunan (5 tahun terakhir).
4. WHEN pengguna memilih Time_Range tertentu, THE Chart SHALL memperbarui tampilan grafik untuk hanya menampilkan data Entry dalam rentang waktu yang dipilih.
5. WHEN tidak ada data Entry dalam Time_Range yang dipilih, THE Chart SHALL menampilkan pesan "Tidak ada data untuk rentang waktu yang dipilih" sebagai pengganti grafik.
6. THE Chart SHALL menampilkan sumbu X dengan label tanggal dalam format: DD/MM untuk Time_Range Harian, nama minggu (Minggu ke-N) untuk Mingguan, nama bulan (Jan–Des) untuk Bulanan, dan tahun (YYYY) untuk Tahunan; sumbu Y SHALL menggunakan skala otomatis dengan batas minimum dan maksimum masing-masing 10% di bawah dan di atas nilai terendah dan tertinggi dalam rentang data yang ditampilkan.
7. WHEN pengguna mengarahkan kursor atau menyentuh titik data pada grafik, THE Chart SHALL menampilkan tooltip yang memuat nilai Body_Fat_Percentage atau Weight dan Measurement_Date dari Entry yang bersangkutan.
8. WHEN data Entry baru berhasil disimpan, THE Chart SHALL memperbarui tampilan grafik secara otomatis dalam waktu tidak lebih dari 2 detik tanpa memerlukan reload halaman penuh.
9. WHEN hanya terdapat satu Entry dalam Time_Range yang dipilih, THE Chart SHALL menampilkan titik data tunggal sebagai marker titik (bukan garis) disertai label nilai di atas marker tersebut.

---

### Requirement 5: Tampilan Riwayat (History View)

**User Story:** As a pengguna aplikasi fitness, I want to melihat daftar riwayat semua data pengukuran yang pernah saya input, so that I can meninjau catatan historis kondisi tubuh saya dan melakukan manajemen data.

#### Acceptance Criteria

1. THE History_View SHALL menampilkan daftar semua Entry yang tersimpan diurutkan berdasarkan Measurement_Date dari yang terbaru ke yang terlama.
2. THE History_View SHALL menampilkan informasi berikut untuk setiap Entry: Measurement_Date, Weight, Body_Fat_Percentage (jika tersedia), dan BMI.
3. THE History_View SHALL menampilkan 20 Entry per halaman; WHEN jumlah Entry melebihi 20, THE History_View SHALL menyediakan kontrol navigasi halaman; THE History_View SHALL merender setiap halaman dalam waktu tidak lebih dari 2 detik.
4. WHEN pengguna memilih satu Entry dari daftar riwayat, THE History_View SHALL menampilkan detail lengkap Entry tersebut termasuk semua data lingkar tubuh yang diinput dan Catatan Ringkas.
5. WHEN pengguna memilih opsi hapus pada satu Entry, THE Body_Metrics_System SHALL menampilkan dialog konfirmasi yang memuat Measurement_Date dari Entry yang akan dihapus sebelum menghapus data.
6. WHEN pengguna mengkonfirmasi penghapusan, THE Body_Metrics_System SHALL menghapus Entry tersebut dari penyimpanan data dan memperbarui tampilan History_View serta Chart secara otomatis.
7. IF operasi penghapusan gagal karena kesalahan sistem, THEN THE Body_Metrics_System SHALL menampilkan pesan kesalahan yang mengindikasikan bahwa penghapusan gagal, membatalkan operasi penghapusan, dan mempertahankan Entry dalam daftar riwayat.
8. IF tidak ada Entry yang tersimpan, THEN THE History_View SHALL menampilkan pesan "Belum ada data pengukuran. Mulai tambahkan data pertama Anda." beserta tautan langsung ke Input_Form.
9. THE History_View SHALL menampilkan jumlah total Entry yang tersimpan.
10. IF operasi memuat detail Entry gagal karena kesalahan sistem, THEN THE History_View SHALL menampilkan indikasi error pada area detail dan mempertahankan tampilan daftar riwayat tanpa perubahan.

---

### Requirement 6: Validasi Data dan Konsistensi Penyimpanan

**User Story:** As a pengguna aplikasi fitness, I want data pengukuran tubuh saya disimpan dan divalidasi dengan benar, so that I can memastikan integritas data historis yang saya miliki.

#### Acceptance Criteria

1. THE Body_Metrics_System SHALL mencegah penyimpanan dua Entry dengan Measurement_Date yang sama; WHEN pengguna mencoba menyimpan Entry dengan Measurement_Date yang sudah ada, THE Body_Metrics_System SHALL menampilkan opsi untuk memperbarui Entry yang sudah ada atau membatalkan penyimpanan sebelum operasi penyimpanan dieksekusi.
2. THE Body_Metrics_System SHALL menyimpan semua data Entry secara persisten sehingga data tetap tersedia setelah pengguna menutup dan membuka kembali aplikasi, tanpa kehilangan nilai numerik maupun Measurement_Date dari Entry yang telah tersimpan.
3. WHEN Entry berhasil disimpan, THE Body_Metrics_System SHALL menampilkan notifikasi konfirmasi yang memuat Measurement_Date dari Entry yang disimpan selama minimal 3 detik sebelum menghilang secara otomatis.
4. THE Body_Metrics_System SHALL mempertahankan konsistensi antara data yang ditampilkan di History_View dan Chart dalam waktu tidak lebih dari 1 detik setelah operasi penyimpanan atau penghapusan Entry selesai, sehingga Entry yang dihapus dari History_View tidak lagi muncul di Chart.
5. IF operasi penyimpanan atau penghapusan gagal karena kesalahan sistem, THEN THE Body_Metrics_System SHALL menampilkan pesan kesalahan yang mengindikasikan jenis kegagalan operasi dan mempertahankan seluruh data Entry pada state terakhir yang valid sebelum operasi gagal tersebut dijalankan.
6. IF nilai numerik pada salah satu field Entry berada di luar rentang yang valid (berat badan: 1–500 kg, tinggi badan: 50–300 cm, persentase lemak tubuh: 0–100%), THEN THE Body_Metrics_System SHALL menolak penyimpanan Entry tersebut dan menampilkan pesan kesalahan yang mengindikasikan field mana yang tidak valid beserta rentang nilai yang diperbolehkan.
