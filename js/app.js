// اپ اصلی: بارگذاری داده، مسیریابی hash، رندر صفحات، SEO
import {Player,cv,DEF,share} from './player.js';import {searchSongs,debounce} from './search.js';
const API_BASE='https://muzio.kingdom80.workers.dev'; // بعد از ساخت Worker: 'https://your-worker.workers.dev'
const $=id=>document.getElementById(id),v=$('view'),player=new Player(API_BASE);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let songs=[],info={};const lists={};
const card=(s,i,l)=>`<a class="card" href="#/song/${s.id}" data-i="${i}" data-l="${l}"><img loading="lazy" src="${esc(cv(s))}" onerror="this.onerror=null;this.src='${DEF}'" alt=""><b>${esc(s.title)}</b><span>${esc(s.artist)}</span></a>`;
const tile=(s,i,l)=>`<a class="tile" href="#/song/${s.id}" data-i="${i}" data-l="${l}"><img loading="lazy" src="${esc(cv(s))}" onerror="this.onerror=null;this.src='${DEF}'" alt=""><span class="badge">جدید</span><div class="cap"><b>${esc(s.title)}</b><span>${esc(s.artist)}</span></div></a>`;
const tiles=(list,l)=>list.length?`<div class="tiles">${list.map((s,i)=>tile(s,i,l)).join('')}</div>`:`<p class="empty">موردی پیدا نشد.</p>`;
const row=(list,l)=>list.length?`<div class="grid">${list.map((s,i)=>card(s,i,l)).join('')}</div>`:`<p class="empty">موردی پیدا نشد.</p>`;
const byDate=()=>[...songs].sort((a,b)=>b.releaseDate.localeCompare(a.releaseDate));
const uniq=k=>[...new Set(songs.map(s=>s[k]))];
const ph=(n,c='')=>info[n]&&info[n].photo?`<img class="ph" src="${esc(info[n].photo)}" alt="" loading="lazy">`:`<span class="ph">${esc([...n][0]||'?')}</span>`;
const avatars=()=>`<div class="avs">${uniq('artist').map(a=>`<a class="av" href="#/artist/${encodeURIComponent(a)}">${ph(a)}<b>${esc(a)}</b></a>`).join('')}</div>`;
const chips=(k,r)=>`<div class="chips">${uniq(k).map(a=>`<a class="chip" href="#/${r}/${encodeURIComponent(a)}">${esc(a)}</a>`).join('')}</div>`;
function seo(t,d,path){document.title=t+' | Muzio · موزیو';const m=(n,c,p)=>{let e=document.querySelector(`meta[${p||'name'}="${n}"]`);if(!e){e=document.createElement('meta');e.setAttribute(p||'name',n);document.head.append(e)}e.content=c};
  m('description',d);m('og:title',t,'property');m('og:description',d,'property');m('twitter:card','summary_large_image');
  document.querySelector('link[rel=canonical]').href=location.origin+location.pathname+(path||'')}
