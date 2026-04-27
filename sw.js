var CACHE = 'aurim-v5';
var ASSETS = ['./aurim.html', './manifest.json'];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(cache) { return cache.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var url=e.request.url;
  if(url.includes('firebasejs')||url.includes('firestore')||url.includes('googleapis')||url.includes('anthropic')||url.includes('fonts')) return;
  e.respondWith(caches.match(e.request).then(function(cached){
    if(cached) return cached;
    return fetch(e.request).then(function(r){
      var c=r.clone();
      caches.open(CACHE).then(function(cache){cache.put(e.request,c)});
      return r;
    }).catch(function(){return caches.match('./aurim.html')});
  }));
});

self.addEventListener('message', function(e) {
  if(e.data && e.data.type==='AGENDAR_LEMBRETE'){
    agendarLembrete(
      e.data.registrouHoje,
      e.data.hora||21,
      e.data.minuto||0,
      e.data.title||'aurim',
      e.data.body||'O que merece ser registrado hoje?'
    );
  }
});

function agendarLembrete(registrouHoje, hora, minuto, title, body){
  if(self._lembreteTimer) clearTimeout(self._lembreteTimer);
  var agora=new Date();
  var t=new Date();
  t.setHours(hora, minuto, 0, 0);
  if(t<=agora) t.setDate(t.getDate()+1);
  var diff=t.getTime()-agora.getTime();
  self._lembreteHora=hora;
  self._lembreteMinuto=minuto;
  self._lembreteTimer=setTimeout(function(){
    self.registration.showNotification(title,{
      body:body,
      icon:'icon-192.png',
      badge:'icon-192.png',
      tag:'lembrete-diario',
      renotify:true,
      actions:[{action:'abrir',title:'Registrar agora'},{action:'depois',title:'Depois'}]
    });
    agendarLembrete(false, self._lembreteHora||21, self._lembreteMinuto||0, title, body);
  }, diff);
}

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(function(list){
    for(var i=0;i<list.length;i++){
      if(list[i].url.includes('aurim')&&'focus'in list[i]) return list[i].focus();
    }
    return clients.openWindow('./aurim.html');
  }));
});
