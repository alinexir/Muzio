// Cloudflare Worker: API + Importer. Secret: ADMIN_TOKEN. Binding: KV. Var: DATA_URL (آدرس songs.json روی GitHub Pages)
const H={'content-type':'application/json;charset=utf-8','access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,DELETE,OPTIONS'};
const J=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:H});
const load=async e=>(await e.KV.get('songs','json'))||(await fetch(e.DATA_URL)).json();
let pend={},pn=0,last=0; // شمارندهٔ پخش: دسته‌ای نوشته می‌شود تا سقف نوشتن روزانهٔ KV تمام نشود
const authed=(r,e)=>e.ADMIN_TOKEN&&r.headers.get('authorization')==='Bearer '+e.ADMIN_TOKEN;
// کمک‌تابع‌های گیت‌هاب: یک کامیت واحد برای چند فایل (Secret: GITHUB_TOKEN، متغیر: GH_REPO مثل user/repo، اختیاری: GH_BRANCH)
const GH=async(e,path,o={})=>{const r=await fetch('https://api.github.com/repos/'+e.GH_REPO+path,{...o,headers:{authorization:'Bearer '+e.GITHUB_TOKEN,'user-agent':'muzio-worker',accept:'application/vnd.github+json','content-type':'application/json'}});
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.message||r.status);return j};
const ghCommit=async(e,files,msg)=>{const br=e.GH_BRANCH||'main',ref=await GH(e,'/git/ref/heads/'+br),base=ref.object.sha,bc=await GH(e,'/git/commits/'+base),tree=[];
  for(const f of files){
    if(!/^[\w\-./]+$/.test(f.path)||f.path.includes('..')||f.path.startsWith('/')||f.path.startsWith('.'))throw new Error('مسیر نامعتبر: '+f.path);
    if(typeof f.text==='string')tree.push({path:f.path,mode:'100644',type:'blob',content:f.text});
    else{const b=await GH(e,'/git/blobs',{method:'POST',body:JSON.stringify({content:f.b64,encoding:'base64'})});tree.push({path:f.path,mode:'100644',type:'blob',sha:b.sha})}}
  const t=await GH(e,'/git/trees',{method:'POST',body:JSON.stringify({base_tree:bc.tree.sha,tree})}),
    c=await GH(e,'/git/commits',{method:'POST',body:JSON.stringify({message:msg,tree:t.sha,parents:[base]})});
  await GH(e,'/git/refs/heads/'+br,{method:'PATCH',body:JSON.stringify({sha:c.sha})});return c.html_url};
