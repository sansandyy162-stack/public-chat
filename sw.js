/* =========================================================
   PRIVATE CHAT — SERVICE WORKER (PWA)

   Strategi aman untuk aplikasi chat realtime:
   - Aset statis satu origin (HTML/CSS/JS/ikon/manifest)
     dilayani NETWORK-FIRST: update selalu menang,
     cache hanya jadi cadangan saat offline.
   - Request ke origin lain (Supabase API/Realtime,
     storage, CDN, Google Fonts) TIDAK disentuh
     sama sekali — auth & realtime tetap langsung.
   - Hanya request GET yang ditangani.

   Naikkan APP_VERSION setiap rilis agar cache lama
   dibuang otomatis (samakan dengan ?v= di index.html).
========================================================= */

const APP_VERSION =
  "20261025-1";

const CACHE_NAME =
  "private-chat-" +
  APP_VERSION;

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css?v=" + APP_VERSION,
  "./app.js?v=" + APP_VERSION,
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];


self.addEventListener(
  "install",
  event => {

    event.waitUntil(
      caches
        .open(
          CACHE_NAME
        )
        .then(
          cache =>
            cache.addAll(
              APP_SHELL
            )
        )
        .then(
          () =>
            self.skipWaiting()
        )
    );
  }
);


self.addEventListener(
  "activate",
  event => {

    event.waitUntil(
      caches
        .keys()
        .then(
          keys =>
            Promise.all(
              keys
                .filter(
                  key =>
                    key !==
                    CACHE_NAME
                )
                .map(
                  key =>
                    caches.delete(
                      key
                    )
                )
            )
        )
        .then(
          () =>
            self.clients.claim()
        )
    );
  }
);


self.addEventListener(
  "fetch",
  event => {

    const request =
      event.request;

    if (
      request.method !==
      "GET"
    ) {
      return;
    }

    const url =
      new URL(
        request.url
      );

    /*
     * Origin lain: biarkan browser
     * menangani langsung (tanpa cache).
     */
    if (
      url.origin !==
      self.location.origin
    ) {
      return;
    }

    /*
     * Network-first: coba jaringan dulu
     * (update langsung terpakai), kalau
     * gagal/offline baru pakai cache.
     */
    event.respondWith(
      fetch(
        request
      )
        .then(
          response => {

            if (
              response &&
              response.ok
            ) {

              const copy =
                response.clone();

              caches
                .open(
                  CACHE_NAME
                )
                .then(
                  cache =>
                    cache.put(
                      request,
                      copy
                    )
                );
            }

            return response;
          }
        )
        .catch(
          async () => {

            const cached =
              await caches.match(
                request,
                {
                  ignoreSearch:
                    false
                }
              );

            if (
              cached
            ) {
              return cached;
            }

            if (
              request.mode ===
              "navigate"
            ) {

              return caches.match(
                "./index.html"
              );
            }

            throw new Error(
              "Offline dan tidak ada di cache: " +
              request.url
            );
          }
        )
    );
  }
);
