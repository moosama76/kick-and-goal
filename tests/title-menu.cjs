const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
let reduced=false,shot,delay,started,focus,sounds=[];
const node=()=>({hidden:false,disabled:false,classList:{add(){},remove(){}},focus(){focus=this},dataset:{}}),nodes={'title-options':node(),'title-music-volume':node()};
nodes['title-options'].hidden=true;
const buttons=[node(),node()];buttons[0].dataset.titleAction='play';buttons[1].dataset.titleAction='options';
const context=vm.createContext({Phaser:{Scene:class{},BlendModes:{ADD:1}},window:{matchMedia:()=>({matches:reduced})},$:id=>nodes[id],audio:{start(){},sfx:name=>sounds.push(name)}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/title.js'),'utf8')+';globalThis.Title=Title',context);
const scene=new context.Title();
scene.game={canvas:{getBoundingClientRect:()=>({left:0,top:0,width:1280,height:720})}};
scene.scale={gameSize:{width:1280,height:720}};
scene.player={x:346,displayWidth:96,displayHeight:96,setTexture(){return this},setFlipX(){return this},setScale(){return this},setPosition(){return this}};
scene.ground=576;
scene.ball={displayHeight:60,setPosition(){return this},setRotation(){return this},setScale(){return this},setAlpha(){return this},setTexture(){return this},setVisible(){return this}};
scene.actions={setAttribute(){},removeAttribute(){},querySelectorAll:()=>buttons};
scene.tweens={add:config=>shot=config};scene.time={delayedCall:(_duration,callback)=>delay=callback,now:0};
scene.scene={start:(...args)=>started=args};
scene.menuImpact=()=>{};scene.resetTitleBall=()=>{};scene.drawShadows=()=>{};scene.kickFlash=()=>{};scene.ballTrail=()=>{};
scene.cameras={main:{shake(){}}};
scene.artScale=4;scene.playerBaseX=346;
const rect={left:805,top:300,width:200,height:84};buttons.forEach(b=>b.getBoundingClientRect=()=>rect);

// Shot geometry must track the measured button at any canvas size.
for(const width of [390,1280,2560]){
 scene.scale.gameSize.width=width;scene.game.canvas.getBoundingClientRect=()=>({left:10,top:20,width:width/2,height:360});
 const end=scene.titleShotPosition(buttons[0],1);
 assert.equal(end.x,(rect.left-10)*2);assert.equal(end.y,(rect.top+rect.height/2-20)*2);
}
scene.scale.gameSize.width=1280;scene.game.canvas.getBoundingClientRect=()=>({left:0,top:0,width:1280,height:720});

// One action per shot: a second click while busy cannot queue a competing animation.
scene.kickMenuButton(buttons[1]);assert.equal(scene.busy,true);assert.ok(buttons.every(b=>b.disabled));
const first=shot;scene.kickMenuButton(buttons[0]);assert.equal(shot,first,'Rapid clicks cannot queue competing actions');
assert.equal(started,undefined);assert.equal(nodes['title-options'].hidden,true);

// Drive the tween through its phases: wind-up, release, flight, impact.
const run=config=>{for(const p of [0,.1,.2,.3,.45,.6,.8,1]){config.targets.progress=p;config.onUpdate&&config.onUpdate()}config.onComplete&&config.onComplete()};
run(shot);
assert.equal(started,undefined,'Navigation waits for impact');
delay();
assert.equal(scene.optionsOpen,true);assert.equal(scene.actions.hidden,true);assert.equal(focus,nodes['title-options']);
assert.ok(sounds.includes('kick'),'the kick sound fires on release');

// Reduced motion shortens the shot but still delivers the action.
scene.optionsOpen=false;scene.actions.hidden=false;reduced=true;
scene.kickMenuButton(buttons[0]);assert.ok(shot.duration<first.duration);
run(shot);delay();
assert.equal(started[0],'game');assert.equal(started[1].i,0);assert.equal(started[1].showLevels,true);
console.log('PASS: title shots track measured buttons across sizes; one action per shot; wind-up, flight and impact phases run; Play and Options open after impact; reduced motion supported');
