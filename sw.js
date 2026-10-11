// Service Worker: اول شبکه (تغییرات سایت فوری دیده می‌شود)، در قطعی اینترنت نسخهٔ ذخیره‌شده. آهنگ‌ها و API هرگز ذخیره نمی‌شوند.
const C='muzio-v1',SHELL=['./','index.html','css/style.css','js/app.js','js/player.js','js/search.js','images/default-cover.jpg','images/favicon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin||r.headers.has('range')||/\.(mp3|m4a|wav|ogg|flac|aac)$/i.test(u.pathname)||u.pathname.includes('/admin/'))return;
  e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))))});
