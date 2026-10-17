/**
 * CatatYuk - Database & Supabase Client Service
 * Menghubungkan aplikasi dengan Supabase Database (PostgreSQL)
 * serta mendukung fallback otomatis ke LocalStorage jika Supabase belum disetel.
 */

class DatabaseService {
  constructor() {
    this.client = null;
    this.isUsingSupabase = false;
    this.init();
  }

  // Inisialisasi client
  init() {
    const { url, anonKey, isConfigured } = APP_CONFIG.getCredentials();

    if (isConfigured && window.supabase) {
      try {
        this.client = window.supabase.createClient(url, anonKey);
        this.isUsingSupabase = true;
        console.log('[CatatYuk] Terhubung menggunakan Supabase SDK.');
      } catch (err) {
        console.error('[CatatYuk] Gagal inisialisasi Supabase:', err);
        this.client = null;
        this.isUsingSupabase = false;
      }
    } else {
      this.client = null;
      this.isUsingSupabase = false;
      console.log('[CatatYuk] Menggunakan LocalStorage Mode (Offline/Demo).');
      this.seedInitialLocalDataIfEmpty();
    }
  }

  // Mengisi data sampel awal untuk demo jika LocalStorage kosong
  seedInitialLocalDataIfEmpty() {
    const raw = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.LOCAL_TRANSACTIONS);
    if (!raw) {
      const today = new Date();
      const formatDay = (daysAgo) => {
        const d = new Date();
        d.setDate(today.getDate() - daysAgo);
        return d.toISOString().split('T')[0];
      };

      const sampleData = [
        {
          id: 'demo-1',
          type: 'income',
          amount: 8500000,
          category: 'Gaji',
          date: formatDay(15),
          notes: 'Gaji Bulanan',
          created_at: new Date(Date.now() - 15 * 86400000).toISOString()
        },
        {
          id: 'demo-2',
          type: 'expense',
          amount: 250000,
          category: 'Makanan',
          date: formatDay(5),
          notes: 'Makan malam bersama keluarga',
          created_at: new Date(Date.now() - 5 * 86400000).toISOString()
        },
        {
          id: 'demo-3',
          type: 'expense',
          amount: 150000,
          category: 'Transportasi',
          date: formatDay(3),
          notes: 'Isi bensin kendaraan',
          created_at: new Date(Date.now() - 3 * 86400000).toISOString()
        },
        {
          id: 'demo-4',
          type: 'expense',
          amount: 500000,
          category: 'Belanja',
          date: formatDay(1),
          notes: 'Belanja bulanan supermarket',
          created_at: new Date(Date.now() - 1 * 86400000).toISOString()
        },
        {
          id: 'demo-5',
          type: 'expense',
          amount: 350000,
          category: 'Utilitas',
          date: formatDay(0),
          notes: 'Tagihan listrik & internet',
          created_at: new Date().toISOString()
        }
      ];

      localStorage.setItem(
        APP_CONFIG.STORAGE_KEYS.LOCAL_TRANSACTIONS,
        JSON.stringify(sampleData)
      );
    }
  }

  // Menguji koneksi Supabase
  async testConnection(url, anonKey) {
    if (!window.supabase) {
      return { success: false, message: 'Library Supabase SDK belum dimuat.' };
    }
    try {
      const tempClient = window.supabase.createClient(url, anonKey);
      // Coba query sederhana 1 baris
      const { data, error } = await tempClient
        .from(APP_CONFIG.TABLE_NAME)
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          return {
            success: false,
            message: `Tabel '${APP_CONFIG.TABLE_NAME}' belum dibuat di Supabase. Silakan jalankan query SQL pembuatan tabel.`
          };
        }
        return { success: false, message: error.message };
      }
      return { success: true, message: 'Koneksi ke Supabase berhasil!' };
    } catch (err) {
      return { success: false, message: err.message || 'Koneksi gagal.' };
    }
  }

  // Ambil semua transaksi
  async getTransactions() {
    if (this.isUsingSupabase && this.client) {
      try {
        const { data, error } = await this.client
          .from(APP_CONFIG.TABLE_NAME)
          .select('*')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('[CatatYuk] Error fetch dari Supabase:', err);
        throw err;
      }
    } else {
      // Ambil dari LocalStorage
      const raw = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.LOCAL_TRANSACTIONS);
      const items = raw ? JSON.parse(raw) : [];
      // Urutkan berdasarkan tanggal terbaru
      return items.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  }

  // Tambah transaksi baru
  async addTransaction(item) {
    const payload = {
      type: item.type,
      amount: Number(item.amount),
      category: item.category,
      date: item.date,
      notes: item.notes || '',
      created_at: new Date().toISOString()
    };

    if (this.isUsingSupabase && this.client) {
      try {
        const { data, error } = await this.client
          .from(APP_CONFIG.TABLE_NAME)
          .insert([payload])
          .select();

        if (error) throw error;
        return data && data[0] ? data[0] : payload;
      } catch (err) {
        console.error('[CatatYuk] Gagal menyimpan ke Supabase:', err);
        throw err;
      }
    } else {
      // Simpan ke LocalStorage
      const raw = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.LOCAL_TRANSACTIONS);
      const items = raw ? JSON.parse(raw) : [];
      const newRecord = {
        ...payload,
        id: 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5)
      };
      items.unshift(newRecord);
      localStorage.setItem(
        APP_CONFIG.STORAGE_KEYS.LOCAL_TRANSACTIONS,
        JSON.stringify(items)
      );
      return newRecord;
    }
  }

  // Hapus transaksi
  async deleteTransaction(id) {
    if (this.isUsingSupabase && this.client) {
      try {
        const { error } = await this.client
          .from(APP_CONFIG.TABLE_NAME)
          .delete()
          .eq('id', id);

        if (error) throw error;
        return true;
      } catch (err) {
        console.error('[CatatYuk] Gagal menghapus dari Supabase:', err);
        throw err;
      }
    } else {
      // Hapus dari LocalStorage
      const raw = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.LOCAL_TRANSACTIONS);
      let items = raw ? JSON.parse(raw) : [];
      items = items.filter((item) => String(item.id) !== String(id));
      localStorage.setItem(
        APP_CONFIG.STORAGE_KEYS.LOCAL_TRANSACTIONS,
        JSON.stringify(items)
      );
      return true;
    }
  }
}

// Global instance
window.dbService = new DatabaseService();

