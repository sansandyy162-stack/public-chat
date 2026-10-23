# public-chat
Simple public chat using Google Apps Script

## Pasang sebagai Aplikasi Android (PWA)

Web ini adalah PWA — bisa dipasang jadi aplikasi mandiri di Android
tanpa Play Store dan tanpa file APK:

1. Buka https://sansandyy162-stack.github.io/public-chat/ di Chrome Android.
2. Ketuk tombol **"📲 Jadikan Aplikasi"** di sidebar, atau menu ⋮
   Chrome → **"Instal aplikasi / Tambahkan ke Layar Utama"**.
3. Ikon "Private Chat" muncul di layar utama — dibuka fullscreen
   seperti aplikasi biasa, dan update otomatis setiap ada rilis baru.

Teknis: `manifest.webmanifest` + service worker `sw.js`
(network-first, cache hanya cadangan offline; request Supabase
tidak pernah di-cache). Setiap rilis: naikkan versi `?v=` di
`index.html` dan `APP_VERSION` di `sw.js` agar cache lama bersih.

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
