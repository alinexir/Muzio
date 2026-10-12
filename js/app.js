// اپ اصلی: بارگذاری داده، مسیریابی hash، رندر صفحات، SEO
import {Player,cv,DEF,share,isFav,toggleFav,favs} from './player.js';import {searchSongs,debounce} from './search.js';
const API_BASE='https://muzio.kingdom80.workers.dev'; // بعد از ساخت Worker: 'https://your-worker.workers.dev'
const $=id=>document.getElementById(id),v=$('view'),player=new Player(API_BASE);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let songs=[],info={},cfg={};const lists={};
const card=(s,i,l)=>`<a class="card" href="#/song/${s.id}" data-i="${i}" data-l="${l}"><img loading="lazy" src="${esc(cv(s))}" onerror="this.onerror=null;this.src='${DEF}'" alt=""><b>${esc(s.title)}</b><span>${esc(s.artist)}</span></a>`;
const isNew=s=>s.addedAt&&Date.now()-new Date(s.addedAt)<(cfg.new_hours||6)*36e5; // «جدید» فقط چند ساعت بعد از آپلود
const tile=(s,i,l)=>`<a class="tile" href="#/song/${s.id}" data-i="${i}" data-l="${l}"><img loading="lazy" src="${esc(cv(s))}" onerror="this.onerror=null;this.src='${DEF}'" alt="">${isNew(s)?'<span class="badge">جدید</span>':''}<div class="cap"><b>${esc(s.title)}</b><span>${esc(s.artist)}</span></div></a>`;
const tiles=(list,l)=>list.length?`<div class="tiles">${list.map((s,i)=>tile(s,i,l)).join('')}</div>`:`<p class="empty">موردی پیدا نشد.</p>`;
const tslider=(list,l)=>{if(!list.length)return '<p class="empty">موردی پیدا نشد.</p>';const pg=[];
  for(let i=0;i<list.length;i+=8)pg.push(list.slice(i,i+8).map((s,j)=>tile(s,i+j,l)).join('')); // هر اسلاید ۸ کاشی
  return `<div class="tslider" id="ts"><div class="ttrack">${pg.map(p=>`<div class="tpage"><div class="tiles">${p}</div></div>`).join('')}</div>${pg.length>1?`<div class="tdots">${pg.map((_,i)=>`<i${i?'':' class="on"'}></i>`).join('')}</div>`:''}</div>`};
const rank=(list,l)=>list.length?`<div class="rks">${list.map((s,i)=>`<a class="rk pplay" href="#/song/${s.id}" data-i="${i}" data-l="${l}"><em class="n">${(i+1).toLocaleString('fa')}</em><img loading="lazy" src="${esc(cv(s))}" onerror="this.onerror=null;this.src='${DEF}'" alt=""><div><b>${esc(s.title)}</b><span>${esc(s.artist)}</span></div>${cfg.show_plays!==false&&s.plays?`<small>▶ ${s.plays.toLocaleString('fa')}</small>`:''}</a>`).join('')}</div>`:`<p class="empty">موردی پیدا نشد.</p>`;
const row=(list,l)=>list.length?`<div class="grid">${list.map((s,i)=>card(s,i,l)).join('')}</div>`:`<p class="empty">موردی پیدا نشد.</p>`;
const dlq=(u,s,l)=>/^https?:\/\//.test(u)||/^[\w./-]+$/.test(u)?(/\/api\/file\//.test(u)?u+'?dl=1&name='+encodeURIComponent(s.artist+' - '+s.title+' ['+l+']'):u):'#';
const dl=s=>/\/api\/file\//.test(s.audio)?s.audio+'?dl=1&name='+encodeURIComponent(s.artist+' - '+s.title):s.audio;
const NOTE='<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';
const fdate=d=>{const x=new Date(d);return isNaN(x)?'':x.toLocaleDateString('fa-IR',{year:'numeric',month:'long',day:'numeric'})};
const post=(s,i)=>`<article class="post"><a class="phd" href="#/song/${s.id}"><span class="pnote">${NOTE}</span><div><h3>${esc(s.title)} | ${esc(s.artist)}</h3><small>${[esc(s.category),fdate(s.releaseDate),cfg.show_plays!==false&&s.plays?s.plays.toLocaleString('fa')+' پخش':''].filter(Boolean).join(' / ')}</small></div></a>
  <div class="pcard"><b>${esc(s.title)}</b><p>از ${esc(s.artist)}${s.album?' · آلبوم '+esc(s.album):''}</p>
  <a class="pplay" href="#/song/${s.id}" data-i="${i}" data-l="f"><img loading="lazy" src="${esc(cv(s))}" onerror="this.onerror=null;this.src='${DEF}'" alt=""></a>
  <a class="pbtn pplay" href="#/song/${s.id}" data-i="${i}" data-l="f">${cfg.allow_download!==false&&s.downloadAllowed?'پخش و دانلود':'پخش'} «${esc(s.title)}»</a></div></article>`;
