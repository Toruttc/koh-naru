const CACHE_NAME = 'kohnaru-cards-v1';

// インストール時：何もキャッシュしない（常に最新を取得）
self.addEventListener('install', event => {
  self.skipWaiting();
});

// アクティベート時：古いキャッシュを全削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// フェッチ：常にネットワーク優先、失敗時のみキャッシュ
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // HTMLとJSONは毎回最新を取得、画像のみキャッシュ
        const url = event.request.url;
        if (url.endsWith('.png') || url.endsWith('.jpg')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
