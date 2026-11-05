/* Page controller and accessible unified keyboard/touch/pointer input. */
(function(){
'use strict';
const RA=window.RetroArcade;
const config={
  space:{name:'غزاة الفضاء',english:'SPACE SHOOTER',description:'حرّك المركبة، أطلق النار على الغزاة وتفادَ قذائفهم.',guide:'دافع عن الأرض',guideText:'تقدّم الغزاة أسرع مع كل موجة. حافظ على محاولاتك وحطّم الرقم القياسي.',keys:'<div><kbd>←</kbd><kbd>→</kbd><span>التحريك</span></div><div><kbd class="wide-key">SPACE</kbd><span>إطلاق النار</span></div>',action:'إطلاق',class:RA.SpaceGame},
  breakout:{name:'تحطيم الطوب',english:'BREAKOUT',description:'حرّك المضرب لتعيد الكرة إلى الطوب. لا تدع الكرة تسقط!',guide:'احمِ الكرة',guideText:'حطّم جميع الطوب لفتح الموجة التالية. يتغير اتجاه الكرة بحسب مكان ملامستها للمضرب.',keys:'<div><kbd>←</kbd><kbd>→</kbd><span>تحريك المضرب</span></div><div><kbd class="wide-key">SPACE</kbd><span>إطلاق الكرة</span></div>',action:'إطلاق',class:RA.BreakoutGame},
  maze:{name:'المتاهة',english:'MAZE CHASE',description:'اجمع كل النقاط، وتفادَ المطاردين. النقاط الكبيرة تمنحك قوة مؤقتة!',guide:'اعرف طريقك',guideText:'اجمع النقاط الصغيرة والكبيرة. عندما تتناول نقطة كبيرة يمكنك اصطياد المطاردين لفترة وجيزة.',keys:'<div><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd><span>التحريك</span></div><div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>بديل</span></div>',action:'',class:RA.MazeGame}
};
const get=id=>document.getElementById(id);
const canvas=get('gameCanvas'),ctx=canvas.getContext('2d',{alpha:false});
if(!ctx){get('overlayDescription').textContent='تعذر تشغيل Canvas في هذا المتصفح.';get('startButton').disabled=true;return;}
const sound=new RA.Audio();let kind='space',game=null,status='ready',prevTs=0,lastUI=-1,finishedRecorded=false;
const activeKeys=new Set(),virtualKeys=new Set();
const input={pointerX:null,pointerActive:false,direction:null,
 get left(){return activeKeys.has('left')||virtualKeys.has('left');},
 get right(){return activeKeys.has('right')||virtualKeys.has('right');},
 get up(){return activeKeys.has('up')||virtualKeys.has('up');},
 get down(){return activeKeys.has('down')||virtualKeys.has('down');},
 get fire(){return activeKeys.has('fire')||virtualKeys.has('fire');}
};
const dirs={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',a:'left',d:'right',w:'up',s:'down',' ':'fire'};
window.addEventListener('keydown',e=>{const key=e.key.length===1?e.key.toLowerCase():e.key;const action=dirs[key];if(action){e.preventDefault();activeKeys.add(action);if(action!=='fire')input.direction=action;if(status==='ready'&&action==='fire')startGame();return;}if(key==='Enter'&&status==='ready'){e.preventDefault();startGame();}if((key==='Escape'||key==='p')&&(status==='running'||status==='paused')){e.preventDefault();togglePause();}if(key==='r'&&e.ctrlKey===false&&e.metaKey===false){e.preventDefault();resetGame();}});
window.addEventListener('keyup',e=>{const key=e.key.length===1?e.key.toLowerCase():e.key;const action=dirs[key];if(action){e.preventDefault();activeKeys.delete(action);}});
window.addEventListener('blur',()=>{activeKeys.clear();virtualKeys.clear();input.pointerActive=false;if(status==='running')togglePause();});
const statusTexts={ready:'جاهز للعب',running:'الجولة جارية',paused:'متوقف مؤقتًا',gameover:'انتهت الجولة'};
function setStatus(value){status=value;get('statusText').textContent=statusTexts[value];get('gameStatus').className='game-status '+(value==='gameover'?'gameover':value==='paused'?'paused':value==='running'?'running':'');get('pauseButton').disabled=!(value==='running'||value==='paused');get('pauseLabel').textContent=value==='paused'?'متابعة':'إيقاف مؤقت';get('pauseIcon').textContent=value==='paused'?'▶':'Ⅱ';}
function showOverlay(title,desc,buttonText,subtitle){get('overlayTitle').textContent=title;get('overlayDescription').textContent=desc;get('startButton').innerHTML=buttonText+' <span aria-hidden="true">←</span>';get('overlaySubtitle').textContent=subtitle||config[kind].english;get('gameOverlay').classList.remove('hidden');}
function hideOverlay(){get('gameOverlay').classList.add('hidden');}
function resetInput(){activeKeys.clear();virtualKeys.clear();input.direction=null;input.pointerX=null;input.pointerActive=false;document.querySelectorAll('.control-btn,.action-btn').forEach(el=>el.classList.remove('pressed'));}
function selectGame(id){if(!config[id])return;kind=id;const c=config[kind];game=new c.class((effect)=>sound.tone(effect));finishedRecorded=false;lastUI=-1;resetInput();setStatus('ready');get('playingTitle').textContent=c.name;get('guideTitle').textContent=c.guide;get('guideDescription').textContent=c.guideText;get('controlGuide').innerHTML=c.keys;get('actionLabel').textContent=c.action;get('touchControls').classList.toggle('no-fire',id==='maze');get('touchControls').classList.toggle('horizontal-only',id!=='maze');get('overlayHint').textContent=id==='maze'?'استخدم الأسهم أو WASD للتحريك':'للحاسوب: Enter أو Space للبدء';showOverlay('هل أنت مستعد؟',c.description,'ابدأ اللعب');document.querySelectorAll('.game-card').forEach(btn=>{const selected=btn.dataset.game===kind;btn.classList.toggle('selected',selected);btn.setAttribute('aria-pressed',String(selected));});updateUI();game.render(ctx);}
function startGame(){if(status==='running')return;if(status==='gameover'){resetGame();}setStatus('running');hideOverlay();sound.tone('start');canvas.focus({preventScroll:true});}
function togglePause(){if(status==='running'){setStatus('paused');showOverlay('استراحة قصيرة','اللعبة متوقفة. نقاطك ومحاولاتك محفوظة في هذه الجولة.','متابعة اللعب','PAUSED');}else if(status==='paused'){setStatus('running');hideOverlay();canvas.focus({preventScroll:true});}}
function resetGame(){game.reset();finishedRecorded=false;resetInput();lastUI=-1;setStatus('ready');showOverlay('جولة جديدة',config[kind].description,'ابدأ اللعب');updateUI();game.render(ctx);}
function finishGame(){if(finishedRecorded)return;finishedRecorded=true;const stats=RA.storage.read(kind);stats.rounds=(Number(stats.rounds)||0)+1;stats.best=Math.max(Number(stats.best)||0,game.score);RA.storage.save(kind,stats);setStatus('gameover');showOverlay('انتهت الجولة',`حققت ${game.score.toLocaleString('en-US')} نقطة. يمكنك المحاولة مجددًا لتحطيم رقمك القياسي.`,'العب من جديد','GAME OVER');sound.tone('lose');updateUI();}
function updateUI(){const stats=RA.storage.read(kind);const score=game.score||0,best=Math.max(stats.best||0,score);get('scoreDisplay').textContent=String(score).padStart(6,'0');get('bestDisplay').textContent=String(best).padStart(6,'0');get('levelDisplay').textContent=String(game.level).padStart(2,'0');get('livesDisplay').textContent='♥ '.repeat(Math.max(0,game.lives)).trim()||'—';get('recordBig').textContent=String(best).padStart(6,'0');get('roundsDisplay').textContent=String(stats.rounds||0);}
function frame(time){if(prevTs===0)prevTs=time;const dt=Math.min(.045,(time-prevTs)/1000);prevTs=time;if(game){if(status==='running'){game.update(dt,input);if(game.over)finishGame();}game.render(ctx);if(time-lastUI>90){updateUI();lastUI=time;}}requestAnimationFrame(frame);}
// Choice buttons, toolbar, and full-screen controls.
document.querySelectorAll('.game-card').forEach(el=>el.addEventListener('click',()=>selectGame(el.dataset.game)));
get('startButton').addEventListener('click',startGame);get('pauseButton').addEventListener('click',togglePause);get('restartButton').addEventListener('click',resetGame);
get('soundToggle').addEventListener('click',()=>{sound.setEnabled(!sound.enabled);get('soundToggle').setAttribute('aria-pressed',String(sound.enabled));get('soundToggle').setAttribute('aria-label',sound.enabled?'إيقاف المؤثرات الصوتية':'تشغيل المؤثرات الصوتية');if(sound.enabled)sound.tone('start');});
get('fullscreenButton').addEventListener('click',async()=>{const el=document.querySelector('.game-area');try{if(document.fullscreenElement)await document.exitFullscreen();else if(el.requestFullscreen)await el.requestFullscreen();else if(el.webkitRequestFullscreen)el.webkitRequestFullscreen();}catch{ /* Unsupported or blocked: leave the game running normally. */ }});
// Pointer controls: paddle follows touch/mouse; spaceship follows drag. Mobile swipes steer the maze.
let pointerStart=null;
function pointerX(e){const rect=canvas.getBoundingClientRect();return RA.clamp((e.clientX-rect.left)/rect.width*RA.W,0,RA.W);}
function pointerY(e){const rect=canvas.getBoundingClientRect();return RA.clamp((e.clientY-rect.top)/rect.height*RA.H,0,RA.H);}
canvas.addEventListener('pointerdown',e=>{e.preventDefault();pointerStart={x:pointerX(e),y:pointerY(e),id:e.pointerId};input.pointerX=pointerStart.x;input.pointerActive=true;try{canvas.setPointerCapture(e.pointerId);}catch{}if(status==='ready')startGame();else if(status==='running'&&kind==='breakout')game.launch();});
canvas.addEventListener('pointermove',e=>{if(kind==='breakout'||(input.pointerActive&&kind==='space'))input.pointerX=pointerX(e);if(pointerStart&&kind==='maze'){const dx=pointerX(e)-pointerStart.x,dy=pointerY(e)-pointerStart.y;if(Math.hypot(dx,dy)>27){input.direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';pointerStart.x=pointerX(e);pointerStart.y=pointerY(e);}}});
function endPointer(e){if(pointerStart?.id===e.pointerId)pointerStart=null;input.pointerActive=false;}
canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',endPointer);canvas.addEventListener('lostpointercapture',endPointer);
// Virtual buttons hold direction while touched. setPointerCapture keeps release events reliable.
for(const button of document.querySelectorAll('[data-control]')){const control=button.dataset.control;const release=()=>{virtualKeys.delete(control);button.classList.remove('pressed');};button.addEventListener('pointerdown',e=>{e.preventDefault();virtualKeys.add(control);button.classList.add('pressed');if(control!=='fire')input.direction=control;if(status==='ready')startGame();if(control==='fire'&&kind==='breakout'&&status==='running')game.launch();try{button.setPointerCapture(e.pointerId);}catch{}});button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);}
window.addEventListener('pagehide',()=>{if(status==='running')togglePause();});
if('serviceWorker'in navigator&&/^https?:$/.test(location.protocol)){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}
selectGame('space');requestAnimationFrame(frame);
})();
