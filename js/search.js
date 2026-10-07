// جستجوی سریع در نام آهنگ، خواننده و آلبوم (بدون بارگذاری مجدد)
const norm=s=>(s||'').toLowerCase().replace(/ي/g,'ی').replace(/ك/g,'ک').trim();
export const searchSongs=(songs,q)=>{q=norm(q);return q?songs.filter(s=>[s.title,s.artist,s.album].some(f=>norm(f).includes(q))):[]};
export const debounce=(f,ms=200)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>f(...a),ms)}};
