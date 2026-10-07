// پلیر: صف پخش، کنترل‌ها، پخش خودکار آهنگ بعدی
const $=id=>document.getElementById(id), fmt=s=>isFinite(s)?Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0'):'0:00';
export class Player{
  constructor(){this.a=new Audio();this.q=[];this.i=0;const a=this.a;
    $('pPlay').onclick=()=>a.paused?a.play():a.pause();
    $('pNext').onclick=()=>this.step(1);$('pPrev').onclick=()=>this.step(-1);
    $('pVol').oninput=e=>a.volume=e.target.value;
    $('pBar').oninput=e=>a.duration&&(a.currentTime=e.target.value/100*a.duration);
    $('pToggle').onclick=()=>$('player').classList.toggle('min');
    a.onplay=a.onpause=()=>$('pPlay').textContent=a.paused?'▶':'⏸';
    a.ontimeupdate=()=>{$('pCur').textContent=fmt(a.currentTime);$('pDur').textContent=fmt(a.duration);a.duration&&($('pBar').value=a.currentTime/a.duration*100)};
    a.onended=()=>this.step(1);
  }
  play(queue,i){this.q=queue;this.i=i;const s=queue[i];if(!s?.audio)return;
    $('player').hidden=false;$('player').classList.remove('min');
    $('pCover').src=s.cover||'';$('pTitle').textContent=s.title;$('pArtist').textContent=s.artist;
    this.a.src=s.audio;this.a.play().catch(()=>{})}
  step(d){if(this.q.length)this.play(this.q,(this.i+d+this.q.length)%this.q.length)}
}
