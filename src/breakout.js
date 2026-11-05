/* Original Breakout / paddle-and-ball game with deterministic collision handling. */
(function(){
'use strict';
const RA=window.RetroArcade;
const COLOR=['#fe81a7','#f8a47e','#f7d57c','#8fe0ad','#74e1df','#a8a5ff'];
class BreakoutGame{
  constructor(sound){this.sound=sound;this.stars=RA.makeStars(743,45);this.reset();}
  reset(){this.score=0;this.level=1;this.lives=3;this.paddle={x:390,y:513,w:120,h:14};this.ball={x:450,y:499,r:9,vx:0,vy:0};this.launched=false;this.over=false;this.won=false;this.elapsed=0;this.sparks=[];this.buildLevel();}
  buildLevel(){const cols=11,rows=Math.min(7,4+this.level);this.bricks=[];const width=62,gap=9,start=(900-(cols*width+(cols-1)*gap))/2;for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){if(this.level>1&&((col+row+this.level)%9===0))continue;this.bricks.push({x:start+col*(width+gap),y:84+row*31,w:width,h:21,color:COLOR[(row+this.level-1)%COLOR.length]});}this.resetBall();}
  resetBall(){this.paddle.x=RA.clamp(this.paddle.x,18,900-this.paddle.w-18);this.ball={x:this.paddle.x+this.paddle.w/2,y:this.paddle.y-11,r:9,vx:0,vy:0};this.launched=false;}
  launch(){if(this.over||this.launched)return;const speed=310+Math.min(185,(this.level-1)*23);this.ball.vx=speed*.5;this.ball.vy=-Math.sqrt(speed*speed-this.ball.vx**2);this.launched=true;this.sound('start');}
  hitBall(brick){const b=this.ball;const r=RA.random((this.score+Math.floor(this.elapsed*997))>>>0);for(let i=0;i<9;i++){const a=r()*Math.PI*2,s=25+r()*115;this.sparks.push({x:b.x,y:b.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,t:.25+r()*.3,c:brick.color});}}
  update(dt,input){if(this.over)return;this.elapsed+=dt;const p=this.paddle,b=this.ball;const motion=(input.right?1:0)-(input.left?1:0);if(motion)p.x+=motion*590*dt;else if(input.pointerX!=null)p.x+=(input.pointerX-p.w/2-p.x)*Math.min(1,dt*20);p.x=RA.clamp(p.x,14,900-p.w-14);
    if(!this.launched){b.x=p.x+p.w/2;b.y=p.y-b.r-2;if(input.fire)this.launch();return;}
    const steps=Math.max(1,Math.ceil(dt/.009)),step=dt/steps;
    for(let k=0;k<steps;k++){
      const prevX=b.x,prevY=b.y;b.x+=b.vx*step;b.y+=b.vy*step;
      if(b.x-b.r<13){b.x=13+b.r;b.vx=Math.abs(b.vx);}
      if(b.x+b.r>887){b.x=887-b.r;b.vx=-Math.abs(b.vx);}
      if(b.y-b.r<15){b.y=15+b.r;b.vy=Math.abs(b.vy);}
      if(b.vy>0&&RA.circleRect(b.x,b.y,b.r,p)&&prevY+b.r<=p.y+12){b.y=p.y-b.r-1;const offset=RA.clamp((b.x-(p.x+p.w/2))/(p.w/2),-1,1);const velocity=Math.min(620,Math.hypot(b.vx,b.vy)*1.025);b.vx=velocity*.87*offset;b.vy=-Math.sqrt(velocity*velocity-b.vx*b.vx);this.sound('brick');}
      for(let i=0;i<this.bricks.length;i++){
        const brick=this.bricks[i];if(!RA.circleRect(b.x,b.y,b.r,brick))continue;
        const fromLeft=prevX+b.r<=brick.x,fromRight=prevX-b.r>=brick.x+brick.w;
        if(fromLeft||fromRight)b.vx*=-1;else b.vy*=-1;
        this.bricks.splice(i,1);this.score+=10+Math.floor(this.level/3)*5;this.sound('brick');this.hitBall(brick);break;
      }
      if(b.y-b.r>560){this.lives--;this.sound('lose');if(this.lives<=0){this.over=true;}else this.resetBall();break;}
    }
    if(!this.bricks.length){this.score+=100;this.level++;this.buildLevel();this.sound('win');}
    for(const s of this.sparks){s.x+=s.vx*dt;s.y+=s.vy*dt;s.t-=dt;}this.sparks=this.sparks.filter(s=>s.t>0);
  }
  render(ctx){RA.backdrop(ctx,'#251a3f');RA.drawStars(ctx,this.stars,this.elapsed);ctx.strokeStyle='#3c305c';ctx.lineWidth=3;ctx.strokeRect(12,12,876,534);
    for(const b of this.bricks){ctx.shadowColor=b.color;ctx.shadowBlur=8;RA.round(ctx,b.x,b.y,b.w,b.h,4,b.color);ctx.shadowBlur=0;ctx.fillStyle='#ffffff4a';ctx.fillRect(b.x+6,b.y+3,b.w-12,3);}
    const p=this.paddle;ctx.shadowColor='#70ebda';ctx.shadowBlur=22;RA.round(ctx,p.x,p.y,p.w,p.h,7,'#68e2d2');ctx.shadowBlur=0;RA.round(ctx,p.x+12,p.y+3,p.w-24,3,3,'#e0fff9');
    const b=this.ball;ctx.shadowColor='#ffffff';ctx.shadowBlur=18;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fillStyle='#faffff';ctx.fill();ctx.shadowBlur=0;
    for(const s of this.sparks){ctx.globalAlpha=Math.min(1,s.t*2);ctx.fillStyle=s.c;ctx.fillRect(s.x,s.y,3,3);}ctx.globalAlpha=1;
    if(!this.launched&&!this.over){RA.text(ctx,'SPACE  /  اضغط إطلاق لبدء حركة الكرة',450,411,17,'#cfd6ed');ctx.beginPath();ctx.setLineDash([5,6]);ctx.strokeStyle='#8a98ba';ctx.moveTo(b.x,b.y-21);ctx.lineTo(b.x+75,b.y-80);ctx.stroke();ctx.setLineDash([]);}RA.text(ctx,`STAGE ${String(this.level).padStart(2,'0')}`,450,36,15,'#a6a9d9');
  }
}
RA.BreakoutGame=BreakoutGame;
})();
