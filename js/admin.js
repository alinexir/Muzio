// پنل مدیریت: فقط با توکن Worker کار می‌کند؛ هیچ Secret ای در کد نیست.
const API='https://muzio.kingdom80.workers.dev',app=document.getElementById('app');
const H=()=>({authorization:'Bearer '+sessionStorage.getItem('t'),'content-type':'application/json'});
const call=(p,o={})=>fetch(API+p,{...o,headers:H()}).then(r=>{if(r.status===401){sessionStorage.removeItem('t');login();throw 0}return r.json()});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const F=['title','artist','album','cover','audio','duration','releaseDate','category'];
function login(){app.innerHTML=`<h2>ورود مدیر</h2><form id=f><input id=t type=password placeholder="توکن مدیر" required><button class=btn>ورود</button></form>`;
  f.onsubmit=e=>{e.preventDefault();sessionStorage.setItem('t',t.value);dash()}}
async function dash(){const s=await call('/api/songs');
  app.innerHTML=`<h2>داشبورد</h2><p>آهنگ‌ها: ${s.length} · خواننده‌ها: ${new Set(s.map(x=>x.artist)).size}</p>
  <input id=flt placeholder="جستجوی آهنگ‌ها"><h2>افزودن / ویرایش</h2>
  <form id=f><label>آپلود فایل آهنگ (حداکثر ۲۴ مگابایت)<input type=file id=fa accept="audio/*"></label><label>آپلود کاور<input type=file id=fc accept="image/*"></label><small id=st></small>${F.map(k=>`<input name=${k} placeholder="${k}">`).join('')}<input name=id type=hidden><label><input type=checkbox name=downloadAllowed style="width:auto"> اجازه دانلود</label><button class=btn>ذخیره</button></form>
  <h2>Import Manager</h2><form id=im><input id=iu placeholder="URL مجاز API یا RSS"><button class=btn>Preview</button></form><div id=pv></div>
  <h2>لیست</h2><table id=tb></table>`;
  const draw=q=>tb.innerHTML=s.filter(x=>(x.title+x.artist+x.album).includes(q)).map(x=>`<tr><td>${esc(x.title)}</td><td>${esc(x.artist)}</td><td><button data-e=${x.id}>ویرایش</button> <button data-d=${x.id}>حذف</button></td></tr>`).join('');
  draw('');flt.oninput=()=>draw(flt.value);
  tb.onclick=async e=>{const d=e.target.dataset;if(d.d&&confirm('حذف شود؟')){await call('/api/songs/'+d.d,{method:'DELETE'});dash()}
    if(d.e){const x=s.find(y=>y.id==d.e);[...F,'id'].forEach(k=>f.elements[k].value=x[k]??'');f.elements.downloadAllowed.checked=!!x.downloadAllowed}};
  f.onsubmit=async e=>{e.preventDefault();const o=Object.fromEntries(new FormData(f));o.downloadAllowed=f.elements.downloadAllowed.checked;if(!o.id)delete o.id;else o.id=+o.id;await call('/api/songs',{method:'POST',body:JSON.stringify(o)});dash()};
  const up=(inp,field)=>inp.onchange=async()=>{const file=inp.files[0];if(!file)return;
    if(file.size>24*1024*1024)return alert('حداکثر حجم ۲۴ مگابایت است');
    st.textContent='در حال آپلود… صبر کنید';
    try{const r=await fetch(API+'/api/upload?ext='+(file.name.split('.').pop()||'bin'),{method:'POST',headers:{authorization:'Bearer '+sessionStorage.getItem('t'),'content-type':file.type},body:file});
      const j=await r.json();if(!j.url)throw 0;f.elements[field].value=j.url;st.textContent='آپلود شد ✓';
      if(field==='audio'){const au=new Audio(URL.createObjectURL(file));au.onloadedmetadata=()=>{const d=au.duration,z=n=>String(Math.floor(n)).padStart(2,'0');f.elements.duration.value=z(d/60)+':'+z(d%60)}}
    }catch{st.textContent='آپلود ناموفق بود'}};
  up(fa,'audio');up(fc,'cover');
  im.onsubmit=async e=>{e.preventDefault();const {preview}=await call('/api/import/source1?url='+encodeURIComponent(iu.value));
    const seen=new Set(s.map(x=>x.title+x.artist)),fresh=preview.filter(x=>!seen.has(x.title+x.artist));
    pv.innerHTML=`<p>${preview.length} مورد، ${fresh.length} جدید (تکراری‌ها حذف شد)</p><ul>${fresh.map(x=>`<li>${esc(x.title)} — ${esc(x.artist)}</li>`).join('')}</ul><button class=btn id=ok>انتشار ${fresh.length} مورد</button>`;
    ok.onclick=async()=>{const r=await call('/api/songs',{method:'POST',body:JSON.stringify(fresh)});alert('اضافه شد: '+r.added);dash()}}}
sessionStorage.getItem('t')?dash():login();