let fpg=0; // لیست همهٔ آهنگ‌ها: ۱۰ آهنگ در هر صفحه با دکمه‌های صفحه‌بندی
function feed(){const box=document.getElementById('feed'),pg=document.getElementById('fend');if(!box)return;
  const all=lists.f||[],per=cfg.feed_per||10,np=Math.max(1,Math.ceil(all.length/per));
  const nums=()=>{const s=new Set([0,np-1,fpg-1,fpg,fpg+1]),o=[];let last=-1;
    [...s].filter(x=>x>=0&&x<np).sort((x,y)=>x-y).forEach(x=>{if(x-last>1)o.push('<span>…</span>');o.push(`<button data-pg="${x}" class="${x===fpg?'on':''}">${(x+1).toLocaleString('fa')}</button>`);last=x});return o.join('')};
  const draw=sc=>{fpg=Math.min(Math.max(fpg,0),np-1);box.innerHTML=all.slice(fpg*per,fpg*per+per).map((s,i)=>post(s,fpg*per+i)).join('');
    pg.innerHTML=np>1?`<div class="pager"><button data-pg="next" ${fpg>=np-1?'disabled':''}>صفحهٔ بعد ‹</button>${nums()}<button data-pg="prev" ${fpg<=0?'disabled':''}>› صفحهٔ قبل</button></div>`:'';
    if(sc)box.previousElementSibling.scrollIntoView({behavior:'smooth'})};
  pg.onclick=e=>{const b=e.target.closest('[data-pg]');if(!b||b.disabled)return;const v=b.dataset.pg;fpg=v==='next'?fpg+1:v==='prev'?fpg-1:+v;draw(true)};
  draw(false)}
const popular=()=>songs.filter(s=>s.plays||s.popular).sort((x,y)=>(y.plays||0)-(x.plays||0)||(y.popular?1:0)-(x.popular?1:0)); // محبوب = بیشترین پخش
const byDate=()=>[...songs].sort((a,b)=>(!!b.addedAt-!!a.addedAt)||(b.addedAt||'').localeCompare(a.addedAt||'')||(b.releaseDate||'').localeCompare(a.releaseDate||'')); // تازه‌ترین آپلود اول
const uniq=k=>[...new Set(songs.map(s=>s[k]))];
const ph=(n,c='')=>info[n]&&info[n].photo?`<img class="ph" src="${esc(info[n].photo)}" alt="" loading="lazy">`:`<span class="ph">${esc([...n][0]||'?')}</span>`;
const avatars=()=>`<div class="avs">${uniq('artist').map(a=>`<a class="av" href="#/artist/${encodeURIComponent(a)}">${ph(a)}<b>${esc(a)}</b></a>`).join('')}</div>`;
const chips=(k,r)=>`<div class="chips">${uniq(k).map(a=>`<a class="chip" href="#/${r}/${encodeURIComponent(a)}">${esc(a)}</a>`).join('')}</div>`;
function seo(t,d,path){document.title=t+' | '+(cfg.name_en||'Muzio')+' · '+(cfg.name_fa||'موزیو');const m=(n,c,p)=>{let e=document.querySelector(`meta[${p||'name'}="${n}"]`);if(!e){e=document.createElement('meta');e.setAttribute(p||'name',n);document.head.append(e)}e.content=c};
  m('description',d);m('og:title',t,'property');m('og:description',d,'property');m('twitter:card','summary_large_image');
  document.querySelector('link[rel=canonical]').href=location.origin+location.pathname+(path||'')}
