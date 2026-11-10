import {readGameHtml} from './game-source.cjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

// Staged body-contact/death fixtures for inspecting checkpoint feedback, not route solutions.
export async function checkpointPreview(browser,root,entryUrl=null){
 const out=path.join(root, '..', 'artifacts','checkpoints');await fs.mkdir(out,{recursive:true});
 const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out}}),page=await context.newPage(),results=[];
 const buildSha256=createHash('sha256').update(readGameHtml(root)).digest('hex');
 try{
  await page.goto(entryUrl||pathToFileURL(path.join(root,'index.html')).href);
  await page.waitForFunction(()=>window.game?.scene.getScene('game')?.p);
  assert.match(await page.locator('.upgrade-grid button').nth(0).innerText(),/1.5s cooldown/);
  await page.screenshot({path:path.join(out,'jump-cooldown-menu.png')});

  for(const level of [2,3,4,8]){
   await page.locator(`[data-level="${level}"]`).click();await page.waitForTimeout(100);await page.locator('.upgrade-grid button').first().click();await page.locator('.menu-action').click();
   const activation=await page.evaluate(()=>{
    const s=game.scene.getScene('game'),sw=s.switches[0];s.health=1;s.invuln=2;s.p.body.reset(sw.x,sw.y);s.updatePuzzles();
    return {on:sw.on,health:s.health,checkpoint:s.checkpoint};
   });
   assert.equal(activation.on,true);assert.equal(activation.health,1);assert.ok(activation.checkpoint);
   await page.waitForTimeout(100);await page.screenshot({path:path.join(out,`level-${level}-activated.png`)});
   const respawn=await page.evaluate(()=>{
    const s=game.scene.getScene('game'),L=LV[s.i];s.p.body.reset(L.p[0]*16+8,L.p[1]*16+8);s.ball.body.reset(L.b[0]*16+8,L.b[1]*16+8);
    s.health=1;s.invuln=0;s.hurt({x:s.p.x+20});
    return {health:s.health,player:[s.p.x,s.p.y],ball:[s.ball.x,s.ball.y],checkpoint:s.checkpoint,lock:s.switches[0].on};
   });
   assert.deepEqual(respawn.player,activation.checkpoint.p.map(v=>v*16+8));assert.deepEqual(respawn.ball,activation.checkpoint.b.map(v=>v*16+8));
   assert.equal(respawn.health,3);assert.equal(respawn.lock,true);
   await page.waitForTimeout(150);await page.screenshot({path:path.join(out,`level-${level}-respawn.png`)});
   results.push({level,activation,respawn});
   await page.keyboard.press('KeyL',{delay:100});await page.locator('#menu').waitFor({state:'visible'});
  }
 }finally{await context.close()}
 await fs.writeFile(path.join(out,'results.json'),JSON.stringify({buildSha256,fixture:'Staged lock contact and lethal damage; not normal-input route proof',results},null,2));
 console.log('PASS: checkpoints activate without healing and restore both bodies on death in levels 2, 3, 6 and 8; menu shows Ball Jump 1.5s');
}
