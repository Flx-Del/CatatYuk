/**
 * CatatYuk - Configuration
 * Konfigurasi Supabase dan pengaturan aplikasi.
 * Anda dapat mengisi SUPABASE_URL dan SUPABASE_ANON_KEY langsung di sini,
 * ATAU mengisinya lewat tombol pengaturan (ikon gear) langsung di web!
 */

const APP_CONFIG = {
  // Masukkan kredensial Supabase Anda di sini (opsional jika sudah diatur via UI web):
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',

  // Nama tabel di database Supabase
  TABLE_NAME: 'transactions',

  // Kunci penyimpanan LocalStorage
  STORAGE_KEYS: {
    SUPABASE_URL: 'catatyuk_supabase_url',
    SUPABASE_ANON_KEY: 'catatyuk_supabase_key',
    LOCAL_TRANSACTIONS: 'catatyuk_local_transactions'
  },

  // Mendapatkan kredensial aktif (dari LocalStorage atau nilai default di file ini)
  getCredentials() {
    const storedUrl = localStorage.getItem(this.STORAGE_KEYS.SUPABASE_URL);
    const storedKey = localStorage.getItem(this.STORAGE_KEYS.SUPABASE_ANON_KEY);

    const url = (storedUrl && storedUrl.trim()) || this.SUPABASE_URL;
    const anonKey = (storedKey && storedKey.trim()) || this.SUPABASE_ANON_KEY;

    return {
      url: url ? url.trim() : '',
      anonKey: anonKey ? anonKey.trim() : '',
      isConfigured: Boolean(url && anonKey && url.startsWith('http'))
    };
  },

  // Simpan kredensial baru
  saveCredentials(url, anonKey) {
    localStorage.setItem(this.STORAGE_KEYS.SUPABASE_URL, url.trim());
    localStorage.setItem(this.STORAGE_KEYS.SUPABASE_ANON_KEY, anonKey.trim());
  },

  // Hapus kredensial (kembali ke local storage demo mode)
  clearCredentials() {
    localStorage.removeItem(this.STORAGE_KEYS.SUPABASE_URL);
    localStorage.removeItem(this.STORAGE_KEYS.SUPABASE_ANON_KEY);
  }
};
