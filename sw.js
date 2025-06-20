// Service Worker محدث لتطبيق منظم سلمى
const CACHE_NAME = 'salma-organizer-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800&display=swap',
  'https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvalIkTp2mxdt0UX8gTpgxfPs.woff2',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2b50.png',
  'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3af.png',
  'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4dd.png'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  console.log('🚀 Service Worker: تم التثبيت');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 تم فتح الكاش');
        return cache.addAll(urlsToCache.map(url => {
          return new Request(url, {
            mode: 'cors',
            credentials: 'omit'
          });
        }));
      })
      .catch(error => {
        console.log('❌ خطأ في الكاش:', error);
        // لا نفشل التثبيت حتى لو فشل بعض الملفات
        return Promise.resolve();
      })
  );
  // فرض التفعيل الفوري
  self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
  console.log('✅ Service Worker: تم التفعيل');
  event.waitUntil(
    Promise.all([
      // حذف الكاش القديم
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ حذف كاش قديم:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // السيطرة على جميع العملاء
      self.clients.claim()
    ])
  );
});

// التعامل مع الطلبات
self.addEventListener('fetch', event => {
  // تجاهل الطلبات غير HTTP/HTTPS
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // استراتيجية Cache First للموارد الثابتة
  if (event.request.destination === 'script' || 
      event.request.destination === 'style' || 
      event.request.destination === 'font' || 
      event.request.destination === 'image') {
    
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          
          return fetch(event.request)
            .then(response => {
              // تأكد من صحة الاستجابة
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });

              return response;
            })
            .catch(() => {
              // في حالة فشل الشبكة، أرجع استجابة fallback
              if (event.request.destination === 'image') {
                return new Response(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
                    <rect width="100" height="100" fill="#f3f4f6"/>
                    <text x="50" y="50" text-anchor="middle" dy=".3em" font-size="12" fill="#6b7280">صورة</text>
                  </svg>
                `, {
                  headers: { 'Content-Type': 'image/svg+xml' }
                });
              }
              return new Response('', { status: 408 });
            });
        })
    );
    return;
  }

  // استراتيجية Network First للصفحات
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // كاش الصفحة إذا كانت ناجحة
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // في حالة عدم وجود شبكة، أرجع الصفحة من الكاش أو الصفحة الرئيسية
          return caches.match(event.request)
            .then(response => {
              if (response) {
                return response;
              }
              return caches.match('/');
            })
            .then(response => {
              if (response) {
                return response;
              }
              // صفحة fallback بسيطة
              return new Response(`
                <!DOCTYPE html>
                <html lang="ar" dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>منظم سلمى - غير متصل</title>
                    <style>
                        body { 
                            font-family: system-ui, sans-serif; 
                            text-align: center; 
                            padding: 50px; 
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            min-height: 100vh;
                            margin: 0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        .container { max-width: 400px; }
                        h1 { font-size: 2em; margin-bottom: 20px; }
                        button { 
                            background: white; 
                            color: #667eea; 
                            border: none; 
                            padding: 12px 24px; 
                            border-radius: 25px; 
                            font-size: 16px; 
                            cursor: pointer; 
                            margin-top: 20px;
                        }
                        button:hover { transform: scale(1.05); }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div style="font-size: 4em; margin-bottom: 20px;">📱</div>
                        <h1>منظم سلمى</h1>
                        <p>أنت غير متصل بالإنترنت حالياً</p>
                        <p>سيعمل التطبيق تلقائياً عند عودة الاتصال</p>
                        <button onclick="location.reload()">إعادة المحاولة</button>
                    </div>
                </body>
                </html>
              `, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
              });
            });
        })
    );
    return;
  }

  // استراتيجية عادية للطلبات الأخرى
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// رسائل من التطبيق الرئيسي
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// إشعارات push (للمستقبل)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'رسالة جديدة من منظم سلمى!',
    icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2b50.png',
    badge: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2b50.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'فتح التطبيق',
        icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f440.png'
      },
      {
        action: 'close',
        title: 'إغلاق',
        icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/274c.png'
      }
    ],
    tag: 'salma-notification',
    renotify: true,
    requireInteraction: false,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification('منظم سلمى', options)
  );
});

// النقر على الإشعارات
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then(clientList => {
          // إذا كان التطبيق مفتوح، ركز عليه
          for (const client of clientList) {
            if (client.url === '/' && 'focus' in client) {
              return client.focus();
            }
          }
          // وإلا افتح نافذة جديدة
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});

// إغلاق الإشعار
self.addEventListener('notificationclose', event => {
  console.log('Notification was closed', event.notification.tag);
});

// معالجة أخطاء الشبكة
self.addEventListener('error', event => {
  console.error('Service Worker error:', event.error);
});

// معالجة الأخطاء غير المعالجة
self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker unhandled rejection:', event.reason);
  event.preventDefault();
});

// Background Sync (للمستقبل)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // هنا يمكن إضافة منطق مزامنة البيانات
      console.log('Background sync triggered')
    );
  }
});

// Periodic Background Sync (للمستقبل)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'daily-reminder') {
    event.waitUntil(
      self.registration.showNotification('تذكير يومي', {
        body: 'لا تنسي تحديث عاداتك ومهامك اليوم! 🌟',
        icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2b50.png',
        tag: 'daily-reminder'
      })
    );
  }
});

console.log('🎯 Service Worker محدث وجاهز لمنظم سلمى!');
