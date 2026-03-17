// sw.js - 首爾櫻花祭 2026 專用高速快取版
const CACHE_NAME = 'seoul-2026-v1'; // 更新內容時改為 v2 即可強制刷新

// 列出你所有想要「秒開」的檔案
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './sakura-icon.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/gh/justfont/open-huninn-font@1.1/font/jf-openhuninn.css'
];

// 1. 安裝：將檔案寫入手機存儲
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('🌸 櫻花快取已準備就緒');
      return cache.addAll(urlsToCache);
    })
  );
});

// 2. 攔截請求：優先從手機讀取（這是變快的關鍵！）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 如果快取裡有，直接給它（秒開）；沒有才去網路抓
      return response || fetch(event.request);
    })
  );
});

// 3. 激活：清理舊版本快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🧹 清理過期快取');
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
