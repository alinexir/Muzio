// پلیر: صف پخش، کنترل‌ها، آیکون‌های SVG، پخش خودکار آهنگ بعدی
const $=id=>document.getElementById(id),fmt=s=>isFinite(s)?Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0'):'0:00';
const ic=d=>`<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="${d}"/></svg>`;
const PLAY=ic('M8 5v14l11-7z'),PAUSE=ic('M6 5h4v14H6zM14 5h4v14h-4z');
const fill=(el,p)=>el.style.setProperty('--p',p+'%');
export class Player{
  constructor(){this.a=new Audio();this.q=[];this.i=0;const a=this.a;
    $('pPlay').onclick=()=>a.paused?a.play():a.pause();
    $('pNext').onclick=()=>this.step(1);$('pPrev').onclick=()=>this.step(-1);
    $('pVol').oninput=e=>{a.volume=e.target.value;fill(e.target,e.target.value*100)};fill($('pVol'),100);
    $('pBar').oninput=e=>{a.duration&&(a.currentTime=e.target.value/100*a.duration);fill(e.target,e.target.value)};
    $('pToggle').onclick=()=>$('player').classList.toggle('min');
    const st=()=>{$('pPlay').innerHTML=a.paused?PLAY:PAUSE;$('player').classList.toggle('playing',!a.paused)};
    a.onplay=a.onpause=st;
    a.ontimeupdate=()=>{$('pCur').textContent=fmt(a.currentTime);$('pDur').textContent=fmt(a.duration);if(a.duration){const p=a.currentTime/a.duration*100;$('pBar').value=p;fill($('pBar'),p)}};
    a.onended=()=>this.step(1); // پخش خودکار بعدی
  }
  play(queue,i){this.q=queue;this.i=i;const s=queue[i];if(!s?.audio)return;
    $('player').hidden=false;$('player').classList.remove('min');
    $('pCover').src=s.cover||'';$('pTitle').textContent=s.title;$('pArtist').textContent=s.artist;
    this.a.src=s.audio;this.a.play().catch(()=>{})}
  step(d){if(this.q.length)this.play(this.q,(this.i+d+this.q.length)%this.q.length)}
}
