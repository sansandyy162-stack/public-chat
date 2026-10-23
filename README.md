# public-chat
Simple public chat using Google Apps Script

## Fitur Buzz & Notifikasi Pesan Masuk

- **Tombol BUZZ (⚡)** di composer: mengirim buzz ke pasangan chat —
  layar penerima bergetar (shake), bunyi buzz keras, HP bergetar
  (navigator.vibrate), dan muncul overlay "BUZZ!" yang bisa diketuk
  untuk membuka chat. Ada cooldown 10 detik anti-spam.
- Buzz terkirim lewat dua jalur: broadcast realtime (presence channel)
  agar instan, dan pesan persisten `type: "buzz"` di tabel `messages`
  agar tetap tercatat di riwayat chat bila penerima sedang offline.
  Bila database menolak type `buzz`, otomatis fallback ke pesan teks
  berisi `⚡ BUZZ!` dan tetap terdeteksi sebagai buzz di penerima.
- **Notifikasi otomatis pesan masuk**: bunyi ding (WebAudio),
  getar singkat, judul tab berkedip, dan Browser Notification
  (perlu izin notifikasi dari browser) saat tab tidak aktif atau
  room pengirim belum dibuka. Klik notifikasi membuka chat pengirim.
