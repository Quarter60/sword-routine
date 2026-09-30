/**
 * data.js — JSON import/export ve veri sıfırlama
 */

const DataManager = (() => {

  /**
   * Tüm veriyi JSON olarak dışa aktar
   */
  function exportData() {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      routines: JSON.parse(localStorage.getItem('routines') || '[]'),
      completions: JSON.parse(localStorage.getItem('completions') || '{}'),
      goals: JSON.parse(localStorage.getItem('goals') || '[]'),
      journal: JSON.parse(localStorage.getItem('journal_entries') || '{}'),
      pomodoro: JSON.parse(localStorage.getItem('pomodoro_state') || '{}'),
      pomodoroWeekly: JSON.parse(localStorage.getItem('pomodoro_weekly') || '{}'),
      idleSuggestions: JSON.parse(localStorage.getItem('idle_suggestions') || '[]'),
      notifEnabled: localStorage.getItem('notif_enabled'),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rutintakip-yedek-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    App.showToast('Veriler başarıyla dışa aktarıldı! 📥', 'success');
  }

  /**
   * JSON dosyasından veri içe aktar
   */
  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // Validate
        if (!data.version && !data.routines && !data.completions) {
          App.showToast('Geçersiz yedek dosyası!', 'error');
          return;
        }

        App.showConfirm(
          'Veri İçe Aktar',
          'Mevcut tüm veriler silinecek ve yedek dosyası yüklenecek. Devam etmek istiyor musun?',
          () => {
            // Restore all data
            if (data.routines) localStorage.setItem('routines', JSON.stringify(data.routines));
            if (data.completions) localStorage.setItem('completions', JSON.stringify(data.completions));
            if (data.goals) localStorage.setItem('goals', JSON.stringify(data.goals));
            if (data.journal) localStorage.setItem('journal_entries', JSON.stringify(data.journal));
            if (data.pomodoro) localStorage.setItem('pomodoro_state', JSON.stringify(data.pomodoro));
            if (data.pomodoroWeekly) localStorage.setItem('pomodoro_weekly', JSON.stringify(data.pomodoroWeekly));
            if (data.idleSuggestions) localStorage.setItem('idle_suggestions', JSON.stringify(data.idleSuggestions));
            if (data.notifEnabled !== undefined) localStorage.setItem('notif_enabled', data.notifEnabled);

            App.showToast('Veriler başarıyla içe aktarıldı! 📤', 'success');
            // Reload to apply
            setTimeout(() => location.reload(), 1200);
          }
        );
      } catch (err) {
        App.showToast('Dosya okunamadı: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  }

  /**
   * Tüm verileri sıfırla
   */
  function confirmReset() {
    App.showConfirm(
      '⚠️ Tüm Veriyi Sıfırla',
      'Bu işlem GERİ ALINAMAZ! Tüm rutinler, tamamlamalar, hedefler, günlük yazıları silinecek. Emin misin?',
      () => {
        const keys = [
          'routines', 'completions', 'goals', 'journal_entries',
          'pomodoro_state', 'pomodoro_weekly', 'idle_suggestions', 'notif_enabled'
        ];
        keys.forEach(k => localStorage.removeItem(k));
        App.showToast('Tüm veriler sıfırlandı.', 'info');
        setTimeout(() => location.reload(), 1000);
      }
    );
  }

  return { exportData, importData, confirmReset };
})();
