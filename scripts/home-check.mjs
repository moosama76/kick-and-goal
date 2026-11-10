import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export async function homeCheck(browser,root,url){
 const out=path.join(root,'..','artifacts','home');await fs.mkdir(out,{recursive:true});
 const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url||pathToFileURL(path.join(root,'index.html')).href);
 // The title screen now gates the home menu: shoot PLAY, then wait for the level grid.
 await page.locator('[data-title-action="play"]').click();
 await page.waitForFunction(()=>window.game?.scene.getScene('game')?.p);
 assert.equal(await page.locator('#menu').getAttribute('data-screen'),'home');
 assert.equal(await page.locator('.level-grid button:visible').count(),9);
 assert.equal(await page.locator('.upgrade-grid').count(),0);
 await page.screenshot({path:path.join(out,'home.png')});
 for(const [width,height] of [[1920,1080],[2560,1080],[390,844],[1280,720]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(200);
  const view=await page.evaluate(()=>{const canvas=document.querySelector('#g canvas').getBoundingClientRect(),camera=game.scene.getScene('game').cameras.main;return {width:canvas.width,height:canvas.height,x:camera.x,y:camera.y,cw:camera.width,ch:camera.height}});
  assert.deepEqual(view,{width,height,x:0,y:0,cw:width,ch:height});
  await page.screenshot({path:path.join(out,`responsive-${width}.png`)});
 }

 // This scenario exercises the full kit; the fresh-profile lock path lives in progression-check.
 await page.evaluate(()=>{profile.highestLevelReached=9;profile.earnedLoadouts=['bounce','teleport','glove'];profile.upgrades=['bounce'];saveProfile()});
 await page.locator('[data-level="2"]').click();
 await page.waitForFunction(()=>!game.scene.getScene('game').menuOpen);
 assert.equal(await page.locator('#loadout-hud button').count(),3);
 await page.mouse.move(800,450);await page.mouse.wheel(0,120);await page.waitForTimeout(100);
 // Visible order is unlock order: Jump, Rocket, Blink.
 assert.equal(await page.evaluate(()=>profile.upgrades[0]),'glove');
 for(const [index,field] of ['ballJumpCool','teleportCool','gloveCool'].entries()){
  await page.evaluate(field=>{const s=game.scene.getScene('game');s.ballJumpCool=0;s.teleportCool=0;s.gloveCool=0;s[field]=2},field);
  await page.waitForTimeout(160);await page.mouse.wheel(0,120);
  assert.equal(await page.evaluate(()=>profile.upgrades[0]),['teleport','bounce','glove'][index]);
  assert.ok(await page.evaluate(field=>game.scene.getScene('game')[field]>0,field));
 }
 await page.screenshot({path:path.join(out,'loadout-switched.png')});
 // Hold each key across frames: the game reads these with JustDown, and an
 // instantaneous press can land entirely between two updates.
 const tap=async key=>{await page.keyboard.down(key);await page.waitForTimeout(120);await page.keyboard.up(key);await page.waitForTimeout(120)};
 for(const key of ['l','Escape']){
  await tap(key);
  assert.equal(await page.locator('#menu').getAttribute('data-screen'),'home');
  assert.equal(await page.locator('.upgrade-grid').count(),0);
  await page.locator('.menu-action:not(.level-menu-back)').click();assert.equal(await page.locator('#menu').isVisible(),false);
 }
 await tap('n');await page.waitForTimeout(200);
 assert.equal(await page.locator('#menu').isVisible(),false);
 assert.deepEqual(errors,[]);await context.close();
 console.log('PASS: home level selection, HUD loadouts, preserved cooldowns, L/Esc resume, direct next-level play; screenshots and footage captured');
}
