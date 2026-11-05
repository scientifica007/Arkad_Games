/* Original Space Shooter game, inspired by classic fixed shooters. */
(function(){
'use strict';
const RA=window.RetroArcade;
const SPRITES=[
  ['00100100','00011000','01111110','11011011','11111111','10100101','00100100'],
  ['00011000','00111100','01111110','11011011','11111111','00100100','01000010'],
  ['00111100','01111110','11111111','11011011','11111111','01100110','11000011']
];
class SpaceGame{
  constructor(sound){this.sound=sound;this.stars=RA.makeStars(451,100);this.reset();}
  reset(){this.score=0;this.level=1;this.lives=3;this.shipX=450;this.shipY=494;this.bullets=[];this.foeBullets=[];this.waveTime=0;this.fireTimer=0;this.enemyFireTimer=1.3;this.invulnerable=0;this.over=false;this.won=false;this.elapsed=0;this.particles=[];this.setupWave();}
  setupWave(){this.aliens=[];for(let row=0;row<5;row++){for(let col=0;col<10;col++)this.aliens.push({x:127+col*63,y:79+row*43,row,col,w:34,h:25,alive:true});}this.dir=1;this.enemyFireTimer=1.25;this.foeBullets=[];this.bullets=[];this.shipX=450;}
  hitPlayer(){if(this.invulnerable>0)return;this.lives--;this.invulnerable=1.6;this.sound('lose');this.burst(this.shipX,this.shipY,'#6fe7d5',18);if(this.lives<=0)this.over=true;}
  burst(x,y,color,count=10){const r=RA.random((this.score+this.elapsed*1000)|0);for(let i=0;i<count;i++){const a=r()*Math.PI*2,s=35+r()*190;this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,t:.3+r()*.5,color});}}
  update(dt,input){if(this.over)return;this.elapsed+=dt;this.waveTime+=dt;this.invulnerable=Math.max(0,this.invulnerable-dt);this.fireTimer-=dt;this.enemyFireTimer-=dt;let motion=(input.right?1:0)-(input.left?1:0);if(motion)this.shipX=RA.clamp(this.shipX+motion*385*dt,32,RA.W-32);else if(input.pointerActive&&input.pointerX!=null)this.shipX=RA.clamp(this.shipX+(input.pointerX-this.shipX)*Math.min(1,dt*14),32,RA.W-32);
    if(input.fire&&this.fireTimer<=0){this.bullets.push({x:this.shipX-2,y:this.shipY-28,w:4,h:22});this.fireTimer=.17;this.sound('shoot');}
    for(const p of this.bullets)p.y-=680*dt;
    this.bullets=this.bullets.filter(b=>b.y>-35);
    const move=this.dir*(35+this.level*10+Math.min(55,(50-this.aliens.length)*1.5))*dt;
    for(const a of this.aliens)a.x+=move;
    if(this.aliens.length){let low=Math.min(...this.aliens.map(a=>a.x)),high=Math.max(...this.aliens.map(a=>a.x+a.w));if((high>864&&this.dir>0)||(low<34&&this.dir<0)){this.dir*=-1;for(const a of this.aliens)a.y+=17;}if(this.aliens.some(a=>a.y+a.h>=this.shipY-15))this.over=true;}
    if(this.enemyFireTimer<=0&&this.aliens.length){const shooter=this.aliens[Math.floor(Math.random()*this.aliens.length)];this.foeBullets.push({x:shooter.x+shooter.w/2,y:shooter.y+20,w:5,h:16});this.enemyFireTimer=Math.max(.35,1.25-this.level*.06)+Math.random()*.6;}
    for(const e of this.foeBullets){e.y+=(245+this.level*18)*dt;if(this.invulnerable<=0&&RA.collide({x:this.shipX-21,y:this.shipY-14,w:42,h:30},e)){e.y=1000;this.hitPlayer();}}
    this.foeBullets=this.foeBullets.filter(e=>e.y<RA.H+20);
    for(let bi=this.bullets.length-1;bi>=0;bi--){const b=this.bullets[bi];const hit=this.aliens.findIndex(a=>RA.collide(b,a));if(hit!==-1){const a=this.aliens[hit];this.aliens.splice(hit,1);this.bullets.splice(bi,1);this.score+=10+(4-a.row)*5;this.sound('hit');this.burst(a.x+17,a.y+13,['#fa82af','#ffd27d','#71e6d7','#b09dff','#9bdcff'][a.row]);}}
    if(this.aliens.length===0&&!this.over){this.level++;this.score+=150;this.sound('win');this.setupWave();}
    for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=80*dt;p.t-=dt;}this.particles=this.particles.filter(p=>p.t>0);
  }
  render(ctx){RA.backdrop(ctx,'#10283c');RA.drawStars(ctx,this.stars,this.elapsed);ctx.save();ctx.strokeStyle='#172946';ctx.globalAlpha=.4;for(let y=55;y<560;y+=52){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(900,y);ctx.stroke();}ctx.globalAlpha=1;
    const colors=['#ff8bae','#ffd37c','#a2a3ff','#70e5d8','#8cc4ff'];
    for(const a of this.aliens){const map=SPRITES[a.row%3],sx=4.5,sy=3.7;ctx.fillStyle=colors[a.row];ctx.shadowColor=colors[a.row];ctx.shadowBlur=7;for(let r=0;r<map.length;r++)for(let col=0;col<8;col++)if(map[r][col]==='1')ctx.fillRect(a.x+col*sx,a.y+r*sy,sx-0.4,sy-0.3);ctx.shadowBlur=0;}
    for(const b of this.bullets){ctx.shadowBlur=16;ctx.shadowColor='#6effdf';ctx.fillStyle='#a6ffef';ctx.fillRect(b.x,b.y,b.w,b.h);ctx.shadowBlur=0;}
    for(const e of this.foeBullets){ctx.shadowBlur=10;ctx.shadowColor='#ff83ab';ctx.fillStyle='#ff8cac';ctx.fillRect(e.x,e.y,e.w,e.h);ctx.shadowBlur=0;}
    if(this.invulnerable<=0||Math.floor(this.elapsed*14)%2===0){ctx.translate(this.shipX,this.shipY);const flame=12+Math.sin(this.elapsed*34)*7;ctx.fillStyle='#e8ae71';ctx.beginPath();ctx.moveTo(-12,11);ctx.lineTo(0,11+flame);ctx.lineTo(12,11);ctx.fill();ctx.shadowColor='#70e8dc';ctx.shadowBlur=22;ctx.fillStyle='#6ee4d7';ctx.beginPath();ctx.moveTo(0,-27);ctx.lineTo(-11,-9);ctx.lineTo(-23,1);ctx.lineTo(-25,18);ctx.lineTo(-8,12);ctx.lineTo(8,12);ctx.lineTo(25,18);ctx.lineTo(23,1);ctx.lineTo(11,-9);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#0d1934';ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(-7,-3);ctx.lineTo(7,-3);ctx.fill();ctx.translate(-this.shipX,-this.shipY);}
    for(const p of this.particles){ctx.globalAlpha=Math.min(1,p.t*2);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,4,4);}ctx.globalAlpha=1;
    ctx.fillStyle='#33516d';ctx.fillRect(0,547,900,2);RA.text(ctx,`WAVE ${String(this.level).padStart(2,'0')}`,450,30,14,'#869fbd');ctx.restore();
  }
}
RA.SpaceGame=SpaceGame;
})();
