import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
export async function titleCheck(browser,root,url){
 const out=path.join(root,'..','artifacts','title');await fs.mkdir(out,{recursive:true});
 const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url||pathToFileURL(path.join(root,'index.html')).href);
  await page.waitForFunction(()=>window.game?.scene.isActive('title'));
  assert.equal(await page.locator('#title-actions button').count(),2);
  for(const [width,height] of [[1280,720],[390,844],[844,390]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(150);
   const layout=await page.evaluate(()=>{const title=game.scene.getScene('title'),button=document.querySelector('[data-title-action="play"]').getBoundingClientRect();return {playerRight:title.player.x+title.player.displayWidth/2,buttonLeft:button.left,buttonRight:button.right}});
   assert.ok(layout.playerRight<layout.buttonLeft);assert.ok(layout.buttonRight<=width);
   await page.screenshot({path:path.join(out,`title-${width}.png`)});
  }
  await page.setViewportSize({width:1280,height:720});
  await page.locator('[data-title-action="options"]').click();
  assert.equal(await page.evaluate(()=>game.scene.getScene('title').busy),true);
  await page.waitForTimeout(200);await page.screenshot({path:path.join(out,'options-shot.png')});
  await page.locator('#title-options').waitFor({state:'visible'});
  await page.locator('#title-music-volume').evaluate(el=>{el.value='25';el.dispatchEvent(new Event('input',{bubbles:true}))});
  assert.equal(await page.locator('#music-volume').inputValue(),'25');
  assert.equal(await page.evaluate(()=>audio.musicVolume),.25);
  await page.screenshot({path:path.join(out,'options.png')});await page.locator('#title-back').click();
  await page.locator('[data-title-action="play"]').click();
  await page.waitForFunction(()=>game.scene.isActive('game')&&game.scene.getScene('game').p);
  assert.equal(await page.locator('#title-screen').isVisible(),false);
  assert.equal(await page.locator('#menu').isVisible(),true);
  assert.equal(await page.locator('.level-grid button:visible').count(),9);
  await page.locator('[data-level="2"]').click();await page.waitForTimeout(150);
  const tap=async key=>{await page.keyboard.down(key);await page.waitForTimeout(120);await page.keyboard.up(key);await page.waitForTimeout(120)};
  for(const key of ['l','Escape']){
   await tap(key);await page.locator('#menu').waitFor({state:'visible'});
   assert.equal(await page.locator('.level-grid button:visible').count(),9);
   await tap(key);assert.equal(await page.locator('#menu').isVisible(),false);
  }
  await tap('Escape');await page.locator('.level-menu-back').click();
  await page.locator('#title-actions').waitFor({state:'visible'});
  assert.deepEqual(errors,[]);console.log('PASS: responsive title layout, animated menu shots, shared options, Play, and Play level selector, L/Esc toggle, level menu Back; screenshots and footage captured');
 }finally{await context.close()}
}
