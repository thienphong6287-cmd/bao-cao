/* Báo cáo kiểm hàng — chạy offline. Có mạng: lấy bản mới; mất mạng / mạng chậm: dùng bản đã lưu. */
const C="kiem-hang-v12",F=["./","./index.html","./manifest.webmanifest","./apple-touch-icon.png","./icon-192.png","./icon-512.png"];
const XL="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; // bộ đọc Excel, lưu sẵn để nhập Excel khi offline
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(async c=>{await c.addAll(F);try{await c.add(new Request(XL,{mode:"cors"}))}catch(_){}}));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener("fetch",e=>{const rq=e.request,u=new URL(rq.url),same=u.origin===location.origin;
 if(rq.method!=="GET"||!(same||rq.url===XL))return; // dữ liệu đồng bộ (Supabase) luôn đi thẳng ra mạng
 e.respondWith((async()=>{const c=await caches.open(C);
  const hit=rq.url===XL?await c.match(XL):(await c.match(rq,{ignoreSearch:true}))||(rq.mode==="navigate"?await c.match("./index.html"):null);
  const net=fetch(rq).then(r=>{if(r&&(r.ok||r.type==="opaque"))c.put(rq.url===XL?XL:rq,r.clone()).catch(()=>{});return r});net.catch(()=>{});
  if(hit)return Promise.race([net,new Promise(ok=>setTimeout(()=>ok(hit),3500))]).catch(()=>hit);
  try{return await net}catch(err){return(await c.match("./index.html"))||Response.error()}})())});