const views={
 home(){const on=k=>cfg[k]!==false,n=byDate().slice(0,(cfg.pages||2)*8),p=popular().slice(0,10),fg=byDate().filter(s=>s.foreign).slice(0,8);lists.n=n;lists.p=p;lists.g=fg;lists.f=byDate();
  const sec=(t,r)=>`<div class="sec"><h2>${t}</h2><a class="more" href="#/songs/${r}">مشاهده همه</a></div>`;
  const bn=cfg.banners&&cfg.banners.length?cfg.banners:['images/banner.jpg','images/banner2.jpg'];
  return (on('show_banner')?`<div class="bslider" id="bs">${bn.map((u,i)=>`<img${i?'':' class="on"'} src="${esc(u)}" alt="${esc(cfg.name_en||'Muzio')}">`).join('')}${bn.length>1?`<div class="dots">${bn.map((_,i)=>`<i${i?'':' class="on"'}></i>`).join('')}</div>`:''}</div>`:'')
  +(on('show_new')?sec('آهنگ‌های جدید','new')+tslider(n,'n'):'')
  +(on('show_feed')?`<h2>همهٔ آهنگ‌ها</h2><div id="feed" class="feed"></div><div id="fend"></div>`:'')
  +(on('show_popular')&&p.length?sec('پربازدیدترین‌ها','popular')+rank(p,'p'):'')+(on('show_foreign')&&fg.length?sec('آهنگ‌های خارجی','foreign')+row(fg,'g'):'')
  +(on('show_artists')?`<h2>خواننده‌ها</h2>${avatars()}`:'')+(on('show_cats')?`<h2>دسته‌بندی‌ها</h2>${chips('category','cat')}`:'')},
 songs(k){const l=k==='popular'?popular().slice(0,50):k==='foreign'?byDate().filter(s=>s.foreign):byDate();lists.l=l;
  return `<h2>${k==='popular'?'پربازدیدترین‌ها':k==='foreign'?'آهنگ‌های خارجی':'آهنگ‌های جدید'}</h2>${k==='popular'?rank(l,'l'):tiles(l,'l')}`},
 artists:()=>`<h2>خواننده‌ها</h2>${avatars()}`,
 artist(n){n=decodeURIComponent(n);lists.l=songs.filter(s=>s.artist===n);seo(n,`آهنگ‌های ${n}`);return `<div class="ah">${ph(n)}<h1>${esc(n)}</h1></div><h2>آهنگ‌ها</h2>${row(lists.l,'l')}`},
 cats:()=>`<h2>دسته‌بندی‌ها</h2>${chips('category','cat')}`,
 cat(c){c=decodeURIComponent(c);lists.l=songs.filter(s=>s.category===c);return `<h2>${esc(c)}</h2>${row(lists.l,'l')}`},
 search(q){q=decodeURIComponent(q);lists.l=searchSongs(songs,q);return `<h2>نتایج «${esc(q)}»</h2>${row(lists.l,'l')}`},
 song(id){const s=songs.find(x=>x.id==id);if(!s)return views.nf();lists.l=[s];
  seo(`${s.title} - ${s.artist}`,`پخش آهنگ ${s.title} از ${s.artist}`,'#/song/'+s.id);
  const ld=document.getElementById('ld')||Object.assign(document.createElement('script'),{id:'ld',type:'application/ld+json'});
  ld.textContent=JSON.stringify({'@context':'https://schema.org','@type':'MusicRecording',name:s.title,byArtist:s.artist,inAlbum:s.album,datePublished:s.releaseDate,duration:s.duration});document.head.append(ld);
  return `<div class="detail"><img src="${esc(cv(s))}" onerror="this.onerror=null;this.src='${DEF}'" alt=""><div><h1>${esc(s.title)}</h1><p><a href="#/artist/${encodeURIComponent(s.artist)}">${esc(s.artist)}</a> · ${esc(s.album)} · ${esc(s.duration)}${cfg.show_plays!==false&&s.plays?' · '+s.plays.toLocaleString('fa')+' پخش':''}</p>
  ${s.license?`<p class="lic">منبع: <a href="${esc(s.sourceUrl||'#')}" target="_blank" rel="noopener">${esc(s.source||'')}</a> · مجوز: <a href="${esc(s.licenseUrl||'#')}" target="_blank" rel="noopener">${esc(s.license)}</a></p>`:''}<div class="acts"><button class="btn" data-play>پخش</button> <button class="btn ghost" data-fav>${isFav(s.id)?'♥ ذخیره‌شده':'♡ علاقه‌مندی'}</button> <button class="btn ghost" data-share>اشتراک‌گذاری</button> <a class="btn ghost" href="#/artist/${encodeURIComponent(s.artist)}">همهٔ آهنگ‌های ${esc(s.artist)} (${songs.filter(x=>x.artist===s.artist).length.toLocaleString('fa')})</a> ${cfg.allow_download!==false&&s.downloadAllowed&&s.audio?`<a class="btn dlb" href="${esc(s.downloadUrl||dl(s))}" download>${s.qlabel?'دانلود آهنگ با کیفیت '+esc(s.qlabel):'دانلود آهنگ'}</a>`:''}${cfg.allow_download!==false&&s.downloadAllowed?(s.qualities||[]).map(q=>`<a class="btn dlb" href="${esc(dlq(q.url,s,q.label))}" download>دانلود آهنگ با کیفیت ${esc(q.label)}</a>`).join(''):''}</div></div></div>${s.lyrics?`<h2>متن آهنگ</h2><pre class="lyr">${esc(s.lyrics)}</pre>`:''}`},
 fav(){const l=songs.filter(s=>favs().includes(s.id));lists.l=l;return `<h2>علاقه‌مندی‌های من</h2>`+(l.length?tiles(l,'l'):`<p class="empty">هنوز آهنگی ذخیره نکرده‌اید. روی ♡ در صفحهٔ آهنگ بزنید.</p>`)},
 about:()=>`<h2>درباره ما</h2>${cfg.about?`<p class="abt">${esc(cfg.about)}</p>`:`<p>موزیو (Muzio) فقط آهنگ‌هایی را نمایش می‌دهد که انتشار آن‌ها مجاز است.</p>`}`,
 nf:()=>`<div class="empty"><h2>۴۰۴</h2><p>صفحه پیدا نشد.</p><a class="btn" href="#/">بازگشت به خانه</a></div>`
};
let tt; // اسلایدر آهنگ‌های جدید: هر ۵ ثانیه ۴ آهنگ بعدی، نقطه‌ها و کشیدن انگشت
function tslide(){clearInterval(tt);const s=document.getElementById('ts');if(!s)return;
  const tr=s.querySelector('.ttrack'),ds=[...s.querySelectorAll('.tdots i')],n=ds.length;if(n<2)return;let k=0,x0=0;
  const go=i=>{k=(i+n)%n;tr.style.setProperty('--i',k);ds.forEach((d,j)=>d.classList.toggle('on',j===k))};
  const reset=()=>{clearInterval(tt);tt=setInterval(()=>go(k+1),(cfg.slide_sec||5)*1000)};
  ds.forEach((d,j)=>d.onclick=()=>{go(j);reset()});
  s.ontouchstart=e=>{x0=e.touches[0].clientX;clearInterval(tt)};
  s.ontouchend=e=>{const d=e.changedTouches[0].clientX-x0;if(Math.abs(d)>40)go(k+(d>0?1:-1));reset()};
  reset()}