const views={
 home(){const n=byDate().slice(0,8),p=songs.filter(s=>s.popular).slice(0,8);lists.n=n;lists.p=p;
  const sec=(t,r)=>`<div class="sec"><h2>${t}</h2><a class="more" href="#/songs/${r}">مشاهده همه</a></div>`;
  return `<div class="bslider" id="bs"><img class="on" src="images/banner.jpg" alt="Muzio موزیو - موسیقی، بی‌مرز و همیشه همراه تو"><img src="images/banner2.jpg" alt="Muzio موزیو"><div class="dots"><i class="on"></i><i></i></div></div>
  ${sec('آهنگ‌های جدید','new')}${tiles(n,'n')}
  ${p.length?sec('محبوب‌ترین‌ها','popular')+row(p,'p'):''}
  <h2>خواننده‌ها</h2>${avatars()}<h2>دسته‌بندی‌ها</h2>${chips('category','cat')}`},
 songs(k){const l=k==='popular'?songs.filter(s=>s.popular):byDate();lists.l=l;return `<h2>${k==='popular'?'آهنگ‌های محبوب':'آهنگ‌های جدید'}</h2>${k==='popular'?row(l,'l'):tiles(l,'l')}`},
 artists:()=>`<h2>خواننده‌ها</h2>${avatars()}`,
 artist(n){n=decodeURIComponent(n);lists.l=songs.filter(s=>s.artist===n);seo(n,`آهنگ‌های ${n}`);return `<div class="ah">${ph(n)}<h1>${esc(n)}</h1></div><h2>آهنگ‌ها</h2>${row(lists.l,'l')}`},
 cats:()=>`<h2>دسته‌بندی‌ها</h2>${chips('category','cat')}`,
 cat(c){c=decodeURIComponent(c);lists.l=songs.filter(s=>s.category===c);return `<h2>${esc(c)}</h2>${row(lists.l,'l')}`},
 search(q){q=decodeURIComponent(q);lists.l=searchSongs(songs,q);return `<h2>نتایج «${esc(q)}»</h2>${row(lists.l,'l')}`},
 song(id){const s=songs.find(x=>x.id==id);if(!s)return views.nf();lists.l=[s];
  seo(`${s.title} - ${s.artist}`,`پخش آهنگ ${s.title} از ${s.artist}`,'#/song/'+s.id);
  const ld=document.getElementById('ld')||Object.assign(document.createElement('script'),{id:'ld',type:'application/ld+json'});
  ld.textContent=JSON.stringify({'@context':'https://schema.org','@type':'MusicRecording',name:s.title,byArtist:s.artist,inAlbum:s.album,datePublished:s.releaseDate,duration:s.duration});document.head.append(ld);
  return `<div class="detail"><img src="${esc(cv(s))}" onerror="this.onerror=null;this.src='${DEF}'" alt=""><div><h1>${esc(s.title)}</h1><p><a href="#/artist/${encodeURIComponent(s.artist)}">${esc(s.artist)}</a> · ${esc(s.album)} · ${esc(s.duration)}</p>
  <button class="btn" data-play>پخش</button> <button class="btn ghost" data-share>اشتراک‌گذاری</button> ${s.downloadAllowed&&s.audio?`<a class="btn" href="${esc(s.audio)}" download>دانلود</a>`:''}</div></div>${s.lyrics?`<h2>متن آهنگ</h2><pre class="lyr">${esc(s.lyrics)}</pre>`:''}`},
 about:()=>`<h2>درباره ما</h2><p>موزیو (Muzio) فقط آهنگ‌هایی را نمایش می‌دهد که انتشار آن‌ها مجاز است.</p>`,
 nf:()=>`<div class="empty"><h2>۴۰۴</h2><p>صفحه پیدا نشد.</p><a class="btn" href="#/">بازگشت به خانه</a></div>`
};
let bt; // اسلایدر بنر: تعویض خودکار هر ۴.۵ ثانیه، نقطه‌ها و کشیدن انگشت
function slider(){clearInterval(bt);const s=document.getElementById('bs');if(!s)return;
  const im=[...s.querySelectorAll('img')],ds=[...s.querySelectorAll('.dots i')];let k=0,x0=0;
  const go=n=>{k=(n+im.length)%im.length;im.forEach((x,j)=>x.classList.toggle('on',j===k));ds.forEach((x,j)=>x.classList.toggle('on',j===k))};
  const reset=()=>{clearInterval(bt);bt=setInterval(()=>go(k+1),4500)};
  ds.forEach((d,j)=>d.onclick=()=>{go(j);reset()});
  s.ontouchstart=e=>x0=e.touches[0].clientX;
  s.ontouchend=e=>{const d=e.changedTouches[0].clientX-x0;if(Math.abs(d)>40){go(k+(d<0?1:-1));reset()}};
  reset()}
function route(){const [p,a]=location.hash.replace(/^#\/?/,'').split('/');const f=views[p||'home']||views.nf;
  if(!p)seo('خانه','پخش و دانلود آهنگ‌های دارای مجوز انتشار');v.innerHTML=f(a);scrollTo(0,0);slider()}
v.addEventListener('click',e=>{if(e.target.closest('[data-share]'))return share(lists.l[0]);if(e.target.closest('[data-play]'))return player.play(lists.l,0);
  const c=e.target.closest('.card,.tile');if(c&&lists[c.dataset.l])player.play(lists[c.dataset.l],+c.dataset.i)});
$('q').addEventListener('input',debounce(e=>{const q=e.target.value.trim();location.hash=q?'#/search/'+encodeURIComponent(q):'#/'}));
addEventListener('hashchange',route);
v.innerHTML=`<div class="grid">${'<div class="sk"></div>'.repeat(8)}</div>`;
Promise.all([fetch(API_BASE?API_BASE+'/api/songs':'data/songs.json').then(r=>r.json()),API_BASE?fetch(API_BASE+'/api/artist-info').then(r=>r.json()).catch(()=>({})):{}]).then(([d,ai])=>{songs=d.songs||d;info=ai||{};route()})
 .catch(()=>v.innerHTML=`<div class="empty"><p>بارگذاری آهنگ‌ها ناموفق بود.</p><button class="btn" onclick="location.reload()">تلاش دوباره</button></div>`);
