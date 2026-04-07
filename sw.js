const V='iri-v5';
const A=['/Idara/','/Idara/index.html','/Idara/manifest.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(A)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.url.includes('script.google.com')){e.respondWith(fetch(e.request).catch(()=>new Response(JSON.stringify({success:false,error:'OFFLINE'}),{headers:{'Content-Type':'application/json'}})))}
  else{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))}
});
