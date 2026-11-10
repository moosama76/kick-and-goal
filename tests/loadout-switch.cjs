const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const profile={upgrades:['bounce']},sounds=[];
const context=vm.createContext({Phaser:{Scene:class{}},profile,UP:[{id:'bounce'},{id:'teleport'},{id:'glove'}],hasUp:id=>profile.upgrades.includes(id),saveProfile(){},audio:{sfx:s=>sounds.push(s)}});
vm.runInContext(fs.readFileSync('js/game.js','utf8')+';globalThis.Game=Game',context);
const scene=new context.Game(),art=()=>({setVisible(){return this},setPosition(){return this},setAlpha(){return this},setScale(){return this}});
Object.assign(scene,{menuOpen:false,won:false,ballJumpCool:1.2,teleportCool:12,gloveCool:7,ballJumpArt:art(),teleportArt:art(),gloveArt:art(),updateLoadoutHud(){}});
const timers=()=>[scene.ballJumpCool,scene.teleportCool,scene.gloveCool];
for(const index of [1,2,0,2]){
 const before=timers();assert.equal(scene.changeLoadout(index),true);assert.deepEqual(timers(),before,'Switching must preserve all cooldowns');
 assert.equal(profile.upgrades[0],['bounce','teleport','glove'][index]);
}
assert.equal(scene.gloveState,'cooldown','Reequipping a cooling rocket must not restore it early');
scene.tickCooldowns(.5);assert.deepEqual(timers(),[.7,11.5,6.5],'Unequipped abilities keep cooling down');
assert.equal(scene.changeLoadout(0),true);assert.equal(scene.ballJumpCool,.7);
assert.equal(sounds.includes('deny'),false,'Switching never plays a denial sound');
scene.time={now:0};scene.p={x:0,y:0};scene.ball={x:0,y:0};
for(const source of ['ballJumpCool','teleportCool','gloveCool']){
 scene.ballJumpCool=scene.teleportCool=scene.gloveCool=0;scene[source]=.5;profile.upgrades=['glove'];
 scene.changeLoadout(0);assert.equal(scene.tryBallJump(),false,'A running '+source+' blocks Ball Jump after switching');
 scene.changeLoadout(1);scene.teleport();assert.equal(scene.teleportCool,source==='teleportCool'?.5:0,'Blink cannot fire during another loadout cooldown');
 scene.changeLoadout(2);scene.updateLoadouts(.01);assert.equal(scene.gloveState,'cooldown','Rocket stays unavailable during '+source);
 scene.tickCooldowns(.5);assert.equal(scene.loadoutCooldown().remaining,0,'All abilities unlock when the original timer expires');
}
scene.menuOpen=true;assert.equal(scene.changeLoadout(1),false);
scene.menuOpen=false;scene.won=true;assert.equal(scene.changeLoadout(1),false);
console.log('PASS: switching during cooldown preserves all timers, inactive cooldowns advance, rocket cannot recharge by swapping, swapping is silent; all three abilities remain locked by any running cooldown');
