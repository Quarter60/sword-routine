/**
 * goals.js — Hedef yönetimi
 * Ekleme, düzenleme, ilerleme takibi, tamamlama, geri sayım.
 */

const GoalManager = (() => {

  let goals = [];
  let currentFilter = 'all';

  // ---- Init ----
  function init() {
    loadGoals();
    setupFilterTabs();
    render();
  }

  function loadGoals() {
    const stored = localStorage.getItem('goals');
    goals = stored ? JSON.parse(stored) : [];
  }

  function saveGoals() {
    localStorage.setItem('goals', JSON.stringify(goals));
  }

  // ---- Filter Tabs ----
  function setupFilterTabs() {
    const filterBar = document.querySelector('.goals-filter');
    if (!filterBar) return;
    filterBar.addEventListener('click', e => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      filterBar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderGoalsList();
    });
  }

  // ---- Render ----
  function render() {
    renderGoalsList();
    renderDashboardSummary();
  }

  function renderGoalsList() {
    const container = document.getElementById('goalsList');
    if (!container) return;

    let filtered = goals;
    if (currentFilter === 'active') filtered = goals.filter(g => !g.completed);
    if (currentFilter === 'completed') filtered = goals.filter(g => g.completed);

    if (filtered.length === 0) {
      container.innerHTML = '<p class="empty-state" style="grid-column:1/-1">Henüz hedef yok.</p>';
      return;
    }

    container.innerHTML = filtered.map(goal => renderGoalCard(goal)).join('');
  }

  function renderGoalCard(goal) {
    const daysRemaining = getDaysRemaining(goal.targetDate);
    const daysClass = goal.completed ? 'done' : (daysRemaining <= 7 && daysRemaining >= 0) ? 'urgent' : '';
    const daysLabel = goal.completed ? '✅ Tamamlandı'
      : daysRemaining === null ? 'Tarih yok'
      : daysRemaining < 0 ? `${Math.abs(daysRemaining)} gün geçti!`
      : daysRemaining === 0 ? 'Bugün son gün!'
      : `${daysRemaining} gün kaldı`;

    return `
      <div class="goal-card${goal.completed ? ' completed' : ''}">
        ${goal.completed ? '<div class="goal-complete-badge">✓</div>' : ''}
        <div class="goal-card-header">
          <div class="goal-title">${escapeHtml(goal.title)}</div>
          ${goal.category ? `<span class="goal-category-badge">${escapeHtml(goal.category)}</span>` : ''}
        </div>
        ${goal.description ? `<p class="goal-desc">${escapeHtml(goal.description)}</p>` : ''}
        <div class="goal-progress-bar-wrap">
          <div class="goal-progress-bar" style="width:${goal.progress}%"></div>
        </div>
        <div class="goal-footer">
          <span class="goal-pct">${goal.progress}%</span>
          <span class="goal-days ${daysClass}">${daysLabel}</span>
          <div class="goal-actions">
            ${!goal.completed ? `<button class="btn-icon" onclick="GoalManager.toggleComplete('${goal.id}')" title="Tamamlandı işaretle">✅</button>` : `<button class="btn-icon" onclick="GoalManager.toggleComplete('${goal.id}')" title="Tekrar aç">↩️</button>`}
            <button class="btn-icon" onclick="GoalManager.openEditModal('${goal.id}')" title="Düzenle">✏️</button>
            <button class="btn-icon" onclick="GoalManager.deleteGoal('${goal.id}')" title="Sil">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderDashboardSummary() {
    const container = document.getElementById('dashGoalsList');
    if (!container) return;

    const active = goals.filter(g => !g.completed);

    // Update active goal count on dashboard
    const dashGoals = document.getElementById('dashGoals');
    if (dashGoals) dashGoals.textContent = active.length;

    if (active.length === 0) {
      container.innerHTML = '<p class="empty-state">Aktif hedef yok.</p>';
      return;
    }

    container.innerHTML = active.slice(0, 4).map(g => `
      <div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;margin-bottom:5px">
          <span style="font-size:13px;font-weight:600">${escapeHtml(g.title)}</span>
          <span style="font-size:12px;color:var(--primary-light)">${g.progress}%</span>
        </div>
        <div class="progress-wrap">
          <div class="progress-fill" style="width:${g.progress}%"></div>
        </div>
      </div>
    `).join('');
  }

  // ---- CRUD ----
  function openAddModal() {
    document.getElementById('goalModalTitle').textContent = 'Hedef Ekle';
    document.getElementById('goalEditId').value = '';
    document.getElementById('goalTitle').value = '';
    document.getElementById('goalDesc').value = '';
    document.getElementById('goalCategory').value = '';
    document.getElementById('goalTargetDate').value = '';
    document.getElementById('goalProgress').value = 0;
    document.getElementById('goalProgressLabel').textContent = '0';
    document.getElementById('goalModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('goalTitle').focus(), 100);
  }

  function openEditModal(id) {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    document.getElementById('goalModalTitle').textContent = 'Hedefi Düzenle';
    document.getElementById('goalEditId').value = id;
    document.getElementById('goalTitle').value = goal.title;
    document.getElementById('goalDesc').value = goal.description || '';
    document.getElementById('goalCategory').value = goal.category || '';
    document.getElementById('goalTargetDate').value = goal.targetDate || '';
    document.getElementById('goalProgress').value = goal.progress;
    document.getElementById('goalProgressLabel').textContent = goal.progress;
    document.getElementById('goalModal').classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('goalModal').classList.add('hidden');
  }

  function saveGoal() {
    const title = document.getElementById('goalTitle').value.trim();
    if (!title) {
      App.showToast('Hedef başlığı gerekli!', 'error');
      return;
    }

    const description = document.getElementById('goalDesc').value.trim();
    const category = document.getElementById('goalCategory').value.trim();
    const targetDate = document.getElementById('goalTargetDate').value;
    const progress = parseInt(document.getElementById('goalProgress').value) || 0;
    const editId = document.getElementById('goalEditId').value;

    if (editId) {
      const idx = goals.findIndex(g => g.id === editId);
      if (idx !== -1) {
        goals[idx] = { ...goals[idx], title, description, category, targetDate, progress };
        App.showToast('Hedef güncellendi!', 'success');
      }
    } else {
      goals.push({
        id: 'g_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        title, description, category, targetDate, progress,
        completed: false,
        createdAt: new Date().toISOString()
      });
      App.showToast('Hedef eklendi!', 'success');
    }

    saveGoals();
    closeModal();
    render();
    StatsManager.renderGoalProgress();
  }

  function deleteGoal(id) {
    App.showConfirm('Hedefi sil', 'Bu hedefi silmek istediğine emin misin?', () => {
      goals = goals.filter(g => g.id !== id);
      saveGoals();
      render();
      StatsManager.refresh();
      App.showToast('Hedef silindi.', 'info');
    });
  }

  function toggleComplete(id) {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    goal.completed = !goal.completed;
    if (goal.completed) {
      goal.progress = 100;
      App.showToast('🎊 Hedef tamamlandı! Tebrikler!', 'success');
      RoutineManager.triggerConfetti();
    }
    saveGoals();
    render();
    StatsManager.refresh();
  }

  // ---- Helpers ----
  function getDaysRemaining(targetDate) {
    if (!targetDate) return null;
    const target = new Date(targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return Math.round((target - today) / (1000 * 60 * 60 * 24));
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  return {
    init,
    render,
    renderDashboardSummary,
    openAddModal,
    openEditModal,
    closeModal,
    saveGoal,
    deleteGoal,
    toggleComplete,
    getGoals: () => goals,
    setGoals: (data) => { goals = data; saveGoals(); render(); }
  };
})();
