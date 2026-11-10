const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=require('../scripts/game-source.cjs').readGameLogic();
const context=vm.createContext({T:16,Phaser:{Scene:class{}},audio:{sfx(){}}});
vm.runInContext(html+';globalThis.fixture={LV,EN,Game,build}',context);
const {LV,EN,Game,build}=context.fixture,L=LV[7];
for(let i=0;i<9;i++)if(i!==7){assert.ok(L.w>LV[i].w);assert.ok(L.h>LV[i].h);assert.ok(L.w*L.h>LV[i].w*LV[i].h);}
assert.ok(L.h/L.w>2,'Tower must be predominantly vertical');
assert.equal(L.requiredUpgrade,undefined,'Tower cannot require a particular upgrade');
assert.equal(EN[8].filter(([type])=>type==='d').length,12,'Level 8 needs twelve drones');
assert.equal(L.cover,false,'Level 8 drones must fire through walls');
const scene=Object.assign(Object.create(Game.prototype),{i:7,S:build(L),enemies:EN[8].map(()=>({dead:false})),
 switches:L.s.map(([x,y],index)=>({x,y,index,on:false})),doors:L.d.map(([x,y,w,h])=>({x,y,w,h,open:false,o:{disableBody(){}}})),
 burst(){},hud(){},cameras:{main:{width:960,zoom:2,flash(){},setBounds(...bounds){scene.cameraBounds=bounds;}}}});
for(const d of scene.doors)for(let y=d.y;y<d.y+d.h;y++)for(let x=d.x;x<d.x+d.w;x++)scene.S[y][x]=true;
assert.ok(L.p[0]<12,'Player must start inside the left chamber');
scene.setLevelCameraBounds();
assert.equal(scene.cameraBounds[0],0,'Camera must cover the left starting chamber and return shaft');
for(let y=8;y<103;y++)assert.equal(scene.S[y][12],true,'Divider must stay solid from the summit to the bottom');
assert.equal(L.x.length,3+31+11,'No added foyer steps or new platforms');
assert.deepEqual(Array.from(L.g),[26,99,3,3],'Goal must sit beyond the lowest platform, raised off the ground');
assert.equal(L.g[0]-(L.ascent[0][0]+L.ascent[0][2]),1,'Leave one tile between the lowest platform and goal');
assert.ok(L.g[1]+L.g[3]<L.h-1,'Goal must have a clear gap above the ground');
assert.equal(L.d.length,1,'Relocate the existing lock; do not add a second lock');
const [gx,gy,gw,gh]=L.d[0];
assert.deepEqual(Array.from(L.d[0]),[3,8,5,1],'Restore the original door that closes only the small top gap');
assert.equal(scene.S[gy][gx-1],true,'The small door must meet the existing left roof');
assert.equal(scene.S[gy][gx+gw],true,'The small door must meet the existing right roof');
assert.ok(L.s[0][0]>0&&L.s[0][0]<12&&L.s[0][1]>gy&&L.s[0][1]<=gy+8,'The lock switch must remain near the gate at the top, never at the bottom');
assert.equal(L.checkpoints[0].p[1],L.s[0][1],'The lock checkpoint must follow its switch to the top');
for(let i=1;i<L.s.length;i++){
 assert.deepEqual(Array.from(L.requires[i]),[i-1],'Each tower relay must wait for the preceding switch');
 if(i>1)assert.ok(L.s[i][1]>L.s[i-1][1],'Remaining switches must unlock from top to bottom');
 assert.ok(Math.abs(L.checkpoints[i].p[1]-L.s[i][1])<=1,'Each checkpoint must follow its reordered switch');
}
assert.equal(scene.astar(...L.p,9,7),null,'Closed interior lock must block the upper exit');
assert.ok(scene.astar(...L.p,...L.s[0]),'The first switch must be reachable from the left start');
assert.equal(scene.goalUnlocked(),false);
scene.switches[0].on=true;scene.openReadyDoors();
assert.equal(scene.doors[0].open,true,'The existing lock must unlock first, before combat or other switches');
assert.ok(scene.astar(...L.p,16,99),'Opened lock must connect the left route over the summit to the right tower');
scene.switches.forEach(sw=>sw.on=true);
assert.equal(scene.goalUnlocked(),false,'Opening the first lock must not bypass combat');
scene.enemies.forEach(e=>e.dead=true);scene.switches[3].on=false;
assert.equal(scene.goalUnlocked(),false,'Combat must not bypass the final relay');
scene.switches[3].on=true;assert.equal(scene.goalUnlocked(),true);
const geometry=build(L);
for(let y=L.g[1]*16;y<(L.g[1]+L.g[3])*16;y++)for(let x=L.g[0]*16;x<(L.g[0]+L.g[2])*16;x++)assert.ok(!geometry[Math.floor(y/16)][Math.floor(x/16)],'Raised goal must be completely clear of ground and platforms');
for(let i=1;i<L.ascent.length;i++){
 const prev=L.ascent[i-1],next=L.ascent[i];
 assert.equal(prev[1]-next[1],3,'Every ascent step must stay within a normal held jump');
 assert.equal(Math.max(prev[0],next[0])-Math.min(prev[0]+prev[2],next[0]+next[2]),1,'Alternating ledges should have a small horizontal gap');
}
for(const checkpoint of L.checkpoints)for(const point of [checkpoint.p,checkpoint.b]){
 assert.equal(build(L)[point[1]][point[0]],false,'Checkpoint must be outside solids');
}
scene.checkpoint=L.checkpoints[1];assert.equal(scene.spawnPoints(),scene.checkpoint);
console.log('PASS: raised goal beyond the lowest platform, continuous divider, upper-left lock first, no added platforms, combat/relay requirements and checkpoints');
