# 💰 CatatYuk - Aplikasi Pencatatan Keuangan Pribadi

**CatatYuk** adalah aplikasi web modern dan responsif untuk pencatatan dan pengelolaan keuangan pribadi harian/bulanan. Aplikasi ini dirancang agar nyaman diakses melalui perangkat **Mobile (Smartphone)** maupun **Desktop (PC/Laptop)**, serta siap di-deploy secara gratis ke **GitHub Pages**.

---

## 🚀 Fitur Unggulan

1. **Dashboard & Ringkasan Keuangan (Real-time):**
   - **Total Saldo Saat Ini:** Akumulasi total saldo bersih (Pemasukan dikurangi Pengeluaran).
   - **Pemasukan Bulan Ini:** Ringkasan total uang masuk pada bulan berjalan.
   - **Pengeluaran Bulan Ini:** Ringkasan total uang keluar pada bulan berjalan.
2. **Form Input Transaksi Intuitif:**
   - Pilihan tipe: **Pengeluaran** (*Expense*) atau **Pemasukan** (*Income*) dengan tombol switch dinamis.
   - Input nominal angka dengan pratinjau format Rupiah (`Rp`) otomatis.
   - Pilihan kategori relevan (Makanan, Transportasi, Belanja, Utilitas, Gaji, Investasi, dll.).
   - Pilihan tanggal transaksi (otomatis default tanggal hari ini, dapat diubah manual).
   - Kolom catatan tambahan (opsional).
3. **Visualisasi Data Interaktif (Chart.js):**
   - **Line Chart (Tren Pengeluaran):** Melihat naik-turunnya pengeluaran harian/periode secara visual.
   - **Doughnut / Pie Chart (Komposisi Kategori):** Persentase dan porsi pengeluaran berdasarkan pos kategori.
4. **Histori Transaksi Lengkap:**
   - Tabel riwayat transaksi tersusun rapi dari tanggal terbaru.
   - Label badge warna hijau (Pemasukan) dan merah (Pengeluaran).
   - Tombol hapus transaksi dengan konfirmasi keamanan.
5. **Pencarian & Multi-Filter:**
   - Filter berdasarkan rentang waktu: *Bulan Ini*, *30 Hari Terakhir*, *Semua Waktu*, atau *Kustom (Pilih Tanggal Mulai & Akhir)*.
   - Filter berdasarkan tipe transaksi dan kategori.
   - Kotak pencarian catatan/kategori secara instan.
6. **Ekspor Data:**
   - Ekspor seluruh catatan transaksi ke format file **CSV** dengan satu klik.
7. **Dual-Mode Database (Cloud Supabase & Offline LocalStorage):**
   - Mendukung integrasi cloud database **Supabase** via JavaScript Client SDK.
   - Jika Supabase belum diatur, aplikasi langsung berjalan normal menggunakan **LocalStorage Demo Mode** tanpa error!

---

## 📁 Struktur File Proyek

```text
CatatYuk/
│
├── index.html            # File utama tampilan aplikasi (HTML5, Tailwind, Chart.js)
├── README.md             # Panduan instalasi, konfigurasi Supabase, dan deployment
│
├── css/
│   └── style.css         # Styling kustom (Glassmorphism, animasi, scrollbar, font)
│
└── js/
    ├── config.js         # Pengaturan URL, API Key Supabase, dan localStorage key
    ├── supabase-client.js# Service database (CRUD Supabase & fallback LocalStorage)
    ├── charts.js         # Pengelola visualisasi grafik Chart.js
    └── app.js            # Logika utama aplikasi (DOM, filter, kalkulasi, form)
```

---

## 🛠️ Langkah 1: Menjalankan di Komputer Lokal

Karena aplikasi ini dibangun murni menggunakan **HTML5, CSS3, dan JavaScript (Client-side)**, Anda tidak perlu menginstal Node.js atau server backend yang rumit.

1. Buka folder `CatatYuk`.
2. Klik dua kali file `index.html` untuk langsung membukanya di browser (Chrome, Edge, Firefox, Safari).
3. Atau jalankan menggunakan ekstensi **Live Server** di VS Code:
   - Klik kanan pada `index.html` -> Pilih **Open with Live Server**.

---

## ☁️ Langkah 2: Konfigurasi Database Cloud (Supabase)

Supabase menyediakan database PostgreSQL gratis di cloud. Ikuti langkah-langkah mudah berikut:

### 1. Buat Project di Supabase
1. Buka [https://supabase.com/](https://supabase.com/) lalu buat akun (atau login dengan akun GitHub).
2. Klik **New Project**.
3. Beri nama project (contoh: `CatatYuk-DB`), masukkan database password yang aman, dan pilih Region terdekat (contoh: `Singapore - ap-southeast-1`).
4. Klik **Create new project** dan tunggu beberapa menit hingga project selesai dibuat.

### 2. Buat Tabel Transaksi di SQL Editor
1. Pada menu sebelah kiri dashboard Supabase, klik ikon **SQL Editor** (`>_`).
2. Klik **New Query**, lalu salin dan tempelkan script SQL berikut:

```sql
-- 1. Buat tabel transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(15, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 3. Berikan izin akses anonim (untuk web statis / GitHub Pages)
CREATE POLICY "Public Read" ON transactions 
  FOR SELECT USING (true);

CREATE POLICY "Public Insert" ON transactions 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Delete" ON transactions 
  FOR DELETE USING (true);
```

3. Klik tombol **Run** (atau tekan `Ctrl + Enter`). Anda akan melihat pesan `Success. No rows returned`.

### 3. Ambil URL dan Anon Key Supabase
1. Pada dashboard Supabase, klik menu **Project Settings** (ikon roda gigi di kiri bawah).
2. Pilih submenu **API**.
3. Salin dua data berikut:
   - **Project URL** (contoh: `https://xxxxxxxxxxxx.supabase.co`)
   - **Project API Keys** -> Ambil key dengan label `anon` `public` (contoh: `eyJhbGciOiJIUzI1...`)

### 4. Hubungkan ke CatatYuk
Anda memiliki **dua cara mudah**:

- **Cara A (Langsung lewat Tampilan Web - Direkomendasikan):**
  1. Buka `index.html` di browser.
  2. Klik tombol **Database Cloud** di pojok kanan atas navbar.
  3. Masukkan **Project URL** dan **Anon Key**.
  4. Klik **Tes Koneksi** untuk memastikan data benar.
  5. Klik **Simpan & Hubungkan**. Aplikasi akan otomatis tersinkronisasi dengan database cloud!

- **Cara B (Tulis Langsung di Kode `js/config.js`):**
  Buka file `js/config.js` dan isi variabel berikut:
  ```javascript
  const APP_CONFIG = {
    SUPABASE_URL: 'https://xxxxxxxxxxxx.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    // ...
  };
  ```

---


Aplikasi **CatatYuk** kini sudah live di internet dan dapat dibuka dari ponsel, tablet, maupun komputer di mana saja! 🎉

---

## 📱 Desain Responsif & Antarmuka Modern
- Menggunakan palet tema **Slate & Emerald Dark Mode** yang nyaman di mata (*eye-friendly*).
- Form input dan grafik otomatis menyesuaikan ukuran layar (*single-column* pada smartphone, *multi-column dashboard* pada desktop).
- Animasi transisi halus dan indikator loading interaktif saat memproses data.

