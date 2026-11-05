/* Original connected maze generator, pellet collection, and pathfinding ghosts. */
(function(){
'use strict';
const RA=window.RetroArcade;
const DIR={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
class MazeGame{
  constructor(sound){this.sound=sound;this.cols=23;this.rows=17;this.tile=27;this.ox=Math.floor((900-23*27)/2);this.oy=Math.floor((560-17*27)/2)+9;this.reset();}
  reset(){this.score=0;this.level=1;this.lives=3;this.elapsed=0;this.over=false;this.won=false;this.generate();}
  generate(){const {cols,rows}=this;const rnd=RA.random(14159+this.level*379);this.rnd=rnd;this.grid=Array.from({length:rows},()=>Array(cols).fill(1));const stack=[[1,1]];this.grid[1][1]=0;
    while(stack.length){const [x,y]=stack[stack.length-1];const possibles=[];for(const [dx,dy] of [[2,0],[-2,0],[0,2],[0,-2]]){const nx=x+dx,ny=y+dy;if(nx>0&&nx<cols-1&&ny>0&&ny<rows-1&&this.grid[ny][nx]===1)possibles.push([nx,ny,dx,dy]);}if(!possibles.length){stack.pop();continue;}const [nx,ny,dx,dy]=possibles[Math.floor(rnd()*possibles.length)];this.grid[y+dy/2][x+dx/2]=0;this.grid[ny][nx]=0;stack.push([nx,ny]);}
    // Open a number of walls between existing corridors to create alternate routes.
    for(let y=2;y<rows-2;y++)for(let x=2;x<cols-2;x++){if(this.grid[y][x]!==1||rnd()>.13)continue;if((this.grid[y][x-1]===0&&this.grid[y][x+1]===0)||(this.grid[y-1][x]===0&&this.grid[y+1][x]===0))this.grid[y][x]=0;}
    this.player={x:1,y:1,dir:'right',want:'right'};this.playerTick=0;this.ghostTick=0;this.powerTime=0;this.invulnerable=2;this.startDelay=1.4;
    const homes=[[cols-2,rows-2],[cols-2,1],[1,rows-2]];this.ghosts=homes.map(([x,y],i)=>({x,y,hx:x,hy:y,color:['#ff85a3','#7edfec','#ffcb81'][i],delay:1+i*.5,dir:'left'}));
    this.dots=new Set();this.power=new Set();for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++)if(this.grid[y][x]===0&&!(x===1&&y===1))this.dots.add(x+','+y);
    for(const [x,y] of [[1,rows-2],[cols-2,1],[cols-2,rows-2],[Math.floor(cols/2)|1,Math.floor(rows/2)|1]]){if(this.grid[y]?.[x]===0){this.dots.delete(x+','+y);this.power.add(x+','+y);}}
    for(const g of this.ghosts){this.dots.delete(g.x+','+g.y);this.power.delete(g.x+','+g.y);}
  }
  valid(x,y){return x>=0&&x<this.cols&&y>=0&&y<this.rows&&this.grid[y][x]===0;}
  canMove(p,d){const v=DIR[d];return !!v&&this.valid(p.x+v[0],p.y+v[1]);}
  move(p,d){const [dx,dy]=DIR[d];p.x+=dx;p.y+=dy;p.dir=d;}
  onCell(){const k=this.player.x+','+this.player.y;if(this.dots.delete(k)){this.score+=10;this.sound('coin');}if(this.power.delete(k)){this.score+=50;this.powerTime=8.5;this.sound('power');}if(this.dots.size===0&&this.power.size===0){this.score+=200;this.level++;this.sound('win');this.generate();}}
  selectGhostMove(g){const choices=Object.keys(DIR).filter(d=>this.canMove(g,d));if(!choices.length)return null;
    if(this.rnd()<.22)return choices[Math.floor(this.rnd()*choices.length)];
    const isFrightened=this.powerTime>0;const target=this.player;const dist=Array.from({length:this.rows},()=>Array(this.cols).fill(Infinity));const queue=[[target.x,target.y]];dist[target.y][target.x]=0;
    for(let qi=0;qi<queue.length;qi++){const [x,y]=queue[qi];for(const [dx,dy] of Object.values(DIR)){const nx=x+dx,ny=y+dy;if(this.valid(nx,ny)&&dist[ny][nx]===Infinity){dist[ny][nx]=dist[y][x]+1;queue.push([nx,ny]);}}}
    choices.sort((a,b)=>{const pa=DIR[a],pb=DIR[b],da=dist[g.y+pa[1]][g.x+pa[0]],db=dist[g.y+pb[1]][g.x+pb[0]];return isFrightened?db-da:da-db;});return choices[0];
  }
  collideGhosts(){for(const g of this.ghosts){if(g.x!==this.player.x||g.y!==this.player.y||g.delay>0)continue;if(this.powerTime>0){this.score+=200;this.sound('hit');g.x=g.hx;g.y=g.hy;g.delay=1.8;}else if(this.invulnerable<=0){this.lives--;this.sound('lose');this.invulnerable=2.4;this.player.x=1;this.player.y=1;this.player.dir='right';this.player.want='right';for(const enemy of this.ghosts){enemy.x=enemy.hx;enemy.y=enemy.hy;enemy.delay=2;}if(this.lives<=0)this.over=true;break;}}}
  update(dt,input){if(this.over)return;this.elapsed+=dt;this.powerTime=Math.max(0,this.powerTime-dt);this.invulnerable=Math.max(0,this.invulnerable-dt);this.startDelay=Math.max(0,this.startDelay-dt);
    if(input.direction&&DIR[input.direction])this.player.want=input.direction;
    this.playerTick+=dt;const interval=Math.max(.075,.12-this.level*.004);
    if(this.playerTick>=interval){this.playerTick=0;if(this.canMove(this.player,this.player.want))this.move(this.player,this.player.want);else if(this.canMove(this.player,this.player.dir))this.move(this.player,this.player.dir);this.onCell();this.collideGhosts();}
    if(this.startDelay>0||this.over)return;this.ghostTick+=dt;
    if(this.ghostTick>=Math.max(.145,.265-this.level*.01)){this.ghostTick=0;for(const g of this.ghosts){if(g.delay>0){g.delay=Math.max(0,g.delay-.24);continue;}const next=this.selectGhostMove(g);if(next)this.move(g,next);}this.collideGhosts();}
  }
  render(ctx){RA.backdrop(ctx,'#14143b');const t=this.tile,o=this.ox,oy=this.oy;ctx.fillStyle='#09112c';ctx.fillRect(o-10,oy-10,this.cols*t+20,this.rows*t+20);
    for(let y=0;y<this.rows;y++)for(let x=0;x<this.cols;x++){const px=o+x*t,py=oy+y*t;if(this.grid[y][x]){RA.round(ctx,px+1,py+1,t-2,t-2,5,'#25245f','#37378a');ctx.fillStyle='#4940a44b';ctx.fillRect(px+4,py+4,t-8,2);}}
    for(const s of this.dots){const [x,y]=s.split(',').map(Number),px=o+x*t+t/2,py=oy+y*t+t/2;ctx.beginPath();ctx.arc(px,py,2.8,0,Math.PI*2);ctx.fillStyle='#f5d48c';ctx.fill();}
    for(const s of this.power){const [x,y]=s.split(',').map(Number),px=o+x*t+t/2,py=oy+y*t+t/2;ctx.shadowColor='#fbe6a7';ctx.shadowBlur=17;ctx.beginPath();ctx.arc(px,py,6+Math.sin(this.elapsed*5)*1.5,0,Math.PI*2);ctx.fillStyle='#f5e6aa';ctx.fill();ctx.shadowBlur=0;}
    for(const g of this.ghosts){if(g.delay>0&&Math.floor(this.elapsed*5)%2===0)continue;const px=o+(g.x+.5)*t,py=oy+(g.y+.5)*t;const color=this.powerTime>0?'#7e8bff':g.color;ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=10;ctx.beginPath();ctx.arc(px,py-2,10,Math.PI,0);ctx.lineTo(px+10,py+10);ctx.lineTo(px+5,py+6);ctx.lineTo(px,py+10);ctx.lineTo(px-5,py+6);ctx.lineTo(px-10,py+10);ctx.closePath();ctx.fill();ctx.shadowBlur=0;for(const dx of [-4,4]){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px+dx,py-3,3.3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#142044';ctx.beginPath();ctx.arc(px+dx+1,py-2.2,1.7,0,Math.PI*2);ctx.fill();}}
    if(this.invulnerable<=0||Math.floor(this.elapsed*11)%2===0){const p=this.player,x=o+(p.x+.5)*t,y=oy+(p.y+.5)*t;const angle={right:0,left:Math.PI,up:-Math.PI/2,down:Math.PI/2}[p.dir];const mouth=.22+Math.abs(Math.sin(this.elapsed*13))*.35;ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,11,angle+mouth,angle+Math.PI*2-mouth);ctx.closePath();ctx.fillStyle='#fbe27d';ctx.shadowColor='#fbe27d';ctx.shadowBlur=13;ctx.fill();ctx.shadowBlur=0;}
    RA.text(ctx,`DOTS ${String(this.dots.size+this.power.size).padStart(3,'0')}`,450,25,15,'#a9a7ea');if(this.powerTime>0){RA.round(ctx,16,20,110,28,8,'#29295b');RA.text(ctx,`POWER ${Math.ceil(this.powerTime)}s`,71,34,13,'#f5e6a5');}ctx.fillStyle='#263461';ctx.fillRect(o-9,oy+this.rows*t+4,this.cols*t+18,3);
  }
}
RA.MazeGame=MazeGame;
})();
