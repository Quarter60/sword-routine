/**
 * idle.js — Boş kalma algılama ve aktivite önerileri
 * 10 dakika hareketsizlik sonrası floating card gösterir.
 */

const IdleManager = (() => {

  // Varsayılan öneri listesi
  const defaultSuggestions = [
    "Kitabından birkaç sayfa oku 📚",
    "10 dakika yürüyüş yap 🚶",
    "Su iç! 💧",
    "Sırt egzersizi yap 🧘",
    "Gözlerini 20 saniye dinlendir 👁️",
    "Günlüğüne bir şeyler yaz ✍️",
    "Derin nefes egzersizi yap 🌬️",
    "Beş dakika müzik dinle 🎵",
    "Birine güzel bir mesaj gönder 💬",
    "Masanı topla 🗂️",
    "Bir bardak çay/kahve hazırla ☕",
    "5 dakika meditasyon yap 🧘‍♂️",
    "Çevrendeki üç güzel şeyi fark et 🌸",
    "Yarın için notlar al 📝",
    "Omuz ve boyun germe egzersizleri yap 💪",
    "Bir şarkı söyle veya mırıldan 🎶",
    "Pencereden dışarıya bak, gökyüzünü izle 🌤️",
    "El yıka ve yüzünü serinlet 🚿",
    "Favori podcastinden bir bölüm başlat 🎙️",
    "Hedeflerini tekrar gözden geçir 🎯",
    "Sırt düzeltme egzersizi yap 🏋️",
    "Bir meyve veya sağlıklı atıştırmalık ye 🍎",
    "5 dakika dans et! 💃",
    "Vücudunu esnet 🤸",
    "Bugün için üç şükran yaz 🙏",
  ];

  let suggestions = [];
  let currentIndex = 0;
  let idleTimer = null;
  let lastActivity = Date.now();
  const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 dakika

  function init() {
    loadSuggestions();
    setupActivityListeners();
    setupIdlePanel();
    renderSettingsList();
  }

  function loadSuggestions() {
    const stored = localStorage.getItem('idle_suggestions');
    suggestions = stored ? JSON.parse(stored) : [...defaultSuggestions];
  }

  function saveSuggestions() {
    localStorage.setItem('idle_suggestions', JSON.stringify(suggestions));
  }

  /**
   * Kullanıcı aktivitesini dinle
   */
  function setupActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(e => {
      document.addEventListener(e, resetIdleTimer, { passive: true });
    });
    startIdleTimer();
  }

  function resetIdleTimer() {
    lastActivity = Date.now();
    clearTimeout(idleTimer);
    // Paneli kapat (aktivite var)
    const panel = document.getElementById('idlePanel');
    if (panel && !panel.classList.contains('hidden')) {
      // Paneli kapatma - kullanıcı kapatamazsa da kapansın
    }
    startIdleTimer();
  }

  function startIdleTimer() {
    idleTimer = setTimeout(showIdlePanel, IDLE_TIMEOUT);
  }

  /**
   * Idle panelini göster
   */
  function showIdlePanel() {
    const panel = document.getElementById('idlePanel');
    if (!panel) return;
    showRandomSuggestion();
    panel.classList.remove('hidden');
  }

  function setupIdlePanel() {
    const closeBtn = document.getElementById('idleClose');
    const nextBtn = document.getElementById('idleNext');
    if (closeBtn) closeBtn.addEventListener('click', hideIdlePanel);
    if (nextBtn) nextBtn.addEventListener('click', showNextSuggestion);
  }

  function hideIdlePanel() {
    const panel = document.getElementById('idlePanel');
    if (panel) panel.classList.add('hidden');
  }

  function showRandomSuggestion() {
    currentIndex = Math.floor(Math.random() * suggestions.length);
    updateSuggestionDisplay();
  }

  function showNextSuggestion() {
    currentIndex = (currentIndex + 1) % suggestions.length;
    updateSuggestionDisplay();
  }

  function updateSuggestionDisplay() {
    const el = document.getElementById('idleSuggestion');
    if (el && suggestions.length > 0) {
      el.textContent = suggestions[currentIndex];
    }
  }

  /**
   * Ayarlar sayfasında öneri listesini render et
   */
  function renderSettingsList() {
    const container = document.getElementById('idleSuggestionList');
    if (!container) return;
    container.innerHTML = '';
    suggestions.forEach((s, i) => {
      const item = document.createElement('div');
      item.className = 'idle-suggestion-item';
      item.innerHTML = `
        <span>${s}</span>
        <button class="idle-suggestion-del" onclick="IdleManager.removeSuggestion(${i})" title="Sil">✕</button>
      `;
      container.appendChild(item);
    });
  }

  /**
   * Özel öneri ekle
   */
  function addCustomSuggestion() {
    const input = document.getElementById('newSuggestionInput');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;
    suggestions.push(val);
    saveSuggestions();
    input.value = '';
    renderSettingsList();
    App.showToast('Öneri eklendi!', 'success');
  }

  /**
   * Öneri sil
   */
  function removeSuggestion(index) {
    suggestions.splice(index, 1);
    saveSuggestions();
    renderSettingsList();
  }

  /**
   * Tüm önerileri sıfırla (data reset için)
   */
  function reset() {
    suggestions = [...defaultSuggestions];
    saveSuggestions();
    renderSettingsList();
  }

  return {
    init,
    showIdlePanel,
    hideIdlePanel,
    addCustomSuggestion,
    removeSuggestion,
    renderSettingsList,
    reset,
    getSuggestions: () => suggestions
  };
})();
