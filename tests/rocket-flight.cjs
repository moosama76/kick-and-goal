const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const profile={upgrades:['glove']},sounds=[];
const context=vm.createContext({Phaser:{Scene:class{}},profile,UP:[{id:'bounce'},{id:'teleport'},{id:'glove'}],hasUp:id=>profile.upgrades.includes(id),saveProfile(){},audio:{sfx:s=>sounds.push(s)}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/game.js'),'utf8')+';globalThis.Game=Game',context);
const art=()=>({x:0,y:0,rotation:0,visible:false,setVisible(v){this.visible=v;return this},setPosition(x,y){this.x=x;this.y=y;return this},setAlpha(){return this},setScale(){return this},setRotation(v){this.rotation=v;return this},setFlipX(v){this.flipX=v;return this}});
let kills=0,impacts=0;
const target={dead:false,o:{x:120,y:0}};
const s=Object.assign(new context.Game(),{menuOpen:false,won:false,time:{now:0},p:{x:0,y:0},ball:{x:0,y:0},face:1,ballJumpCool:0,teleportCool:0,gloveCool:0,gloveState:'orbit',gloveAngle:0,gloveFx:0,ballJumpArt:art(),teleportArt:art(),gloveArt:art(),enemies:[target],los:()=>true,updateLoadoutHud(){},hud(){},particle(){},rocketAppear(){},rocketImpact(){impacts++},extinguishRocket(){},killEnemy(e){e.dead=true;kills++},cameras:{main:{flash(){}}}});
s.updateLoadouts(1/60);assert.equal(s.gloveState,'out');assert.equal(s.gloveCool,10);
const start={x:s.gloveArt.x,y:s.gloveArt.y};
for(const loadout of [1,0,2,1]){
 assert.equal(s.changeLoadout(loadout),true);assert.equal(s.gloveState,'out');assert.equal(s.gloveTarget,target);assert.equal(s.gloveArt.visible,true);assert.equal(s.gloveCool,10);
}
s.updateLoadouts(1/60);assert.ok(s.gloveArt.x>start.x,'Rocket keeps advancing while unequipped');
for(let frame=0;frame<100;frame++){s.tickCooldowns(1/60);s.updateLoadouts(1/60)}
assert.equal(kills,1);assert.equal(impacts,1);assert.equal(s.gloveArt.visible,false);assert.ok(s.gloveCool>0);
assert.equal(sounds.filter(s=>s==='gloveLaunch').length,1,'Swapping cannot duplicate a launched rocket');
s.changeLoadout(2);s.updateLoadouts(1/60);assert.equal(s.gloveArt.visible,false,'Reequip cannot bypass cooldown after impact');
console.log('PASS: repeated loadout swaps preserve launched rocket position/target, flight, one hit and original cooldown');
