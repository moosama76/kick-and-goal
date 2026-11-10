const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const listeners=[],doc={activeElement:null,querySelectorAll:()=>[],getElementById:id=>menus[id]};let clicks=0;
const item=(tag='BUTTON')=>({tagName:tag,getClientRects:()=>[{}],focus(){doc.activeElement=this},click(){clicks++}});
const buttons=[item(),item(),item('INPUT')],menus={};
for(const id of ['menu','title-options','title-actions'])menus[id]={visible:false,getClientRects(){return this.visible?[{}]:[]},querySelectorAll:()=>buttons};
const context=vm.createContext({window:{innerWidth:960,innerHeight:540,addEventListener:(type,fn,capture)=>listeners.push({type,fn,capture})},document:doc,Phaser:{Game:class{},AUTO:0,Scale:{RESIZE:0}},Title:class{},Game:class{},audio:{start(){},sfx(){}},drawHomeScene(){}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/main.js'),'utf8'),context);
const navigate=listeners.find(l=>l.type==='keydown'&&l.capture).fn;
function press(key,repeat=false){let stopped=false;const e={key,repeat,preventDefault(){stopped=true},stopImmediatePropagation(){}};navigate(e);return stopped}
assert.equal(press('w'),false,'Gameplay W remains available when menus are closed');
for(const menu of Object.values(menus)){
 menu.visible=true;doc.activeElement=null;
 assert.equal(press('s'),true);assert.equal(doc.activeElement,buttons[0]);
 press('s');assert.equal(doc.activeElement,buttons[1]);press('Enter');assert.equal(clicks%2,1);
 press('Enter',true);assert.equal(clicks%2,1,'Held Enter cannot repeat an action');
 press('s');assert.equal(doc.activeElement,buttons[2]);press('s');assert.equal(doc.activeElement,buttons[0]);
 press('w');assert.equal(doc.activeElement,buttons[2]);press('w');assert.equal(doc.activeElement,buttons[1]);press('Enter');assert.equal(clicks%2,0);
 menu.visible=false;
}
let columns=3;
context.window.getComputedStyle=()=>({gridTemplateColumns:Array(columns).fill('100px').join(' ')});
const levels=Array.from({length:9},()=>item()),back=item(),grid={querySelectorAll:()=>levels};
levels.forEach(button=>button.closest=()=>grid);
menus.menu.querySelectorAll=()=>[...levels,back];menus.menu.visible=true;
for(const count of [3,2]){
 columns=count;levels[0].focus();press('d');assert.equal(doc.activeElement,levels[1]);
 press('ArrowLeft');assert.equal(doc.activeElement,levels[0]);
 press('ArrowDown');assert.equal(doc.activeElement,levels[count]);
 press('w');assert.equal(doc.activeElement,levels[0]);
 press('s');assert.equal(doc.activeElement,levels[count]);
 press('ArrowUp');assert.equal(doc.activeElement,levels[0]);
 press('a');assert.equal(doc.activeElement,back);
}
menus.menu.visible=false;assert.equal(press('ArrowUp'),false);assert.equal(press('ArrowRight'),false);
console.log('PASS: WASD/arrows navigate menus and responsive level rows; Enter selects once; gameplay keys remain unaffected');
