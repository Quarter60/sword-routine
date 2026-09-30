/**
 * quotes.js — Motivasyonel alıntılar (Türkçe & İngilizce karışık)
 * Her gün yeni bir alıntı gösterilir.
 */

const Quotes = (() => {

  const quotes = [
    { text: "Küçük adımlar büyük yolculukların başlangıcıdır.", author: "Anonim" },
    { text: "Bugün yapabileceğini yarına bırakma.", author: "Benjamin Franklin" },
    { text: "Başarı, her gün tekrarlanan küçük çabaların toplamıdır.", author: "Robert Collier" },
    { text: "Disiplin, hedef ile başarı arasındaki köprüdür.", author: "Jim Rohn" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Zorluklar seni güçlendirir, vazgeçmek ise hepsini boşa çıkarır.", author: "Anonim" },
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
    { text: "Kendinize inanın. Potansiyeliniz sayısızdır.", author: "Anonim" },
    { text: "Hayalini kurabileceğin her şeyi başarabilirsin.", author: "Walt Disney" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "Başarılı insanlar fırsatları beklemez, onları yaratır.", author: "Anonim" },
    { text: "Kendini geliştirmek için hiçbir zaman geç değildir.", author: "George Eliot" },
    { text: "Zorlu yollar çoğu zaman en güzel yerlere çıkar.", author: "Anonim" },
    { text: "Hayat bir bisiklete binmek gibidir. Dengeyi korumak için hareket etmeye devam etmelisin.", author: "Albert Einstein" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "Gün içinde küçük bir şey başarmak bile seni ileriye taşır.", author: "Anonim" },
    { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
    { text: "Her sabah yeni bir fırsat, yeni bir başlangıçtır.", author: "Anonim" },
    { text: "Odaklan, ilerle, başar.", author: "Anonim" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Küçük kazanımlar büyük değişimlerin tohumudur.", author: "Anonim" },
    { text: "Sükûnetsiz bir zihinde hedef yoktur.", author: "Seneca" },
    { text: "Motivasyon seni harekete geçirir, alışkanlık ise devam ettirir.", author: "Jim Ryun" },
    { text: "Bir ağacı budamak onu zayıflatmaz, güçlendirir.", author: "Anonim" },
    { text: "Your limitation — it's only your imagination.", author: "Anonim" },
    { text: "Şimdiki andaki çaban, yarınki başarının temelidir.", author: "Anonim" },
    { text: "Fall seven times, stand up eight.", author: "Japon Atasözü" },
    { text: "Başarı bir yer değil, bir yolculuktur.", author: "Arthur Ashe" },
    { text: "Hayatın her anına şükret; iyi şeyler geliyor.", author: "Anonim" },
    { text: "Push yourself, because no one else is going to do it for you.", author: "Anonim" },
    { text: "Karanlık en yoğun olduğunda şafak en yakındır.", author: "Anonim" },
    { text: "İyi günler güzel anılar bırakır; zor günler güçlü dersler öğretir.", author: "Anonim" },
  ];

  /**
   * Günün indexini hesapla (her gün sabit kalır)
   */
  function getDailyIndex() {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    return dayOfYear % quotes.length;
  }

  /**
   * Bugünün alıntısını getir
   */
  function getDailyQuote() {
    return quotes[getDailyIndex()];
  }

  /**
   * Rastgele alıntı getir
   */
  function getRandomQuote() {
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  return { getDailyQuote, getRandomQuote, quotes };
})();
