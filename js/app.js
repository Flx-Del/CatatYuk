/**
 * CatatYuk - Main Application Logic
 * Menangani state, interaksi DOM, filter, ringkasan, dan validasi form
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    transactions: [],
    filters: {
      type: 'all', // all, income, expense
      category: 'all',
      dateRange: 'this_month', // this_month, last_30_days, all, custom
      startDate: '',
      endDate: '',
      search: ''
    },
    transactionType: 'expense' // Form default type
  };

  // Kategori berdasarkan tipe
  const CATEGORIES = {
    expense: [
      'Makanan',
      'Transportasi',
      'Belanja',
      'Utilitas',
      'Hiburan',
      'Kesehatan',
      'Pendidikan',
      'Lainnya'
    ],
    income: [
      'Gaji',
      'Investasi',
      'Bonus / THR',
      'Penjualan',
      'Hadiah',
      'Lainnya'
    ]
  };

  // DOM Elements
  const elements = {
    // Form
    form: document.getElementById('transactionForm'),
    typeExpenseBtn: document.getElementById('typeExpenseBtn'),
    typeIncomeBtn: document.getElementById('typeIncomeBtn'),
    amountInput: document.getElementById('amountInput'),
    categorySelect: document.getElementById('categorySelect'),
    dateInput: document.getElementById('dateInput'),
    notesInput: document.getElementById('notesInput'),
    submitBtn: document.getElementById('submitBtn'),
    amountFormattedPreview: document.getElementById('amountFormattedPreview'),

    // Summary Cards
    totalBalanceEl: document.getElementById('totalBalance'),
    totalIncomeEl: document.getElementById('totalIncomeMonth'),
    totalExpenseEl: document.getElementById('totalExpenseMonth'),
    transactionCountEl: document.getElementById('transactionCount'),

    // Table & List
    transactionList: document.getElementById('transactionList'),
    emptyState: document.getElementById('emptyState'),
    tableLoading: document.getElementById('tableLoading'),

    // Filters
    filterTypeSelect: document.getElementById('filterType'),
    filterCategorySelect: document.getElementById('filterCategory'),
    filterPeriodSelect: document.getElementById('filterPeriod'),
    customDateContainer: document.getElementById('customDateContainer'),
    filterStartDate: document.getElementById('filterStartDate'),
    filterEndDate: document.getElementById('filterEndDate'),
    searchInput: document.getElementById('searchInput'),
    resetFilterBtn: document.getElementById('resetFilterBtn'),

    // Database Status Badge & Modal
    dbStatusBadge: document.getElementById('dbStatusBadge'),
    dbStatusText: document.getElementById('dbStatusText'),
    openSettingsBtn: document.getElementById('openSettingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    supabaseUrlInput: document.getElementById('supabaseUrlInput'),
    supabaseKeyInput: document.getElementById('supabaseKeyInput'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    testConnBtn: document.getElementById('testConnBtn'),
    useLocalBtn: document.getElementById('useLocalBtn'),
    testStatusMsg: document.getElementById('testStatusMsg'),
    copySqlBtn: document.getElementById('copySqlBtn'),

    // Export & Toast
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toastMsg')
  };

  // Format Helper: Rupiah
  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Format Helper: Tanggal Indonesia
  const formatDateIndo = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Show Toast Alert
  const showToast = (message, type = 'success') => {
    if (!elements.toast) return;
    elements.toastMsg.textContent = message;
    elements.toast.className = `fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl transition-all duration-300 transform translate-y-0 ${
      type === 'success'
        ? 'bg-emerald-600 text-white'
        : type === 'error'
        ? 'bg-rose-600 text-white'
        : 'bg-slate-800 text-slate-100 border border-slate-700'
    }`;

    // Auto hide
    setTimeout(() => {
      elements.toast.classList.add('translate-y-20', 'opacity-0');
    }, 3500);
  };

  // Update Category Dropdown options based on type
  const updateCategoryOptions = (type) => {
    const list = CATEGORIES[type] || CATEGORIES.expense;
    elements.categorySelect.innerHTML = list
      .map((cat) => `<option value="${cat}">${cat}</option>`)
      .join('');
  };

  // Update Filter Category Options
  const populateFilterCategories = () => {
    const allUnique = Array.from(
      new Set([...CATEGORIES.expense, ...CATEGORIES.income])
    ).sort();

    elements.filterCategorySelect.innerHTML =
      '<option value="all">Semua Kategori</option>' +
      allUnique.map((c) => `<option value="${c}">${c}</option>`).join('');
  };

  // Set default form date ke hari ini
  const setDefaultDate = () => {
    const today = new Date().toISOString().split('T')[0];
    elements.dateInput.value = today;
  };

  // Update status koneksi database di header
  const updateDatabaseStatusUI = () => {
    const { isConfigured } = APP_CONFIG.getCredentials();
    if (window.dbService && window.dbService.isUsingSupabase) {
      elements.dbStatusBadge.className =
        'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      elements.dbStatusText.textContent = 'Supabase Cloud';
    } else {
      elements.dbStatusBadge.className =
        'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30';
      elements.dbStatusText.textContent = 'Demo LocalStorage';
    }
  };

  // Load Transactions from Database
  const loadTransactions = async () => {
    try {
      if (elements.tableLoading) elements.tableLoading.classList.remove('hidden');
      if (elements.emptyState) elements.emptyState.classList.add('hidden');

      state.transactions = await window.dbService.getTransactions();
      applyFilters();
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat data transaksi: ' + (err.message || ''), 'error');
    } finally {
      if (elements.tableLoading) elements.tableLoading.classList.add('hidden');
    }
  };

  // Hitung Summary Dashboard
  const updateSummaryCards = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let totalBalance = 0;
    let monthIncome = 0;
    let monthExpense = 0;

    // Hitung seluruh transaksi untuk Saldo Bersih Total
    state.transactions.forEach((item) => {
      const amt = Number(item.amount) || 0;
      if (item.type === 'income') {
        totalBalance += amt;
      } else {
        totalBalance -= amt;
      }

      // Hitung khusus bulan ini
      const itemDate = new Date(item.date);
      if (
        itemDate.getFullYear() === currentYear &&
        itemDate.getMonth() === currentMonth
      ) {
        if (item.type === 'income') {
          monthIncome += amt;
        } else {
          monthExpense += amt;
        }
      }
    });

    elements.totalBalanceEl.textContent = formatRupiah(totalBalance);
    elements.totalIncomeEl.textContent = formatRupiah(monthIncome);
    elements.totalExpenseEl.textContent = formatRupiah(monthExpense);

    // Color balance if negative
    if (totalBalance < 0) {
      elements.totalBalanceEl.className = 'text-2xl lg:text-3xl font-extrabold text-rose-400';
    } else {
      elements.totalBalanceEl.className = 'text-2xl lg:text-3xl font-extrabold text-emerald-400';
    }
  };

  // Filter Data
  const applyFilters = () => {
    const { type, category, dateRange, startDate, endDate, search } = state.filters;
    const now = new Date();

    const filtered = state.transactions.filter((item) => {
      // 1. Filter Tipe
      if (type !== 'all' && item.type !== type) return false;

      // 2. Filter Kategori
      if (category !== 'all' && item.category !== category) return false;

      // 3. Filter Rentang Tanggal
      const itemDate = new Date(item.date);
      if (dateRange === 'this_month') {
        if (
          itemDate.getFullYear() !== now.getFullYear() ||
          itemDate.getMonth() !== now.getMonth()
        ) {
          return false;
        }
      } else if (dateRange === 'last_30_days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        if (itemDate < thirtyDaysAgo || itemDate > now) return false;
      } else if (dateRange === 'custom') {
        if (startDate && new Date(item.date) < new Date(startDate)) return false;
        if (endDate && new Date(item.date) > new Date(endDate)) return false;
      }

      // 4. Filter Kata Kunci Pencarian (Notes / Kategori)
      if (search && search.trim() !== '') {
        const query = search.toLowerCase();
        const inNotes = (item.notes || '').toLowerCase().includes(query);
        const inCategory = (item.category || '').toLowerCase().includes(query);
        if (!inNotes && !inCategory) return false;
      }

      return true;
    });

    renderTransactionTable(filtered);
    window.chartManager.updateCharts(filtered);
    updateSummaryCards();

    if (elements.transactionCountEl) {
      elements.transactionCountEl.textContent = `${filtered.length} transaksi ditampilkan`;
    }
  };

  // Category Icon Generator
  const getCategoryIconSvg = (cat, type) => {
    if (type === 'income') {
      return `<div class="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/15 text-emerald-400">
        <i data-lucide="arrow-down-left" class="w-5 h-5"></i>
      </div>`;
    }
    return `<div class="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-500/15 text-rose-400">
      <i data-lucide="arrow-up-right" class="w-5 h-5"></i>
    </div>`;
  };

  // Render Tabel Transaksi
  const renderTransactionTable = (items) => {
    if (!elements.transactionList) return;

    if (items.length === 0) {
      elements.transactionList.innerHTML = '';
      elements.emptyState.classList.remove('hidden');
      return;
    }

    elements.emptyState.classList.add('hidden');
    elements.transactionList.innerHTML = items
      .map((item) => {
        const isIncome = item.type === 'income';
        const badgeColor = isIncome
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20';

        const amountSign = isIncome ? '+ ' : '- ';
        const amountClass = isIncome ? 'text-emerald-400' : 'text-rose-400';

        return `
          <tr class="hover:bg-slate-800/40 transition-colors border-b border-slate-800/60 group">
            <td class="py-3.5 px-4 whitespace-nowrap">
              <div class="flex items-center gap-3">
                ${getCategoryIconSvg(item.category, item.type)}
                <div>
                  <span class="font-medium text-slate-100 text-sm block">${item.category}</span>
                  <span class="text-xs text-slate-400 md:hidden block mt-0.5">${formatDateIndo(item.date)}</span>
                </div>
              </div>
            </td>
            <td class="py-3.5 px-4 hidden md:table-cell whitespace-nowrap text-sm text-slate-300">
              ${formatDateIndo(item.date)}
            </td>
            <td class="py-3.5 px-4 hidden lg:table-cell text-sm text-slate-400 max-w-xs truncate">
              ${item.notes || '-'}
            </td>
            <td class="py-3.5 px-4 whitespace-nowrap text-right">
              <span class="font-bold text-sm sm:text-base ${amountClass}">
                ${amountSign}${formatRupiah(item.amount)}
              </span>
            </td>
            <td class="py-3.5 px-4 whitespace-nowrap text-center">
              <button 
                onclick="window.deleteItem('${item.id}')"
                class="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Hapus Transaksi"
              >
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    // Re-initialize Lucide Icons for dynamically rendered icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  };

  // Expose delete to global scope for inline button handler
  window.deleteItem = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan transaksi ini?')) {
      return;
    }
    try {
      await window.dbService.deleteTransaction(id);
      showToast('Transaksi berhasil dihapus');
      await loadTransactions();
    } catch (err) {
      console.error(err);
      showToast('Gagal menghapus: ' + (err.message || ''), 'error');
    }
  };

  // Event: Toggle Type (Expense vs Income)
  const setTransactionType = (type) => {
    state.transactionType = type;
    if (type === 'expense') {
      elements.typeExpenseBtn.className =
        'flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-rose-600 text-white shadow-lg btn-expense-glow';
      elements.typeIncomeBtn.className =
        'flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60';
      elements.submitBtn.className =
        'w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white shadow-lg btn-expense-glow cursor-pointer';
      elements.submitBtn.textContent = 'Simpan Pengeluaran';
    } else {
      elements.typeIncomeBtn.className =
        'flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-emerald-600 text-white shadow-lg btn-primary-glow';
      elements.typeExpenseBtn.className =
        'flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60';
      elements.submitBtn.className =
        'w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg btn-primary-glow cursor-pointer';
      elements.submitBtn.textContent = 'Simpan Pemasukan';
    }
    updateCategoryOptions(type);
  };

  elements.typeExpenseBtn.addEventListener('click', () => setTransactionType('expense'));
  elements.typeIncomeBtn.addEventListener('click', () => setTransactionType('income'));

  // Live formatted rupiah preview for input nominal
  elements.amountInput.addEventListener('input', (e) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const num = Number(rawVal);
    if (rawVal && num > 0) {
      elements.amountFormattedPreview.textContent = formatRupiah(num);
    } else {
      elements.amountFormattedPreview.textContent = 'Rp 0';
    }
  });

  // Handle Form Submit
  elements.form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const amount = Number(elements.amountInput.value);
    const category = elements.categorySelect.value;
    const date = elements.dateInput.value;
    const notes = elements.notesInput.value.trim();

    if (!amount || amount <= 0) {
      showToast('Mohon masukkan nominal yang valid!', 'error');
      elements.amountInput.focus();
      return;
    }

    if (!date) {
      showToast('Mohon pilih tanggal transaksi!', 'error');
      return;
    }

    elements.submitBtn.disabled = true;
    elements.submitBtn.classList.add('opacity-70', 'cursor-not-allowed');

    try {
      await window.dbService.addTransaction({
        type: state.transactionType,
        amount: amount,
        category: category,
        date: date,
        notes: notes
      });

      showToast('Transaksi berhasil disimpan!');
      elements.amountInput.value = '';
      elements.notesInput.value = '';
      elements.amountFormattedPreview.textContent = 'Rp 0';
      setDefaultDate();

      await loadTransactions();
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan transaksi: ' + (err.message || ''), 'error');
    } finally {
      elements.submitBtn.disabled = false;
      elements.submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
  });

  // Filters Listeners
  elements.filterTypeSelect.addEventListener('change', (e) => {
    state.filters.type = e.target.value;
    applyFilters();
  });

  elements.filterCategorySelect.addEventListener('change', (e) => {
    state.filters.category = e.target.value;
    applyFilters();
  });

  elements.filterPeriodSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    state.filters.dateRange = val;
    if (val === 'custom') {
      elements.customDateContainer.classList.remove('hidden');
    } else {
      elements.customDateContainer.classList.add('hidden');
    }
    applyFilters();
  });

  elements.filterStartDate.addEventListener('change', (e) => {
    state.filters.startDate = e.target.value;
    applyFilters();
  });

  elements.filterEndDate.addEventListener('change', (e) => {
    state.filters.endDate = e.target.value;
    applyFilters();
  });

  elements.searchInput.addEventListener('input', (e) => {
    state.filters.search = e.target.value;
    applyFilters();
  });

  elements.resetFilterBtn.addEventListener('click', () => {
    state.filters = {
      type: 'all',
      category: 'all',
      dateRange: 'this_month',
      startDate: '',
      endDate: '',
      search: ''
    };
    elements.filterTypeSelect.value = 'all';
    elements.filterCategorySelect.value = 'all';
    elements.filterPeriodSelect.value = 'this_month';
    elements.customDateContainer.classList.add('hidden');
    elements.filterStartDate.value = '';
    elements.filterEndDate.value = '';
    elements.searchInput.value = '';
    applyFilters();
    showToast('Filter di-reset ke default');
  });

  // Export to CSV
  elements.exportCsvBtn.addEventListener('click', () => {
    if (state.transactions.length === 0) {
      showToast('Tidak ada data transaksi untuk diekspor', 'error');
      return;
    }

    const headers = ['ID', 'Tipe', 'Kategori', 'Nominal', 'Tanggal', 'Catatan'];
    const rows = state.transactions.map((t) => [
      `"${t.id}"`,
      `"${t.type}"`,
      `"${t.category}"`,
      t.amount,
      `"${t.date}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `CatatYuk_Transaksi_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Data berhasil diekspor ke CSV!');
  });

  // Settings Modal Handlers
  elements.openSettingsBtn.addEventListener('click', () => {
    const { url, anonKey } = APP_CONFIG.getCredentials();
    elements.supabaseUrlInput.value = url || '';
    elements.supabaseKeyInput.value = anonKey || '';
    elements.testStatusMsg.textContent = '';
    elements.settingsModal.classList.remove('hidden');
  });

  elements.closeSettingsBtn.addEventListener('click', () => {
    elements.settingsModal.classList.add('hidden');
  });

  // Test Connection
  elements.testConnBtn.addEventListener('click', async () => {
    const url = elements.supabaseUrlInput.value.trim();
    const key = elements.supabaseKeyInput.value.trim();

    if (!url || !key) {
      elements.testStatusMsg.className = 'text-xs text-rose-400 mt-2';
      elements.testStatusMsg.textContent = 'Isi URL dan Anon Key terlebih dahulu!';
      return;
    }

    elements.testStatusMsg.className = 'text-xs text-amber-400 mt-2';
    elements.testStatusMsg.textContent = 'Menguji koneksi ke Supabase...';

    const res = await window.dbService.testConnection(url, key);
    if (res.success) {
      elements.testStatusMsg.className = 'text-xs text-emerald-400 mt-2';
      elements.testStatusMsg.textContent = '✓ ' + res.message;
    } else {
      elements.testStatusMsg.className = 'text-xs text-rose-400 mt-2';
      elements.testStatusMsg.textContent = '✕ ' + res.message;
    }
  });

  // Save Settings
  elements.saveSettingsBtn.addEventListener('click', () => {
    const url = elements.supabaseUrlInput.value.trim();
    const key = elements.supabaseKeyInput.value.trim();

    if (url && key) {
      APP_CONFIG.saveCredentials(url, key);
      window.dbService.init();
      updateDatabaseStatusUI();
      elements.settingsModal.classList.add('hidden');
      showToast('Kredensial Supabase disimpan!');
      loadTransactions();
    } else {
      showToast('Mohon lengkapi URL dan Anon Key!', 'error');
    }
  });

  // Use Local Demo Mode
  elements.useLocalBtn.addEventListener('click', () => {
    APP_CONFIG.clearCredentials();
    elements.supabaseUrlInput.value = '';
    elements.supabaseKeyInput.value = '';
    window.dbService.init();
    updateDatabaseStatusUI();
    elements.settingsModal.classList.add('hidden');
    showToast('Beralih ke Demo LocalStorage');
    loadTransactions();
  });

  // Copy SQL Schema Button
  elements.copySqlBtn.addEventListener('click', () => {
    const sqlCode = `-- Buat tabel transactions di SQL Editor Supabase
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(15, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Buat policy agar publik anonim dapat membaca, menambah, dan menghapus (untuk web statis)
CREATE POLICY "Public Read" ON transactions FOR SELECT USING (true);
CREATE POLICY "Public Insert" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Delete" ON transactions FOR DELETE USING (true);`;

    navigator.clipboard.writeText(sqlCode).then(() => {
      showToast('Script SQL berhasil disalin ke clipboard!');
    });
  });

  // Initialize App
  const init = () => {
    updateCategoryOptions('expense');
    populateFilterCategories();
    setDefaultDate();
    updateDatabaseStatusUI();
    loadTransactions();

    if (window.lucide) {
      window.lucide.createIcons();
    }
  };

  init();
});

