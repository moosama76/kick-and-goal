const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=require('../scripts/game-source.cjs').readGameLogic(),profile={upgrades:[]};
const c=vm.createContext({T:16,Phaser:{Scene:class{}},hasUp:id=>profile.upgrades.includes(id),audio:{sfx(){}}});
vm.runInContext(html+';globalThis.data={Game,LV,EN,build}',c);
const {Game,LV,EN,build}=c.data;
const art=()=>({x:0,y:0,setVisible(){return this},setPosition(x,y){this.x=x;this.y=y;return this},setAlpha(){return this},setScale(){return this},setRotation(){return this},setFlipX(){return this}});
const s=Object.assign(Object.create(Game.prototype),{i:7,p:{x:50,y:100,body:{velocity:{y:50},setVelocityY(y){this.velocity.y=y;return this},setGravityY(){return this}}},ball:{x:50,y:110,body:{velocity:{y:-100},blocked:{down:false},setVelocityY(y){this.velocity.y=y;return this}}},bj:0,bounces:0,ballJumpCool:0,teleportCool:0,gloveCool:0,burst(){},hud(){},cameras:{main:{shake(){},flash(){}}}});
for(const id of [null,'teleport','glove']){profile.upgrades=id?[id]:[];assert.equal(s.tryBallJump(true),false,'Ball bouncing must not be a core ability');}
profile.upgrades=['bounce'];s.updateBallPullRise();assert.equal(s.tryBallJump(),false,'Upward motion without a pull must not qualify');
s.updateBallPullRise(true);s.updateBallPullRise();assert.equal(s.tryBallJump(),true,'Upward pull momentum survives releasing recall');assert.equal(s.ballJumpCool,1.5);
s.p.body.velocity.y=50;s.bj=0;assert.equal(s.tryBallJump(true),false);
s.tickCooldowns(1.499);assert.equal(s.tryBallJump(true),false);s.tickCooldowns(.002);s.ball.body.velocity.y=-100;s.updateBallPullRise(true);assert.equal(s.tryBallJump(),true,'Ball Jump must recharge after 1.5 seconds');
s.ball.body.velocity.y=0;s.updateBallPullRise();assert.equal(s.ballPullRising,false,'Apex clears pull eligibility');
s.ball.body.velocity.y=-100;s.updateBallPullRise();assert.equal(s.ballPullRising,false,'An unrelated rebound does not restore pull eligibility');
// A one-frame pull lifts a grounded ball; released momentum can catch an ascending player.
s.ballJumpCool=0;s.bj=0;s.p.body.velocity.y=-150;s.ball.body.velocity.y=-300;s.ball.body.blocked.down=true;
s.updateBallPullRise(true);assert.equal(s.ballPullRising,true,'Fresh upward pull overrides the previous ground-contact flag');
s.ball.body.blocked.down=false;s.ball.y=s.p.y+2;s.updateBallPullRise();
assert.equal(s.tryBallJump(),true,'Short released pull must bounce when the rising ball catches the rising player');
s.ballJumpCool=0;s.bj=0;s.p.body.velocity.y=-350;s.ball.body.velocity.y=-300;s.updateBallPullRise(true);
assert.equal(s.tryBallJump(),false,'No bounce while player is moving away from the ball');
s.ballJumpCool=0;profile.upgrades=['glove'];let kills=0;
Object.assign(s,{time:{now:0},ballJumpArt:art(),teleportArt:art(),gloveArt:art(),rocketAppear(){},gloveState:'orbit',gloveAngle:0,gloveCool:0,fxClock:1,fx:[],los(){return true},particle(){},enemies:[{dead:false,o:{x:90,y:100}},{dead:false,o:{x:120,y:100}}],killEnemy(e){e.dead=true;kills++}});
s.updateLoadouts(.01);assert.equal(s.gloveCool,10);
for(let n=0;n<20;n++){s.tickCooldowns(.1);s.updateLoadouts(.1)}
assert.equal(kills,1,'Rocket must not repeatedly fire during its cooldown');
for(let n=0;n<79;n++){s.tickCooldowns(.1);s.updateLoadouts(.1)}
assert.equal(kills,1,'Rocket must remain blocked before ten seconds');
for(let n=0;n<10;n++){s.tickCooldowns(.1);s.updateLoadouts(.1)}
assert.equal(kills,2,'Rocket must fire again after its ten-second cooldown');
const patrols=EN[3].filter(([type])=>type==='w'),drones=EN[3].filter(([type])=>type==='d');
assert.equal(patrols.length,6,'Level 3 needs one patrol per platform lane');
for(const [x,y,w] of LV[2].x)assert.equal(patrols.filter(([,px,py])=>py===y-1&&px>=x&&px<x+w).length,1,'Every level 3 platform must have exactly one patrol');
assert.equal(drones.length,11,'Preserve the eight drones and add three');
for(let i=0;i<drones.length;i++)for(let j=0;j<i;j++)assert.ok(Math.hypot(drones[i][1]-drones[j][1],drones[i][2]-drones[j][2])>=2,'Drone positions must be distinct and separated');
const L4=LV[8];
assert.equal(EN[9].filter(([type])=>type==='d').length,2,'Level 9 starts with two drones');
assert.equal(EN[9].filter(([type])=>type==='w').length,4,'Level 9 starts with four patrols');
assert.equal((L4.d||[]).length,0,'Level 9 gate must be removed');
assert.equal((L4.s||[]).length,0,'Level 9 lock must be removed');
const [bx,by]=L4.b,[gx,gy,gw,gh]=L4.g,bcx=bx*16+8,bcy=by*16+8;
assert.ok(bcx>gx*16&&bcx<(gx+gw)*16&&bcy>gy*16&&bcy<(gy+gh)*16,'Trapped ball must touch the goal');
const S4=build(L4);
const ring=[[bx-1,by-1],[bx,by-1],[bx+1,by-1],[bx-1,by],[bx+1,by],[bx-1,by+1],[bx,by+1],[bx+1,by+1]];
for(const [wx,wy] of ring)assert.equal(S4[wy][wx],true,'Trapped ball must sit between eight solid blocks');
for(const [,ex,ey] of EN[9])assert.ok(Math.hypot((ex-L4.p[0])*16,(ey-L4.p[1])*16)>=6*16,'Level 9 patrols must spawn away from the player');
for(const [index,oldCount] of [[2,4],[8,2]]){
 const L=LV[index];assert.ok(EN[index+1].length>oldCount);assert.equal(L.normalJumps,true);
 const levels=index===2?[L.h-1,...L.x.map(p=>p[1])]:[L.h-1,L.x[0][1]];
 for(let n=1;n<levels.length;n++)assert.ok(levels[n-1]-levels[n]<=4,'Combat routes must fit normal jumps');
 for(const [type,x,y] of EN[index+1])if(type==='w')assert.equal(build(L)[y+1][x],true,'Combat guards require footing');
}
console.log('PASS: Ball Jump is loadout-only with 1.5s cooldown; rocket recharges in 10s; levels 3/4 add guards and normal-jump geometry');
