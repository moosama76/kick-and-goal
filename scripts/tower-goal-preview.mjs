import {readGameHtml} from './game-source.cjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

export async function towerGoalPreview(browser,root,entryUrl=null){
 const out=path.join(root, '..', 'artifacts','tower-goal');await fs.mkdir(out,{recursive:true});
 const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out}}),page=await context.newPage();
 const buildSha256=createHash('sha256').update(readGameHtml(root)).digest('hex');
 try{
  await page.goto(entryUrl||pathToFileURL(path.join(root,'index.html')).href);
  await page.waitForFunction(()=>window.game?.scene.getScene('game')?.p);
  await page.locator('[data-level="8"]').click();await page.waitForTimeout(100);await page.locator('.upgrade-grid button').first().click();await page.waitForTimeout(100);await page.locator('.menu-action').click();
  await page.waitForTimeout(150);await page.screenshot({path:path.join(out,'starting-view.png')});
  const placement=await page.evaluate(()=>{const s=game.scene.getScene('game'),L=LV[7];return {goal:L.g,platform:L.ascent[0],floor:L.h-1,visible:s.goal.visible,unlocked:s.goalUnlocked()};});
  assert.equal(placement.visible,true);assert.equal(placement.unlocked,false);
  assert.equal(placement.goal[0]-placement.platform[0]-placement.platform[2],1);assert.ok(placement.goal[1]+placement.goal[3]<placement.floor);
  // Stage completed objectives and the final approach; only the final jump is normal input proof.
  await page.evaluate(()=>{
   const s=game.scene.getScene('game'),L=LV[7];s.enemies.forEach(e=>s.killEnemy(e));
   for(const sw of s.switches){s.p.body.reset(sw.x,sw.y);s.updatePuzzles()}
   s.p.body.reset(s.G.x+s.G.w/2,(L.h-1)*16-7);s.ball.body.reset(s.p.x+11,(L.h-1)*16-5);
  });
  await page.keyboard.down('KeyR');await page.waitForFunction(()=>game.scene.getScene('game').drib,null,{timeout:3000});await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>game.scene.getScene('game').won),false,'Raised goal must not score from the ground');
  await page.screenshot({path:path.join(out,'below-goal.png')});
  await page.keyboard.down('Space');await page.waitForFunction(()=>game.scene.getScene('game').won,null,{timeout:1500});
  const result=await page.evaluate(()=>{const s=game.scene.getScene('game');return {won:s.won,bounces:s.bounces,player:[s.p.x,s.p.y],ball:[s.ball.x,s.ball.y]};});
  assert.equal(result.bounces,0,'Final approach must use a normal jump');await page.screenshot({path:path.join(out,'joint-goal.png')});
  await fs.writeFile(path.join(out,'results.json'),JSON.stringify({buildSha256,fixture:'Staged completed objectives and ground approach; real-input final jump, not full tower completion',placement,result},null,2));
  console.log('PASS: level 8 goal is raised beyond the lowest platform; normal jump with the ball completes the final approach');
 }finally{await context.close()}
}
