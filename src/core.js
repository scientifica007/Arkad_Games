/* RETRO ARCADE: shared drawing, math, persistence, and original synthesized SFX. */
(function(){
  'use strict';
  const RA=window.RetroArcade=window.RetroArcade||{};
  RA.W=900; RA.H=560;
  RA.clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  RA.collide=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  RA.circleRect=(cx,cy,r,box)=>{let x=RA.clamp(cx,box.x,box.x+box.w),y=RA.clamp(cy,box.y,box.y+box.h);return (x-cx)**2+(y-cy)**2<=r*r;};
  RA.random=function(seed){let t=seed>>>0;return ()=>{t+=0x6D2B79F5;let v=t;v=Math.imul(v^(v>>>15),v|1);v^=v+Math.imul(v^(v>>>7),v|61);return ((v^(v>>>14))>>>0)/4294967296;};};
  RA.round=(ctx,x,y,w,h,r,fill,stroke)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}};
  RA.text=(ctx,value,x,y,size,color='#ecf2ff',align='center',font='700')=>{ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.font=`${font} ${size}px Tahoma, Arial, sans-serif`;ctx.fillText(value,x,y);};
  RA.drawStars=(ctx,stars,time=0)=>{for(const s of stars){ctx.globalAlpha=.25+s.a*(.3+.2*Math.sin(time*1.8+s.x));ctx.fillStyle=s.c||'#b0ddf9';ctx.fillRect(s.x,s.y,s.r,s.r);}ctx.globalAlpha=1;};
  RA.makeStars=(seed,n=75)=>{const r=RA.random(seed);return Array.from({length:n},()=>({x:r()*RA.W,y:r()*RA.H,r:1+r()*2,a:.2+r()*.8,c:r()<.15?'#63e8cf':'#b8d0ff'}));};
  RA.backdrop=(ctx,accent='#112747')=>{ctx.fillStyle='#070d20';ctx.fillRect(0,0,RA.W,RA.H);const grad=ctx.createRadialGradient(450,210,25,450,280,550);grad.addColorStop(0,accent);grad.addColorStop(1,'#070d20');ctx.fillStyle=grad;ctx.fillRect(0,0,RA.W,RA.H);};
  RA.storage={read(game){try{return JSON.parse(localStorage.getItem('retro-arcade:'+game)||'{"best":0,"rounds":0}');}catch{return {best:0,rounds:0};}},save(game,data){try{localStorage.setItem('retro-arcade:'+game,JSON.stringify(data));}catch{}}};
  RA.Audio=class{
    constructor(){this.enabled=false;this.ctx=null;}
    setEnabled(v){this.enabled=!!v;}
    tone(kind){if(!this.enabled)return;try{const AudioContextClass=window.AudioContext||window.webkitAudioContext;if(!AudioContextClass)return;if(!this.ctx)this.ctx=new AudioContextClass();if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});const now=this.ctx.currentTime;const o=this.ctx.createOscillator(),g=this.ctx.createGain();const params={shoot:[560,220,.10,'square'],hit:[195,70,.18,'sawtooth'],brick:[520,700,.09,'triangle'],coin:[670,940,.08,'sine'],power:[420,750,.22,'triangle'],lose:[270,80,.4,'sawtooth'],start:[400,820,.16,'triangle'],win:[550,1080,.3,'sine']}[kind]||[440,630,.1,'sine'];o.type=params[3];o.frequency.setValueAtTime(params[0],now);o.frequency.exponentialRampToValueAtTime(Math.max(20,params[1]),now+params[2]);g.gain.setValueAtTime(.035,now);g.gain.exponentialRampToValueAtTime(.0001,now+params[2]);o.connect(g);g.connect(this.ctx.destination);o.start(now);o.stop(now+params[2]+.01);}catch{}}
  };
})();
