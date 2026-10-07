// اپ اصلی: بارگذاری داده، مسیریابی hash، رندر صفحات، SEO
import {Player} from './player.js';import {searchSongs,debounce} from './search.js';
const API_BASE=''; // بعد از ساخت Worker: 'https://your-worker.workers.dev'
const $=id=>document.getElementById(id),v=$('view'),player=new Player();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let songs=[];const lists={};
const card=(s,i,l)=>`<a class="card" href="#/song/${s.id}" data-i="${i}" data-l="${l}"><img loading="lazy" src="${esc(s.cover)}" alt=""><b>${esc(s.title)}</b><span>${esc(s.artist)}</span></a>`;
const row=(list,l)=>list.length?`<div class="grid">${list.map((s,i)=>card(s,i,l)).join('')}</div>`:`<p class="empty">موردی پیدا نشد.</p>`;
const byDate=()=>[...songs].sort((a,b)=>b.releaseDate.localeCompare(a.releaseDate));
const uniq=k=>[...new Set(songs.map(s=>s[k]))];
const chips=(k,r)=>`<div class="chips">${uniq(k).map(a=>`<a class="chip" href="#/${r}/${encodeURIComponent(a)}">${esc(a)}</a>`).join('')}</div>`;
function seo(t,d,path){document.title=t+' | Muzio';const m=(n,c,p)=>{let e=document.querySelector(`meta[${p||'name'}="${n}"]`);if(!e){e=document.createElement('meta');e.setAttribute(p||'name',n);document.head.append(e)}e.content=c};
  m('description',d);m('og:title',t,'property');m('og:description',d,'property');m('twitter:card','summary_large_image');
  document.querySelector('link[rel=canonical]').href=location.origin+location.pathname+(path||'')}
const views={
 home(){const n=byDate().slice(0,8),p=songs.filter(s=>s.popular).slice(0,8);lists.n=n;lists.p=p.length?p:n;
  return `<div class="hero"><h1>موسیقی مجاز، بی‌دردسر</h1><p>فقط آهنگ‌هایی که انتشارشان آزاد است.</p></div>
  <h2>منتخب</h2><div class="slider">${n.slice(0,6).map((s,i)=>card(s,i,'n')).join('')}</div>
  <h2>جدیدترین‌ها</h2>${row(n,'n')}<h2>محبوب‌ترین‌ها</h2>${row(lists.p,'p')}
  <h2>خواننده‌ها</h2>${chips('artist','artist')}<h2>دسته‌بندی‌ها</h2>${chips('category','cat')}`},
 songs(k){const l=k==='popular'?songs.filter(s=>s.popular):byDate();lists.l=l;return `<h2>${k==='popular'?'آهنگ‌های محبوب':'آهنگ‌های جدید'}</h2>${row(l,'l')}`},
 artists:()=>`<h2>خواننده‌ها</h2>${chips('artist','artist')}`,
 artist(n){n=decodeURIComponent(n);lists.l=songs.filter(s=>s.artist===n);seo(n,`آهنگ‌های ${n}`);return `<h2>${esc(n)}</h2>${row(lists.l,'l')}`},
 cats:()=>`<h2>دسته‌بندی‌ها</h2>${chips('category','cat')}`,
 cat(c){c=decodeURIComponent(c);lists.l=songs.filter(s=>s.category===c);return `<h2>${esc(c)}</h2>${row(lists.l,'l')}`},
 search(q){q=decodeURIComponent(q);lists.l=searchSongs(songs,q);return `<h2>نتایج «${esc(q)}»</h2>${row(lists.l,'l')}`},
 song(id){const s=songs.find(x=>x.id==id);if(!s)return views.nf();lists.l=[s];
  seo(`${s.title} - ${s.artist}`,`پخش آهنگ ${s.title} از ${s.artist}`,'#/song/'+s.id);
  const ld=document.getElementById('ld')||Object.assign(document.createElement('script'),{id:'ld',type:'application/ld+json'});
  ld.textContent=JSON.stringify({'@context':'https://schema.org','@type':'MusicRecording',name:s.title,byArtist:s.artist,inAlbum:s.album,datePublished:s.releaseDate,duration:s.duration});document.head.append(ld);
  return `<div class="detail"><img src="${esc(s.cover)}" alt=""><div><h1>${esc(s.title)}</h1><p><a href="#/artist/${encodeURIComponent(s.artist)}">${esc(s.artist)}</a> · ${esc(s.album)} · ${esc(s.duration)}</p>
  <button class="btn" data-play>پخش</button> ${s.downloadAllowed&&s.audio?`<a class="btn" href="${esc(s.audio)}" download>دانلود</a>`:''}</div></div>`},
 about:()=>`<h2>درباره ما</h2><p>این سایت فقط آهنگ‌هایی را نمایش می‌دهد که انتشار آن‌ها مجاز است.</p>`,
 terms:()=>`<h2>قوانین استفاده</h2><p>استفاده از محتوا تابع مجوز هر اثر است. برای حذف محتوا با ما تماس بگیرید.</p>`,
 nf:()=>`<div class="empty"><h2>۴۰۴</h2><p>صفحه پیدا نشد.</p><a class="btn" href="#/">بازگشت به خانه</a></div>`
};
function route(){const [p,a]=location.hash.replace(/^#\/?/,'').split('/');const f=views[p||'home']||views.nf;
  if(!p)seo('خانه','پخش و دانلود آهنگ‌های دارای مجوز انتشار');v.innerHTML=f(a);scrollTo(0,0)}
v.addEventListener('click',e=>{if(e.target.closest('[data-play]'))return player.play(lists.l,0);
  const c=e.target.closest('.card');if(c&&lists[c.dataset.l])player.play(lists[c.dataset.l],+c.dataset.i)});
$('q').addEventListener('input',debounce(e=>{const q=e.target.value.trim();location.hash=q?'#/search/'+encodeURIComponent(q):'#/'}));
addEventListener('hashchange',route);
v.innerHTML=`<div class="grid">${'<div class="sk"></div>'.repeat(8)}</div>`;
fetch(API_BASE?API_BASE+'/api/songs':'data/songs.json').then(r=>r.json()).then(d=>{songs=d.songs||d;route()})
 .catch(()=>v.innerHTML=`<div class="empty"><p>بارگذاری آهنگ‌ها ناموفق بود.</p><button class="btn" onclick="location.reload()">تلاش دوباره</button></div>`);
