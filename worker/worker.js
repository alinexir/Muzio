// Cloudflare Worker: API + Importer. Secret: ADMIN_TOKEN. Binding: KV. Var: DATA_URL (آدرس songs.json روی GitHub Pages)
const H={'content-type':'application/json;charset=utf-8','access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,DELETE,OPTIONS'};
const J=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:H});
const load=async e=>(await e.KV.get('songs','json'))||(await fetch(e.DATA_URL)).json();
const authed=(r,e)=>e.ADMIN_TOKEN&&r.headers.get('authorization')==='Bearer '+e.ADMIN_TOKEN;
// منابع Import: فقط API/RSS رسمی و مجاز. برای منبع جدید یک تابع به این شیء اضافه کنید.
const IMPORTERS={
  source1:async url=>{const t=await(await fetch(url)).text();
    if(/^\s*[\[{]/.test(t)){const j=JSON.parse(t);return(j.songs||j).map(x=>({title:x.title,artist:x.artist,album:x.album||'',cover:x.cover||'',audio:x.audio||'',duration:x.duration||'',releaseDate:x.releaseDate||'',category:x.category||'',downloadAllowed:!!x.downloadAllowed}))}
    const tag=(s,n)=>(s.match(new RegExp('<'+n+'[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</'+n+'>'))||[])[1]||'';
    return[...t.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m=>({title:tag(m[1],'title'),artist:tag(m[1],'author')||tag(m[1],'dc:creator'),album:'',cover:'',audio:(m[1].match(/enclosure[^>]*url="([^"]+)"/)||[])[1]||'',duration:'',releaseDate:new Date(tag(m[1],'pubDate')||Date.now()).toISOString().slice(0,10),category:tag(m[1],'category'),downloadAllowed:false}))}
};
export default{async fetch(r,e){
  if(r.method==='OPTIONS')return new Response(null,{headers:H});
  const u=new URL(r.url),p=u.pathname.split('/').filter(Boolean);if(p[0]!=='api')return J({error:'not found'},404);
  if(r.method==='GET'&&p[1]==='file'){ // پخش فایل‌های آپلودشده (با پشتیبانی از Range برای جلو/عقب کردن)
    const {value:buf,metadata:m}=await e.KV.getWithMetadata('f:'+p[2],{type:'arrayBuffer',cacheTtl:3600});
    if(!buf)return J({error:'not found'},404);const n=buf.byteLength;
    const h={'content-type':(m&&m.type)||'application/octet-stream','accept-ranges':'bytes','cache-control':'public,max-age=86400','access-control-allow-origin':'*','x-content-type-options':'nosniff'};
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
  const songs=await load(e),by=k=>[...new Set(songs.map(s=>s[k]))];
  if(r.method==='GET'&&p[1]!=='import'){
    if(p[1]==='songs'){const s=songs.find(x=>x.id==p[2]);return p[2]?(s?J(s):J({error:'not found'},404)):J(songs)}
    if(p[1]==='search'){const q=(u.searchParams.get('q')||'').toLowerCase();return J(songs.filter(s=>[s.title,s.artist,s.album].some(f=>(f||'').toLowerCase().includes(q))))}
    if(p[1]==='artists')return J(by('artist').map((n,i)=>({id:i+1,name:n})));
    if(p[1]==='categories')return J(by('category'));
    if(p[1]==='latest')return J([...songs].sort((a,b)=>b.releaseDate.localeCompare(a.releaseDate)).slice(0,20));
    if(p[1]==='popular')return J(songs.filter(s=>s.popular));
  }
  if(!authed(r,e))return J({error:'unauthorized'},401); // مسیرهای مدیریتی
  if(p[1]==='import'&&IMPORTERS[p[2]])return J({preview:await IMPORTERS[p[2]](u.searchParams.get('url'))}); // فقط Preview
  if(r.method==='POST'&&p[1]==='songs'){const b=await r.json(),add=Array.isArray(b)?b:[b];let n=0;
    for(const s of add){if(!s.title||!s.artist)continue;const i=songs.findIndex(x=>x.id==s.id||(x.title===s.title&&x.artist===s.artist));
      if(i>=0)songs[i]={...songs[i],...s};else{s.id=s.id||Math.max(0,...songs.map(x=>x.id))+1;songs.push(s);n++}}
    await e.KV.put('songs',JSON.stringify(songs));return J({added:n,total:songs.length})}
  if(r.method==='DELETE'&&p[1]==='songs'){const d=songs.find(x=>x.id==p[2]);for(const k of['audio','cover']){const q=((d||{})[k]||'').match(/\/api\/file\/([\w.]+)$/);if(q)await e.KV.delete('f:'+q[1])}await e.KV.put('songs',JSON.stringify(songs.filter(s=>s.id!=p[2])));return J({ok:1})}
  return J({error:'not found'},404)}};
