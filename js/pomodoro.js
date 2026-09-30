/**
 * pomodoro.js — Pomodoro Timer yönetimi
 * Web Audio API ile ses bildirimi, SVG progress ring, session log.
 */

const Pomodoro = (() => {

  // ---- State ----
  let state = {
    mode: 'work',        // 'work' | 'short' | 'long'
    running: false,
    secondsLeft: 25 * 60,
    totalSeconds: 25 * 60,
    sessionCount: 0,
    autoStart: false,
    durations: { work: 25, short: 5, long: 15 },
    todayPomodoros: 0,
    todayBreaks: 0,
    sessionLog: [],
  };

  // AudioContext for beep
  let audioCtx = null;

  const CIRCUMFERENCE = 2 * Math.PI * 90; // r=90 => ~565.5

  // ---- Init ----
  function init() {
    loadState();
    bindUI();
    updateDisplay();
    renderSessionLog();
    renderTodayStats();
  }

  function loadState() {
    const saved = localStorage.getItem('pomodoro_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge durations and today counts, but don't restore running timer
        state.durations = parsed.durations || state.durations;
        state.autoStart = parsed.autoStart || false;
        state.sessionCount = parsed.sessionCount || 0;

        // Check if today's data is still today
        const today = new Date().toDateString();
        if (parsed.date === today) {
          state.todayPomodoros = parsed.todayPomodoros || 0;
          state.todayBreaks = parsed.todayBreaks || 0;
          state.sessionLog = parsed.sessionLog || [];
        }
      } catch (e) { /* ignore */ }
    }

    // Apply stored durations to inputs
    const workInput = document.getElementById('workDuration');
    const shortInput = document.getElementById('shortBreakDuration');
    const longInput = document.getElementById('longBreakDuration');
    if (workInput) workInput.value = state.durations.work;
    if (shortInput) shortInput.value = state.durations.short;
    if (longInput) longInput.value = state.durations.long;

    // Auto-start toggle
    const autoToggle = document.getElementById('autoStartToggle');
    if (autoToggle) autoToggle.checked = state.autoStart;

    // Set initial timer
    setMode(state.mode, false);
  }

  function saveState() {
    const toSave = {
      durations: state.durations,
      autoStart: state.autoStart,
      sessionCount: state.sessionCount,
      todayPomodoros: state.todayPomodoros,
      todayBreaks: state.todayBreaks,
      sessionLog: state.sessionLog.slice(-30), // keep last 30
      date: new Date().toDateString(),
    };
    localStorage.setItem('pomodoro_state', JSON.stringify(toSave));
  }

  // ---- UI Binding ----
  function bindUI() {
    // Mode tabs
    document.querySelectorAll('.pomo-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.running) return; // don't switch while running
        setMode(btn.dataset.mode, true);
      });
    });

    // Auto-start
    const autoToggle = document.getElementById('autoStartToggle');
    if (autoToggle) {
      autoToggle.addEventListener('change', () => {
        state.autoStart = autoToggle.checked;
        saveState();
      });
    }
  }

  // ---- Mode Management ----
  function setMode(mode, reset = true) {
    state.mode = mode;
    if (reset) {
      state.running = false;
      clearInterval(state._interval);
      state.secondsLeft = state.durations[mode] * 60;
      state.totalSeconds = state.secondsLeft;
      updateToggleBtn(false);
    }

    // Update mode tabs
    document.querySelectorAll('.pomo-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Progress ring color
    const ring = document.getElementById('timerProgressCircle');
    if (ring) {
      ring.style.stroke = mode === 'work' ? '#8aad8a'
        : mode === 'short' ? '#c4a882'
        : '#7ab87a';
    }

    const labels = {
      work: 'Çalışma',
      short: 'Kısa Mola',
      long: 'Uzun Mola'
    };

    const modeLabel = document.getElementById('pomodoroModeLabel');
    if (modeLabel) modeLabel.textContent = labels[mode];

    const dashMode = document.getElementById('dashTimerMode');
    if (dashMode) dashMode.textContent = labels[mode];

    updateDisplay();
  }

  // ---- Timer Controls ----
  let _interval = null;

  function toggle() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    state.running = !state.running;
    updateToggleBtn(state.running);

    if (state.running) {
      _interval = setInterval(tick, 1000);
    } else {
      clearInterval(_interval);
    }
  }

  function tick() {
    if (state.secondsLeft <= 0) {
      timerEnd();
      return;
    }
    state.secondsLeft--;
    updateDisplay();
  }

  function timerEnd() {
    clearInterval(_interval);
    state.running = false;
    updateToggleBtn(false);

    // Play sound
    playBeep();

    // Notification
    NotificationManager.pomodoroEnd(state.mode);

    // Log session
    const sessionType = state.mode === 'work' ? '🍅 Pomodoro' : state.mode === 'short' ? '☕ Kısa Mola' : '🛌 Uzun Mola';
    state.sessionLog.unshift({
      type: sessionType,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      duration: state.durations[state.mode]
    });

    if (state.mode === 'work') {
      state.sessionCount++;
      state.todayPomodoros++;
      // Track in weekly data for stats chart
      trackWeeklyPomodoro();
      App.showToast(`🍅 Pomodoro tamamlandı! (${state.sessionCount}. oturum)`, 'success');
    } else {
      state.todayBreaks++;
      App.showToast('☕ Mola bitti! Çalışmaya devam edelim.', 'info');
    }

    saveState();
    renderSessionLog();
    renderTodayStats();

    // Update dashboard
    const dashPom = document.getElementById('dashPomodoro');
    if (dashPom) dashPom.textContent = state.todayPomodoros;

    // Auto switch mode
    const nextMode = state.mode === 'work'
      ? (state.sessionCount % 4 === 0 ? 'long' : 'short')
      : 'work';

    setMode(nextMode, true);

    const sessionEl = document.getElementById('pomodoroSession');
    if (sessionEl) sessionEl.textContent = `Oturum ${state.sessionCount + 1}`;

    // Auto-start next
    if (state.autoStart) {
      setTimeout(() => toggle(), 1000);
    }
  }

  function reset() {
    clearInterval(_interval);
    state.running = false;
    state.secondsLeft = state.durations[state.mode] * 60;
    state.totalSeconds = state.secondsLeft;
    updateToggleBtn(false);
    updateDisplay();
  }

  function skip() {
    clearInterval(_interval);
    state.secondsLeft = 0;
    timerEnd();
  }

  // ---- Display Update ----
  function updateDisplay() {
    const mins = Math.floor(state.secondsLeft / 60).toString().padStart(2, '0');
    const secs = (state.secondsLeft % 60).toString().padStart(2, '0');
    const timeStr = `${mins}:${secs}`;

    // Pomodoro page
    const display = document.getElementById('pomodoroDisplay');
    if (display) display.textContent = timeStr;

    // Dashboard
    const dashDisplay = document.getElementById('dashTimerDisplay');
    if (dashDisplay) dashDisplay.textContent = timeStr;

    // SVG progress ring
    const ring = document.getElementById('timerProgressCircle');
    if (ring) {
      const progress = state.secondsLeft / (state.durations[state.mode] * 60);
      const offset = CIRCUMFERENCE * (1 - progress);
      ring.style.strokeDasharray = CIRCUMFERENCE;
      ring.style.strokeDashoffset = offset;
    }

    // Update page title
    if (state.running) {
      document.title = `${timeStr} — RutinTakip`;
    } else {
      document.title = 'RutinTakip';
    }
  }

  function updateToggleBtn(running) {
    const btn = document.getElementById('pomodoroToggleBtn');
    if (btn) btn.textContent = running ? '⏸' : '▶';

    // Dashboard button
    const dashBtn = document.querySelector('#dashPomodoroCard .btn-primary');
    if (dashBtn) dashBtn.textContent = running ? '⏸ Duraklat' : '▶ Başlat';
  }

  // ---- Settings ----
  function applySettings() {
    const work = parseInt(document.getElementById('workDuration').value) || 25;
    const short = parseInt(document.getElementById('shortBreakDuration').value) || 5;
    const long = parseInt(document.getElementById('longBreakDuration').value) || 15;

    state.durations = { work, short, long };

    if (!state.running) {
      reset();
    }
    saveState();
    App.showToast('Süre ayarları güncellendi!', 'success');
  }

  // ---- Session Log Render ----
  function renderSessionLog() {
    const container = document.getElementById('sessionLog');
    if (!container) return;
    if (state.sessionLog.length === 0) {
      container.innerHTML = '<p class="empty-state">Henüz oturum yok.</p>';
      return;
    }
    container.innerHTML = state.sessionLog.slice(0, 15).map(s => `
      <div class="session-log-item">
        <span class="session-type">${s.type}</span>
        <span>${s.duration} dk — ${s.time}</span>
      </div>
    `).join('');
  }

  function renderTodayStats() {
    const todayPom = document.getElementById('todayPomodoros');
    const todayFocus = document.getElementById('todayFocusTime');
    const todayBreaks = document.getElementById('todayBreaks');

    if (todayPom) todayPom.textContent = state.todayPomodoros;
    if (todayFocus) todayFocus.textContent = `${state.todayPomodoros * state.durations.work} dk`;
    if (todayBreaks) todayBreaks.textContent = state.todayBreaks;
  }

  // ---- Web Audio Beep ----
  function playBeep() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      // Three short beeps
      [0, 0.3, 0.6].forEach(delay => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + 0.25);
        osc.start(audioCtx.currentTime + delay);
        osc.stop(audioCtx.currentTime + delay + 0.25);
      });
    } catch (e) {
      console.warn('Ses çalınamadı:', e);
    }
  }

  // ---- Weekly Tracker ----
  function trackWeeklyPomodoro() {
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    let weekly = {};
    try { weekly = JSON.parse(localStorage.getItem('pomodoro_weekly') || '{}'); } catch(e) {}
    weekly[key] = (weekly[key] || 0) + 1;
    localStorage.setItem('pomodoro_weekly', JSON.stringify(weekly));
  }

  // ---- Getters for other modules ----
  function getTodayPomodoros() { return state.todayPomodoros; }
  function getSessionLog() { return state.sessionLog; }
  function getDurations() { return state.durations; }

  return {
    init,
    toggle,
    reset,
    skip,
    applySettings,
    getTodayPomodoros,
    getSessionLog,
    getDurations,
    getState: () => state
  };
})();
