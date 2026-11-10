const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),source=require('../scripts/game-source.cjs').readGameLogic(root);
const context=vm.createContext({T:16,Phaser:{Scene:class{}}});
vm.runInContext(source+';globalThis.data={Game,LV}',context);
const {Game,LV}=context.data;
const scene=new Game(),camera={zoom:2,worldView:{left:0,top:500,right:480,bottom:770},centerOn(x,y){this.center={x,y}}};
Object.assign(scene,{p:{x:240,y:640},tg:{setPosition(x,y){this.x=x;this.y=y}},cameras:{main:camera}});
for(let i=0;i<LV.length;i++){
 if(LV[i].overview)continue;
 scene.i=i;
 for(const [x,y] of [[0,0],[1000,0],[0,1000],[1000,1000],[260,650]]){
  scene.ball={x,y};camera.center=null;scene.updateCameraTarget();
  assert.equal(scene.tg.x,scene.p.x);assert.equal(scene.tg.y,scene.p.y);assert.equal(camera.center,null,'A ball shot alone cannot move the camera');assert.equal(camera.zoom,2);
 }
}
scene.i=0;scene.p={x:600,y:900};scene.updateCameraTarget();assert.deepEqual(camera.center,{x:600,y:900},'Recenter on a player who leaves the view');
scene.i=5;scene.updateCameraTarget();assert.equal(scene.tg.x,LV[5].w*8);assert.equal(scene.tg.y,(LV[5].h*16-(LV[5].ceilingLift||0))/2,'Level 6 keeps its centered overview');
console.log('PASS: all normal levels follow the player regardless of ball position; player visibility recovers; level 4 overview and zoom remain unchanged');
