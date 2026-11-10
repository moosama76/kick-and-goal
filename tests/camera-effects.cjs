const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..');
// Load the actual pinned Phaser effects and matrix without booting a DOM renderer.
// Only replace the bundle entrypoint; the engine modules under test are unchanged.
const vendor=fs.readFileSync(path.join(root,'vendor/phaser-4.2.0.min.js'),'utf8');
const entry=/i\(85454\)(?=\}\)\(\)\);?$)/;
assert.ok(entry.test(vendor),'Update the test loader if the pinned Phaser bundle changes');
let random=.9;
const engine=vm.createContext({module:{exports:{}},exports:{},Math:Object.assign(Object.create(Math),{random:()=>random})});
vm.runInContext(vendor.replace(entry,'i'),engine);
const requireVendor=engine.module.exports,Shake=requireVendor(30330),Matrix=requireVendor(61340),Flash=requireVendor(10662);
const source=require('../scripts/game-source.cjs').readGameLogic(root),app=vm.createContext({T:16,Phaser:{Scene:class{}}});
vm.runInContext(source+';globalThis.data={Game,LV}',app);
const {Game,LV}=app.data;
function camera(width,height,zoom,roundPixels=false){
 const c={width,height,zoom,roundPixels,scene:{},matrix:new Matrix(),emit(){}};
 c.shakeEffect=new Shake(c);c.flashEffect=new Flash(c);
 c.shake=(...args)=>c.shakeEffect.start(...args);c.flash=(...args)=>c.flashEffect.start(...args);
 return c;
}
function displacement(c){
 c.shakeEffect.update(0,1);c.matrix.applyITRS(0,0,0,c.zoom,c.zoom);c.shakeEffect.preRender();
 return {x:c.matrix.tx,y:c.matrix.ty};
}
function near(actual,expected,label){assert.ok(Math.abs(actual-expected)<1e-4,`${label}: ${actual} vs ${expected}`)}
// Reproduce the regression using engine transforms, not a copy of its formula.
const before=camera(960,540,2),after=camera(1920,1080,4);
before.shake(80,.0035);after.shake(80,.0035);
const old=displacement(before),broken=displacement(after);
near(broken.x/(old.x*2),4,'Unnormalized fullscreen shake is four times the old FIT shake at 1080p');
const game=new Game();
const viewports=[[960,540],[1280,720],[1920,1080],[2560,1080],[3840,2160],[390,844],[844,390]];
// Original event tuning: checkpoint, hurt, enemy, Ball Jump, trapped ball, kick, goal.
const effects=[[100,.003],[140,.006],[120,.005],[90,.003],[150,.0015],[80,.0035],[250,.006]];
let cases=0;
for(const L of LV)for(const [w,h] of viewports)for(const [duration,strength] of effects)for(const rounded of [false,true]){
 const zoom=L.overview?Math.min(w/(L.w*16),h/(L.overviewHeight||L.h*16+(L.ceilingLift||0))):2*Math.min(h/540,w/640);
 for(const sample of [.01,.25,.5,.75,.99]){
  random=sample;
  const reference=camera(960,540,2,rounded);reference.shake(duration,strength);
  const expected=displacement(reference),current=camera(w,h,zoom,rounded);game.cameras={main:current};game.shakeCamera(duration,strength);
  const actual=displacement(current);
  near(actual.x/zoom,expected.x/2,'Horizontal shake in world units');near(actual.y/zoom,expected.y/2,'Vertical shake in world units');
  assert.equal(current.shakeEffect.duration,duration);cases++;
 }
}
// A resize during an active shake follows the new viewport without amplifying displacement.
random=.9;
const current=camera(960,540,2);game.cameras={main:current};game.shakeCamera(100,.003);
const initial=displacement(current);current.width=2560;current.height=1080;current.zoom=4;
const resized=displacement(current);near(resized.x/current.zoom,initial.x/2,'Active resize X');near(resized.y/current.zoom,initial.y/2,'Active resize Y');
// Phaser still owns overlap and completion; repeated events do not stack or extend a shake.
game.shakeCamera(250,.006);assert.equal(current.shakeEffect.duration,100);
current.shakeEffect.update(100,100);assert.equal(current.shakeEffect.isRunning,false);
current.matrix.loadIdentity();current.shakeEffect.preRender();assert.equal(current.matrix.tx,0);assert.equal(current.matrix.ty,0);
// Restore native full-opacity flashes and the original unlock duration.
const goalCamera=camera(960,540,2);game.cameras={main:goalCamera};game.goalUnlocked=()=>true;game.goalReady=false;game.goal={setVisible(){return this},setTint(){return this}};
game.updateGoalUnlock();assert.equal(goalCamera.flashEffect.duration,90);assert.equal(goalCamera.flashEffect.alpha,1);
console.log(`PASS: reproduced 4x fullscreen regression; ${cases} actual Phaser shake/matrix cases preserve original world displacement, timing, resize and overlap behavior; native flash opacity restored`);
