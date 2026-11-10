import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
export async function wavesCheck(browser,root,url){
 const out=path.join(root,'..','artifacts','waves');await fs.mkdir(out,{recursive:true});
 const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url||pathToFileURL(path.join(root,'index.html')).href);
  await page.locator('[data-title-action="play"]').click();await page.locator('[data-level="9"]').click();
  await page.waitForFunction(()=>game.scene.getScene('game')?.p);
  await page.evaluate(()=>{game.scene.getScene('game').invuln=60});
  const expected=[[2,4],[4,4],[8,4]];
  for(let wave=0;wave<3;wave++){
   await page.waitForFunction(w=>game.scene.getScene('game').waveIndex===w,wave);
   const state=await page.evaluate(()=>{const s=game.scene.getScene('game');return {counts:[s.enemies.filter(e=>e.type==='d').length,s.enemies.filter(e=>e.type==='w').length],unlocked:s.goalUnlocked()}});
   assert.deepEqual(state,{counts:expected[wave],unlocked:false});
   assert.match(await page.locator('#hud').innerText(),new RegExp(`wave: ${wave+1}/3`));
   await page.waitForTimeout(200);await page.screenshot({path:path.join(out,`wave-${wave+1}.png`)});
   // Staged kills test wave/goal rules; this is not a normal-input combat solution.
   await page.evaluate(()=>{const s=game.scene.getScene('game');s.enemies.filter(e=>e.type==='d').slice(0,-1).forEach(e=>s.killEnemy(e,null))});
   await page.waitForTimeout(60);assert.equal(await page.evaluate(()=>game.scene.getScene('game').goalUnlocked()),false);
   await page.evaluate(()=>{const s=game.scene.getScene('game');s.killEnemy(s.enemies.filter(e=>e.type==='d').at(-1),null)});
   if(wave<2){
    await page.waitForTimeout(120);
    assert.equal(await page.evaluate(()=>game.scene.getScene('game').waveIndex),wave,'Next wave must wait for the intermission');
    assert.match(await page.locator('#wave-banner').innerText(),/CLEARED/);
   }
  }
  await page.waitForFunction(()=>game.scene.getScene('game').wavesComplete);
  assert.equal(await page.evaluate(()=>game.scene.getScene('game').goalUnlocked()),false);
  await page.evaluate(()=>{const s=game.scene.getScene('game');s.enemies.filter(e=>e.type==='w').forEach(e=>s.killEnemy(e,null))});
  assert.equal(await page.evaluate(()=>game.scene.getScene('game').goalUnlocked()),true);
  await page.screenshot({path:path.join(out,'all-waves-cleared.png')});
  await page.keyboard.down('Backspace');await page.waitForTimeout(100);await page.keyboard.up('Backspace');
  assert.equal(await page.evaluate(()=>game.scene.getScene('game').waveIndex),0);
  assert.equal(await page.evaluate(()=>game.scene.getScene('game').enemies.length),6);
  assert.deepEqual(errors,[]);console.log('PASS: staged three-wave counts, sequential clears, HUD, final goal unlock and restart; screenshots and footage captured');
 }finally{await context.close()}
}
