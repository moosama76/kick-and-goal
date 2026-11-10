import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = process.argv.includes('--root') ? path.resolve(process.argv[process.argv.indexOf('--root')+1]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entryUrl=process.argv.includes('--url')?process.argv[process.argv.indexOf('--url')+1]:null;
const out = path.join(root, '..', 'artifacts',entryUrl?'localhost':'browser');
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: !process.argv.includes('--record') });
try {
  if(process.argv.includes('--all')){
    for(const file of ['configurations','level-layout','respawn','level7-teleport','return-tower','loadouts','body-triggers'])require(`../tests/${file}.cjs`);
    const {default:rules}=await import('../tests/passability.cjs');await rules;
    const {inputSmoke}=await import('./input-smoke.mjs');await inputSmoke(browser,root);
    const {cameraCheck}=await import('./camera-check.mjs');await cameraCheck(browser,root,entryUrl);
    const {towerInput}=await import('./tower-input.mjs');await towerInput(browser,root);
  }
  if(process.argv.includes('--record-smoke')){
    const {recordSolution,replaySolutions}=await import('./solution-evidence.mjs');
    const recording=recordSolution(browser,root,1,'automated-real-input');
    while(!browser.contexts()[0]?.pages()[0])await new Promise(r=>setTimeout(r,20));
    const page=browser.contexts()[0].pages()[0];
    await page.waitForFunction(()=>window.game?.scene.getScene('game')?.p);
    await page.waitForTimeout(600);await page.locator('.menu-action').click();await page.locator('.upgrade-grid button').first().click();await page.locator('.menu-action').click();
    await page.keyboard.down('KeyR');
    await page.waitForFunction(()=>game.scene.getScene('game').drib,null,{timeout:15000});
    await page.keyboard.down('Space');
    await recording;
    await replaySolutions(browser,root,[1]);
    console.log('PASS: recorder captured and replayed a complete real-input level 1 solution');
  }
  else if(process.argv.includes('--footage')){
    const requestedVideo=process.argv.includes('--video-file')?path.resolve(process.argv[process.argv.indexOf('--video-file')+1]):null;
    const dir=requestedVideo?path.dirname(requestedVideo):path.join(root, '..', 'artifacts',process.argv.includes('--camera')?'camera':process.argv.includes('--ui-video')?(entryUrl?'localhost':'browser'):process.argv.includes('--tower-entry')?(entryUrl?'tower-corrected-entry-localhost':'tower-corrected-entry'):process.argv.includes('--tower-video')?(entryUrl?'tower-corrected-localhost':'tower-corrected'):'inputs'),files=requestedVideo?[path.basename(requestedVideo)]:(await fs.readdir(dir)).filter(f=>f.endsWith('.webm'));
    const ranked=await Promise.all(files.map(async f=>({f,t:(await fs.stat(path.join(dir,f))).mtimeMs})));
    ranked.sort((a,b)=>b.t-a.t);
    const page=await browser.newPage({viewport:{width:1280,height:720}});
    await page.goto(pathToFileURL(path.join(dir,ranked[0].f)).href);
    await page.waitForFunction(()=>document.querySelector('video')?.duration>0);
    for(const t of (requestedVideo?[5,20,40,60]:process.argv.includes('--camera')?[0.2,0.6,1.2,2.4]:process.argv.includes('--ui-video')?[4,5,6,7]:process.argv.includes('--tower-video')?(entryUrl?[10,100,200,250]:[10,45,85,100]):[1,4,7])){
      await page.evaluate(async t=>{const v=document.querySelector('video');v.pause();await new Promise(resolve=>{v.addEventListener('seeked',resolve,{once:true});v.currentTime=Math.min(t,v.duration-.1);});},t);
      await page.screenshot({path:path.join(dir,`footage-${t}s.png`)});
    }
    await page.close();console.log('Footage frames extracted from '+ranked[0].f);
  }
  else if(process.argv.includes('--record')){const {recordSolution}=await import('./solution-evidence.mjs');await recordSolution(browser,root,Number(process.argv[process.argv.indexOf('--record')+1]));}
  else if(process.argv.includes('--solutions')){const {replaySolutions}=await import('./solution-evidence.mjs');await replaySolutions(browser,root);}
  else if(process.argv.includes('--rules')){const {default:rules}=await import('../tests/passability.cjs');await rules;}
  else if(process.argv.includes('--waves')){const {wavesCheck}=await import('./waves-check.mjs');await wavesCheck(browser,root,entryUrl);}
  else if(process.argv.includes('--progression')){const {progressionCheck}=await import('./progression-check.mjs');await progressionCheck(browser,root,entryUrl);}
  else if(process.argv.includes('--coach')){const {coachCheck}=await import('./coach-check.mjs');await coachCheck(browser,root,entryUrl);}
  else if(process.argv.includes('--title')){const {titleCheck}=await import('./title-check.mjs');await titleCheck(browser,root,entryUrl);}
  else if(process.argv.includes('--camera-effects')){const {cameraEffectsCheck}=await import('./camera-effects-check.mjs');await cameraEffectsCheck(browser,root,entryUrl);}
  else if(process.argv.includes('--camera')){const {cameraCheck}=await import('./camera-check.mjs');await cameraCheck(browser,root,entryUrl);}
  else if(process.argv.includes('--combat-input')){const {combatInput}=await import('./combat-input.mjs');await combatInput(browser,root,entryUrl);}
  else if(process.argv.includes('--home')){const {homeCheck}=await import('./home-check.mjs');await homeCheck(browser,root,entryUrl);}
  else if(process.argv.includes('--checkpoints')){const {checkpointPreview}=await import('./checkpoint-preview.mjs');await checkpointPreview(browser,root,entryUrl);}
  else if(process.argv.includes('--tower-goal')){const {towerGoalPreview}=await import('./tower-goal-preview.mjs');await towerGoalPreview(browser,root,entryUrl);}
  else if(process.argv.includes('--recall-chamber')){const {recallChamber}=await import('./recall-chamber.mjs');await recallChamber(browser,root);}
  else if(process.argv.includes('--empty-finale')){const {emptyFinale}=await import('./empty-finale.mjs');await emptyFinale(browser,root);}
  else if(process.argv.includes('--tower-entry')){const {towerInput}=await import('./tower-input.mjs');await towerInput(browser,root,entryUrl,true);}
  else if(process.argv.includes('--tower')){const {towerInput}=await import('./tower-input.mjs');await towerInput(browser,root,entryUrl);}
  else if(process.argv.includes('--inputs')){const {inputSmoke}=await import('./input-smoke.mjs');await inputSmoke(browser,root);const {towerInput}=await import('./tower-input.mjs');await towerInput(browser,root,entryUrl);}
  else {
    const {levelSmoke}=await import('./level-smoke.mjs');
    await levelSmoke(browser,root,entryUrl);
  }

} finally {
  await browser.close();
}
