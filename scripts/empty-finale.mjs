import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {recordSolution,replaySolutions} from './solution-evidence.mjs';

// Full level 4 completion using only menu, keyboard and mouse inputs.
export async function emptyFinale(browser,root){
 const recording=recordSolution(browser,root,4,'automated-real-input');recording.catch(()=>{});
 while(!browser.contexts()[0]?.pages()[0])await new Promise(resolve=>setTimeout(resolve,20));
 const page=browser.contexts()[0].pages()[0],out=path.join(root, '..', 'artifacts','empty-finale');await fs.mkdir(out,{recursive:true});
 try{
  await page.waitForFunction(()=>window.game?.scene.getScene('game')?.i===5&&document.getElementById('menu').style.display==='grid');
  await page.locator('.menu-action').click();await page.locator('.upgrade-grid button').nth(1).click();await page.locator('.menu-action').click();
  await page.waitForTimeout(100);await page.screenshot({path:path.join(out,'starting-view.png')});
  const empty=await page.evaluate(()=>{const s=game.scene.getScene('game');return [s.enemies.length,s.switches.length,s.doors.length]});assert.deepEqual(empty,[0,0,0]);
  await page.keyboard.down('KeyR');await page.keyboard.down('ArrowRight');
  await page.waitForFunction(()=>game.scene.getScene('game').p.x>=90,null,{timeout:2000});
  await page.keyboard.up('ArrowRight');await page.keyboard.down('ArrowLeft');
  await page.waitForFunction(()=>{const p=game.scene.getScene('game').p;return p.x<=80&&p.body.velocity.x<0},null,{timeout:2000});
  await page.keyboard.up('ArrowLeft');await page.waitForFunction(()=>{const s=game.scene.getScene('game');return s.drib&&Math.abs(s.p.body.velocity.x)<1},null,{timeout:2000});
  await page.keyboard.up('KeyR');await page.waitForTimeout(40);
  // Bank off the left boundary so the ball crosses the goal near its slow vertical apex.
  const aim=await page.evaluate(()=>{const s=game.scene.getScene('game'),c=s.cameras.main,r=game.canvas.getBoundingClientRect(),vy=Math.sqrt(700*(s.ball.y-s.G.y-s.G.h/2)),vx=Math.sqrt(800*800-vy*vy);return {x:r.left+(c.x+(s.ball.x-vx/20-c.worldView.left)*c.zoom)*r.width/960,y:r.top+(c.y+(s.ball.y-vy/20-c.worldView.top)*c.zoom)*r.height/540}});
  await page.mouse.move(aim.x,aim.y);await page.mouse.click(aim.x,aim.y,{delay:30});
  await page.waitForFunction(()=>{const s=game.scene.getScene('game'),b=s.ball,G=s.G;return b.x>G.x+15&&b.x<G.x+G.w-10&&b.y>G.y+10&&b.y<G.y+G.h-10},null,{timeout:3000});
  await page.keyboard.down('KeyQ');await recording;
  await replaySolutions(browser,root,[4]);
  console.log('PASS: empty level 4 completed and replayed with real movement, a kick and the explicitly selected Blink loadout');
 }catch(error){await browser.contexts()[0]?.close();await recording.catch(()=>{});throw error}
}
