/**
 * stats.js — İstatistik ve seri hesaplama
 * GitHub-style heatmap, rutin bazında istatistikler, Pomodoro özeti.
 */

const StatsManager = (() => {

  function init() {
    refresh();
  }

  /**
   * Tüm istatistik bileşenlerini yenile
   */
  function refresh() {
    updateMainStats();
    renderHeatmap();
    renderRoutineStats();
    renderWeeklyPomodoro();
    renderGoalProgress();
  }

  // ---- Ana İstatistikler ----
  function updateMainStats() {
    const streak = RoutineManager.getDailyStreak();
    const best = RoutineManager.getBestStreak();
    const total = RoutineManager.getTotalCompleted();

    // Stats page
    const currentEl = document.getElementById('statsCurrentStreak');
    const bestEl = document.getElementById('statsBestStreak');
    const totalEl = document.getElementById('statsTotalCompleted');
    if (currentEl) currentEl.textContent = streak;
    if (bestEl) bestEl.textContent = best;
    if (totalEl) totalEl.textContent = total;

    // Dashboard
    const dashStreak = document.getElementById('dashStreak');
    if (dashStreak) dashStreak.textContent = streak;
  }

  // ---- Heatmap (GitHub-style) ----
  function renderHeatmap() {
    const container = document.getElementById('heatmapContainer');
    if (!container) return;
    container.innerHTML = '';

    // Son 12 hafta = 84 gün
    const today = new Date();
    const weeks = 12;
    const days = weeks * 7;

    // Başlangıç gününü haftanın başına hizala
    const start = new Date(today);
    start.setDate(today.getDate() - days + 1);

    // Haftaları oluştur
    let currentWeek = null;
    let currentWeekEl = null;

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dayOfWeek = (d.getDay() + 6) % 7; // Mon=0

      if (dayOfWeek === 0 || i === 0) {
        currentWeekEl = document.createElement('div');
        currentWeekEl.className = 'heatmap-week';
        container.appendChild(currentWeekEl);
      }

      const dateStr = RoutineManager.formatDate(d);
      const isFuture = d > today;

      let bg = 'var(--surface2)';
      let tooltipText = dateStr;

      if (!isFuture) {
        const comp = RoutineManager.getCompletionForDate(dateStr);
        if (comp) {
          const pct = comp.pct;
          tooltipText = `${dateStr}: ${comp.done}/${comp.total} rutin (${pct}%)`;
          if (pct === 0) bg = 'var(--surface2)';
          else if (pct < 25) bg = '#2a3d2a';
          else if (pct < 50) bg = '#3d5c3d';
          else if (pct < 75) bg = '#4d7a4d';
          else if (pct < 100) bg = '#6b8f6b';
          else bg = '#8aad8a';
        }
      } else {
        bg = 'transparent';
        tooltipText = '';
      }

      const dayEl = document.createElement('div');
      dayEl.className = 'heatmap-day';
      dayEl.style.background = bg;
      dayEl.dataset.tooltip = tooltipText;
      currentWeekEl.appendChild(dayEl);
    }
  }

  // ---- Rutin Bazında İstatistikler ----
  function renderRoutineStats() {
    const container = document.getElementById('routineStatsContainer');
    if (!container) return;

    const routines = RoutineManager.getRoutines();
    const completions = RoutineManager.getCompletions();

    if (routines.length === 0) {
      container.innerHTML = '<p class="empty-state">Henüz rutin eklenmedi.</p>';
      return;
    }

    // Her rutin için tamamlanma sayısı ve toplam gün hesapla
    const stats = routines.map(routine => {
      let total = 0, done = 0;

      Object.entries(completions).forEach(([dateStr, dayData]) => {
        const d = new Date(dateStr);
        const dayIndex = (d.getDay() + 6) % 7;
        if (routine.days.includes(dayIndex)) {
          total++;
          if (dayData[routine.id]) done++;
        }
      });

      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return { routine, total, done, pct };
    });

    // Pct'e göre sırala
    stats.sort((a, b) => b.pct - a.pct);

    container.innerHTML = stats.map(({ routine, done, total, pct }) => `
      <div class="routine-stat-item">
        <span class="routine-stat-emoji">${routine.emoji}</span>
        <div class="routine-stat-info">
          <div class="routine-stat-name">${escapeHtml(routine.name)}</div>
          <div class="routine-stat-bar-wrap">
            <div class="routine-stat-bar" style="width:${pct}%"></div>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:3px">${done}/${total} gün</div>
        </div>
        <span class="routine-stat-pct">${pct}%</span>
      </div>
    `).join('');
  }

  // ---- Haftalık Pomodoro Bar Chart ----
  function renderWeeklyPomodoro() {
    const container = document.getElementById('weeklyPomodoro');
    if (!container) return;

    // Son 7 gün için pomodoro verisi
    // Pomodoro verisi sessionLog'dan çekiyoruz; basit yaklaşım: today's count sadece
    // Gerçekçi haftalık veri için localStorage'dan çek
    const weekData = getWeeklyPomodoroData();
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const maxVal = Math.max(...weekData, 1);

    container.innerHTML = weekData.map((val, i) => `
      <div class="pomo-bar-wrap">
        <span class="pomo-bar-val">${val > 0 ? val : ''}</span>
        <div class="pomo-bar" style="height:${(val / maxVal) * 70}px"></div>
        <span class="pomo-bar-label">${days[i]}</span>
      </div>
    `).join('');
  }

  function getWeeklyPomodoroData() {
    const stored = localStorage.getItem('pomodoro_weekly') || '{}';
    let weekly = {};
    try { weekly = JSON.parse(stored); } catch(e) {}

    const result = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = RoutineManager.formatDate(d);
      result.push(weekly[key] || 0);
    }
    return result;
  }

  // ---- Hedef İlerleme (Stats sayfası) ----
  function renderGoalProgress() {
    const container = document.getElementById('statsGoalProgress');
    if (!container) return;

    const goals = GoalManager.getGoals();
    const active = goals.filter(g => !g.completed);

    if (active.length === 0) {
      container.innerHTML = '<p class="empty-state">Aktif hedef yok.</p>';
      return;
    }

    container.innerHTML = active.map(g => `
      <div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:13px;font-weight:600">${escapeHtml(g.title)}</span>
          <span style="font-size:13px;color:var(--primary-light)">${g.progress}%</span>
        </div>
        <div class="progress-wrap">
          <div class="progress-fill" style="width:${g.progress}%"></div>
        </div>
      </div>
    `).join('');
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  return { init, refresh, getWeeklyPomodoroData };
})();
