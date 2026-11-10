import {readGameHtml} from './game-source.cjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

export async function combatInput(browser,root,entryUrl=null){
 const out=path.join(root, '..', 'artifacts','combat-input');await fs.mkdir(out,{recursive:true});
 const buildSha256=createHash('sha256').update(readGameHtml(root)).digest('hex');
 await fs.rm(path.join(out,'results.json'),{force:true});const results=[];
 for(const level of [3,4]){
  const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out}}),page=await context.newPage(),actions=[],began=Date.now();
  const key=async(k,down)=>{actions.push({t:Date.now()-began,key:k,down});await page.keyboard[down?'down':'up'](k)};
  const wait=ms=>page.waitForTimeout(ms);
  const read=()=>page.evaluate(()=>{const s=game.scene.getScene('game');return {won:s.won,deaths:s.deaths,health:s.health,kicks:s.kicks,bounces:s.bounces,rocket:s.gloveCool,drib:s.drib,p:{x:s.p.x,y:s.p.y,vx:s.p.body.velocity.x,ground:s.p.body.blocked.down},enemies:s.enemies.map(e=>({dead:e.dead,x:e.o.x,y:e.o.y,vx:e.o.body.velocity.x,vy:e.o.body.velocity.y,visible:s.los(s.ball.x,s.ball.y,e.o.x,e.o.y)})),ball:{x:s.ball.x,y:s.ball.y},locks:s.switches.map(sw=>sw.on),upgrades:[...profile.upgrades]}});
  let seen=0;
  const alive=async()=>{const s=await read();assert.equal(s.bounces,0,'Rocket route cannot use Ball Jump');if(s.deaths!==seen)throw Error('Respawned');return s};
  const release=async()=>{for(const k of ['ArrowLeft','ArrowRight','Space'])await key(k,false)};
  const move=async target=>{
   await key('Space',false);await key('KeyR',true);
   for(let n=0;n<220;n++){
    const s=await alive();if(s.won)return;
    const dx=target-s.p.x,desired=Math.max(-120,Math.min(120,dx*5));
    if(Math.abs(dx)<3&&Math.abs(s.p.vx)<15&&s.p.ground){await key('ArrowLeft',false);await key('ArrowRight',false);return;}
    if(s.p.vx<desired-12){await key('ArrowLeft',false);await key('ArrowRight',true)}
    else if(s.p.vx>desired+12){await key('ArrowRight',false);await key('ArrowLeft',true)}
    else{await key('ArrowLeft',false);await key('ArrowRight',false)}
    await wait(35);
   }
   throw Error('Cannot reach '+target);
  };
  const jump=async(direction,expectedY)=>{
   await release();await page.waitForFunction(()=>game.scene.getScene('game').p.body.blocked.down,null,{timeout:2500});
   await key('Space',true);if(direction)await key(direction>0?'ArrowRight':'ArrowLeft',true);
   await wait(650);await key('Space',false);
   for(let n=0;n<50;n++){if((await alive()).p.ground)break;await wait(25)}
   await key('ArrowLeft',false);await key('ArrowRight',false);
   const landing=await alive();console.log('COMBAT JUMP',level,expectedY,JSON.stringify(landing.p));
   assert.ok(landing.p.y<=expectedY+12,'Normal jump missed platform');
  };
  const attack=async index=>{
   await key('KeyR',true);
   await page.waitForFunction(()=>game.scene.getScene('game').drib,null,{timeout:3500});
   await key('KeyR',false);await wait(40);
   const s=await alive(),e=s.enemies[index];if(e.dead)return;
   let angle;
   for(let n=0;n<3;n++){
    const t=angle===undefined?Math.abs(e.x-s.ball.x)/700:Math.abs(e.x-s.ball.x)/(800*Math.max(.05,Math.abs(Math.cos(angle))));
    const dx=e.x+e.vx*t-s.ball.x,dy=s.ball.y-(e.y+e.vy*t),d=Math.max(.1,Math.abs(dx)),v2=640000,g=350;
    const theta=Math.atan((v2-Math.sqrt(Math.max(0,v2*v2-g*(g*d*d+2*dy*v2))))/(g*d));angle=dx>=0?-theta:Math.PI+theta;
   }
   const point=await page.evaluate(angle=>{
    const s=game.scene.getScene('game'),c=s.cameras.main,r=game.canvas.getBoundingClientRect(),x=s.ball.x+Math.cos(angle)*32,y=s.ball.y+Math.sin(angle)*32;
    const o=c.getWorldPoint(0,0),a=c.getWorldPoint(1,0),b=c.getWorldPoint(0,1),ax=a.x-o.x,ay=a.y-o.y,bx=b.x-o.x,by=b.y-o.y,det=ax*by-ay*bx;
    return {x:r.left+((x-o.x)*by-(y-o.y)*bx)/det*r.width/960,y:r.top+(ax*(y-o.y)-ay*(x-o.x))/det*r.height/540};
   },angle);
   await page.mouse.move(point.x,point.y);await wait(30);actions.push({t:Date.now()-began,type:'click',...point});
   await page.mouse.click(point.x,point.y,{delay:60});await wait(350);await key('KeyR',true);
  };
  const clear=async(indices,x,expectedY=null)=>{
   if((await read()).enemies.filter((e,i)=>indices.includes(i)&&!e.dead).length===0)return;
   await move(x);
   if(expectedY!==null)assert.ok((await alive()).p.y<=expectedY+12,'Fell below combat platform');
   for(let n=0;n<70;n++){
    const s=await alive();if(indices.every(i=>s.enemies[i].dead))return;
    const target=indices.find(i=>!s.enemies[i].dead&&s.enemies[i].visible);
    if(target!==undefined)await attack(target);
    await jump(0,expectedY??s.p.y);await wait(100);
   }
   throw Error('Rocket failed to clear '+indices);
  };
  try{
   await page.goto(entryUrl||pathToFileURL(path.join(root,'index.html')).href);
   await page.waitForFunction(()=>window.game?.scene.getScene('game')?.p);
   await page.locator(`[data-level="${level}"]`).click();await page.waitForTimeout(100);await page.locator('.upgrade-grid button').nth(2).click();await wait(100);await page.locator('.menu-action').click();await wait(200);
   const L=await page.evaluate(()=>LV[game.scene.getScene('game').i]);
   await page.screenshot({path:path.join(out,`level-${level}-start.png`)});
   for(let attempt=0;attempt<30;attempt++){
    try{
     seen=(await read()).deaths;
     if(level===3){
      await move(56);await jump(1,361);
      const guards=[[0,1,10,14],[2,3,11,15],[4,5,12],[6,7,13],[8,16],[9]],points=[192,336,192,336,416,552];
      for(let stage=0;stage<L.x.length;stage++){
       if(stage===2)await move(L.s[0][0]*16+8);
       await clear(guards[stage],points[stage],L.x[stage][1]*16-7);
       if(stage===L.x.length-1){await move(552);break;}
       const next=L.x[stage+1],dir=next[0]>L.x[stage][0]?1:-1;
       const edge=dir>0?(next[0]<L.x[stage][0]+L.x[stage][2]?next[0]*16-48:(L.x[stage][0]+L.x[stage][2])*16-16):L.x[stage][0]*16+16;
       await move(edge);
       await jump(dir,next[1]*16-7);
      }
     }else{
      await clear([0],100);await move(136);await jump(1,265);
      await clear([4,5,6],220);await move(264);await jump(0,329);
      await clear([1],300);await move(408);await clear([2,3,7],440);await move(456);
     }
     await page.waitForFunction(()=>game.scene.getScene('game').won,null,{timeout:3000});break;
    }catch(error){
     console.log('COMBAT RETRY',level,attempt,error.message);
     await release();if(attempt===29)throw error;
     seen=(await read()).deaths;try{await move(56)}catch{seen=(await read()).deaths}
    }
   }
   const state=await read();assert.equal(state.won,true);assert.equal(state.bounces,0);assert.deepEqual(state.upgrades,['glove']);
   await page.screenshot({path:path.join(out,`level-${level}-goal.png`)});results.push({level,buildSha256,normalInputsOnly:true,state});
   console.log('PASS: level '+level+' completed using Rocket and normal jumps only');
  }catch(error){console.error('COMBAT STATE',level,JSON.stringify(await read()));await page.screenshot({path:path.join(out,`level-${level}-failure.png`)});throw error;}
  finally{await fs.writeFile(path.join(out,`level-${level}-actions.json`),JSON.stringify(actions,null,2));await context.close()}
 }
 await fs.writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));
}
