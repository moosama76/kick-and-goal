const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const h=require('../scripts/game-source.cjs').readGameLogic(),c=vm.createContext({T:16,Phaser:{Scene:class{}},audio:{sfx(){}}});
vm.runInContext(h+';globalThis.data={Game,LV,build}',c);
const {Game,LV,build}=c.data,L=LV[7],o={setAlpha(){return this},setTint(){return this},setTexture(){return this},clearTint(){return this}};
const body={left:60,right:70,top:1630,bottom:1644};
const s=Object.assign(Object.create(Game.prototype),{i:7,S:build(L),time:{now:0},p:{body},ball:{x:72,y:248},enemies:[{dead:false}],
 switches:L.s.map(([x,y],index)=>({index,x:x*16+8,y:y*16+8,requires:L.requires[index],on:false,o,label:{setText(){}}})),
 doors:L.d.map(([x,y,w,h])=>({x,y,w,h,open:false,o:{disableBody(){}}})),
 burst(){},hud(){},drawWire(){},updateGoalUnlock(){},cameras:{main:{shake(){},setBounds(){}}}});
function touch(sw){Object.assign(body,{left:sw.x-5,right:sw.x+5,top:sw.y-7,bottom:sw.y+7});s.updatePuzzles()}
s.updatePuzzles();assert.equal(s.switches[0].on,false,'The ball must not activate locks');
s.ball.x=600;s.ball.y=1600;touch(s.switches[2]);assert.equal(s.switches[2].on,false,'Body contact must respect lock order');
touch(s.switches[0]);assert.equal(s.switches[0].on,true);assert.equal(s.doors[0].open,true);assert.equal(s.checkpoint,L.checkpoints[0]);
for(let n=1;n<4;n++)touch(s.switches[n]);
assert.equal(s.goalUnlocked(),false,'Body locks must not bypass remaining enemies');s.enemies[0].dead=true;assert.equal(s.goalUnlocked(),true);
console.log('PASS: only player-body contact activates locks/checkpoints; ball contact is ignored and ordering/combat requirements remain enforced');

// Every switch uses the same contact test, with no per-switch trigger settings.
for(const L of LV)for(const [x,y,...settings] of [...(L.routeSelectors||[]),...(L.s||[])]){
 assert.equal(settings.length,0,'Switch data must contain positions only');
 const sw={x:x*16+8,y:y*16+8};
 Object.assign(body,{left:sw.x+13,right:sw.x+23,top:sw.y-7,bottom:sw.y+7});
 assert.equal(s.playerTouchesSwitch(sw),false,'Nearby without body contact must not trigger');
 Object.assign(body,{left:sw.x-5,right:sw.x+5,top:sw.y-7,bottom:sw.y+7});
 assert.equal(s.playerTouchesSwitch(sw),true,'Body contact must trigger every switch consistently');
}

const checkpoint={index:0,x:176,y:264,on:false,requires:[],o,label:{setText(){}}};
const ordinary=Object.assign(Object.create(Game.prototype),{i:1,time:{now:0},health:1,p:{body:{left:50,right:60,top:257,bottom:271}},
 ball:{x:176,y:264},switches:[checkpoint],doors:[],enemies:[],burst(){},hud(){},drawWire(){},openReadyDoors(){},updateGoalUnlock(){},cameras:{main:{shake(){}}}});
ordinary.updatePuzzles();assert.equal(checkpoint.on,false,'Ball contact alone must not activate level 2 checkpoint');
Object.assign(ordinary.p.body,{left:171,right:181});ordinary.updatePuzzles();
assert.equal(checkpoint.on,true,'Ordinary player contact must activate level 2 checkpoint without a bounce');
assert.equal(ordinary.health,1);assert.ok(ordinary.checkpoint);
console.log('PASS: level 2 checkpoint activates on ordinary body contact without healing');