// منابع Import: فقط API/RSS رسمی و مجاز. برای منبع جدید یک تابع به این شیء اضافه کنید.
const IMPORTERS={
  source1:async url=>{const t=await(await fetch(url)).text();
    if(/^\s*[\[{]/.test(t)){const j=JSON.parse(t);return(j.songs||j).map(x=>({title:x.title,artist:x.artist,album:x.album||'',cover:x.cover||'',audio:x.audio||'',duration:x.duration||'',releaseDate:x.releaseDate||'',category:x.category||'',downloadAllowed:!!x.downloadAllowed}))}
    const tag=(s,n)=>(s.match(new RegExp('<'+n+'[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</'+n+'>'))||[])[1]||'';
    return[...t.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m=>({title:tag(m[1],'title'),artist:tag(m[1],'author')||tag(m[1],'dc:creator'),album:'',cover:'',audio:(m[1].match(/enclosure[^>]*url="([^"]+)"/)||[])[1]||'',duration:'',releaseDate:new Date(tag(m[1],'pubDate')||Date.now()).toISOString().slice(0,10),category:tag(m[1],'category'),downloadAllowed:false}))}
};
export default{async fetch(r,e,ctx){
  if(r.method==='OPTIONS')return new Response(null,{headers:H});
  const u=new URL(r.url),p=u.pathname.split('/').filter(Boolean);if(p[0]!=='api')return J({error:'not found'},404);
  if(r.method==='GET'&&p[1]==='file'){ // پخش فایل‌های آپلودشده (با پشتیبانی از Range برای جلو/عقب کردن)
    const {value:buf,metadata:m}=await e.KV.getWithMetadata('f:'+p[2],{type:'arrayBuffer',cacheTtl:3600});
    if(!buf)return J({error:'not found'},404);const n=buf.byteLength;
    const h={'content-type':(m&&m.type)||'application/octet-stream','accept-ranges':'bytes','cache-control':'public,max-age=86400','access-control-allow-origin':'*','x-content-type-options':'nosniff'};
    if(u.searchParams.get('dl')){const nm=(u.searchParams.get('name')||'muzio').replace(/[\\/:*?"<>|]/g,'');h['content-disposition']="attachment; filename*=UTF-8''"+encodeURIComponent(nm+'.'+p[2].split('.').pop())} // دانلود واقعی (نه پخش در مرورگر)
    const g=/bytes=(\d*)-(\d*)/.exec(r.headers.get('range')||'');
    if(g){const s=g[1]?+g[1]:Math.max(0,n-+g[2]),t=g[1]&&g[2]?Math.min(+g[2],n-1):n-1;
      if(s>=n)return new Response(null,{status:416,headers:{...h,'content-range':'bytes */'+n}});
      return new Response(buf.slice(s,t+1),{status:206,headers:{...h,'content-range':`bytes ${s}-${t}/${n}`}})}
    return new Response(buf,{headers:h})}
  if(r.method==='POST'&&p[1]==='upload'){ // آپلود مستقیم آهنگ/کاور (فقط مدیر). سقف KV: ۲۵ مگابایت
    if(!authed(r,e))return J({error:'unauthorized'},401);
    const type=(r.headers.get('content-type')||'').toLowerCase();
    if(!/^(audio|image)\//.test(type)||type.includes('svg'))return J({error:'only audio/image'},415);
    const buf=await r.arrayBuffer();if(buf.byteLength>25*1024*1024-1024)return J({error:'too big'},413);
    const ext=(u.searchParams.get('ext')||'bin').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,5)||'bin';
    const id=crypto.randomUUID().replace(/-/g,'').slice(0,16)+'.'+ext;
    await e.KV.put('f:'+id,buf,{metadata:{type}});return J({url:u.origin+'/api/file/'+id})}
  if(p[1]==='settings'){ // تنظیمات کلی سایت: GET عمومی، POST فقط مدیر (مقادیر پاک‌سازی می‌شوند)
    if(r.method==='GET')return J((await e.KV.get('settings','json',{cacheTtl:60}))||{});
    if(!authed(r,e))return J({error:'unauthorized'},401);
    if(r.method==='POST'){const b=await r.json(),o={},S=(v,n)=>String(v??'').slice(0,n),U=v=>/^(https?:\/\/|images\/|\/)/.test(v||'')?S(v,500):'';
      for(const k of['name_en','name_fa','tagline','contact_email'])o[k]=S(b[k],120);
      o.about=S(b.about,5000);for(const k of['contact_tg','contact_ig'])o[k]=/^https?:\/\//.test(b[k]||'')?S(b[k],300):'';
      for(const k of['c1','c2','c3'])if(/^#[0-9a-fA-F]{6}$/.test(b[k]||''))o[k]=b[k];
      o.slide_sec=Math.min(30,Math.max(2,+b.slide_sec||5));o.new_hours=Math.min(168,Math.max(1,+b.new_hours||6));o.pages=Math.min(6,Math.max(1,+b.pages||4));
      for(const k of['show_banner','show_new','show_feed','show_popular','show_artists','show_cats'])o[k]=b[k]!==false;
      o.banners=(Array.isArray(b.banners)?b.banners:[]).map(U).filter(Boolean).slice(0,8);
      await e.KV.put('settings',JSON.stringify(o));return J(o)}}
  if(p[1]==='artist-info'){ // عکس خواننده‌ها: GET عمومی، POST فقط مدیر
    const o=(await e.KV.get('artists','json'))||{};
    if(r.method==='GET')return J(o);
    if(!authed(r,e))return J({error:'unauthorized'},401);
    if(r.method==='POST'){const b=await r.json();if(b.name){o[b.name]={...(o[b.name]||{}),photo:b.photo||''};await e.KV.put('artists',JSON.stringify(o))}return J(o)}}
  if(r.method==='POST'&&p[1]==='play'&&+p[2]){ // شمارش پخش (عمومی، تقریبی)
    const id=String(+p[2]);pend[id]=(pend[id]||0)+1;pn++;
    if(pn>=25||Date.now()-last>300000){const b=pend;pend={};pn=0;last=Date.now();
      ctx.waitUntil((async()=>{const o=(await e.KV.get('plays','json'))||{};for(const k in b)o[k]=(o[k]||0)+b[k];await e.KV.put('plays',JSON.stringify(o))})())}
    return J({ok:1})}
  if(p[1]==='jamendo'){ // جستجوی موسیقی دارای مجوز آزاد از API رسمی Jamendo (فقط مدیر؛ client_id در Secret با نام JAMENDO_ID)
    if(!authed(r,e))return J({error:'unauthorized'},401);
    if(!e.JAMENDO_ID)return J({error:'no_client_id'},400);
    const safe=x=>/^https?:\/\//.test(x||'')?x:'',z=n=>String(Math.floor(n)).padStart(2,'0'),
      lic=x=>{const m=/licenses\/([a-z-]+)\/([\d.]+)/.exec(x||'');return m?'CC '+m[1].toUpperCase()+' '+m[2]:''};
    const url='https://api.jamendo.com/v3.0/tracks/?'+new URLSearchParams({client_id:e.JAMENDO_ID,format:'json',limit:'20',search:u.searchParams.get('q')||'',audioformat:'mp32',audiodlformat:'mp32',imagesize:'300'});
    let j;try{j=await(await fetch(url)).json()}catch{return J({error:'jamendo_failed'},502)}
    if(!j.results)return J({error:(j.headers&&j.headers.error_message)||'jamendo_failed'},502);
    return J({results:j.results.map(t=>({title:t.name,artist:t.artist_name,album:t.album_name||'',cover:safe(t.image),audio:safe(t.audio),
      duration:z(t.duration/60)+':'+z(t.duration%60),releaseDate:t.releasedate||'',downloadAllowed:!!(t.audiodownload_allowed&&t.audiodownload),
      downloadUrl:t.audiodownload_allowed?safe(t.audiodownload):'',license:lic(t.license_ccurl),licenseUrl:safe(t.license_ccurl),sourceUrl:safe(t.shareurl),source:'Jamendo'}))})}
  if(p[1]==='gh'){ // به‌روزرسانی سایت و پشتیبان‌گیری از پنل (فقط مدیر)
    if(!authed(r,e))return J({error:'unauthorized'},401);
    if(!e.GITHUB_TOKEN||!e.GH_REPO)return J({error:'no_github'},400);
    try{
      if(p[2]==='commit'&&r.method==='POST'){const b=await r.json();
        if(!Array.isArray(b.files)||!b.files.length||b.files.length>40)return J({error:'bad files'},400);
        return J({ok:1,url:await ghCommit(e,b.files,String(b.message||'Update from Muzio admin').slice(0,200))})}
      if(p[2]==='backup'&&r.method==='POST'){const sg=await load(e),art=(await e.KV.get('artists','json'))||{};
        return J({ok:1,url:await ghCommit(e,[{path:'data/songs.json',text:JSON.stringify(sg.map(({plays,...s})=>s),null,1)},{path:'data/artists.json',text:JSON.stringify(art,null,1)}],'Backup data from Muzio admin')})}
    }catch(err){return J({error:String(err.message||err)},502)}}
  const songs=await load(e),by=k=>[...new Set(songs.map(s=>s[k]))];
  if(r.method==='GET'&&p[1]!=='import'){
    const pl=(await e.KV.get('plays','json',{cacheTtl:60}))||{};songs.forEach(s=>s.plays=pl[s.id]||0);
    if(p[1]==='songs'){const s=songs.find(x=>x.id==p[2]);return p[2]?(s?J(s):J({error:'not found'},404)):J(songs)}
    if(p[1]==='search'){const q=(u.searchParams.get('q')||'').toLowerCase();return J(songs.filter(s=>[s.title,s.artist,s.album].some(f=>(f||'').toLowerCase().includes(q))))}
    if(p[1]==='artists')return J(by('artist').map((n,i)=>({id:i+1,name:n})));
    if(p[1]==='categories')return J(by('category'));
    if(p[1]==='latest')return J([...songs].sort((a,b)=>b.releaseDate.localeCompare(a.releaseDate)).slice(0,20));
    if(p[1]==='popular')return J([...songs].filter(s=>s.plays||s.popular).sort((a,b)=>(b.plays-a.plays)||((b.popular?1:0)-(a.popular?1:0))).slice(0,50));
  }
  if(!authed(r,e))return J({error:'unauthorized'},401); // مسیرهای مدیریتی
  if(p[1]==='import'&&IMPORTERS[p[2]])return J({preview:await IMPORTERS[p[2]](u.searchParams.get('url'))}); // فقط Preview
  if(r.method==='POST'&&p[1]==='songs'){const b=await r.json(),add=Array.isArray(b)?b:[b];let n=0;
    for(const s of add){if(!s.title||!s.artist)continue;const i=songs.findIndex(x=>x.id==s.id||(x.title===s.title&&x.artist===s.artist));
      if(i>=0)songs[i]={...songs[i],...s};else{s.id=s.id||Math.max(0,...songs.map(x=>x.id))+1;s.addedAt=new Date().toISOString();songs.push(s);n++}}
    await e.KV.put('songs',JSON.stringify(songs));return J({added:n,total:songs.length})}
  if(r.method==='DELETE'&&p[1]==='songs'){const d=songs.find(x=>x.id==p[2]);for(const k of['audio','cover']){const q=((d||{})[k]||'').match(/\/api\/file\/([\w.]+)$/);if(q)await e.KV.delete('f:'+q[1])}await e.KV.put('songs',JSON.stringify(songs.filter(s=>s.id!=p[2])));return J({ok:1})}
  return J({error:'not found'},404)}};
