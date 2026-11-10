const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
let confirmations=0;
// Level 1 supplies a live walker for the aim lesson; the tutorial spawns it through
// the scene, so the test stubs that seam rather than reaching into Phaser.
const context=vm.createContext({audio:{sfx(){confirmations++}},Phaser:{Scene:class{}},T:16,LV:[{tutorialTarget:[24,21,[21,28]]}]});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/tutorial.js'),'utf8')+';globalThis.CoachTutorial=CoachTutorial',context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/game.js'),'utf8')+';globalThis.Game=Game',context);
const tutorial=Object.create(context.CoachTutorial.prototype);
let updates=0,goalChecks=0,revealed=0,spawned=[];
const scene={i:0,doors:[],walls:{},physics:{add:{sprite(x,y,key){return {x,y,key,setDepth(){return this},body:{setSize(){return this},setOffset(){return this},setCircle(){return this},setAllowGravity(){return this}}}},collider(){}}},p:{x:1},drib:false,enemies:[],time:{delayedCall(_time,fn){fn()}},updateGoalUnlock(){goalChecks++},hud(){},
  burst(){},tweens:{add(){}},
  spawnEnemy(type,x,y,patrol){const e=context.Game.prototype.spawnEnemy.call(this,type,x,y,patrol);spawned.push(e);return e},
  killEnemy(e){e.dead=true}};
Object.assign(tutorial,{stage:0,pullSeen:false,revealPlatform(){revealed++},show(){updates++},dialogue:{hidden:false},npc:{x:0,setFlipX(){},setTintFill(){},clearTint(){}},scene});
tutorial.onKick();tutorial.onLoadoutChange();assert.equal(tutorial.stage,0,'Out-of-order actions cannot skip the pull lesson');
tutorial.update(false,false);tutorial.scene.drib=true;tutorial.update(false,false);assert.equal(tutorial.stage,0,'Walking into the ball is not a pull');
tutorial.scene.drib=false;tutorial.update(true,true);assert.equal(tutorial.stage,0,'Pull lesson waits for possession');
tutorial.scene.drib=true;tutorial.update(true,false);assert.equal(tutorial.stage,1);
// The aim lesson now spawns a walker and waits for it to die.
assert.equal(spawned.length,1,'The aim lesson spawns exactly one target');
assert.equal(scene.enemies.length,1,'The target joins the level enemy list');
assert.equal(tutorial.target.harmless,true,'Level 1 stays hazard-free: the target cannot hurt the player');
tutorial.onLoadoutChange();assert.equal(tutorial.stage,1,'Changing loadout cannot skip the aim lesson');
tutorial.onKick();assert.equal(tutorial.stage,1,'A kick that misses does not clear the aim lesson');
tutorial.update(false,false);assert.equal(tutorial.stage,1,'The target is still alive');
tutorial.target.dead=true;tutorial.update(false,false);assert.equal(tutorial.stage,2,'Killing the target clears the aim lesson');
tutorial.onLoadoutChange();assert.equal(tutorial.stage,2,'Unreleased loadouts cannot block or advance training');assert.equal(tutorial.done,false);assert.equal(revealed,1);
assert.equal(spawned.length,1);
tutorial.scene.p.body={blocked:{down:true},bottom:256,left:230,right:242};
tutorial.platform={body:{top:256,left:224,right:288}};
tutorial.update(false,false);assert.equal(tutorial.stage,2,'Ordinary platform contact cannot skip Ball Jump');
tutorial.onBallJump();tutorial.scene.p.body.bottom=368;tutorial.update(false,false);assert.equal(tutorial.stage,2,'A bounce alone is not completion');
tutorial.scene.p.body.bottom=256;tutorial.update(false,false);assert.equal(tutorial.done,true);
tutorial.onKick();tutorial.onLoadoutChange();assert.equal(tutorial.stage,3);assert.equal(confirmations,3);assert.equal(updates,3);assert.equal(goalChecks,3);
tutorial.scene.won=true;tutorial.update(false,false);assert.equal(tutorial.dialogue.hidden,true);
console.log('PASS: ordered pull, aim-and-kill and Ball Jump lessons; no unavailable loadout requirement; practice target and landing gate work');
// Typewriter uses one timer, pauses in menus, and stops old lines before replacing them.
const reveal={textContent:''},measure={textContent:''},paragraph={querySelector:selector=>selector==='.coach-reveal'?reveal:measure,setAttribute(){}};
const writer=Object.create(context.CoachTutorial.prototype);let timer;
writer.dialogue={hidden:false,querySelector:()=>paragraph};
writer.scene={menuOpen:false,won:false,time:{addEvent(config){timer={callback:config.callback,removed:false,remove(){this.removed=true}};return timer}}};
const tick=()=>{if(!timer.removed)timer.callback()};
const soundsBefore=confirmations;writer.writeDialogue('Hi!');assert.equal(reveal.textContent,'');assert.equal(measure.textContent,'Hi!');
tick();assert.equal(reveal.textContent,'H');assert.equal(confirmations,soundsBefore+1);
writer.scene.menuOpen=true;tick();assert.equal(reveal.textContent,'H');assert.equal(confirmations,soundsBefore+1);
writer.scene.menuOpen=false;const oldTimer=timer;writer.writeDialogue('OK');assert.equal(oldTimer.removed,true);
tick();tick();assert.equal(reveal.textContent,'OK');assert.equal(timer.removed,true);
const audioContext=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/audio.js'),'utf8')+';globalThis.audioTest=audio',audioContext);
const sound=audioContext.audioTest,tones=[];sound.ctx={currentTime:0};sound.note=(...args)=>tones.push(args);
sound.sfx('talk');sound.sfx('talk');assert.equal(tones.length,2);assert.notEqual(tones[0][0],tones[1][0]);assert.equal(tones[0][3],'square');assert.equal(tones[0][2],.075);assert.equal(tones[0][4],.14);assert.equal(tones[0][5],sound.effects);
sound.muted=true;sound.sfx('talk');assert.equal(tones.length,2,'Talking respects mute');
console.log('PASS: gradual text and talk blips stay synchronized, pause cleanly, cancel old lines, vary pitch and respect mute');
