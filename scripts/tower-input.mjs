import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
export async function towerInput(browser,root,entryUrl=null,entryOnly=false){
 const out=path.join(root, '..', 'artifacts',entryOnly?(entryUrl?'tower-corrected-entry-localhost':'tower-corrected-entry'):(entryUrl?'tower-corrected-localhost':'tower-corrected'));await fs.mkdir(out,{recursive:true});await Promise.all(['result.json','entry-result.json'].map(name=>fs.rm(path.join(out,name),{force:true})));
 const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out}});
 const page=await context.newPage();const actions=[],started=Date.now();
 const wait=ms=>page.waitForTimeout(ms);
 const down=async key=>{actions.push({t:Date.now()-started,type:'keydown',key});await page.keyboard.down(key);};
 const up=async key=>{actions.push({t:Date.now()-started,type:'keyup',key});await page.keyboard.up(key);};
 const read=()=>page.evaluate(()=>{const s=game.scene.getScene('game');return {i:s.i,won:s.won,health:s.health,deaths:s.deaths,bounces:s.bounces,ballJumpCool:s.ballJumpCool,drib:s.drib,p:{x:s.p.x,y:s.p.y,vx:s.p.body.velocity.x,vy:s.p.body.velocity.y,ground:s.p.body.blocked.down},b:{x:s.ball.x,y:s.ball.y},enemies:s.enemies.map((e,index)=>({index,dead:e.dead,x:e.o.x,y:e.o.y,vx:e.o.body.velocity.x,vy:e.o.body.velocity.y})),relays:s.switches.map(sw=>sw.on),entryGate:s.doors[0].open,gate:s.doors.at(-1).open,checkpoint:s.checkpoint};});
 const aim=async angle=>{
  for(let pass=0;pass<3;pass++){
   const p=await page.evaluate(angle=>{const s=game.scene.getScene('game'),c=s.cameras.main,r=game.canvas.getBoundingClientRect(),x=s.ball.x+Math.cos(angle)*80,y=s.ball.y+Math.sin(angle)*80;
    const o=c.getWorldPoint(0,0),a=c.getWorldPoint(1,0),b=c.getWorldPoint(0,1),ax=a.x-o.x,ay=a.y-o.y,bx=b.x-o.x,by=b.y-o.y,det=ax*by-ay*bx;
    return {x:r.left+((x-o.x)*by-(y-o.y)*bx)/det*r.width/960,y:r.top+(ax*(y-o.y)-ay*(x-o.x))/det*r.height/540};},angle);
   await page.mouse.move(p.x,p.y);await wait(25);
   if(pass===2){actions.push({t:Date.now()-started,type:'click',...p});await page.mouse.click(p.x,p.y,{delay:20});}
  }
 };
 const move=async(target,maxSteps=130)=>{
  await down('KeyR');
  for(let n=0;n<maxSteps;n++){
   const s=await read();if(s.won)return;
   const dx=target-s.p.x,desired=Math.max(-120,Math.min(120,dx*5));
   if(Math.abs(dx)<3&&Math.abs(s.p.vx)<15&&s.p.ground){await up('ArrowLeft');await up('ArrowRight');await wait(100);return;}
   if(s.p.vx<desired-12){await up('ArrowLeft');await down('ArrowRight');}
   else if(s.p.vx>desired+12){await up('ArrowRight');await down('ArrowLeft');}
   else{await up('ArrowLeft');await up('ArrowRight');}
   await wait(35);
  }
  throw Error('Could not reach x='+target);
 };
 const attack=async index=>{
  const attackDeaths=(await read()).deaths;
  for(let attempt=0;attempt<7;attempt++){
   let s=await read();if(s.deaths!==attackDeaths)throw Error('Respawned during attack');if(s.enemies[index].dead)return;
   await down('KeyR');
   await page.waitForFunction(()=>game.scene.getScene('game').drib,null,{timeout:3000});
   await wait(120);await up('KeyR');await wait(35);s=await read();const e=s.enemies[index];
   let angle;
   for(let k=0;k<3;k++){
    const t=angle===undefined?Math.abs(e.x-s.b.x)/700:Math.abs(e.x-s.b.x)/(800*Math.max(.05,Math.abs(Math.cos(angle))));
    const dx=e.x+e.vx*t-s.b.x,dy=s.b.y-(e.y+e.vy*t),d=Math.max(.1,Math.abs(dx)),v2=640000,g=350;
    const disc=v2*v2-g*(g*d*d+2*dy*v2);
    const theta=Math.atan((v2-Math.sqrt(Math.max(0,disc)))/(g*d));angle=dx>=0?-theta:Math.PI+theta;
   }
   await aim(angle);await wait(260);
   console.log('GUARD',index,'attempt',attempt,'remaining',(await read()).enemies.filter(e=>!e.dead).length);
  }
  assert.equal((await read()).enemies[index].dead,true,'Could not defeat guard '+index);
 };
 const jump=async(direction,expectedY)=>{
  await up('ArrowLeft');await up('ArrowRight');await up('KeyR');await up('Space');
  for(let n=0;n<80;n++){if((await read()).p.ground)break;await wait(25);}
  await wait(50);await down('Space');await down(direction>0?'ArrowRight':'ArrowLeft');
  await wait(650);await up('Space');
  for(let n=0;n<50;n++){const s=await read();if(s.p.ground)break;await wait(25);}
  await up(direction>0?'ArrowRight':'ArrowLeft');await down('KeyR');await wait(100);
  const s=await read();
  if(s.p.y>expectedY+12)throw Error(`Missed ledge: expected y ${expectedY}, actual ${s.p.y}`);
 };
 const bounceTo=async(targetX,expectedY)=>{
  const before=await read();
  await up('ArrowLeft');await up('ArrowRight');await up('Space');await down('KeyR');
  await page.waitForFunction(()=>game.scene.getScene('game').drib,null,{timeout:3000});
  await page.waitForFunction(()=>game.scene.getScene('game').ballJumpCool<=0,null,{timeout:3000});
  await down('Space');
  await page.waitForFunction(n=>game.scene.getScene('game').bounces>n,before.bounces,{timeout:3000});
  await up('KeyR');
  console.log('BOUNCE',targetX,expectedY,JSON.stringify((await read()).p));
  for(let n=0;n<110;n++){
    const state=await read();if(state.deaths>before.deaths)throw Error('Respawned in left shaft');
    const dx=targetX-state.p.x,desired=Math.max(-120,Math.min(120,dx*6));
    if(state.p.vx<desired-10){await up('ArrowLeft');await down('ArrowRight');}
    else if(state.p.vx>desired+10){await up('ArrowRight');await down('ArrowLeft');}
    else{await up('ArrowLeft');await up('ArrowRight');}
    if(state.p.ground&&state.p.y<before.p.y-30){await up('ArrowLeft');await up('ArrowRight');await up('Space');await down('KeyR');assert.ok(state.p.y<=expectedY+12,'Missed left landing');return;}
    await wait(20);
  }
  throw Error('Missed bounce landing');
 };
 const enterTower=async()=>{
  const L=await page.evaluate(()=>LV[7]);
  for(let attempt=0;attempt<12;attempt++){
   try{
    if((await read()).p.x<208){
     if((await read()).p.y>1600)await move(152);
     for(const [x,y,w] of [...L.descent].reverse()){
      if((await read()).p.y>y*16+5)await bounceTo((x+w/2)*16,y*16-7);
     }
     if(!(await read()).relays[0]){
      assert.equal((await read()).entryGate,false,'The upper lock must stay closed throughout the left climb');
      await page.screenshot({path:path.join(out,'00-upper-lock-closed.png')});
      await move(L.s[0][0]*16+8);await down('KeyR');
      await page.waitForFunction(()=>game.scene.getScene('game').switches[0].on,null,{timeout:3000});
     }
     assert.equal((await read()).entryGate,true,'Upper switch must open the first lock');
     await page.screenshot({path:path.join(out,'00-first-lock-open.png')});
     if((await read()).p.y>133)await bounceTo(160,121);
     await page.screenshot({path:path.join(out,'00-upper-lock.png')});
     await move(160);await jump(1,153);
    }
    assert.ok((await read()).p.x>208,'Player must cross into the right tower over the summit');
    assert.ok(Math.abs((await read()).p.y-(L.ascent.at(-1)[1]*16-7))<12,'Entry must finish on the top tower platform');
    await page.screenshot({path:path.join(out,'00-entered-tower.png')});return;
   }catch(error){if(page.isClosed()||attempt===11)throw error;console.log('RETRY LEFT ENTRY',attempt+1,error.message);}
  }
 };
 try{
  await page.goto(entryUrl||pathToFileURL(path.join(root,'index.html')).href);
  await page.waitForFunction(()=>window.game?.scene.getScene('game')?.p);
  await page.locator('[data-level="8"]').click();await page.waitForTimeout(100);await page.locator('.upgrade-grid button').nth(0).click();await wait(150);await page.locator('.menu-action').click();await wait(300);
  const L=await page.evaluate(()=>LV[7]);
  await page.screenshot({path:path.join(out,'01-locked-start.png')});
  const initial=await read();assert.ok(initial.p.x<192);assert.equal(initial.entryGate,false);assert.equal(initial.gate,false);
  await enterTower();
  await fs.writeFile(path.join(out,'entry-result.json'),JSON.stringify({url:entryUrl,normalInputsOnly:true,state:await read()},null,2));
  if(entryOnly){console.log('PASS: original goal, sealed divider, relocated upper-left lock opens first, ball-bounce route enters the tower');return;}
  let seenDeaths=(await read()).deaths,retries=0,stumbles=0;
  for(let stage=L.ascent.length-1;stage>=0;stage--){
   try{
   const ledge=L.ascent[stage],expectedY=ledge[1]*16-7;
   let s=await read();
   assert.ok(Math.abs(s.p.y-expectedY)<12,`Stage ${stage} player left authored platform`);
   const encounters={0:[[280,0]],1:[[450,1]],2:[[350,10]],5:[[450,11]],6:[[370,2],[350,3]],9:[[450,13]],10:[[350,12]],12:[[370,4]],13:[[450,5]],16:[[350,14]],19:[[450,15]],20:[[370,6]],22:[[350,7]],26:[[350,16]],28:[[370,8],[390,9]]}[stage]||[];
   for(const [x,index] of encounters){if((await read()).enemies[index].dead)continue;if((await read()).deaths>seenDeaths)throw Error('Respawned before encounter');await move(x);if((await read()).deaths>seenDeaths)throw Error('Respawned while approaching encounter');await attack(index);}
   const relay={30:1,18:2,9:3}[stage];
   if(relay!==undefined){
    await move(L.s[relay][0]*16+8);await down('KeyR');await wait(300);
    assert.equal((await read()).relays[relay],true,'Relay failed to activate');
    await page.screenshot({path:path.join(out,`relay-${relay+1}.png`)});
   }
   console.log('ASCENT',stage,JSON.stringify((await read()).p));
   if(stage>0){
    await move(stage%2?390:426);
    const current=await read();
    const actual=L.ascent.findIndex(ledge=>Math.abs(current.p.y-(ledge[1]*16-7))<12);
    assert.ok(actual>=0&&actual<stage,'Descent must reach a lower tower platform');
    stage=actual+1;
   }
   }catch(error){
    const current=await read();
    if(current.deaths<=seenDeaths){
      const actual=L.ascent.findIndex(ledge=>Math.abs(current.p.y-(ledge[1]*16-7))<12);
      if(actual>=0&&stumbles++<30){stage=actual+1;console.log('RETRY LEDGE',actual);continue;}
      throw error;
    }
    if(retries++>=12)throw error;
    seenDeaths=current.deaths;
    const resume=current.checkpoint?({101:31,15:31,72:9,45:18,9:30}[current.checkpoint.p[1]]):31;
    console.log('RESPAWN: resuming at stage',resume);
    if(resume===31)await enterTower();
    seenDeaths=(await read()).deaths;
    stage=(resume===31?30:resume)+1;
   }
  }
  let s=await read();assert.ok(s.enemies.every(e=>e.dead));assert.equal(s.gate,true);
  await page.screenshot({path:path.join(out,'02-summit-unlocked.png')});
  await move(680,350);
  await page.waitForFunction(()=>{const s=game.scene.getScene('game');return s.p.body.blocked.down&&s.p.y>1630;},null,{timeout:4000});
  await move((L.g[0]+1)*16+8);await down('KeyR');
  await page.waitForFunction(()=>game.scene.getScene('game').won,null,{timeout:3000});
  await page.screenshot({path:path.join(out,'04-goal.png')});
  s=await read();await fs.writeFile(path.join(out,'result.json'),JSON.stringify({date:new Date().toISOString(),url:entryUrl,normalInputsOnly:true,state:s},null,2));
  console.log('PASS: complete tower descent, all guards, four relays, relocated lock and original goal through normal inputs');
 }catch(error){console.error('TOWER STATE',JSON.stringify(await read()));await page.screenshot({path:path.join(out,'failure.png')});throw error;}
 finally{await fs.writeFile(path.join(out,'actions.json'),JSON.stringify(actions,null,2));await context.close();}
}
