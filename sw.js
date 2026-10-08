/* Báo cáo kiểm hàng — chạy offline. Có mạng: lấy bản mới; mất mạng / mạng chậm: dùng bản đã lưu. */
const C="kiem-hang-v33",F=["./","./index.html","./manifest.webmanifest","./apple-touch-icon.png","./icon-192.png","./icon-512.png"];
const XL="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; // bộ đọc Excel, lưu sẵn để nhập Excel khi offline
const LIBS=[XL,"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js","https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js","https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js"]; // + bộ đọc PDF HDLR
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(async c=>{await c.addAll(F);for(const u of LIBS)try{await c.add(new Request(u,{mode:"cors"}))}catch(_){}}));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener("fetch",e=>{const rq=e.request,u=new URL(rq.url),same=u.origin===location.origin;
 if(rq.method!=="GET"||!(same||LIBS.includes(rq.url)))return; // dữ liệu đồng bộ (Supabase) luôn đi thẳng ra mạng
 e.respondWith((async()=>{const c=await caches.open(C);
  const lib=LIBS.includes(rq.url);const hit=lib?await c.match(rq.url):(await c.match(rq,{ignoreSearch:true}))||(rq.mode==="navigate"?await c.match("./index.html"):null);
  const net=fetch(rq).then(r=>{if(r&&(r.ok||r.type==="opaque"))c.put(lib?rq.url:rq,r.clone()).catch(()=>{});return r});net.catch(()=>{});
  if(hit)return Promise.race([net,new Promise(ok=>setTimeout(()=>ok(hit),3500))]).catch(()=>hit);
  try{return await net}catch(err){return(await c.match("./index.html"))||Response.error()}})())});
