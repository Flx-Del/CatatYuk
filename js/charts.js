/**
 * CatatYuk - Chart Visualizations with Chart.js
 * Mengelola Line Chart (Tren Pengeluaran) dan Doughnut Chart (Komposisi Kategori)
 */

class ChartManager {
  constructor() {
    this.trendChart = null;
    this.categoryChart = null;
  }

  // Format angka ke format mata uang Rupiah untuk tooltip
  formatRupiah(value) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  }

  // Palet warna modern untuk kategori
  getCategoryColor(category) {
    const colors = {
      Makanan: '#f97316', // Orange
      Transportasi: '#0ea5e9', // Sky blue
      Belanja: '#ec4899', // Pink
      Utilitas: '#eab308', // Amber/Yellow
      Gaji: '#10b981', // Emerald
      Investasi: '#8b5cf6', // Violet
      Hiburan: '#06b6d4', // Cyan
      Kesehatan: '#ef4444', // Red
      Pendidikan: '#3b82f6', // Blue
      Lainnya: '#64748b' // Slate
    };
    return colors[category] || '#94a3b8';
  }

  // Update kedua grafik dengan data transaksi yang sudah difilter
  updateCharts(transactions) {
    // Hanya hitung transaksi bertipe pengeluaran untuk visualisasi pengeluaran
    const expenses = transactions.filter((t) => t.type === 'expense');

    this.renderTrendChart(expenses);
    this.renderCategoryChart(expenses);
  }

  // Render Line Chart Tren Pengeluaran
  renderTrendChart(expenses) {
    const canvas = document.getElementById('expenseTrendChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Kosongkan state jika tidak ada data
    if (expenses.length === 0) {
      if (this.trendChart) this.trendChart.destroy();
      this.trendChart = null;
      document.getElementById('trendChartEmpty').classList.remove('hidden');
      canvas.classList.add('hidden');
      return;
    } else {
      document.getElementById('trendChartEmpty').classList.add('hidden');
      canvas.classList.remove('hidden');
    }

    // Kelompokkan pengeluaran berdasarkan tanggal (urut kronologis)
    const dailyMap = {};
    expenses.forEach((item) => {
      dailyMap[item.date] = (dailyMap[item.date] || 0) + Number(item.amount);
    });

    // Urutkan tanggal dari yang terlama ke terbaru untuk grafik garis
    const sortedDates = Object.keys(dailyMap).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    const labels = sortedDates.map((dateStr) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    });
    const dataValues = sortedDates.map((d) => dailyMap[d]);

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

    if (this.trendChart) {
      this.trendChart.data.labels = labels;
      this.trendChart.data.datasets[0].data = dataValues;
      this.trendChart.update();
    } else {
      this.trendChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Pengeluaran',
              data: dataValues,
              borderColor: '#ef4444',
              backgroundColor: gradient,
              borderWidth: 2.5,
              pointBackgroundColor: '#ef4444',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
              fill: true,
              tension: 0.35
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1e293b',
              titleColor: '#cbd5e1',
              bodyColor: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              padding: 10,
              displayColors: false,
              callbacks: {
                label: (context) => ` Pengeluaran: ${this.formatRupiah(context.raw)}`
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#94a3b8', font: { size: 11 } }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: {
                color: '#94a3b8',
                font: { size: 11 },
                callback: (val) => {
                  if (val >= 1000000) return (val / 1000000).toFixed(1) + ' jt';
                  if (val >= 1000) return (val / 1000).toFixed(0) + ' rb';
                  return val;
                }
              }
            }
          }
        }
      });
    }
  }

  // Render Doughnut / Pie Chart Komposisi Pengeluaran
  renderCategoryChart(expenses) {
    const canvas = document.getElementById('categoryPieChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (expenses.length === 0) {
      if (this.categoryChart) this.categoryChart.destroy();
      this.categoryChart = null;
      document.getElementById('categoryChartEmpty').classList.remove('hidden');
      canvas.classList.add('hidden');
      return;
    } else {
      document.getElementById('categoryChartEmpty').classList.add('hidden');
      canvas.classList.remove('hidden');
    }

    // Hitung total pengeluaran per kategori
    const categoryTotals = {};
    expenses.forEach((item) => {
      const cat = item.category || 'Lainnya';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(item.amount);
    });

    const labels = Object.keys(categoryTotals);
    const dataValues = Object.values(categoryTotals);
    const backgroundColors = labels.map((cat) => this.getCategoryColor(cat));

    if (this.categoryChart) {
      this.categoryChart.data.labels = labels;
      this.categoryChart.data.datasets[0].data = dataValues;
      this.categoryChart.data.datasets[0].backgroundColor = backgroundColors;
      this.categoryChart.update();
    } else {
      this.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [
            {
              data: dataValues,
              backgroundColor: backgroundColors,
              borderColor: '#1e293b',
              borderWidth: 2,
              hoverOffset: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: '#cbd5e1',
                padding: 12,
                boxWidth: 12,
                font: { size: 12 }
              }
            },
            tooltip: {
              backgroundColor: '#1e293b',
              titleColor: '#cbd5e1',
              bodyColor: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              padding: 10,
              callbacks: {
                label: (context) => {
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((context.raw / total) * 100).toFixed(1);
                  return ` ${context.label}: ${this.formatRupiah(context.raw)} (${percentage}%)`;
                }
              }
            }
          },
          cutout: '65%'
        }
      });
    }
  }
}

// Global instance
window.chartManager = new ChartManager();

