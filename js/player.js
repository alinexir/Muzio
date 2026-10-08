// پلیر: صف پخش، حالت مینی، کاور بزرگ، موج نئونی، اشتراک‌گذاری
const $=id=>document.getElementById(id),fmt=s=>isFinite(s)?Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0'):'0:00';
export const DEF='images/default-cover.jpg';
export const cv=s=>(!s.cover||/cover1\.svg$/.test(s.cover))?DEF:s.cover;
const ic=d=>`<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="${d}"/></svg>`;
const PLAY=ic('M8 5v14l11-7z'),PAUSE=ic('M6 5h4v14H6zM14 5h4v14h-4z');
const fill=(el,p)=>el.style.setProperty('--p',p+'%');
const img=(el,src)=>{el.onerror=()=>{el.onerror=null;el.src=DEF};el.src=src};
export function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.append(d);setTimeout(()=>d.remove(),2200)}
export async function share(s){ // اشتراک‌گذاری لینک آهنگ (منوی اشتراک گوشی، یا کپی لینک)
  if(!s)return;const url=location.origin+location.pathname+'#/song/'+s.id;
  try{if(navigator.share)await navigator.share({title:s.title+' - '+s.artist,text:'گوش بده: '+s.title+' - '+s.artist,url});
    else{await navigator.clipboard.writeText(url);toast('لینک کپی شد')}}catch{}}
export class Player{
  constructor(api){this.api=api?new URL(api).origin:'';this.q=[];this.i=0;this.vol=1;this.bind(new Audio());
    $('pPlay').onclick=()=>this.a.paused?this.a.play():this.a.pause();
    $('pNext').onclick=()=>this.step(1);$('pPrev').onclick=()=>this.step(-1);
    $('pVol').oninput=e=>{this.vol=+e.target.value;this.a.volume=this.vol;fill(e.target,this.vol*100)};fill($('pVol'),100);
    $('pBar').oninput=e=>{const a=this.a;a.duration&&(a.currentTime=e.target.value/100*a.duration);fill(e.target,e.target.value)};
    $('pToggle').onclick=()=>$('player').classList.toggle('min');
    const open=()=>{if(!this.q.length)return;$('np').hidden=false;this.connect();this.loop()},close=()=>$('np').hidden=true;
    $('pCover').onclick=open;document.querySelector('.meta').onclick=open;
    $('npX').onclick=close;$('np').onclick=e=>{if(e.target.id==='np'||e.target.id==='npBg')close()};
    $('npS').onclick=()=>share(this.q[this.i]);
    addEventListener('keydown',e=>e.key==='Escape'&&close());
  }
  bind(a){this.a=a;a.volume=this.vol;
    a.onplay=a.onpause=()=>{$('pPlay').innerHTML=a.paused?PLAY:PAUSE;$('player').classList.toggle('playing',!a.paused);a._viz&&a._viz.C.resume();this.loop()};
    a.ontimeupdate=()=>{$('pCur').textContent=fmt(a.currentTime);$('pDur').textContent=fmt(a.duration);if(a.duration){const p=a.currentTime/a.duration*100;$('pBar').value=p;fill($('pBar'),p)}};
    a.onended=()=>this.step(1);
    a.onerror=()=>{if(a.crossOrigin&&!a._viz&&!a._retry){a._retry=1;a.removeAttribute('crossorigin');a.src=this.q[this.i].audio;a.play().catch(()=>{})}}}
  trusted(u){try{const o=new URL(u,location.href).origin;return o===location.origin||(this.api&&o===this.api)}catch{return false}}
  play(queue,i){this.q=queue;this.i=i;const s=queue[i];if(!s?.audio)return;const ok=this.trusted(s.audio);
    if(!ok&&this.a._viz){const o=this.a;o.pause();o.onplay=o.onpause=o.ontimeupdate=o.onended=o.onerror=null;this.bind(new Audio())}
    const a=this.a;a._retry=0;ok?a.crossOrigin='anonymous':a.removeAttribute('crossorigin');
    const src=cv(s);$('player').hidden=false;img($('pCover'),src);img($('npImg'),src);$('npBg').style.backgroundImage=`url("${src}")`;
    $('pTitle').textContent=$('npT').textContent=s.title;$('pArtist').textContent=$('npA').textContent=s.artist;
    a.src=s.audio;a.play().catch(()=>{})}
  step(d){if(this.q.length)this.play(this.q,(this.i+d+this.q.length)%this.q.length)}
  connect(){const a=this.a; // اتصال آنالایزر فقط وقتی کاور بزرگ باز می‌شود و منبع CORS دارد
    if(a._viz||!a.crossOrigin||a._retry)return;
    try{const C=new(window.AudioContext||window.webkitAudioContext)(),s=C.createMediaElementSource(a),an=C.createAnalyser();an.fftSize=128;s.connect(an);an.connect(C.destination);a._viz={C,an,arr:new Uint8Array(an.frequencyBinCount)}}catch{}}
  loop(){cancelAnimationFrame(this.r);const run=()=>{if($('np').hidden||this.a.paused)return;this.draw();this.r=requestAnimationFrame(run)};run()}
  draw(){const c=$('viz'),g=c.getContext('2d'),d=devicePixelRatio||1,w=c.clientWidth*d,h=c.clientHeight*d;
    if(c.width!==w)c.width=w;if(c.height!==h)c.height=h;g.clearRect(0,0,w,h);
    const N=36,bw=w/N,z=this.a._viz,t=performance.now();if(z)z.an.getByteFrequencyData(z.arr);
    const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#00f0ff');gr.addColorStop(.5,'#8a5cff');gr.addColorStop(1,'#ff2bd6');
    g.fillStyle=gr;g.shadowColor='#8a5cff';g.shadowBlur=12*d;
    for(let i=0;i<N;i++){ // اگر آنالایزر نیست، حرکت نرم جایگزین نمایش داده می‌شود
      const v=z?z.arr[Math.floor(i*z.arr.length*.75/N)]/255:(Math.sin(t/260+i*.55)+Math.sin(t/410+i*.31)+2)/4,bh=Math.max(4*d,v*h);
      g.beginPath();g.roundRect?g.roundRect(i*bw+bw*.2,(h-bh)/2,bw*.6,bh,bw*.3):g.rect(i*bw+bw*.2,(h-bh)/2,bw*.6,bh);g.fill()}}
}
