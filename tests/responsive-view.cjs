const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const source=require('../scripts/game-source.cjs').readGameLogic();
const context=vm.createContext({T:16,Phaser:{Scene:class{}}});
vm.runInContext(source+';globalThis.data={Game,LV}',context);
const {Game,LV}=context.data,s=new Game(),camera={setViewport(x,y,w,h){this.viewport=[x,y,w,h];this.width=w;this.height=h;return this},setZoom(z){this.zoom=z;return this},setBounds(x,y,w,h){this.bounds={x,y,w,h};return this},centerOn(){return this}};
let mountains=[];const mountainShapes=new Map();
const bg=new Proxy({},{get:(_target,key)=>{if(key==='clear')return()=>{mountains=[];return bg};if(key==='fillTriangle')return(...points)=>{mountains.push(points);return bg};return()=>bg}});
Object.assign(s,{cameras:{main:camera},levelBackdrop:bg,tg:{x:100,y:100},scale:{gameSize:{}}});
for(let i=0;i<LV.length;i++)for(const [width,height] of [[960,540],[1280,720],[1920,1080],[2560,1080],[390,844],[844,390]]){
 s.i=i;s.scale.gameSize={width,height};s.resizeGameView();
 assert.ok(mountains.length>0);
 assert.ok(new Set(mountains.map(([x,y,px,py])=>y-py)).size>3,'The skyline needs distinct mountain heights');
 assert.equal(new Set(mountains.map(([x,y,px,py,right])=>right-x)).size,1,'Only mountain height varies');
 mountains.forEach(([x,y,px,py,right],index)=>{assert.equal(px,(x+right)/2,'Peaks must be centered');if(index)assert.ok(x>mountains[index-1][4],'Mountains must have a gap between them')});
 for(const [x,y,peakX,peakY,rightX,rightY] of mountains){
  const shape=[peakX-x,y-peakY,rightX-x,rightY-y];
  if(mountainShapes.has(x))assert.ok(shape.every((value,index)=>Math.abs(value-mountainShapes.get(x)[index])<1e-8),'Mountain proportions cannot stretch with level height or screen size');
  else mountainShapes.set(x,shape);
 }
 assert.deepEqual(camera.viewport,[0,0,width,height]);
 if(width/camera.zoom>=LV[i].w*16)assert.ok(Math.abs(camera.bounds.x+camera.bounds.w/2-LV[i].w*8)<1e-6,'A room narrower than the viewport stays horizontally centered');assert.ok(Number.isFinite(camera.zoom)&&camera.zoom>0);
 if(!LV[i].overview&&width/height>=640/540)assert.equal(height/camera.zoom,270,'Landscape preserves vertical gameplay framing');
}
console.log('PASS: all nine levels use the full viewport across desktop, ultrawide, portrait and landscape sizes; proportional zoom preserves landscape framing; mountain dimensions remain consistent across every level');
