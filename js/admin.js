// پنل مدیریت: فقط با توکن Worker کار می‌کند؛ هیچ Secret ای در کد نیست.
const API='https://muzio.kingdom80.workers.dev',app=document.getElementById('app');
const H=()=>({authorization:'Bearer '+sessionStorage.getItem('t'),'content-type':'application/json'});
const call=(p,o={})=>fetch(API+p,{...o,headers:H()}).then(r=>{if(r.status===401){sessionStorage.removeItem('t');login();throw 0}return r.json()});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const F=['title','artist','album','cover','audio','duration','releaseDate','category'];
// ---- سئو: صفحه‌های ایستای آهنگ/خواننده + فهرست + sitemap (برای دیده شدن در گوگل) ----
const hx=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jld=o=>JSON.stringify(o).replace(/</g,'\\u003c');
const akey=n=>{let h=2166136261;for(const c of n){h^=c.codePointAt(0);h=Math.imul(h,16777619)>>>0}return h.toString(36)};
const isoDur=d=>{const m=/^(\d+):(\d+)$/.exec(d||'');return m?`PT${+m[1]}M${+m[2]}S`:undefined};
function buildSeo(songs,info,cfg,base){
  const en=cfg.name_en||'Muzio',fa=cfg.name_fa||'موزیو',site=en+' · '+fa,dlOn=cfg.allow_download!==false;
  const abs=u=>u?(/^https?:\/\//.test(u)?u:new URL(u,base).href):'';
  const cover=s=>abs(!s.cover||/cover1\.svg$/.test(s.cover)?'images/default-cover.jpg':s.cover);
  const names=[...new Set(songs.map(s=>s.artist))],used=new Set(),key={};
  names.forEach(n=>{let k=akey(n);while(used.has(k))k+='x';used.add(k);key[n]=k});
  const aurl=n=>base+'artist/'+key[n]+'/',surl=s=>base+'song/'+s.id+'/';
  const head=(title,desc,url,img,type,ld)=>`<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${hx(title)}</title><meta name="description" content="${hx(desc.slice(0,155))}"><link rel="canonical" href="${hx(url)}"><meta property="og:title" content="${hx(title)}"><meta property="og:description" content="${hx(desc.slice(0,155))}"><meta property="og:type" content="${type}"><meta property="og:url" content="${hx(url)}"><meta property="og:image" content="${hx(img)}"><meta property="og:site_name" content="${hx(site)}"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#07060f"><link rel="icon" href="${hx(base)}images/favicon.png"><script>try{var t=localStorage.getItem('muzio_theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script><link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="${hx(base)}css/style.css"><script type="application/ld+json">${jld(ld)}</script></head>`;
  const hdr=`<header class="top"><span></span><a class="logo" href="${hx(base)}"><span>${hx(en)}</span><small>${hx(fa)}</small></a><span></span></header>`;
  const ftr=`<footer>${hx(site)} — <a href="${hx(base)}list/">فهرست آهنگ‌ها</a></footer>`;
  const files=[],lm=d=>/^\d{4}-\d{2}-\d{2}/.test(d||'')?d.slice(0,10):'';
  songs.forEach(s=>{const url=surl(s),dl=dlOn&&s.downloadAllowed&&s.audio,
    desc=`پخش آنلاین آهنگ «${s.title}» از ${s.artist}${s.album?' از آلبوم '+s.album:''}${dl?' و دانلود آن':''} در ${fa}.`,
    ld={'@context':'https://schema.org','@type':'MusicRecording',name:s.title,url,inLanguage:'fa',image:cover(s),byArtist:{'@type':'MusicGroup',name:s.artist,url:aurl(s.artist)},
      ...(s.album?{inAlbum:{'@type':'MusicAlbum',name:s.album}}:{}),...(isoDur(s.duration)?{duration:isoDur(s.duration)}:{}),...(s.releaseDate?{datePublished:s.releaseDate}:{})},
    lic=s.license&&/^https?:\/\//.test(s.licenseUrl||'')?`<p class="lic">مجوز: <a href="${hx(s.licenseUrl)}" rel="noopener">${hx(s.license)}</a>${/^https?:\/\//.test(s.sourceUrl||'')?` · منبع: <a href="${hx(s.sourceUrl)}" rel="noopener">${hx(s.source||'')}</a>`:''}</p>`:'';
    files.push({path:'song/'+s.id+'/index.html',text:head(`${s.title} - ${s.artist} | ${site}`,desc,url,cover(s),'music.song',ld)+
     `<body>${hdr}<main><div class="detail"><img src="${hx(cover(s))}" alt="${hx(s.title+' - '+s.artist)}"><div><h1>${hx(s.title)}</h1><p><a href="${hx(aurl(s.artist))}">${hx(s.artist)}</a>${s.album?' · '+hx(s.album):''}${s.duration?' · '+hx(s.duration):''}</p>${lic}${s.audio?`<audio controls preload="none" src="${hx(abs(s.audio))}" style="width:100%"></audio>`:''}<div class="acts"><a class="btn" href="${hx(base+'#/song/'+s.id)}">باز کردن در ${hx(fa)}</a><a class="btn ghost" href="${hx(aurl(s.artist))}">همهٔ آهنگ‌های ${hx(s.artist)}</a>${dl?`<a class="btn ghost" href="${hx(s.downloadUrl||abs(s.audio))}" download>دانلود</a>`:''}</div></div></div>${s.lyrics?`<h2>متن آهنگ ${hx(s.title)}</h2><pre class="lyr">${hx(s.lyrics)}</pre>`:''}</main>${ftr}</body></html>`})});
  names.forEach(n=>{const list=songs.filter(s=>s.artist===n),url=aurl(n),ph=info[n]&&info[n].photo?abs(info[n].photo):cover(list[0]),
    ld={'@context':'https://schema.org','@type':'MusicGroup',name:n,url,image:ph,track:list.slice(0,50).map(s=>({'@type':'MusicRecording',name:s.title,url:surl(s)}))};
    files.push({path:'artist/'+key[n]+'/index.html',text:head(`آهنگ‌های ${n} | ${site}`,`پخش آنلاین ${list.length} آهنگ از ${n} در ${fa}: ${list.slice(0,4).map(s=>s.title).join('، ')}`,url,ph,'profile',ld)+
     `<body>${hdr}<main><div class="ah"><img class="ph" src="${hx(ph)}" alt="${hx(n)}"><h1>آهنگ‌های ${hx(n)}</h1></div><h2>همهٔ آهنگ‌ها</h2><div class="grid">${list.map(s=>`<a class="card" href="${hx(surl(s))}"><img loading="lazy" src="${hx(cover(s))}" alt="${hx(s.title)}"><b>${hx(s.title)}</b><span>${hx(n)}</span></a>`).join('')}</div></main>${ftr}</body></html>`})});
  files.push({path:'list/index.html',text:head(`فهرست آهنگ‌ها | ${site}`,`فهرست همهٔ آهنگ‌ها و خواننده‌های ${fa}`,base+'list/',abs('images/banner.jpg'),'website',{'@context':'https://schema.org','@type':'CollectionPage',name:'فهرست آهنگ‌ها',url:base+'list/'})+
   `<body>${hdr}<main><h1>فهرست آهنگ‌ها</h1>${names.map(n=>`<h2><a href="${hx(aurl(n))}">${hx(n)}</a></h2><ul style="line-height:2.1;padding-inline-start:22px">${songs.filter(s=>s.artist===n).map(s=>`<li><a href="${hx(surl(s))}">${hx(s.title)}</a></li>`).join('')}</ul>`).join('')}</main>${ftr}</body></html>`});
  const urls=[[base,''],[base+'list/',''],...songs.map(s=>[surl(s),lm(s.addedAt)||lm(s.releaseDate)]),...names.map(n=>[aurl(n),''])];
  files.push({path:'sitemap.xml',text:`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u,d])=>`<url><loc>${hx(u)}</loc>${d?`<lastmod>${d}</lastmod>`:''}</url>`).join('\n')}\n</urlset>\n`});
  files.push({path:'robots.txt',text:`User-agent: *\nAllow: /\nDisallow: ${new URL(base).pathname}admin/\nSitemap: ${base}sitemap.xml\n`});
  return files}
function login(){app.innerHTML=`<h2>ورود مدیر</h2><form id=f><input id=t type=password placeholder="توکن مدیر" required><button class=btn>ورود</button></form>`;
  f.onsubmit=e=>{e.preventDefault();sessionStorage.setItem('t',t.value);dash()}}
async function dash(){const s=await call('/api/songs');
  const cfg=await fetch(API+'/api/settings').then(r=>r.json()).catch(()=>({}));
  const info=await fetch(API+'/api/artist-info').then(r=>r.json()).catch(()=>({}));
  const arts=Object.values(s.reduce((o,x)=>{(o[x.artist]=o[x.artist]||{name:x.artist,n:0}).n++;return o},{})).sort((a,b)=>b.n-a.n);
  const nf=n=>(n||0).toLocaleString('fa'),tp=s.reduce((n,x)=>n+(x.plays||0),0),cats={};
  s.forEach(x=>{const c=x.category||'بدون دسته';(cats[c]=cats[c]||{n:0,p:0}).n++;cats[c].p+=x.plays||0});
  const topS=[...s].sort((a,b)=>(b.plays||0)-(a.plays||0)).filter(x=>x.plays).slice(0,10),mx=Math.max(1,...topS.map(x=>x.plays||0));
  const byA=arts.map(a=>({...a,p:s.filter(x=>x.artist===a.name).reduce((n,x)=>n+(x.plays||0),0)})).sort((a,b)=>b.p-a.p).slice(0,6),recent=s.filter(x=>x.addedAt&&Date.now()-new Date(x.addedAt)<864e5).length;
  const statsHtml=`<h2>آمار سایت</h2><div class=stats><div class=stat><b>${nf(s.length)}</b>آهنگ</div><div class=stat><b>${nf(arts.length)}</b>خواننده</div><div class=stat><b>${nf(Object.keys(cats).length)}</b>دسته‌بندی</div><div class=stat><b>${nf(tp)}</b>مجموع پخش</div><div class=stat><b>${nf(s.filter(x=>x.downloadAllowed).length)}</b>دانلود مجاز</div><div class=stat><b>${nf(recent)}</b>آپلود ۲۴ ساعت اخیر</div></div>
  <h2>پربازدیدترین آهنگ‌ها</h2>${topS.length?topS.map((x,i)=>`<div class=prow><span>${nf(i+1)}. ${esc(x.title)} <small>${esc(x.artist)}</small></span><b>${nf(x.plays)}</b><i style="width:${Math.round(x.plays/mx*100)}%"></i></div>`).join(''):'<small>هنوز پخشی ثبت نشده است</small>'}
  <h2>پخش به تفکیک خواننده</h2>${byA.map(a=>`<div class=prow><span>${esc(a.name)} <small>${nf(a.n)} آهنگ</small></span><b>${nf(a.p)}</b><i style="width:${Math.round(a.p/Math.max(1,byA[0].p)*100)}%"></i></div>`).join('')}
  <h2>دسته‌بندی‌ها</h2>${Object.entries(cats).sort((a,b)=>b[1].n-a[1].n).map(([c,v])=>`<div class=prow><span>${esc(c)}</span><b>${nf(v.n)} آهنگ · ${nf(v.p)} پخش</b></div>`).join('')}
  <small>تعداد پخش تقریبی است و هر چند دقیقه یک‌بار به‌روز می‌شود.</small>`;
  app.innerHTML=`<div class=tabs id=tabs><button data-t=dash>📊 داشبورد</button><button data-t=songs>🎵 آهنگ‌ها</button><button data-t=artists>🎤 خواننده‌ها</button><button data-t=settings>⚙ تنظیمات</button><button data-t=tools>🛠 ابزارها</button></div><section class=tab data-t=dash>${statsHtml}</section><section class=tab data-t=songs hidden><h2 id=lh>لیست</h2><input id=flt placeholder="جستجوی آهنگ‌ها"><div id=tb class=slist></div>
  <h2 id=fh>افزودن آهنگ</h2><div id=einfo class=einfo hidden></div>
  <form id=f><label>آپلود فایل آهنگ (حداکثر ۲۴ مگابایت)<input type=file id=fa accept="audio/*"></label><label>آپلود کاور<input type=file id=fc accept="image/*"></label><div class=row><button type=button id=gc class="btn ghost">🔎 جستجوی کاور در گوگل</button><button type=button id=pc class="btn ghost">چسباندن لینک کاور</button></div><label>آپلود چند آهنگ با هم (اول نام خواننده را در فرم بنویسید)<input type=file id=fm accept="audio/*" multiple></label><small id=st></small>${F.map(k=>`<input name=${k} placeholder="${k}">`).join('')}<textarea name=lyrics rows=5 placeholder="متن آهنگ (فقط اگر حق انتشارش را دارید)" style="padding:8px;border-radius:8px;border:1px solid var(--s2);background:var(--s);color:var(--tx);font:inherit"></textarea><div class=row><button type=button id=gl class="btn ghost">🔎 جستجوی متن در گوگل</button><button type=button id=pl class="btn ghost">چسباندن متن</button></div><small>در گوگل پیدا کنید، کپی کنید و «چسباندن» را بزنید. فقط محتوایی که حق انتشارش را دارید.</small><input name=id type=hidden><label><input type=checkbox name=downloadAllowed style="width:auto"> اجازه دانلود</label><button class=btn>ذخیره</button></form>
  <h2>جستجوی موسیقی آزاد (Jamendo)</h2><form id=jf><input id=jq placeholder="نام آهنگ یا خواننده (انگلیسی بهتر است)"><button class=btn>جستجو</button></form><div id=jr></div><h2>Import Manager</h2><form id=im><input id=iu placeholder="URL مجاز API یا RSS"><button class=btn>Preview</button></form><div id=pv></div>
  </section><section class=tab data-t=artists hidden><h2>خواننده‌ها (${arts.length})</h2><input id=aflt placeholder="جستجوی خواننده"><div id=alist></div><h2>عکس خواننده</h2><form id=af><input id=an list=al placeholder="نام دقیق خواننده"><datalist id=al>${[...new Set(s.map(x=>x.artist))].map(n=>`<option value="${esc(n)}">`).join('')}</datalist><label>انتخاب عکس<input type=file id=ap accept="image/*"></label><div class=row><button type=button id=ag class="btn ghost">🔎 جستجوی عکس در گوگل</button><button type=button id=apu class="btn ghost">چسباندن لینک عکس</button></div><small id=ast></small></form><h2>دسته‌بندی گروهی</h2><form id=cf><small>همهٔ آهنگ‌های یک خواننده را یک‌جا در یک دسته بگذارید.</small><input id=ca list=al placeholder="نام خواننده"><small id=cinfo></small><input id=cc list=cl placeholder="دسته‌بندی (مثلاً پاپ)"><datalist id=cl>${[...new Set(s.map(x=>x.category).filter(Boolean))].map(c=>`<option value="${esc(c)}">`).join('')}</datalist><button class=btn>اعمال برای همهٔ آهنگ‌های این خواننده</button></form></section><section class=tab data-t=settings hidden><h2>تنظیمات سایت</h2><form id=sf>
<details open><summary>🏷 عمومی</summary><label>نام انگلیسی<input name=name_en placeholder="Muzio"></label><label>نام فارسی<input name=name_fa placeholder="موزیو"></label><label>شعار سایت (برای سئو)<input name=tagline></label><label>آدرس اصلی سایت (برای سئو؛ خالی = خودکار)<input name=site_url placeholder="https://alinexir.github.io/Muzio/"></label></details>
<details><summary>🎨 ظاهر</summary><b>رنگ‌های نئونی</b><div class=row><label>رنگ ۱<input type=color name=c1></label><label>رنگ ۲<input type=color name=c2></label><label>رنگ ۳<input type=color name=c3></label><button type=button id=crst class="btn ghost">پیش‌فرض</button></div><label>حالت پیش‌فرض برای بازدیدکنندهٔ جدید<select name=default_theme><option value=dark>تاریک</option><option value=light>روشن</option><option value=system>مطابق گوشی</option></select></label></details>
<details><summary>🏠 صفحهٔ اصلی</summary><b>بخش‌های نمایش‌داده‌شده</b><label class=chk><input type=checkbox name=show_banner> بنر</label><label class=chk><input type=checkbox name=show_new> آهنگ‌های جدید (اسلایدر)</label><label class=chk><input type=checkbox name=show_feed> همهٔ آهنگ‌ها (لیست)</label><label class=chk><input type=checkbox name=show_popular> محبوب‌ترین‌ها</label><label class=chk><input type=checkbox name=show_artists> خواننده‌ها</label><label class=chk><input type=checkbox name=show_cats> دسته‌بندی‌ها</label><label>تعداد اسلاید آهنگ‌های جدید (هر اسلاید ۸ کاشی)<input type=number name=pages min=1 max=6></label><label>ثانیهٔ تعویض اسلایدرها<input type=number name=slide_sec min=2 max=30></label><label>مدت نمایش برچسب «جدید» (ساعت بعد از آپلود)<input type=number name=new_hours min=1 max=168></label><label>تعداد آهنگ در هر صفحهٔ لیست «همهٔ آهنگ‌ها»<input type=number name=feed_per min=5 max=50></label></details>
<details><summary>🖼 بنرها</summary><div id=bnl></div><div class=row><label class="btn ghost">آپلود بنر<input type=file id=bnf accept="image/*" hidden></label><button type=button id=bnp class="btn ghost">چسباندن لینک بنر</button></div></details>
<details><summary>🎵 آهنگ‌ها و دانلود</summary><label class=chk><input type=checkbox name=show_plays> نمایش تعداد پخش</label><label class=chk><input type=checkbox name=allow_download> اجازهٔ دانلود در کل سایت (خاموش = هیچ دکمهٔ دانلودی نمایش داده نشود)</label></details>
<details><summary>📢 اعلان و پایین سایت</summary><label class=chk><input type=checkbox name=announce_on> نمایش اعلان بالای سایت</label><label>متن اعلان<input name=announce></label><label>متن پایین سایت (فوتر)<input name=footer_text></label></details>
<details><summary>📞 درباره و تماس</summary><label>متن صفحهٔ درباره ما<textarea name=about rows=5></textarea></label><label>لینک تلگرام<input name=contact_tg placeholder="https://t.me/..."></label><label>لینک اینستاگرام<input name=contact_ig placeholder="https://instagram.com/..."></label><label>ایمیل<input name=contact_email></label></details>
<details><summary>📈 آمار و تحلیل</summary><label>کد Google Analytics (مثلاً G-XXXXXXX، اختیاری)<input name=ga_id></label></details>
<div class=savebar><button class=btn>ذخیرهٔ تنظیمات</button><small id=sst></small></div></form></section><section class=tab data-t=tools hidden><h2>تنظیمات سایت (GitHub)</h2><div class=gset>
  <label>به‌روزرسانی سایت از فایل زیپ<input type=file id=gz accept=".zip"></label>
  <label>آپلود یک فایل به گیت‌هاب (مثلاً بنر جدید)<input type=file id=gf></label><input id=gp placeholder="مسیر در سایت، مثلاً images/banner3.jpg">
  <button type=button id=gb class="btn ghost">پشتیبان‌گیری آهنگ‌ها و خواننده‌ها در گیت‌هاب</button><small id=gst></small></div>
  <h2>سئو (دیده شدن در گوگل)</h2><div class=gset><small>برای هر آهنگ و خواننده یک صفحهٔ جدا و نقشهٔ سایت (sitemap.xml) ساخته می‌شود. بعد از افزودن آهنگ‌های تازه دوباره بزنید.</small><button type=button id=sg class=btn>ساخت صفحه‌های سئو و ارسال به گیت‌هاب</button><small id=seos></small></div>
  <h2>به‌روزرسانی ورکر از پنل</h2><div class=gset><div id=wst>در حال بررسی…</div><label>فایل worker.js یا music-site.zip<input type=file id=wf accept=".js,.zip"></label><div id=wr></div><small>اتصال: Secret به نام CF_API_TOKEN (دسترسی Workers Scripts Edit) و متغیرهای CF_ACCOUNT_ID و (اختیاری) CF_SCRIPT.</small></div>`;
  const showTab=k=>{document.querySelectorAll('.tab').forEach(x=>x.hidden=x.dataset.t!==k);document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===k));try{sessionStorage.setItem('tab',k)}catch{}document.querySelector('#tabs button.on')?.scrollIntoView({inline:'center',block:'nearest'})};
  tabs.onclick=e=>{const b=e.target.closest('button');if(b){showTab(b.dataset.t);scrollTo(0,0)}};showTab((()=>{try{return sessionStorage.getItem('tab')}catch{}})()||'dash');
  // ----- زدن روی عنوان هر بخش: پنهان / نمایش (حالت در همین نشست حفظ می‌شود) -----
  document.querySelectorAll('.tab h2').forEach(h=>{const key='fold:'+h.textContent.trim();
    const apply=on=>{h.classList.toggle('col',on);let n=h.nextElementSibling;while(n&&n.tagName!=='H2'){n.classList.toggle('fold',on);n=n.nextElementSibling}};
    try{if(sessionStorage.getItem(key)==='1')apply(true)}catch{}
    h.onclick=()=>{const on=!h.classList.contains('col');apply(on);try{on?sessionStorage.setItem(key,'1'):sessionStorage.removeItem(key)}catch{}}});
  const thumb=c=>!c||/cover1\.svg$/.test(c)?'../images/default-cover.jpg':/^https?:\/\//.test(c)?c:'../'+c;
  const draw=q=>tb.innerHTML=s.filter(x=>(x.title+x.artist+x.album).includes(q)).map(x=>`<div class=srow data-row=${x.id}><img src="${esc(thumb(x.cover))}" alt="" loading=lazy onerror="this.style.visibility='hidden'"><div class=sinfo><b>${esc(x.title)}</b><small>${esc(x.artist)}${x.category?' · '+esc(x.category):''}</small><small>▶ ${nf(x.plays)} پخش${x.downloadAllowed?' · ⬇ دانلود مجاز':''}</small></div><div class=sact><button class="btn sm" data-e=${x.id}>✏ ویرایش</button><button class="btn ghost sm" data-t=${x.id}>${x.downloadAllowed?'⬇ دانلود: روشن':'⬇ دانلود: خاموش'}</button><button class="btn ghost sm danger" data-d=${x.id}>🗑 حذف</button></div></div>`).join('')||'<small>آهنگی پیدا نشد</small>';
  draw('');flt.oninput=()=>draw(flt.value);
  // ----- ویرایش سریع: اطلاعات آهنگ، برگشت به همان ردیف لیست -----
  const keep=id=>{try{sessionStorage.setItem('lastEdit',String(id??''));sessionStorage.setItem('lastFlt',flt.value)}catch{}};
  const goRow=id=>{if(lh.classList.contains('col'))lh.click();const r=tb.querySelector(`[data-row="${id}"]`);if(r){r.scrollIntoView({behavior:'smooth',block:'center'});r.classList.add('flash');setTimeout(()=>r.classList.remove('flash'),1700)}};
  const resetForm=()=>{f.reset();f.elements.id.value='';einfo.hidden=true;fh.textContent='افزودن آهنگ'};
  const openEdit=id=>{const x=s.find(y=>y.id==id);if(!x)return;if(fh.classList.contains('col'))fh.click();
    [...F,'id','lyrics'].forEach(k=>f.elements[k].value=x[k]??'');f.elements.downloadAllowed.checked=!!x.downloadAllowed;
    fh.textContent='ویرایش آهنگ';einfo.hidden=false;
    einfo.innerHTML=`<img src="${esc(thumb(x.cover))}" alt="" onerror="this.style.display='none'"><div><b>${esc(x.title)}</b><br>${esc(x.artist)}${x.album?' · '+esc(x.album):''}<br><small>${nf(x.plays)} پخش${x.addedAt?' · آپلود: '+new Date(x.addedAt).toLocaleDateString('fa'):''}${x.category?' · '+esc(x.category):''}${x.downloadAllowed?' · دانلود مجاز':' · دانلود بسته'}</small></div><div class=row><button type=button class="btn ghost" id=ebk>↑ برگشت به لیست</button><button type=button class="btn ghost" id=ecan>لغو ویرایش</button></div>`;
    ebk.onclick=()=>goRow(x.id);ecan.onclick=()=>{resetForm();goRow(x.id)};
    f.scrollIntoView({behavior:'smooth',block:'start'})};
  {const le=sessionStorage.getItem('lastEdit'),lf=sessionStorage.getItem('lastFlt'); // بعد از ذخیره/حذف: فیلتر و جای لیست حفظ می‌شود
   if(lf!==null){flt.value=lf;draw(lf)}if(le!==null){sessionStorage.removeItem('lastEdit');sessionStorage.removeItem('lastFlt');if(le)setTimeout(()=>goRow(le),200)}}
  tb.onclick=async e=>{const d=e.target.dataset;if(d.t){const x=s.find(y=>y.id==d.t);await call('/api/songs',{method:'POST',body:JSON.stringify({id:x.id,title:x.title,artist:x.artist,downloadAllowed:!x.downloadAllowed})});keep(x.id);return dash()}if(d.d&&confirm('حذف شود؟')){await call('/api/songs/'+d.d,{method:'DELETE'});keep('');dash()}
    if(d.e)return openEdit(d.e);
    const tr=e.target.closest('.srow');if(tr&&!e.target.closest('button'))openEdit(tr.dataset.row)}; // زدن روی خود ردیف هم اطلاعات را باز می‌کند
  f.onsubmit=async e=>{e.preventDefault();const o=Object.fromEntries(new FormData(f));o.downloadAllowed=f.elements.downloadAllowed.checked;if(!o.id)delete o.id;else o.id=+o.id;await call('/api/songs',{method:'POST',body:JSON.stringify(o)});keep(o.id);dash()};
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
    alist.innerHTML=cur.map((a,i)=>`<div class=arow><span class=aph>${info[a.name]&&info[a.name].photo?`<img src="${esc(info[a.name].photo)}" alt="">`:esc([...a.name][0]||'?')}</span><div><b>${esc(a.name)}</b><br><small>${a.n} آهنگ</small></div><button data-ap=${i}>عکس</button><button data-as=${i}>آهنگ‌ها</button><button data-ac=${i}>دسته</button></div>`).join('')||'خواننده‌ای پیدا نشد'};
  aflt.oninput=()=>drawA(aflt.value);drawA('');
  alist.onclick=e=>{const d=e.target.dataset,a=cur[d.ap!==undefined?d.ap:d.ac!==undefined?d.ac:d.as];if(!a)return;
    if(d.ac!==undefined){ca.value=a.name;catInfo();ca.scrollIntoView({behavior:'smooth',block:'center'});cc.focus()}
    else if(d.ap!==undefined){an.value=a.name;af.scrollIntoView({behavior:'smooth'})}else{showTab('songs');if(lh.classList.contains('col'))lh.click();flt.value=a.name;draw(a.name);tb.scrollIntoView({behavior:'smooth'})}};
  // ----- دسته‌بندی گروهی: همهٔ آهنگ‌های یک خواننده -----
  const catInfo=()=>{const l=s.filter(x=>x.artist===ca.value.trim());cinfo.textContent=l.length?`${l.length} آهنگ · دستهٔ فعلی: ${[...new Set(l.map(x=>x.category||'بدون دسته'))].join('، ')}`:''};
  ca.oninput=catInfo;
  cf.onsubmit=async e=>{e.preventDefault();const n=ca.value.trim(),c=cc.value.trim(),l=s.filter(x=>x.artist===n);
    if(!l.length)return alert('خواننده‌ای با این نام نیست');if(!c)return alert('دسته‌بندی را بنویسید');
    if(!confirm(`دستهٔ ${l.length} آهنگ «${n}» روی «${c}» تنظیم شود؟`))return;
    const r=await call('/api/songs',{method:'POST',body:JSON.stringify(l.map(x=>({id:x.id,title:x.title,artist:x.artist,category:c})))});
    if(r.error)return alert('ناموفق: '+r.error);alert('انجام شد ✓');dash()};
  // ----- تنظیمات کلی سایت -----
  const DC={c1:'#00f0ff',c2:'#ff2bd6',c3:'#8a5cff'},TK=['name_en','name_fa','tagline','about','contact_tg','contact_ig','contact_email','announce','footer_text','ga_id','site_url','default_theme'],BK=['show_banner','show_new','show_feed','show_popular','show_artists','show_cats','show_plays','allow_download'],sfe=sf.elements;let bn=[...(cfg.banners||[])];
  TK.forEach(k=>sfe[k].value=cfg[k]||'');['c1','c2','c3'].forEach(k=>sfe[k].value=cfg[k]||DC[k]);sfe.slide_sec.value=cfg.slide_sec||5;sfe.new_hours.value=cfg.new_hours||6;sfe.feed_per.value=cfg.feed_per||10;sfe.default_theme.value=cfg.default_theme||'dark';sfe.announce_on.checked=!!cfg.announce_on;sfe.pages.value=cfg.pages||2;BK.forEach(k=>sfe[k].checked=cfg[k]!==false);
  const drawB=()=>bnl.innerHTML=bn.map((u,i)=>`<div class=jrow><img src="${esc(u)}" alt=""><div><small>${esc(u.slice(-40))}</small></div><button type=button data-bu=${i}>⬆</button><button type=button data-bx=${i}>✕</button></div>`).join('')||'<small>بنر سفارشی نیست؛ بنرهای پیش‌فرض نمایش داده می‌شوند</small>';
  drawB();
  bnl.onclick=e=>{const d=e.target.dataset;if(d.bx!==undefined)bn.splice(+d.bx,1);else if(d.bu!==undefined&&+d.bu>0){const i=+d.bu;[bn[i-1],bn[i]]=[bn[i],bn[i-1]]}else return;drawB()};
  bnf.onchange=async()=>{const file=bnf.files[0];if(!file||big(file))return;sst.textContent='در حال آپلود بنر…';try{bn.push(await upload(file,'i'));drawB();sst.textContent='بنر اضافه شد؛ «ذخیرهٔ تنظیمات» را بزنید'}catch{sst.textContent='آپلود بنر ناموفق بود'}};
  bnp.onclick=async()=>{try{const t=(await navigator.clipboard.readText()).trim();if(!/^(https?:\/\/|images\/)/.test(t))return alert('لینک تصویر را کپی کنید');bn.push(t);drawB()}catch{alert('اجازهٔ کلیپ‌بورد داده نشد')}};
  crst.onclick=()=>['c1','c2','c3'].forEach(k=>sfe[k].value=DC[k]);
  sf.onsubmit=async e=>{e.preventDefault();const o={banners:bn};TK.concat(['c1','c2','c3']).forEach(k=>o[k]=sfe[k].value.trim());o.slide_sec=+sfe.slide_sec.value||5;o.new_hours=+sfe.new_hours.value||6;o.feed_per=+sfe.feed_per.value||10;o.announce_on=sfe.announce_on.checked;o.pages=+sfe.pages.value||2;BK.forEach(k=>o[k]=sfe[k].checked);
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
  const push=async(files,msg,z=30)=>{for(let i=0;i<files.length;i+=z){gst.textContent=`در حال ارسال به گیت‌هاب… ${Math.min(i+z,files.length)} از ${files.length}`;
    const r=await call('/api/gh/commit',{method:'POST',body:JSON.stringify({message:msg,files:files.slice(i,i+z)})});if(r.error)throw r.error}};
  const ghErr=err=>gst.textContent='ناموفق: '+(err==='no_github'?'اول GITHUB_TOKEN و GH_REPO را در ورکر بگذارید':err);
  // ----- سئو -----
  sg.onclick=async()=>{const base=(cfg.site_url||new URL('../',location.href).href).replace(/\/?$/,'/'),files=buildSeo(s,info,cfg,base);
    if(!confirm(`${files.length} فایل سئو برای آدرس ${base} ساخته و در گیت‌هاب ذخیره می‌شود. ادامه؟`))return;seos.textContent='در حال ساخت و ارسال…';
    try{await push(files,'SEO pages from Muzio admin',300);seos.textContent=`انجام شد ✓ (${files.length} فایل). یکی دو دقیقه بعد فعال می‌شود. نقشهٔ سایت: ${base}sitemap.xml`}
    catch(err){seos.textContent='ناموفق: '+(err==='no_github'?'اول GITHUB_TOKEN و GH_REPO را در ورکر بگذارید':err)}};
  // ----- به‌روزرسانی ورکر -----
  call('/api/cf/status').then(c=>{wst.innerHTML=c.error==='not_configured'?'اتصال Cloudflare هنوز تنظیم نشده':c.error?'خطا: '+esc(c.error):`ورکر <b>${esc(c.script)}</b> · نسخهٔ فعلی: <b>${esc(c.version)}</b>`}).catch(()=>{});
  wf.onchange=async()=>{const file=wf.files[0];if(!file)return;wr.textContent='در حال خواندن…';
    try{let code;if(/\.zip$/i.test(file.name)){const f=(await readZip(await file.arrayBuffer())).find(x=>/(^|\/)worker\/worker\.js$/.test(x.name));if(!f)throw 'worker/worker.js داخل زیپ نیست';code=new TextDecoder().decode(f.data)}else code=await file.text();
      const ver=(/const VERSION='([^']+)'/.exec(code)||[])[1]||'نامشخص',mod=await import(URL.createObjectURL(new Blob([code],{type:'text/javascript'})));
      if(!mod.default||typeof mod.default.fetch!=='function')throw 'کد ورکر معتبر نیست';
      wr.innerHTML=`<p>کد معتبر است · نسخه: <b>${esc(ver)}</b> · ${(code.length/1024).toFixed(0)} کیلوبایت</p><button class=btn id=wd>Deploy ورکر</button>`;
      wd.onclick=async()=>{if(!confirm('ورکر با این کد جایگزین می‌شود. ادامه؟'))return;wr.textContent='در حال ارسال به Cloudflare…';
        const r=await fetch(API+'/api/cf/deploy',{method:'POST',headers:{authorization:'Bearer '+sessionStorage.getItem('t'),'content-type':'text/plain'},body:code}).then(x=>x.json());
        wr.textContent=r.error?'ناموفق: '+r.error:'انجام شد ✓ ورکر به‌روز شد. اگر چیزی خراب شد، در Cloudflare به Deployments بروید و Rollback بزنید.'}}
    catch(err){wr.textContent='ناموفق: '+err}};
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
