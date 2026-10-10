// پنل مدیریت: فقط با توکن Worker کار می‌کند؛ هیچ Secret ای در کد نیست.
const API='https://muzio.kingdom80.workers.dev',app=document.getElementById('app');
const H=()=>({authorization:'Bearer '+sessionStorage.getItem('t'),'content-type':'application/json'});
const call=(p,o={})=>fetch(API+p,{...o,headers:H()}).then(r=>{if(r.status===401){sessionStorage.removeItem('t');login();throw 0}return r.json()});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const F=['title','artist','album','cover','audio','duration','releaseDate','category'];
function login(){app.innerHTML=`<h2>ورود مدیر</h2><form id=f><input id=t type=password placeholder="توکن مدیر" required><button class=btn>ورود</button></form>`;
  f.onsubmit=e=>{e.preventDefault();sessionStorage.setItem('t',t.value);dash()}}
async function dash(){const s=await call('/api/songs');
  const cfg=await fetch(API+'/api/settings').then(r=>r.json()).catch(()=>({}));
  const info=await fetch(API+'/api/artist-info').then(r=>r.json()).catch(()=>({}));
  const arts=Object.values(s.reduce((o,x)=>{(o[x.artist]=o[x.artist]||{name:x.artist,n:0}).n++;return o},{})).sort((a,b)=>b.n-a.n);
  app.innerHTML=`<h2>داشبورد</h2><p>آهنگ‌ها: ${s.length} · خواننده‌ها: ${new Set(s.map(x=>x.artist)).size}</p>
  <input id=flt placeholder="جستجوی آهنگ‌ها"><h2>افزودن / ویرایش</h2>
  <form id=f><label>آپلود فایل آهنگ (حداکثر ۲۴ مگابایت)<input type=file id=fa accept="audio/*"></label><label>آپلود کاور<input type=file id=fc accept="image/*"></label><div class=row><button type=button id=gc class="btn ghost">🔎 جستجوی کاور در گوگل</button><button type=button id=pc class="btn ghost">چسباندن لینک کاور</button></div><label>آپلود چند آهنگ با هم (اول نام خواننده را در فرم بنویسید)<input type=file id=fm accept="audio/*" multiple></label><small id=st></small>${F.map(k=>`<input name=${k} placeholder="${k}">`).join('')}<textarea name=lyrics rows=5 placeholder="متن آهنگ (فقط اگر حق انتشارش را دارید)" style="padding:8px;border-radius:8px;border:1px solid var(--s2);background:var(--s);color:var(--tx);font:inherit"></textarea><div class=row><button type=button id=gl class="btn ghost">🔎 جستجوی متن در گوگل</button><button type=button id=pl class="btn ghost">چسباندن متن</button></div><small>در گوگل پیدا کنید، کپی کنید و «چسباندن» را بزنید. فقط محتوایی که حق انتشارش را دارید.</small><input name=id type=hidden><label><input type=checkbox name=downloadAllowed style="width:auto"> اجازه دانلود</label><button class=btn>ذخیره</button></form>
  <h2>جستجوی موسیقی آزاد (Jamendo)</h2><form id=jf><input id=jq placeholder="نام آهنگ یا خواننده (انگلیسی بهتر است)"><button class=btn>جستجو</button></form><div id=jr></div><h2>Import Manager</h2><form id=im><input id=iu placeholder="URL مجاز API یا RSS"><button class=btn>Preview</button></form><div id=pv></div>
  <h2>خواننده‌ها (${arts.length})</h2><input id=aflt placeholder="جستجوی خواننده"><div id=alist></div><h2>عکس خواننده</h2><form id=af><input id=an list=al placeholder="نام دقیق خواننده"><datalist id=al>${[...new Set(s.map(x=>x.artist))].map(n=>`<option value="${esc(n)}">`).join('')}</datalist><label>انتخاب عکس<input type=file id=ap accept="image/*"></label><div class=row><button type=button id=ag class="btn ghost">🔎 جستجوی عکس در گوگل</button><button type=button id=apu class="btn ghost">چسباندن لینک عکس</button></div><small id=ast></small></form><h2>لیست</h2><table id=tb></table>
  <h2>تنظیمات کلی سایت</h2><form id=sf>
  <label>نام انگلیسی<input name=name_en placeholder="Muzio"></label><label>نام فارسی<input name=name_fa placeholder="موزیو"></label><label>شعار سایت (برای سئو)<input name=tagline></label>
  <b>رنگ‌های نئونی</b><div class=row><label>رنگ ۱<input type=color name=c1></label><label>رنگ ۲<input type=color name=c2></label><label>رنگ ۳<input type=color name=c3></label><button type=button id=crst class="btn ghost">پیش‌فرض</button></div>
  <label>ثانیهٔ تعویض اسلایدرها<input type=number name=slide_sec min=2 max=30></label><label>مدت نمایش برچسب «جدید» (ساعت بعد از آپلود)<input type=number name=new_hours min=1 max=168></label><label>تعداد صفحهٔ اسلایدر آهنگ‌های جدید (هر صفحه ۴ آهنگ)<input type=number name=pages min=1 max=6></label>
  <b>بخش‌های صفحهٔ اصلی</b><label class=chk><input type=checkbox name=show_banner> بنر</label><label class=chk><input type=checkbox name=show_new> آهنگ‌های جدید (اسلایدر)</label><label class=chk><input type=checkbox name=show_feed> همهٔ آهنگ‌ها (لیست)</label><label class=chk><input type=checkbox name=show_popular> محبوب‌ترین‌ها</label><label class=chk><input type=checkbox name=show_artists> خواننده‌ها</label><label class=chk><input type=checkbox name=show_cats> دسته‌بندی‌ها</label>
  <b>بنرها</b><div id=bnl></div><div class=row><label class="btn ghost">آپلود بنر<input type=file id=bnf accept="image/*" hidden></label><button type=button id=bnp class="btn ghost">چسباندن لینک بنر</button></div>
  <label>متن صفحهٔ درباره ما<textarea name=about rows=5></textarea></label><label>لینک تلگرام<input name=contact_tg placeholder="https://t.me/..."></label><label>لینک اینستاگرام<input name=contact_ig placeholder="https://instagram.com/..."></label><label>ایمیل<input name=contact_email></label>
  <button class=btn>ذخیرهٔ تنظیمات</button><small id=sst></small></form>
  <h2>تنظیمات سایت (GitHub)</h2><div class=gset>
  <label>به‌روزرسانی سایت از فایل زیپ<input type=file id=gz accept=".zip"></label>
  <label>آپلود یک فایل به گیت‌هاب (مثلاً بنر جدید)<input type=file id=gf></label><input id=gp placeholder="مسیر در سایت، مثلاً images/banner3.jpg">
  <button type=button id=gb class="btn ghost">پشتیبان‌گیری آهنگ‌ها و خواننده‌ها در گیت‌هاب</button><small id=gst></small></div>`;
  const draw=q=>tb.innerHTML=s.filter(x=>(x.title+x.artist+x.album).includes(q)).map(x=>`<tr><td>${esc(x.title)}</td><td>${esc(x.artist)}</td><td><button data-e=${x.id}>ویرایش</button> <button data-d=${x.id}>حذف</button> <button data-t=${x.id}>${x.downloadAllowed?'دانلود: روشن':'دانلود: خاموش'}</button></td></tr>`).join('');
  draw('');flt.oninput=()=>draw(flt.value);
  tb.onclick=async e=>{const d=e.target.dataset;if(d.t){const x=s.find(y=>y.id==d.t);await call('/api/songs',{method:'POST',body:JSON.stringify({id:x.id,title:x.title,artist:x.artist,downloadAllowed:!x.downloadAllowed})});return dash()}if(d.d&&confirm('حذف شود؟')){await call('/api/songs/'+d.d,{method:'DELETE'});dash()}
    if(d.e){const x=s.find(y=>y.id==d.e);[...F,'id','lyrics'].forEach(k=>f.elements[k].value=x[k]??'');f.elements.downloadAllowed.checked=!!x.downloadAllowed}};
  f.onsubmit=async e=>{e.preventDefault();const o=Object.fromEntries(new FormData(f));o.downloadAllowed=f.elements.downloadAllowed.checked;if(!o.id)delete o.id;else o.id=+o.id;await call('/api/songs',{method:'POST',body:JSON.stringify(o)});dash()};
  const upload=async(file,kind)=>{const r=await fetch(API+'/api/upload?ext='+(file.name.split('.').pop()||'bin'),{method:'POST',headers:{authorization:'Bearer '+sessionStorage.getItem('t'),'content-type':file.type||(kind==='a'?'audio/mpeg':'image/jpeg')},body:file});
    const j=await r.json();if(!j.url)throw 0;return j.url};
  const dur=file=>new Promise(res=>{const au=new Audio(URL.createObjectURL(file)),z=n=>String(Math.floor(n)).padStart(2,'0');au.onloadedmetadata=()=>res(z(au.duration/60)+':'+z(au.duration%60));au.onerror=()=>res('')});
  const big=file=>file.size>24*1024*1024&&(alert(file.name+': حداکثر حجم ۲۴ مگابایت است'),true);
  const up=(inp,field,kind)=>inp.onchange=async()=>{const file=inp.files[0];if(!file||big(file))return;st.textContent='در حال آپلود… صبر کنید';
    try{f.elements[field].value=await upload(file,kind);st.textContent='آپلود شد ✓';if(field==='audio')f.elements.duration.value=await dur(file)}catch{st.textContent='آپلود ناموفق بود'}};
  up(fa,'audio','a');up(fc,'cover','i');
  // میان‌بر جستجوی گوگل (در تب جدید) + چسباندن از کلیپ‌بورد
  const qs=()=>(f.elements.title.value+' '+f.elements.artist.value).trim();
  const goog=(pre,isImg)=>{if(!qs())return alert('اول نام آهنگ و خواننده را بنویسید');open('https://www.google.com/search?'+(isImg?'tbm=isch&':'')+'q='+encodeURIComponent(pre+' '+qs()),'_blank','noopener')};
  gl.onclick=()=>goog('متن آهنگ');gc.onclick=()=>goog('کاور آهنگ',1);
  const paste=async(field,isUrl)=>{try{const t=(await navigator.clipboard.readText()).trim();if(!t)return alert('کلیپ‌بورد خالی است');
    if(isUrl&&!/^https?:\/\//.test(t))return alert('آدرس تصویر را کپی کنید (با http شروع می‌شود)');f.elements[field].value=t}catch{alert('اجازهٔ کلیپ‌بورد داده نشد؛ دستی بچسبانید')}};
  pl.onclick=()=>paste('lyrics');pc.onclick=()=>paste('cover',1);
  fm.onchange=async()=>{const fs=[...fm.files],ar=f.elements.artist.value.trim();if(!ar){fm.value='';return alert('اول نام خواننده را در فرم بنویسید')}
    const out=[];for(let i=0;i<fs.length;i++){const file=fs[i];if(big(file))continue;st.textContent=`آپلود ${i+1} از ${fs.length}…`;
      try{out.push({title:file.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' '),artist:ar,album:f.elements.album.value,cover:f.elements.cover.value,audio:await upload(file,'a'),duration:await dur(file),releaseDate:new Date().toISOString().slice(0,10),category:f.elements.category.value,downloadAllowed:f.elements.downloadAllowed.checked})}catch{alert('آپلود '+file.name+' ناموفق بود')}}
    if(out.length){await call('/api/songs',{method:'POST',body:JSON.stringify(out)});alert(out.length+' آهنگ اضافه شد. نام‌ها را در لیست ویرایش کنید.');dash()}};
  // عکس خواننده: آپلود، یا جستجو در گوگل و چسباندن لینک عکس
  const saveAp=async url=>{const n=an.value.trim();if(!n)return alert('اول نام خواننده را بنویسید');ast.textContent='در حال ذخیره…';
    try{const r=await call('/api/artist-info',{method:'POST',body:JSON.stringify({name:n,photo:url})});if(r.error)throw r.error;ast.textContent='ذخیره شد ✓';dash()}
    catch(err){ast.textContent='ناموفق: '+err+(err==='not found'?' (ورکر را با کد جدید Deploy کنید)':'')}};
  ag.onclick=()=>{const n=an.value.trim();if(!n)return alert('اول نام خواننده را بنویسید');open('https://www.google.com/search?tbm=isch&q='+encodeURIComponent('عکس '+n),'_blank','noopener')};
  apu.onclick=async()=>{try{const t=(await navigator.clipboard.readText()).trim();if(!/^https?:\/\//.test(t))return alert('آدرس تصویر را کپی کنید (با http شروع می‌شود)');saveAp(t)}catch{alert('اجازهٔ کلیپ‌بورد داده نشد')}};
  ap.onchange=async()=>{const file=ap.files[0];if(!file||big(file))return;if(!an.value.trim())return alert('اول نام خواننده را بنویسید');ast.textContent='در حال آپلود…';
    try{saveAp(await upload(file,'i'))}catch{ast.textContent='آپلود ناموفق بود'}};
  // ----- لیست خواننده‌ها با تعداد آهنگ، عکس و جستجو -----
  let cur=[];const drawA=q=>{cur=arts.filter(a=>a.name.includes(q));
    alist.innerHTML=cur.map((a,i)=>`<div class=arow><span class=aph>${info[a.name]&&info[a.name].photo?`<img src="${esc(info[a.name].photo)}" alt="">`:esc([...a.name][0]||'?')}</span><div><b>${esc(a.name)}</b><br><small>${a.n} آهنگ</small></div><button data-ap=${i}>عکس</button><button data-as=${i}>آهنگ‌ها</button></div>`).join('')||'خواننده‌ای پیدا نشد'};
  aflt.oninput=()=>drawA(aflt.value);drawA('');
  alist.onclick=e=>{const d=e.target.dataset,a=cur[d.ap!==undefined?d.ap:d.as];if(!a)return;
    if(d.ap!==undefined){an.value=a.name;af.scrollIntoView({behavior:'smooth'})}else{flt.value=a.name;draw(a.name);tb.scrollIntoView({behavior:'smooth'})}};
  // ----- تنظیمات کلی سایت -----
  const DC={c1:'#00f0ff',c2:'#ff2bd6',c3:'#8a5cff'},TK=['name_en','name_fa','tagline','about','contact_tg','contact_ig','contact_email'],BK=['show_banner','show_new','show_feed','show_popular','show_artists','show_cats'],sfe=sf.elements;let bn=[...(cfg.banners||[])];
  TK.forEach(k=>sfe[k].value=cfg[k]||'');['c1','c2','c3'].forEach(k=>sfe[k].value=cfg[k]||DC[k]);sfe.slide_sec.value=cfg.slide_sec||5;sfe.new_hours.value=cfg.new_hours||6;sfe.pages.value=cfg.pages||4;BK.forEach(k=>sfe[k].checked=cfg[k]!==false);
  const drawB=()=>bnl.innerHTML=bn.map((u,i)=>`<div class=jrow><img src="${esc(u)}" alt=""><div><small>${esc(u.slice(-40))}</small></div><button type=button data-bu=${i}>⬆</button><button type=button data-bx=${i}>✕</button></div>`).join('')||'<small>بنر سفارشی نیست؛ بنرهای پیش‌فرض نمایش داده می‌شوند</small>';
  drawB();
  bnl.onclick=e=>{const d=e.target.dataset;if(d.bx!==undefined)bn.splice(+d.bx,1);else if(d.bu!==undefined&&+d.bu>0){const i=+d.bu;[bn[i-1],bn[i]]=[bn[i],bn[i-1]]}else return;drawB()};
  bnf.onchange=async()=>{const file=bnf.files[0];if(!file||big(file))return;sst.textContent='در حال آپلود بنر…';try{bn.push(await upload(file,'i'));drawB();sst.textContent='بنر اضافه شد؛ «ذخیرهٔ تنظیمات» را بزنید'}catch{sst.textContent='آپلود بنر ناموفق بود'}};
  bnp.onclick=async()=>{try{const t=(await navigator.clipboard.readText()).trim();if(!/^(https?:\/\/|images\/)/.test(t))return alert('لینک تصویر را کپی کنید');bn.push(t);drawB()}catch{alert('اجازهٔ کلیپ‌بورد داده نشد')}};
  crst.onclick=()=>['c1','c2','c3'].forEach(k=>sfe[k].value=DC[k]);
  sf.onsubmit=async e=>{e.preventDefault();const o={banners:bn};TK.concat(['c1','c2','c3']).forEach(k=>o[k]=sfe[k].value.trim());o.slide_sec=+sfe.slide_sec.value||5;o.new_hours=+sfe.new_hours.value||6;o.pages=+sfe.pages.value||4;BK.forEach(k=>o[k]=sfe[k].checked);
    sst.textContent='در حال ذخیره…';const r=await call('/api/settings',{method:'POST',body:JSON.stringify(o)});
    sst.textContent=r.error?'ناموفق: '+r.error+(r.error==='not found'?' (ورکر را با کد جدید Deploy کنید)':''):'ذخیره شد ✓ (چند ثانیه بعد در سایت اعمال می‌شود)'};
  // ----- به‌روزرسانی سایت با GitHub از داخل پنل -----
  const b64=buf=>{let t='';const u=new Uint8Array(buf);for(let i=0;i<u.length;i+=0x8000)t+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(t)};
  const TEXT=/\.(html|css|js|json|svg|md|txt|webmanifest)$/i;
  const inflate=async u=>{const ds=new DecompressionStream('deflate-raw'),w=ds.writable.getWriter();w.write(u);w.close();return new Uint8Array(await new Response(ds.readable).arrayBuffer())};
  const readZip=async buf=>{const v=new DataView(buf),u=new Uint8Array(buf);let e=v.byteLength-22;while(e>=0&&v.getUint32(e,true)!==0x06054b50)e--;if(e<0)throw 'فایل زیپ معتبر نیست';
    const n=v.getUint16(e+10,true);let p=v.getUint32(e+16,true);const out=[];
    for(let i=0;i<n;i++){if(v.getUint32(p,true)!==0x02014b50)throw 'فایل زیپ معتبر نیست';
      const mt=v.getUint16(p+10,true),cs=v.getUint32(p+20,true),nl=v.getUint16(p+28,true),xl=v.getUint16(p+30,true),cl=v.getUint16(p+32,true),lo=v.getUint32(p+42,true),
        name=new TextDecoder().decode(u.subarray(p+46,p+46+nl));p+=46+nl+xl+cl;if(name.endsWith('/'))continue;
      const st=lo+30+v.getUint16(lo+26,true)+v.getUint16(lo+28,true),raw=u.subarray(st,st+cs);out.push({path:name,data:mt===0?raw:await inflate(raw)})}
    return out};
  const toFile=(path,data)=>TEXT.test(path)?{path,text:new TextDecoder().decode(data)}:{path,b64:b64(data)};
  const push=async(files,msg)=>{for(let i=0;i<files.length;i+=30){gst.textContent=`در حال ارسال به گیت‌هاب… ${Math.min(i+30,files.length)} از ${files.length}`;
    const r=await call('/api/gh/commit',{method:'POST',body:JSON.stringify({message:msg,files:files.slice(i,i+30)})});if(r.error)throw r.error}};
  const ghErr=err=>gst.textContent='ناموفق: '+(err==='no_github'?'اول GITHUB_TOKEN و GH_REPO را در ورکر بگذارید':err);
  gz.onchange=async()=>{const file=gz.files[0];if(!file)return;
    try{gst.textContent='در حال خواندن زیپ…';let fs=await readZip(await file.arrayBuffer());
      const top=fs[0]&&fs[0].path.split('/')[0],root=fs.length&&fs[0].path.includes('/')&&fs.every(f=>f.path.split('/')[0]===top)?top+'/':'';
      fs=fs.map(f=>({path:f.path.slice(root.length),data:f.data})).filter(f=>f.path&&!/^(worker\/|data\/|README\.md$)/.test(f.path)&&!f.path.startsWith('.'));
      if(!fs.length)throw 'فایلی برای ارسال پیدا نشد';
      if(!confirm(fs.length+' فایل سایت در گیت‌هاب جایگزین می‌شود (پوشه‌های worker و data نادیده گرفته می‌شوند). ادامه؟')){gst.textContent='';return}
      await push(fs.map(f=>toFile(f.path,f.data)),'Update site from admin panel');gst.textContent='انجام شد ✓ تا ۱ تا ۲ دقیقه دیگر سایت به‌روز می‌شود'}catch(err){ghErr(err)}};
  gf.onchange=async()=>{const file=gf.files[0];if(!file)return;const path=gp.value.trim()||('images/'+file.name);
    try{await push([toFile(path,new Uint8Array(await file.arrayBuffer()))],'Add '+path+' from admin panel');gst.textContent='انجام شد ✓ '+path}catch(err){ghErr(err)}};
  gb.onclick=async()=>{try{gst.textContent='در حال پشتیبان‌گیری…';const r=await call('/api/gh/backup',{method:'POST'});if(r.error)throw r.error;gst.textContent='پشتیبان در data/songs.json و data/artists.json ذخیره شد ✓'}catch(err){ghErr(err)}};
  let jres=[]; // موسیقی دارای مجوز آزاد (Jamendo)
  jf.onsubmit=async e=>{e.preventDefault();jr.textContent='در حال جستجو…';
    try{const r=await call('/api/jamendo?q='+encodeURIComponent(jq.value));if(r.error)throw r.error;jres=r.results;
      jr.innerHTML=jres.length?jres.map((x,i)=>`<div class=jrow><img src="${esc(x.cover)}" alt=""><div><b>${esc(x.title)}</b><br>${esc(x.artist)} · <small>${esc(x.license)}</small><br><audio controls preload=none src="${esc(x.audio)}"></audio></div><button class=btn data-j=${i}>افزودن</button></div>`).join(''):'نتیجه‌ای پیدا نشد';
    }catch(err){jr.textContent=err==='no_client_id'?'اول JAMENDO_ID را در Secrets ورکر بگذارید':'جستجو ناموفق بود: '+err}};
  jr.onclick=async e=>{const i=e.target.dataset.j;if(i===undefined)return;const x=jres[i];
    if(/NC/.test(x.license)&&!confirm('این مجوز غیرتجاری (NC) است. فقط اگر سایت شما درآمدی ندارد اضافه کنید. ادامه؟'))return;
    await call('/api/songs',{method:'POST',body:JSON.stringify({...x,category:f.elements.category.value})});alert('اضافه شد');dash()};
  im.onsubmit=async e=>{e.preventDefault();const {preview}=await call('/api/import/source1?url='+encodeURIComponent(iu.value));
    const seen=new Set(s.map(x=>x.title+x.artist)),fresh=preview.filter(x=>!seen.has(x.title+x.artist));
    pv.innerHTML=`<p>${preview.length} مورد، ${fresh.length} جدید (تکراری‌ها حذف شد)</p><ul>${fresh.map(x=>`<li>${esc(x.title)} — ${esc(x.artist)}</li>`).join('')}</ul><button class=btn id=ok>انتشار ${fresh.length} مورد</button>`;
    ok.onclick=async()=>{const r=await call('/api/songs',{method:'POST',body:JSON.stringify(fresh)});alert('اضافه شد: '+r.added);dash()}}}
sessionStorage.getItem('t')?dash():login();
