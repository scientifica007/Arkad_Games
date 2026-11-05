// Run with: node tests/logic.test.js — no extra dependencies.
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const assert=require('node:assert/strict');
const namespace={window:{},console,Math,Set,Array,Infinity};
vm.createContext(namespace);
for(const name of ['core.js','space.js','breakout.js','maze.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src',name),'utf8'),namespace,{filename:name});
const RA=namespace.window.RetroArcade;let sounds=0;
const silent=()=>{sounds++};
const idle={left:false,right:false,up:false,down:false,fire:false,pointerX:null,pointerActive:false,direction:null};
// Space: shots can destroy aliens; destroying last alien advances to next level.
const s=new RA.SpaceGame(silent);assert.equal(s.aliens.length,50);assert.equal(s.lives,3);
s.aliens=[{x:420,y:200,w:34,h:25,row:0,col:0}];s.bullets=[{x:425,y:201,w:4,h:22}];s.update(.001,idle);assert.equal(s.level,2);assert(s.score>=175);
// Breakout: launch, bounce and brick contact increment points; ball lost uses a life.
const b=new RA.BreakoutGame(silent);assert.equal(b.launched,false);b.launch();assert.equal(b.launched,true);assert.equal(b.bricks.length,55);
b.ball.x=b.bricks[0].x+20;b.ball.y=b.bricks[0].y-7;b.ball.vx=0;b.ball.vy=100;b.update(.01,idle);assert(b.bricks.length<55);assert(b.score>=10);
b.ball.y=590;b.ball.vy=300;b.update(.02,idle);assert.equal(b.lives,2);assert.equal(b.launched,false);
// Maze: all generated open cells connected; score increases on pellet collection.
const m=new RA.MazeGame(silent);for(let lvl=1;lvl<=10;lvl++){m.level=lvl;m.generate();const seen=new Set(['1,1']),queue=[[1,1]];for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(m.valid(nx,ny)&&!seen.has(k)){seen.add(k);queue.push([nx,ny]);}}}let open=0;for(let y=0;y<m.rows;y++)for(let x=0;x<m.cols;x++)if(m.valid(x,y))open++;assert.equal(seen.size,open,`level ${lvl} has unconnected passages`);}
m.reset();const previous=m.score;m.update(.2,{...idle,direction:'right'});assert(m.score>previous);assert.equal(m.lives,3);
console.log('PASS: space waves, breakout physics, maze connectivity (10 levels), pellet scoring. Sound callbacks:',sounds);
