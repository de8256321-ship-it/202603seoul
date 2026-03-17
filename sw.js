const CACHE_NAME = 'seoul-blossom-v1';

// 填入你 APP 所有的靜態資源路徑
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  // 如果有其他 CSS 或圖片請補上，例如：
  // '/style.css',
  // '/icon.png'
];

// 1. 安裝階段：把靜態檔案塞進快取
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // 強制立即啟用新的 Service Worker
});

// 2. 啟動階段：清除舊版本的快取，釋放手機空間
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. 攔截請求階段：決定要給快取還是發送網路請求
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // 針對 Google Sheets API (包含 Apps Script) 絕對不做快取，直接放行
  if (requestUrl.hostname.includes('google.com') || requestUrl.hostname.includes('googleapis.com')) {
    return; 
  }

  // 其他靜態資源採用 Cache First (快取優先) 策略，實現秒開
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
