const CACHE='cdv-financeiro-v10';
const ASSETS=['./','./manifest.json','../icon.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const url=new URL(e.request.url);
 if(url.pathname.endsWith('/index.html')||url.pathname.endsWith('/financeiro/')||url.pathname.endsWith('/financeiro')){
  e.respondWith(fetch(e.request,{cache:'no-store'}).then(async r=>{
   const text=await r.text();
   const fix='<style id="cdv-force-fix">.chips[hidden],[hidden]{display:none!important}</style>';
   const patched=text.includes('cdv-force-fix')?text:text.replace('</head>',fix+'</head>');
   const response=new Response(patched,{status:r.status,statusText:r.statusText,headers:r.headers});
   caches.open(CACHE).then(c=>c.put('./index.html',response.clone()));
   return response;
  }).catch(()=>caches.match('./index.html')));
  return;
 }
 e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));
});