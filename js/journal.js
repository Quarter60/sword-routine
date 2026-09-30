/**
 * journal.js — Günlük yazıları yönetimi
 * Tarihler arası gezinme, ruh hali seçici, otomatik kaydetme, kelime sayısı.
 */

const Journal = (() => {

  let entries = {};      // { 'YYYY-MM-DD': { mood: 3, text: '...', updatedAt: '...' } }
  let currentDate = '';
  let autoSaveTimer = null;

  // ---- Init ----
  function init() {
    loadEntries();
    currentDate = getTodayKey();
    setupMoodSelector();
    setupTextarea();
    loadEntryForDate(currentDate);
    renderEntriesList();
    updateDateDisplay();
    updateNextBtn();
  }

  function loadEntries() {
    const stored = localStorage.getItem('journal_entries');
    entries = stored ? JSON.parse(stored) : {};
  }

  function saveEntries() {
    localStorage.setItem('journal_entries', JSON.stringify(entries));
  }

  // ---- Date Navigation ----
  function prevDay() {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    currentDate = formatDate(d);
    loadEntryForDate(currentDate);
    updateDateDisplay();
    updateNextBtn();
  }

  function nextDay() {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    const newDate = formatDate(d);
    // Cannot go beyond today
    if (newDate > getTodayKey()) return;
    currentDate = newDate;
    loadEntryForDate(currentDate);
    updateDateDisplay();
    updateNextBtn();
  }

  function updateNextBtn() {
    const btn = document.getElementById('journalNextBtn');
    if (btn) btn.disabled = (currentDate >= getTodayKey());
  }

  function updateDateDisplay() {
    const el = document.getElementById('journalDateDisplay');
    if (!el) return;
    const today = getTodayKey();
    if (currentDate === today) {
      el.textContent = 'Bugün';
    } else {
      const d = new Date(currentDate);
      el.textContent = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
    }
  }

  // ---- Load/Save Entry ----
  function loadEntryForDate(dateStr) {
    const entry = entries[dateStr] || { mood: 0, text: '' };

    const textarea = document.getElementById('journalText');
    if (textarea) textarea.value = entry.text || '';

    // Set mood
    document.querySelectorAll('.mood-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.mood) === entry.mood);
    });

    updateWordCount();
    showSaveStatus('Kaydedildi ✓');
  }

  function saveCurrentEntry() {
    const text = (document.getElementById('journalText') || {}).value || '';
    const mood = parseInt(document.querySelector('.mood-btn.active')?.dataset.mood || '0');

    if (!entries[currentDate]) entries[currentDate] = {};
    entries[currentDate].text = text;
    entries[currentDate].mood = mood;
    entries[currentDate].updatedAt = new Date().toISOString();

    saveEntries();
    renderEntriesList();
    showSaveStatus('Kaydedildi ✓');
  }

  // ---- Mood Selector ----
  function setupMoodSelector() {
    const container = document.getElementById('moodOptions');
    if (!container) return;
    container.addEventListener('click', e => {
      const btn = e.target.closest('.mood-btn');
      if (!btn) return;
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      scheduleAutoSave();
    });
  }

  // ---- Textarea ----
  function setupTextarea() {
    const textarea = document.getElementById('journalText');
    if (!textarea) return;
    textarea.addEventListener('input', () => {
      updateWordCount();
      scheduleAutoSave();
      showSaveStatus('Kaydediliyor...');
    });
  }

  function updateWordCount() {
    const textarea = document.getElementById('journalText');
    const countEl = document.getElementById('wordCount');
    if (!textarea || !countEl) return;
    const text = textarea.value.trim();
    const count = text ? text.split(/\s+/).length : 0;
    countEl.textContent = `${count} kelime`;
  }

  function scheduleAutoSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(saveCurrentEntry, 1000);
  }

  function showSaveStatus(msg) {
    const el = document.getElementById('saveStatus');
    if (el) el.textContent = msg;
  }

  // ---- Entries List ----
  function renderEntriesList() {
    const container = document.getElementById('journalEntriesList');
    if (!container) return;

    const sorted = Object.entries(entries)
      .filter(([, e]) => e.text && e.text.trim())
      .sort((a, b) => b[0].localeCompare(a[0]));

    if (sorted.length === 0) {
      container.innerHTML = '<p class="empty-state">Henüz yazı yok.</p>';
      return;
    }

    const MOODS = { 1: '😫', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' };

    container.innerHTML = sorted.map(([dateStr, entry]) => {
      const d = new Date(dateStr);
      const label = dateStr === getTodayKey() ? 'Bugün'
        : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
      const moodEmoji = MOODS[entry.mood] || '';
      const preview = (entry.text || '').substring(0, 60) + (entry.text?.length > 60 ? '...' : '');
      return `
        <div class="journal-entry-item" onclick="Journal.goToDate('${dateStr}')">
          <div class="journal-entry-date">
            <span>${label}</span>
            <span>${moodEmoji}</span>
          </div>
          <div class="journal-entry-preview">${escapeHtml(preview) || '<em>Boş</em>'}</div>
        </div>
      `;
    }).join('');
  }

  function goToDate(dateStr) {
    currentDate = dateStr;
    loadEntryForDate(dateStr);
    updateDateDisplay();
    updateNextBtn();
  }

  // ---- Helpers ----
  function getTodayKey() { return formatDate(new Date()); }
  function formatDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  return {
    init,
    prevDay,
    nextDay,
    goToDate,
    getEntries: () => entries,
    setEntries: (data) => { entries = data; saveEntries(); renderEntriesList(); }
  };
})();
