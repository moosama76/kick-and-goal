const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),source=require('../scripts/game-source.cjs').readGameLogic(root);
const c=vm.createContext({T:16,Phaser:{Scene:class{}},audio:{sfx(){}}});
vm.runInContext(source+';globalThis.data={Game,LV,EN,build}',c);
const {Game,LV,EN,build}=c.data,L=LV[8],counts=roster=>[roster.filter(e=>(e.type||e[0])==='d').length,roster.filter(e=>(e.type||e[0])==='w').length];
assert.deepEqual(Array.from(L.waves,counts),[[2,4],[4,0],[8,0]]);assert.equal(EN[9],L.waves[0]);
const s=new Game();Object.assign(s,{i:8,S:build(L),waveIndex:0,wavesComplete:false,health:1,gloveCool:6,ballJumpCool:0,teleportCool:0,switches:[],doors:[],burst(){},hud(){},shots:{clears:0,clear(){this.clears++}},physics:{add:{sprite(x,y,key){return {x,y,key,destroy(){this.destroyed=true},setDepth(){return this},body:{setSize(){return this},setOffset(){return this},setCircle(){return this},setAllowGravity(){return this}}}},collider(){}}},walls:{}});
for(const wave of L.waves)for(const [type,x,y,patrol] of wave){
 const dx=type==='d'?24:6,dy=type==='d'?13:6;
 for(let px=x*16+8-dx;px<=x*16+8+dx;px++)for(let py=y*16+8-dy;py<=y*16+8+dy;py++)assert.equal(s.sp(px,py),false,'Enemy spawn/hover must clear walls');
 if(type==='w')for(let col=patrol[0];col<=patrol[1];col++)assert.equal(s.S[y+1][col],true,'Patrol route needs supporting ground');
}
s.enemies=L.waves[0].map(args=>s.spawnEnemy(...args));
const patrols=s.enemies.filter(e=>e.type==='w');patrols[0].dead=true;patrols[1].o.x+=5;
const patrolX=patrols[1].o.x;
for(let wave=0;wave<3;wave++){
 assert.equal(s.waveIndex,wave);assert.deepEqual(counts(s.enemies),[[2,4],[4,4],[8,4]][wave]);assert.equal(s.goalUnlocked(),false);
 const drones=s.enemies.filter(e=>e.type==='d');
 drones.slice(0,-1).forEach(e=>e.dead=true);s.updateWaves();assert.equal(s.waveIndex,wave,'A surviving drone blocks advancement');
 drones.at(-1).dead=true;s.updateWaves();
 assert.equal(s.health,1);assert.equal(s.gloveCool,6);
 assert.equal(s.enemies.filter(e=>e.type==='w').length,4);
 patrols.forEach(e=>assert.ok(s.enemies.includes(e),'Original patrol identity persists'));
 assert.equal(patrols[0].dead,true,'Defeated patrols never respawn');assert.equal(patrols[1].o.x,patrolX,'Survivors do not reset their position');
 if(wave<2)assert.ok(drones.every(e=>e.o.destroyed));
}
assert.equal(s.wavesComplete,true);assert.equal(s.goalUnlocked(),false,'Surviving original patrols still guard the goal');
patrols.forEach(e=>e.dead=true);assert.equal(s.goalUnlocked(),true);assert.equal(s.shots.clears,2);
const final=s.enemies;s.updateWaves();assert.equal(s.enemies,final);
console.log('PASS: drone waves 2/4/8; four initial patrols retain position and death state without respawning; final goal requires all survivors defeated');
