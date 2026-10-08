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
  <form id=f><label>آپلود فایل آهنگ (حداکثر ۲۴ مگابایت)<input type=file id=fa accept="audio/*"></label><label>آپلود کاور<input type=file id=fc accept="image/*"></label><label>آپلود چند آهنگ با هم (اول نام خواننده را در فرم بنویسید)<input type=file id=fm accept="audio/*" multiple></label><small id=st></small>${F.map(k=>`<input name=${k} placeholder="${k}">`).join('')}<textarea name=lyrics rows=5 placeholder="متن آهنگ (فقط اگر حق انتشارش را دارید)" style="padding:8px;border-radius:8px;border:1px solid var(--s2);background:var(--s);color:var(--tx);font:inherit"></textarea><input name=id type=hidden><label><input type=checkbox name=downloadAllowed style="width:auto"> اجازه دانلود</label><button class=btn>ذخیره</button></form>
  <h2>Import Manager</h2><form id=im><input id=iu placeholder="URL مجاز API یا RSS"><button class=btn>Preview</button></form><div id=pv></div>
  <h2>عکس خواننده</h2><form id=af><input id=an list=al placeholder="نام دقیق خواننده"><datalist id=al>${[...new Set(s.map(x=>x.artist))].map(n=>`<option value="${esc(n)}">`).join('')}</datalist><label>انتخاب عکس<input type=file id=ap accept="image/*"></label><small id=ast></small></form><h2>لیست</h2><table id=tb></table>`;
  const draw=q=>tb.innerHTML=s.filter(x=>(x.title+x.artist+x.album).includes(q)).map(x=>`<tr><td>${esc(x.title)}</td><td>${esc(x.artist)}</td><td><button data-e=${x.id}>ویرایش</button> <button data-d=${x.id}>حذف</button></td></tr>`).join('');
  draw('');flt.oninput=()=>draw(flt.value);
  tb.onclick=async e=>{const d=e.target.dataset;if(d.d&&confirm('حذف شود؟')){await call('/api/songs/'+d.d,{method:'DELETE'});dash()}
    if(d.e){const x=s.find(y=>y.id==d.e);[...F,'id','lyrics'].forEach(k=>f.elements[k].value=x[k]??'');f.elements.downloadAllowed.checked=!!x.downloadAllowed}};
  f.onsubmit=async e=>{e.preventDefault();const o=Object.fromEntries(new FormData(f));o.downloadAllowed=f.elements.downloadAllowed.checked;if(!o.id)delete o.id;else o.id=+o.id;await call('/api/songs',{method:'POST',body:JSON.stringify(o)});dash()};
  const upload=async(file,kind)=>{const r=await fetch(API+'/api/upload?ext='+(file.name.split('.').pop()||'bin'),{method:'POST',headers:{authorization:'Bearer '+sessionStorage.getItem('t'),'content-type':file.type||(kind==='a'?'audio/mpeg':'image/jpeg')},body:file});
    const j=await r.json();if(!j.url)throw 0;return j.url};
  const dur=file=>new Promise(res=>{const au=new Audio(URL.createObjectURL(file)),z=n=>String(Math.floor(n)).padStart(2,'0');au.onloadedmetadata=()=>res(z(au.duration/60)+':'+z(au.duration%60));au.onerror=()=>res('')});
  const big=file=>file.size>24*1024*1024&&(alert(file.name+': حداکثر حجم ۲۴ مگابایت است'),true);
  const up=(inp,field,kind)=>inp.onchange=async()=>{const file=inp.files[0];if(!file||big(file))return;st.textContent='در حال آپلود… صبر کنید';
    try{f.elements[field].value=await upload(file,kind);st.textContent='آپلود شد ✓';if(field==='audio')f.elements.duration.value=await dur(file)}catch{st.textContent='آپلود ناموفق بود'}};
  up(fa,'audio','a');up(fc,'cover','i');
  fm.onchange=async()=>{const fs=[...fm.files],ar=f.elements.artist.value.trim();if(!ar){fm.value='';return alert('اول نام خواننده را در فرم بنویسید')}
    const out=[];for(let i=0;i<fs.length;i++){const file=fs[i];if(big(file))continue;st.textContent=`آپلود ${i+1} از ${fs.length}…`;
      try{out.push({title:file.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' '),artist:ar,album:f.elements.album.value,cover:f.elements.cover.value,audio:await upload(file,'a'),duration:await dur(file),releaseDate:new Date().toISOString().slice(0,10),category:f.elements.category.value,downloadAllowed:false})}catch{alert('آپلود '+file.name+' ناموفق بود')}}
    if(out.length){await call('/api/songs',{method:'POST',body:JSON.stringify(out)});alert(out.length+' آهنگ اضافه شد. نام‌ها را در لیست ویرایش کنید.');dash()}};
  ap.onchange=async()=>{const file=ap.files[0],n=an.value.trim();if(!file||big(file))return;if(!n)return alert('اول نام خواننده را بنویسید');ast.textContent='در حال آپلود…';
    try{await call('/api/artist-info',{method:'POST',body:JSON.stringify({name:n,photo:await upload(file,'i')})});ast.textContent='ذخیره شد ✓'}catch{ast.textContent='ناموفق بود'}};
  im.onsubmit=async e=>{e.preventDefault();const {preview}=await call('/api/import/source1?url='+encodeURIComponent(iu.value));
    const seen=new Set(s.map(x=>x.title+x.artist)),fresh=preview.filter(x=>!seen.has(x.title+x.artist));
    pv.innerHTML=`<p>${preview.length} مورد، ${fresh.length} جدید (تکراری‌ها حذف شد)</p><ul>${fresh.map(x=>`<li>${esc(x.title)} — ${esc(x.artist)}</li>`).join('')}</ul><button class=btn id=ok>انتشار ${fresh.length} مورد</button>`;
    ok.onclick=async()=>{const r=await call('/api/songs',{method:'POST',body:JSON.stringify(fresh)});alert('اضافه شد: '+r.added);dash()}}}
sessionStorage.getItem('t')?dash():login();
