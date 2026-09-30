/**
 * routines.js — Rutin yönetimi
 * Ekleme, düzenleme, silme, tamamlama, sıralama, streak takibi.
 */

const RoutineManager = (() => {

  // ---- Data ----
  let routines = [];
  let completions = {}; // { 'YYYY-MM-DD': { routineId: true } }
  let currentCat = 'all';
  let dragSrcIndex = null;

  const EMOJIS = ['⭐', '🌟', '💪', '🧘', '🏃', '📚', '💧', '🎯', '✍️',
                  '🧠', '❤️', '🌅', '🌙', '☀️', '🍎', '🏋️', '🎵', '🌿',
                  '🔥', '💊', '🚿', '🧹', '📖', '🏊', '🚴', '🤸', '🧴', '🍵'];

  const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  const CAT_ICONS = { sabah: '🌅', öğle: '☀️', akşam: '🌆', gece: '🌙' };

  // ---- Init ----
  function init() {
    loadData();
    setupTabs();
    render();
  }

  function loadData() {
    const rData = localStorage.getItem('routines');
    const cData = localStorage.getItem('completions');
    routines = rData ? JSON.parse(rData) : [];
    completions = cData ? JSON.parse(cData) : {};
  }

  function saveData() {
    localStorage.setItem('routines', JSON.stringify(routines));
    localStorage.setItem('completions', JSON.stringify(completions));
  }

  // ---- Tabs ----
  function setupTabs() {
    const tabBar = document.getElementById('routineTabs');
    if (!tabBar) return;
    tabBar.addEventListener('click', e => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      tabBar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCat = btn.dataset.cat;
      render();
    });
  }

  // ---- Render ----
  function render() {
    renderRoutinesList();
    renderDashboard();
    updateStreakBadge();
  }

  function renderRoutinesList() {
    const container = document.getElementById('routinesList');
    if (!container) return;

    const today = getTodayKey();
    const todayCompletions = completions[today] || {};

    // Filter by category
    const filtered = routines.filter(r => currentCat === 'all' || r.category === currentCat);

    if (filtered.length === 0) {
      container.innerHTML = '<p class="empty-state">Bu kategoride rutin yok. Başlamak için "Rutin Ekle" butonuna tıkla!</p>';
      return;
    }

    container.innerHTML = '';
    filtered.forEach((routine, idx) => {
      const done = !!todayCompletions[routine.id];
      const streak = getRoutineStreak(routine.id);
      const todayDay = getTodayDayIndex();
      const isForToday = routine.days.includes(todayDay);

      const card = document.createElement('div');
      card.className = `routine-card${done ? ' completed' : ''}`;
      card.dataset.id = routine.id;
      card.dataset.idx = idx;
      card.draggable = true;

      card.innerHTML = `
        <span class="routine-drag-handle" title="Sürükle">⠿</span>
        <button class="routine-check-btn${done ? ' checked' : ''}" onclick="RoutineManager.toggleComplete('${routine.id}')" title="${done ? 'Geri al' : 'Tamamlandı işaretle'}">
          ${done ? '✓' : ''}
        </button>
        <span class="routine-emoji">${routine.emoji}</span>
        <div class="routine-info">
          <div class="routine-name">${escapeHtml(routine.name)}</div>
          <div class="routine-meta">
            <span>${CAT_ICONS[routine.category] || ''} ${capitalizeFirst(routine.category)}</span>
            <span>${renderDays(routine.days)}</span>
            ${!isForToday ? '<span style="color:var(--text-muted)">(Bugün değil)</span>' : ''}
          </div>
        </div>
        ${streak > 0 ? `<div class="routine-streak">🔥 ${streak}</div>` : ''}
        <div class="routine-actions">
          <button class="btn-icon" onclick="RoutineManager.openEditModal('${routine.id}')" title="Düzenle">✏️</button>
          <button class="btn-icon" onclick="RoutineManager.deleteRoutine('${routine.id}')" title="Sil">🗑️</button>
        </div>
      `;

      // Drag events
      card.addEventListener('dragstart', () => { dragSrcIndex = idx; card.classList.add('dragging'); });
      card.addEventListener('dragend', () => { card.classList.remove('dragging'); });
      card.addEventListener('dragover', e => { e.preventDefault(); });
      card.addEventListener('drop', () => {
        if (dragSrcIndex === null || dragSrcIndex === idx) return;
        const srcRoutine = filtered[dragSrcIndex];
        const destRoutine = filtered[idx];
        // Swap in main array
        const srcI = routines.findIndex(r => r.id === srcRoutine.id);
        const destI = routines.findIndex(r => r.id === destRoutine.id);
        [routines[srcI], routines[destI]] = [routines[destI], routines[srcI]];
        dragSrcIndex = null;
        saveData();
        render();
      });

      container.appendChild(card);
    });
  }

  function renderDays(days) {
    if (days.length === 7) return 'Her gün';
    if (days.length === 5 && !days.includes(5) && !days.includes(6)) return 'Hafta içi';
    return days.map(d => DAY_NAMES[d]).join(', ');
  }

  function renderDashboard() {
    const container = document.getElementById('dashRoutinesList');
    if (!container) return;

    const today = getTodayKey();
    const todayCompletions = completions[today] || {};
    const todayDay = getTodayDayIndex();

    // Only show today's routines
    const todayRoutines = routines.filter(r => r.days.includes(todayDay));

    if (todayRoutines.length === 0) {
      container.innerHTML = '<p class="empty-state">Bugün için rutin yok.</p>';
      return;
    }

    container.innerHTML = todayRoutines.slice(0, 6).map(r => {
      const done = !!todayCompletions[r.id];
      return `
        <div class="dash-routine-item${done ? ' done' : ''}" onclick="RoutineManager.toggleComplete('${r.id}')">
          <div class="dash-routine-check${done ? ' checked' : ''}">${done ? '✓' : ''}</div>
          <span>${r.emoji}</span>
          <span class="dash-routine-name">${escapeHtml(r.name)}</span>
        </div>
      `;
    }).join('');

    if (todayRoutines.length > 6) {
      container.innerHTML += `<p style="text-align:center;color:var(--text-muted);font-size:12px;margin-top:8px">+${todayRoutines.length - 6} daha</p>`;
    }

    // Update completion %
    const total = todayRoutines.length;
    const done = todayRoutines.filter(r => todayCompletions[r.id]).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const dashComp = document.getElementById('dashCompletion');
    if (dashComp) dashComp.textContent = `${pct}%`;
  }

  // ---- Streak ----
  function getRoutineStreak(routineId) {
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = formatDate(d);
      const dayIndex = (d.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0

      const routine = routines.find(r => r.id === routineId);
      if (!routine) break;

      // Skip days routine doesn't apply
      if (!routine.days.includes(dayIndex)) continue;

      if (completions[key] && completions[key][routineId]) {
        streak++;
      } else {
        if (i === 0) continue; // Today not yet done is ok
        break;
      }
    }
    return streak;
  }

  function getDailyStreak() {
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = formatDate(d);
      const dayIndex = (d.getDay() + 6) % 7;

      const todayRoutines = routines.filter(r => r.days.includes(dayIndex));
      if (todayRoutines.length === 0) continue;

      const dayComps = completions[key] || {};
      const allDone = todayRoutines.every(r => dayComps[r.id]);

      if (allDone) {
        streak++;
      } else {
        if (i === 0) continue; // Today not complete yet is ok
        break;
      }
    }
    return streak;
  }

  function getBestStreak() {
    let best = 0, current = 0;
    const dates = Object.keys(completions).sort();

    dates.forEach(key => {
      const d = new Date(key);
      const dayIndex = (d.getDay() + 6) % 7;
      const todayRoutines = routines.filter(r => r.days.includes(dayIndex));
      if (todayRoutines.length === 0) return;
      const dayComps = completions[key] || {};
      const allDone = todayRoutines.every(r => dayComps[r.id]);
      if (allDone) { current++; best = Math.max(best, current); }
      else current = 0;
    });
    return best;
  }

  function getTotalCompleted() {
    return Object.values(completions).reduce((sum, dayData) => {
      return sum + Object.values(dayData).filter(Boolean).length;
    }, 0);
  }

  function getCompletionForDate(dateStr) {
    const d = new Date(dateStr);
    const dayIndex = (d.getDay() + 6) % 7;
    const dayRoutines = routines.filter(r => r.days.includes(dayIndex));
    if (dayRoutines.length === 0) return null;
    const dayComps = completions[dateStr] || {};
    const done = dayRoutines.filter(r => dayComps[r.id]).length;
    return { done, total: dayRoutines.length, pct: Math.round((done / dayRoutines.length) * 100) };
  }

  function updateStreakBadge() {
    const streak = getDailyStreak();
    document.querySelectorAll('#sidebarStreakCount, #mobileStreakCount').forEach(el => {
      if (el) el.textContent = streak;
    });
    const dashStreak = document.getElementById('dashStreak');
    if (dashStreak) dashStreak.textContent = streak;
  }

  // ---- Toggle Complete ----
  function toggleComplete(id) {
    const today = getTodayKey();
    if (!completions[today]) completions[today] = {};

    const wasDone = completions[today][id];
    completions[today][id] = !wasDone;
    saveData();

    if (!wasDone) {
      // Was just completed
      triggerConfetti();
      App.showToast('Rutin tamamlandı! 🎉', 'success');
      checkDayComplete();
    }

    render();
    StatsManager.refresh();
  }

  function checkDayComplete() {
    const today = getTodayKey();
    const todayDay = getTodayDayIndex();
    const todayRoutines = routines.filter(r => r.days.includes(todayDay));
    const dayComps = completions[today] || {};
    const allDone = todayRoutines.length > 0 && todayRoutines.every(r => dayComps[r.id]);
    if (allDone) {
      setTimeout(() => App.showToast('🎊 Tüm rutinleri tamamladın! Harika!', 'success'), 500);
    }
  }

  // ---- CRUD ----
  function openAddModal() {
    document.getElementById('routineModalTitle').textContent = 'Rutin Ekle';
    document.getElementById('routineEditId').value = '';
    document.getElementById('routineName').value = '';
    document.getElementById('routineEmoji').value = '';
    document.getElementById('routineCategory').value = 'sabah';

    // Reset day buttons
    document.querySelectorAll('#dayPicker .day-btn').forEach(b => b.classList.add('active'));

    // Setup emoji picker
    setupEmojiPicker();

    document.getElementById('routineModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('routineName').focus(), 100);
  }

  function openEditModal(id) {
    const routine = routines.find(r => r.id === id);
    if (!routine) return;

    document.getElementById('routineModalTitle').textContent = 'Rutini Düzenle';
    document.getElementById('routineEditId').value = id;
    document.getElementById('routineName').value = routine.name;
    document.getElementById('routineEmoji').value = routine.emoji;
    document.getElementById('routineCategory').value = routine.category;

    document.querySelectorAll('#dayPicker .day-btn').forEach(b => {
      b.classList.toggle('active', routine.days.includes(parseInt(b.dataset.day)));
    });

    setupEmojiPicker(routine.emoji);
    document.getElementById('routineModal').classList.remove('hidden');
  }

  function setupEmojiPicker(selected = '') {
    const picker = document.getElementById('emojiPicker');
    if (!picker) return;
    picker.innerHTML = EMOJIS.map(e => `
      <span class="emoji-opt${e === selected ? ' selected' : ''}" 
            onclick="RoutineManager.selectEmoji('${e}')" 
            title="${e}">${e}</span>
    `).join('');
  }

  function selectEmoji(emoji) {
    document.getElementById('routineEmoji').value = emoji;
    document.querySelectorAll('.emoji-opt').forEach(el => {
      el.classList.toggle('selected', el.textContent === emoji);
    });
  }

  function closeModal() {
    document.getElementById('routineModal').classList.add('hidden');
  }

  function saveRoutine() {
    const name = document.getElementById('routineName').value.trim();
    if (!name) {
      App.showToast('Rutin adı gerekli!', 'error');
      return;
    }

    const emoji = document.getElementById('routineEmoji').value || '⭐';
    const category = document.getElementById('routineCategory').value;
    const days = Array.from(document.querySelectorAll('#dayPicker .day-btn.active'))
      .map(b => parseInt(b.dataset.day));

    if (days.length === 0) {
      App.showToast('En az bir gün seçin!', 'error');
      return;
    }

    const editId = document.getElementById('routineEditId').value;

    if (editId) {
      const idx = routines.findIndex(r => r.id === editId);
      if (idx !== -1) {
        routines[idx] = { ...routines[idx], name, emoji, category, days };
        App.showToast('Rutin güncellendi!', 'success');
      }
    } else {
      routines.push({ id: generateId(), name, emoji, category, days, createdAt: new Date().toISOString() });
      App.showToast('Rutin eklendi!', 'success');
    }

    saveData();
    closeModal();
    render();
    StatsManager.refresh();
  }

  function deleteRoutine(id) {
    App.showConfirm('Rutini sil', 'Bu rutini silmek istediğine emin misin?', () => {
      routines = routines.filter(r => r.id !== id);
      saveData();
      render();
      StatsManager.refresh();
      App.showToast('Rutin silindi.', 'info');
    });
  }

  // ---- Day Picker Toggle ----
  function initDayPicker() {
    document.querySelectorAll('#dayPicker .day-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
      });
    });
  }

  // ---- Confetti ----
  function triggerConfetti() {
    const container = document.getElementById('confettiContainer');
    if (!container) return;
    const colors = ['#6b8f6b', '#8aad8a', '#c4a882', '#7ab87a', '#c4a64e', '#b87a7a', '#e8ede8'];

    for (let i = 0; i < 40; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.cssText = `
        left: ${Math.random() * 100}%;
        top: ${-10 + Math.random() * 10}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        width: ${6 + Math.random() * 8}px;
        height: ${6 + Math.random() * 8}px;
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        animation-duration: ${1.5 + Math.random() * 2}s;
        animation-delay: ${Math.random() * 0.5}s;
      `;
      container.appendChild(piece);
      setTimeout(() => piece.remove(), 3000);
    }
  }

  // ---- Helpers ----
  function getTodayKey() { return formatDate(new Date()); }
  function formatDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function getTodayDayIndex() {
    return (new Date().getDay() + 6) % 7; // Mon=0 ... Sun=6
  }
  function generateId() { return 'r_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5); }
  function escapeHtml(str) { return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function capitalizeFirst(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

  return {
    init,
    initDayPicker,
    render,
    renderDashboard,
    openAddModal,
    openEditModal,
    closeModal,
    saveRoutine,
    deleteRoutine,
    toggleComplete,
    selectEmoji,
    getDailyStreak,
    getBestStreak,
    getTotalCompleted,
    getCompletionForDate,
    getRoutines: () => routines,
    getCompletions: () => completions,
    getTodayDayIndex,
    formatDate,
    triggerConfetti,
    updateStreakBadge,
  };
})();
