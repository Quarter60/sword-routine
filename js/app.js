/**
 * app.js — Ana uygulama başlatıcı ve yardımcı fonksiyonlar
 * Sayfa navigasyonu, toast, confirm modal, tarih/saat güncelleme.
 */

const App = (() => {

  let currentPage = 'dashboard';
  let confirmCallback = null;
  let clockInterval = null;

  // ---- Init ----
  function init() {
    // Initialize all modules
    RoutineManager.init();
    RoutineManager.initDayPicker();
    Pomodoro.init();
    GoalManager.init();
    Journal.init();
    StatsManager.init();
    NotificationManager.init();
    IdleManager.init();

    // Dashboard setup
    updateDashboardDateTime();
    loadDashboardQuote();
    updateDashboardStats();

    // Navigation
    setupNavigation();
    setupMobileNav();

    // Clock
    clockInterval = setInterval(() => {
      updateDashboardDateTime();
    }, 1000);

    // Confirm modal OK button
    const confirmOkBtn = document.getElementById('confirmOkBtn');
    if (confirmOkBtn) {
      confirmOkBtn.addEventListener('click', () => {
        if (confirmCallback) { confirmCallback(); confirmCallback = null; }
        closeConfirm();
      });
    }

    // Always start at dashboard
    navigateTo('dashboard');

    // Request notification permission if first visit
    if (!localStorage.getItem('notif_prompted')) {
      setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'default') {
          NotificationManager.requestPermission();
          localStorage.setItem('notif_prompted', '1');
        }
      }, 3000);
    }

    console.log('⚔️ Sword Routine başlatıldı!');
  }

  // ---- Navigation ----
  function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        const page = item.dataset.page;
        navigateTo(page);
        // Mobile: close sidebar
        closeMobileSidebar();
      });
    });
  }

  function setupMobileNav() {
    const hamburger = document.getElementById('hamburger');
    const overlay = document.getElementById('overlay');
    const sidebar = document.getElementById('sidebar');

    if (hamburger) {
      hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', closeMobileSidebar);
    }
  }

  function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
  }

  function navigateTo(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Show target page
    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.add('active');

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    currentPage = page;
    // Update URL hash for bookmarking (optional)
    history.replaceState(null, '', '#' + page);

    // Apply theme class to body
    document.body.className = 'theme-' + page;

    // Refresh page-specific content
    if (page === 'dashboard') {
      updateDashboardStats();
      RoutineManager.renderDashboard();
    } else if (page === 'stats') {
      StatsManager.refresh();
    } else if (page === 'journal') {
      Journal.init();
    } else if (page === 'settings') {
      IdleManager.renderSettingsList();
    }
  }

  // ---- Dashboard ----
  function updateDashboardDateTime() {
    const now = new Date();

    // Greeting by time of day
    const hour = now.getHours();
    let greeting = '';
    if (hour < 12) greeting = 'Günaydın! ☀️';
    else if (hour < 17) greeting = 'İyi günler! 🌤️';
    else if (hour < 21) greeting = 'İyi akşamlar! 🌆';
    else greeting = 'İyi geceler! 🌙';

    const greetingEl = document.getElementById('dashboardGreeting');
    if (greetingEl) greetingEl.textContent = greeting;

    // Date/time in Turkish
    const dateStr = now.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const dateEl = document.getElementById('dashboardDate');
    if (dateEl) dateEl.textContent = `${capitalizeFirst(dateStr)} — ${timeStr}`;
  }

  function loadDashboardQuote() {
    const quote = Quotes.getDailyQuote();
    const quoteEl = document.getElementById('dashQuote');
    const authorEl = document.getElementById('dashQuoteAuthor');
    if (quoteEl) quoteEl.textContent = `"${quote.text}"`;
    if (authorEl) authorEl.textContent = `— ${quote.author}`;
  }

  function updateDashboardStats() {
    // Pomodoro today
    const dashPom = document.getElementById('dashPomodoro');
    if (dashPom) dashPom.textContent = Pomodoro.getTodayPomodoros();

    // Goals count
    const dashGoals = document.getElementById('dashGoals');
    if (dashGoals) dashGoals.textContent = GoalManager.getGoals().filter(g => !g.completed).length;

    // Completion % and streak are updated by RoutineManager
    RoutineManager.updateStreakBadge();
    RoutineManager.renderDashboard();
    GoalManager.renderDashboardSummary();
  }

  // ---- Toast Notifications ----
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    container.appendChild(toast);

    // Auto-remove
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ---- Confirm Modal ----
  function showConfirm(title, message, callback) {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const msgEl = document.getElementById('confirmMessage');

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    confirmCallback = callback;
    if (modal) modal.classList.remove('hidden');
  }

  function closeConfirm() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.classList.add('hidden');
    confirmCallback = null;
  }

  // ---- Helpers ----
  function capitalizeFirst(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

  // Close modal on backdrop click
  document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-backdrop')) {
      e.target.classList.add('hidden');
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach(m => m.classList.add('hidden'));
      IdleManager.hideIdlePanel();
    }
  });

  return {
    init,
    navigateTo,
    showToast,
    showConfirm,
    closeConfirm,
    updateDashboardStats,
    getCurrentPage: () => currentPage
  };

})();

// ---- Start the app when DOM is ready ----
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
