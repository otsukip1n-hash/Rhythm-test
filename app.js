(()=>{
const K='tempochk.v1.',$=s=>document.querySelector(s);
const ld=(k,d)=>{try{const v=localStorage.getItem(K+k);return v===null?d:JSON.parse(v)}catch(e){return d}};
const sv=(k,v)=>{try{localStorage.setItem(K+k,JSON.stringify(v))}catch(e){}};
const S={mode:ld('mode','challenge'),target:ld('target',170),tol:ld('tol',10),goal:ld('goal',60),meter:ld('meter',4),snd:ld('snd',true)};
const NAMES={challenge:'チャレンジ',measure:'テンポ計測',compare:'目標と比べる',metro:'メトロノーム'};
const COL=['#ff8fab','#7fd8be','#7cc6f2','#ffd36e','#c9b6ff','#ffab76','#9be37f','#f5a3e0'];
let taps=[],bpm=0,startT=null,cleared=false,run=false,timer=0,next=0,ac=null,beat=0,mstart=0,mivl=0,nd=0;
const clamp=v=>Math.max(30,Math.min(300,Math.round(v)||170));
const show=(s,v)=>$(s).style.display=v?'':'none';
function calc(n){const t=taps.slice(-n);if(t.length<2)return 0;return 60000/((t[t.length-1]-t[0])/(t.length-1))}
function reset(){taps=[];bpm=0;startT=null;cleared=false;stopMetro();render()}
function setMode(m){S.mode=m;sv('mode',m);reset();document.querySelectorAll('#modes button').forEach(b=>b.classList.toggle('on',b.dataset.m===m))}
function gauge(){
  const n=$('#needle');
  if(!bpm){n.style.left='50%';n.style.opacity='.25';return}
  const d=bpm-S.target;n.style.opacity='1';
  n.style.left=Math.max(3,Math.min(97,50+d/(4*S.tol)*100))+'%';
  n.style.background=Math.abs(d)<=S.tol?'#2fbf94':'#ff6b8e';
}
function dots(){
  const d=$('#dots');if(d.children.length===S.meter)return;
  d.innerHTML='';for(let i=0;i<S.meter;i++){const s=document.createElement('span');s.style.setProperty('--c',COL[i%8]);d.appendChild(s)}
}
function render(){
  const m=S.mode,big=$('#big'),sub=$('#sub');
  $('#title').textContent=NAMES[m]+(m==='challenge'?`（${S.goal}秒キープ）`:'');
  show('#rTarget',m!=='measure');show('#rOpt',m!=='measure');
  show('#gTol',m==='challenge'||m==='compare');show('#gGoal',m==='challenge');
  show('#gMeter',m==='metro');show('#gSnd',m==='metro');
  show('#bar',m==='challenge');show('#gauge',m==='challenge'||m==='compare');
  show('#pend',m==='metro');show('#dots',m==='metro');
  $('#lblT').textContent=m==='metro'?'テンポ':'目標';
  $('#tv').value=S.target;$('#tol').value=S.tol;$('#gv').value=S.goal;$('#mt').value=S.meter;$('#snd').checked=S.snd;
  $('#gc').textContent=S.target;$('#zone').style.display='';
  big.style.fontSize=m==='metro'?'48px':'';
  const tp=$('#tap');
  if(m==='metro'){dots();tp.textContent=run?'STOP':'START';big.textContent=S.target;sub.textContent=`BPM ／ ${S.meter}拍子　ボタンで開始/停止`;return}
  tp.textContent='TAP';gauge();
  if(!bpm){big.textContent='--';sub.textContent=m==='challenge'?`${S.target-S.tol}〜${S.target+S.tol} BPMで${S.goal}秒キープ`:m==='compare'?`許容 ±${S.tol} BPM`:'リズムに合わせてタップ';$('#fill').style.width='0';return}
  const b=Math.round(bpm),d=b-S.target;
  if(m==='measure'){big.textContent=b;sub.textContent=`BPM（直近${Math.min(taps.length,8)}タップの平均）`}
  else if(m==='compare'){big.textContent=Math.abs(bpm-S.target)<=S.tol?'範囲内':d>0?'速い':'遅い';sub.textContent=`現在 ${b} BPM ／ 目標 ${S.target}（${d>0?'+':''}${d}）`}
  else{big.textContent=b;if(!cleared&&!startT)sub.textContent=(d>0?'⏩ 速すぎ':'⏪ 遅すぎ')+`（${d>0?'+':''}${d} BPM）`}
}
function loop(){
  const now=performance.now();
  if(S.mode==='challenge'&&!cleared){
    const lim=60000/Math.max(20,S.target-S.tol)*2,G=S.goal*1000;
    if(taps.length&&now-taps[taps.length-1]>lim){startT=null;bpm=0;taps=[];render()}
    const el=startT?now-startT:0;
    $('#fill').style.width=Math.min(100,el/G*100)+'%';
    if(startT){$('#sub').textContent=`✅ 範囲内！継続 ${(el/1000).toFixed(1)} / ${S.goal} 秒`;
      if(el>=G){cleared=true;startT=null;win()}}
  }
  if(S.mode==='metro'){$('#rod').style.transform=run?`rotate(${28*Math.cos(Math.PI*(now-mstart)/mivl)}deg)`:'rotate(0deg)'}
  requestAnimationFrame(loop);
}
function win(){
  $('#fill').style.width='100%';$('#sub').textContent=`🎉 ${S.goal}秒クリア！`;
  $('#clear p').textContent=`${S.target}±${S.tol} BPMを${S.goal}秒キープ！チューニング完了`;
  $('#clear').hidden=false;if(navigator.vibrate)navigator.vibrate([80,60,80,60,200]);
  const e=['🎉','✨','🌸','⭐','💖','🎵'];
  for(let i=0;i<50;i++){const s=document.createElement('span');s.className='c';s.textContent=e[i%6];
    s.style.left=Math.random()*100+'vw';s.style.animationDuration=(2+Math.random()*2.5)+'s';s.style.animationDelay=Math.random()*.8+'s';
    document.body.appendChild(s);setTimeout(()=>s.remove(),5500)}
}
function click(i){
  if(!S.snd||!ac)return;try{
  const o=ac.createOscillator(),g=ac.createGain(),acc=i===0&&S.meter>1;
  o.type=acc?'triangle':'sine';o.frequency.value=acc?1500:i%2?900:1050;
  g.gain.setValueAtTime(acc?.5:.3,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+(acc?.12:.07));
  o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+.13)}catch(e){}
}
function tick(){
  const i=beat%S.meter,t=$('#tap'),c=COL[i%8];beat++;
  t.style.setProperty('--bc',c);$('#rod').style.setProperty('--bc',c);$('#rod i').style.setProperty('--bc',c);
  t.classList.add('beat');setTimeout(()=>t.classList.remove('beat'),110);
  const ds=$('#dots').children;for(let k=0;k<ds.length;k++)ds[k].classList.toggle('on',k===i);
  click(i);next+=mivl;timer=setTimeout(tick,Math.max(0,next-performance.now()));
}
function startMetro(){
  try{if(S.snd){ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume()}}catch(e){}
  run=true;beat=0;mivl=60000/S.target;mstart=next=performance.now();tick();render()}
function stopMetro(){run=false;clearTimeout(timer);$('#tap').classList.remove('beat');const ds=$('#dots').children;for(let k=0;k<ds.length;k++)ds[k].classList.remove('on')}
function restartMetro(){if(run){stopMetro();startMetro()}}
$('#tap').addEventListener('pointerdown',e=>{
  e.preventDefault();
  if(S.mode==='metro'){run?(stopMetro(),render()):startMetro();return}
  if(cleared)return;
  const now=performance.now();
  if(taps.length&&now-taps[taps.length-1]>2500)taps=[];
  taps.push(now);if(taps.length>8)taps.shift();
  bpm=calc(S.mode==='challenge'?5:8);
  if(S.mode==='challenge'){if(bpm&&Math.abs(bpm-S.target)<=S.tol){if(!startT)startT=now}else startT=null}
  if(navigator.vibrate)navigator.vibrate(8);
  render();
});
$('#modes').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setMode(b.dataset.m)});
function setT(v){S.target=clamp(v);sv('target',S.target);startT=null;restartMetro();render()}
$('#tm').onclick=()=>setT(S.target-1);$('#tp').onclick=()=>setT(S.target+1);
$('#tv').onchange=e=>setT(e.target.value);
$('#tol').onchange=e=>{S.tol=+e.target.value;sv('tol',S.tol);startT=null;render()};
$('#gv').onchange=e=>{S.goal=Math.max(5,Math.min(600,Math.round(e.target.value)||60));sv('goal',S.goal);startT=null;render()};
$('#mt').onchange=e=>{S.meter=+e.target.value;sv('meter',S.meter);restartMetro();render()};
$('#snd').onchange=e=>{S.snd=e.target.checked;sv('snd',S.snd)};
$('#clear').onclick=()=>{$('#clear').hidden=true;reset()};
document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('visibilitychange',()=>{if(document.hidden&&run){stopMetro();render()}});
if('serviceWorker' in navigator&&location.protocol==='https:'){navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{})}
setMode(S.mode);loop();
})();
