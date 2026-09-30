/**
 * notifications.js — Tarayıcı bildirimleri yönetimi
 * Rutin hatırlatmaları ve Pomodoro bildirimleri için.
 */

const NotificationManager = (() => {

  let enabled = false;

  function init() {
    const stored = localStorage.getItem('notif_enabled');
    enabled = stored === 'true';
    const toggle = document.getElementById('notifToggle');
    if (toggle) toggle.checked = enabled;
  }

  /**
   * Bildirim iznini iste
   */
  async function requestPermission() {
    if (!('Notification' in window)) {
      App.showToast('Bu tarayıcı bildirimleri desteklemiyor.', 'error');
      return;
    }
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      enabled = true;
      localStorage.setItem('notif_enabled', 'true');
      const toggle = document.getElementById('notifToggle');
      if (toggle) toggle.checked = true;
      App.showToast('Bildirimler etkinleştirildi! 🔔', 'success');
      // Test bildirimi
      send('RutinTakip', 'Bildirimler başarıyla etkinleştirildi!', '🌿');
    } else {
      App.showToast('Bildirim izni reddedildi.', 'error');
    }
  }

  /**
   * Bildirimi aç/kapat
   */
  function toggle(val) {
    enabled = val;
    localStorage.setItem('notif_enabled', val);
    if (val && Notification.permission !== 'granted') {
      requestPermission();
    }
  }

  /**
   * Bildirim gönder
   * @param {string} title
   * @param {string} body
   * @param {string} icon - emoji
   */
  function send(title, body, icon = '🌿') {
    if (!enabled || Notification.permission !== 'granted') return;
    try {
      new Notification(title, {
        body,
        icon: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='80' font-size='80'>${icon}</text></svg>`,
        badge: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='80' font-size='80'>🌿</text></svg>`
      });
    } catch (e) {
      console.warn('Bildirim gönderilemedi:', e);
    }
  }

  /**
   * Pomodoro bitti bildirimi
   * @param {string} mode - 'work' | 'short' | 'long'
   */
  function pomodoroEnd(mode) {
    if (mode === 'work') {
      send('🍅 Pomodoro Bitti!', 'Harika iş! Şimdi mola zamanı.', '🍅');
    } else {
      send('⏰ Mola Bitti!', 'Çalışmaya devam etme zamanı!', '⏰');
    }
  }

  /**
   * Rutin hatırlatması
   * @param {string} routineName
   */
  function routineReminder(routineName) {
    send('✅ Rutin Hatırlatması', `"${routineName}" rutinini yapmayı unutma!`, '✅');
  }

  return { init, requestPermission, toggle, send, pomodoroEnd, routineReminder };
})();
