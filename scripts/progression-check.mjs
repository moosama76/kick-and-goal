import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export async function progressionCheck(browser,root,url){
 const out=path.join(root,'..','artifacts','progression');await fs.mkdir(out,{recursive:true});
 const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url||pathToFileURL(path.join(root,'index.html')).href);
  await page.locator('[data-title-action="play"]').click();
  await page.locator('[data-level="1"]').waitFor({state:'visible'});
  assert.equal(await page.locator('.level-grid button:not(:disabled)').count(),1,'Only level 1 starts unlocked');
  assert.equal(await page.locator('.level-grid button:disabled').count(),8);
  assert.equal(await page.locator('[data-level="2"] .level-locked').innerText(),'LOCKED');
  await page.locator('[data-level="2"]').dispatchEvent('click');
  assert.equal(await page.evaluate(()=>game.scene.getScene('game').menuOpen),true,'Locked click handler cannot enter a level');
  await page.mouse.move(0,0);
  await page.screenshot({path:path.join(out,'locked-levels.png')});
  await page.keyboard.press('d');
  assert.notEqual(await page.evaluate(()=>document.activeElement?.dataset.level),'2','Keyboard skips locked levels');
  await page.locator('[data-level="1"]').click();
  await page.waitForFunction(()=>game.scene.isActive('game')&&game.scene.getScene('game').p);
  assert.deepEqual(await page.evaluate(()=>profile.earnedLoadouts),['bounce']);
  // Locked loadouts are absent from the HUD, not merely disabled.
  assert.equal(await page.locator('#loadout-hud button').count(),1);
  assert.equal(await page.locator('#loadout-hud button:disabled').count(),0);
  await page.keyboard.press('2');await page.keyboard.press('3');
  assert.equal(await page.evaluate(()=>profile.upgrades[0]),'bounce');
  await page.mouse.move(700,400);await page.mouse.wheel(0,120);await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>profile.upgrades[0]),'bounce');
  await page.screenshot({path:path.join(out,'jump-only.png')});
  await page.keyboard.down('n');await page.waitForTimeout(100);await page.keyboard.up('n');
  assert.equal(await page.evaluate(()=>game.scene.getScene('game').i),0,'N cannot skip into a locked level');
  // Scene-entry guard must reject locked indices before any ability reward is earned.
  await page.evaluate(()=>game.scene.getScene('game').scene.restart({i:5}));
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(()=>game.scene.getScene('game').i),0);
  assert.deepEqual(await page.evaluate(()=>profile.earnedLoadouts),['bounce']);
  for(const level of [2,3,4,5,6]){
   // Completion-handler fixture tests unlock persistence, not a physical route solution.
   await page.evaluate(()=>game.scene.getScene('game').completeLevel());
   await page.keyboard.down('l');await page.waitForTimeout(100);await page.keyboard.up('l');
   assert.equal(await page.locator('.level-grid button:not(:disabled)').count(),level);
   assert.equal(await page.locator(`[data-level="${level}"]`).isEnabled(),true);
   await page.locator(`[data-level="${level}"]`).click();await page.waitForTimeout(200);
   const data=await page.evaluate(()=>{const s=game.scene.getScene('game');return {name:LV[s.i].n,earned:[...profile.earnedLoadouts],enemies:s.enemies.length,locks:s.switches.length}});
   if(level===3){
     assert.deepEqual(data.earned,['bounce','glove']);
     assert.equal(await page.locator('#loadout-hud button').count(),2,'Rocket joins the visible bar at level 3');
     assert.equal(await page.locator('#loadout-hud .loadout-key').last().innerText(),'2','Visible keys renumber in unlock order');
     assert.equal(await page.locator('#loadout-earned').isVisible(),true,'Acquisition card celebrates the unlock');
     assert.match(await page.locator('#loadout-earned').innerText(),/HOMING ROCKET/);
     await page.keyboard.down('2');await page.waitForTimeout(120);await page.keyboard.up('2');
     assert.equal(await page.evaluate(()=>profile.upgrades[0]),'glove')
   }
   if(level===4){assert.match(data.name,/Overload/);assert.equal(data.enemies,8);assert.equal(data.locks,3)}
   if(level===6){assert.match(data.name,/Relay Ascent/);assert.deepEqual(data.earned,['bounce','teleport','glove']);assert.equal(data.enemies,0);assert.equal(await page.locator('#loadout-hud button').count(),3);assert.match(await page.locator('#loadout-earned').innerText(),/BALL BLINK/);await page.keyboard.down('3');await page.waitForTimeout(120);await page.keyboard.up('3');assert.equal(await page.evaluate(()=>profile.upgrades[0]),'teleport')}
   await page.screenshot({path:path.join(out,`level-${level}.png`)});
  }
  await page.reload();await page.waitForFunction(()=>window.game?.scene.isActive('title'));
  assert.deepEqual(await page.evaluate(()=>profile.earnedLoadouts),['bounce','teleport','glove']);
  await page.locator('[data-title-action="play"]').click();
  await page.locator('[data-level="1"]').waitFor({state:'visible'});
  assert.equal(await page.locator('.level-grid button:not(:disabled)').count(),6,'Unlocked levels persist after reload');
  assert.equal(await page.locator('[data-level="7"]').isDisabled(),true);
  await page.locator('[data-level="2"]').click();
  await page.waitForTimeout(200);
  await page.evaluate(()=>game.scene.getScene('game').completeLevel());
  assert.equal(await page.evaluate(()=>profile.unlocked),6,'Replaying an earlier level does not reduce progress');
  assert.deepEqual(errors,[]);console.log('PASS: fresh campaign locks, disabled keyboard/mouse choices, guarded scene entry and N shortcut, staged sequential completion unlocks, reload/replay persistence; number/wheel guards, milestone unlocks, swapped geometry/enemies and persisted progression; screenshots and footage captured');
 }finally{await context.close()}
}