let bt; // اسلایدر بنر: تعویض خودکار هر ۴.۵ ثانیه، نقطه‌ها و کشیدن انگشت
function slider(){clearInterval(bt);const s=document.getElementById('bs');if(!s)return;
  const im=[...s.querySelectorAll('img')],ds=[...s.querySelectorAll('.dots i')];let k=0,x0=0;
  const go=n=>{k=(n+im.length)%im.length;im.forEach((x,j)=>x.classList.toggle('on',j===k));ds.forEach((x,j)=>x.classList.toggle('on',j===k))};
  const reset=()=>{clearInterval(bt);bt=setInterval(()=>go(k+1),(cfg.slide_sec||5)*1000)};
  ds.forEach((d,j)=>d.onclick=()=>{go(j);reset()});
  s.ontouchstart=e=>x0=e.touches[0].clientX;
  s.ontouchend=e=>{const d=e.changedTouches[0].clientX-x0;if(Math.abs(d)>40){go(k+(d<0?1:-1));reset()}};
  reset()}
// حالت روشن/تاریک (ذخیره در مرورگر؛ پیش‌فرض تاریک)
const th=()=>document.documentElement.dataset.theme==='light'?'light':'dark';
const setTheme=(t,sv=true)=>{document.documentElement.dataset.theme=t;if(sv)try{localStorage.setItem('muzio_theme',t)}catch{}
  $('themeBtn').textContent=t==='light'?'🌙 حالت تاریک':'☀ حالت روشن';document.querySelector('meta[name=theme-color]').content=t==='light'?'#f5f2ff':'#07060f'};
