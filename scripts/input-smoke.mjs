import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
export async function inputSmoke(browser, root) {
  const out = path.join(root, '..', 'artifacts', 'inputs');
  await fs.mkdir(out, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: out } });
  const page = await context.newPage();
  const actions = [];
  const down = async key => { actions.push({ t: Date.now(), type: 'down', key }); await page.keyboard.down(key); };
  const up = async key => { actions.push({ t: Date.now(), type: 'up', key }); await page.keyboard.up(key); };
  await fs.rm(path.join(out,'results.json'),{force:true});
  const state = () => page.evaluate(() => { const s=game.scene.getScene('game');return {i:s.i,p:{x:s.p.x,y:s.p.y,vx:s.p.body.velocity.x,vy:s.p.body.velocity.y},b:{x:s.ball.x,y:s.ball.y,vy:s.ball.body.velocity.y},bounces:s.bounces,drib:s.drib,won:s.won}; });
  const select = async level => {
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await page.waitForFunction(() => window.game?.scene.getScene('game')?.p);
    await page.locator(`[data-level="${level}"]`).click();await page.waitForTimeout(100);await page.locator('.upgrade-grid button').first().click();
    await page.waitForTimeout(150);
    await page.locator('.menu-action').click();
    await page.waitForTimeout(250);
  };
  try {
    await select(1);
    await down('KeyR');
    await page.waitForFunction(() => game.scene.getScene('game').drib, null, { timeout: 15000 });
    await down('Space');
    await page.waitForFunction(() => game.scene.getScene('game').won, null, { timeout: 3000 });
    await page.screenshot({path:path.join(out,'level-1-goal.png')});
    await up('Space');await up('KeyR');
    await page.waitForFunction(() => game.scene.getScene('game').i===1,null,{timeout:4000});
    await page.locator('#menu').waitFor({state:'visible'});
    await page.screenshot({path:path.join(out,'level-1-to-2.png')});
    console.log('PASS input level 1: recall, score and advance to level 2');
    await fs.writeFile(path.join(out,'results.json'),JSON.stringify({date:new Date().toISOString(),levels:[1],normalInputOnly:true},null,2));
  } catch(error) {
    console.error('INPUT STATE',JSON.stringify(await state()));
    await page.screenshot({path:path.join(out,'failure.png')});
    throw error;
  } finally {
    await fs.writeFile(path.join(out,'actions.json'),JSON.stringify(actions,null,2));
    await context.close();
  }
}