$('themeBtn').onclick=()=>setTheme(th()==='light'?'dark':'light');setTheme(th(),false);
// منوی همبرگری و جستجوی بازشونده
const dr=$('drawer'),sc=$('scrim'),sb=$('sbar');
const menu=o=>{dr.classList.toggle('open',o);sc.hidden=!o;$('menuBtn').setAttribute('aria-expanded',o)};
$('menuBtn').onclick=()=>menu(true);$('menuX').onclick=()=>menu(false);sc.onclick=()=>menu(false);
dr.addEventListener('click',e=>{if(e.target.closest('a'))menu(false)});
$('srchBtn').onclick=()=>{sb.hidden=!sb.hidden;if(!sb.hidden)$('q').focus()};
addEventListener('keydown',e=>{if(e.key==='Escape'){menu(false);sb.hidden=true}});
function applyCfg(){ // اعمال تنظیمات کلی پنل: رنگ‌ها، نام، لینک‌ها
  const r=document.documentElement.style,cc=(k,d)=>cfg[k]&&cfg[k].toLowerCase()!==d;if(cc('c1','#00f0ff')){r.setProperty('--n1',cfg.c1);r.setProperty('--ac',cfg.c1)}if(cc('c2','#ff2bd6'))r.setProperty('--n2',cfg.c2);if(cc('c3','#8a5cff'))r.setProperty('--n3',cfg.c3);
  const en=cfg.name_en||'Muzio',fa=cfg.name_fa||'موزیو';document.querySelector('.logo span').textContent=en;document.querySelector('.logo small').textContent=fa;
  document.querySelector('.drawer .dh b').textContent=en+' · '+fa;$('fname').textContent=en+' · '+fa;
  const ln=[['تلگرام',cfg.contact_tg],['اینستاگرام',cfg.contact_ig],['ایمیل',cfg.contact_email&&'mailto:'+cfg.contact_email]].filter(x=>x[1]).map(x=>`<a href="${esc(x[1])}" target="_blank" rel="noopener">${x[0]}</a>`).join(' · ');
  $('flinks').innerHTML=ln?' · '+ln:'';if(cfg.tagline)document.querySelector('meta[name=description]').content=cfg.tagline;
  let sv=null;try{sv=localStorage.getItem('muzio_theme')}catch{}
  if(!sv&&cfg.default_theme&&cfg.default_theme!=='dark')setTheme(cfg.default_theme==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):cfg.default_theme,false);
  const nt=$('notice');if(cfg.announce_on&&cfg.announce&&sessionStorage.getItem('muzio_ntc')!==cfg.announce){nt.innerHTML=`<span>${esc(cfg.announce)}</span><button aria-label="بستن">✕</button>`;nt.hidden=false;nt.querySelector('button').onclick=()=>{nt.hidden=true;try{sessionStorage.setItem('muzio_ntc',cfg.announce)}catch{}}}
  $('ftext').textContent=cfg.footer_text||'';
  if(/^G-[A-Z0-9]{4,15}$/.test(cfg.ga_id||'')){const g=document.createElement('script');g.async=1;g.src='https://www.googletagmanager.com/gtag/js?id='+cfg.ga_id;document.head.append(g);window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config',cfg.ga_id)}}
function route(){const [p,a]=location.hash.replace(/^#\/?/,'').split('/');const f=views[p||'home']||views.nf;
  if(!p)seo('خانه','پخش و دانلود آهنگ‌های دارای مجوز انتشار');v.innerHTML=f(a);scrollTo(0,0);slider();tslide();feed();dr.querySelectorAll('a').forEach(x=>x.classList.toggle('on',x.getAttribute('href')===(location.hash||'#/')))}
v.addEventListener('click',e=>{if(e.target.closest('[data-share]'))return share(lists.l[0]);const fb=e.target.closest('[data-fav]');if(fb){fb.textContent=toggleFav(lists.l[0].id)?'♥ ذخیره‌شده':'♡ علاقه‌مندی';return}if(e.target.closest('[data-play]'))return player.play(lists.l,0);
  const c=e.target.closest('.card,.tile,.pplay');if(c&&lists[c.dataset.l])player.play(lists[c.dataset.l],+c.dataset.i)});
$('q').addEventListener('input',debounce(e=>{const q=e.target.value.trim();location.hash=q?'#/search/'+encodeURIComponent(q):'#/'}));
addEventListener('hashchange',route);
v.innerHTML=`<div class="grid">${'<div class="sk"></div>'.repeat(8)}</div>`;
Promise.all([fetch(API_BASE?API_BASE+'/api/songs':'data/songs.json').then(r=>r.json()),API_BASE?fetch(API_BASE+'/api/artist-info').then(r=>r.json()).catch(()=>({})):{},API_BASE?fetch(API_BASE+'/api/settings').then(r=>r.json()).catch(()=>({})):{}]).then(([d,ai,cf])=>{songs=d.songs||d;info=ai||{};cfg=cf||{};applyCfg();route()})
 .catch(()=>v.innerHTML=`<div class="empty"><p>بارگذاری آهنگ‌ها ناموفق بود.</p><button class="btn" onclick="location.reload()">تلاش دوباره</button></div>`);

// نصب به‌صورت اپ (PWA) و Service Worker
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
let dp;addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e;$('inst').hidden=false});
$('inst').onclick=async()=>{if(!dp)return;dp.prompt();await dp.userChoice;$('inst').hidden=true};
