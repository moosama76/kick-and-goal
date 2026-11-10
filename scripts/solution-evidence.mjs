import {readGameHtml} from './game-source.cjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const hash = async root => createHash('sha256').update(readGameHtml(root)).digest('hex');
async function select(page,root,level,upgrade) {
  await page.goto(pathToFileURL(path.join(root,'index.html')).href);
  await page.waitForFunction(()=>window.game?.scene.getScene('game')?.p);
  await page.locator(`[data-level="${level}"]`).click();await page.waitForTimeout(100);
  if(upgrade)await page.locator('.upgrade-grid button').nth({bounce:0,teleport:1,glove:2}[upgrade]).click();
  else if(!(await page.locator('.upgrade-grid button.active').count()))await page.locator('.upgrade-grid button').first().click();

  await page.waitForTimeout(150);
}
export async function recordSolution(browser,root,level,source='manual') {
  assert.ok(Number.isInteger(level)&&level>=1&&level<=9,'Supply --record LEVEL (1–9)');
  const out=path.join(root, '..', 'artifacts','recordings');await fs.mkdir(out,{recursive:true});
  const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out}});
  const page=await context.newPage();
  await page.addInitScript(()=>{
    window.__solution={start:null,actions:[],upgrades:[]};
    const record=event=>{
      const r=window.__solution;if(r.start===null)return;
      const t=performance.now()-r.start;
      if(event.type==='keydown'||event.type==='keyup'){
        if(event.repeat)return;r.actions.push({t,type:event.type,key:event.code});
      }else if(event.type==='mousemove'){
        if(t-(r.lastMove||0)<16)return;r.lastMove=t;r.actions.push({t,type:event.type,x:event.clientX,y:event.clientY});
      }else r.actions.push({t,type:event.type,button:event.button,x:event.clientX,y:event.clientY});
    };
    for(const name of ['keydown','keyup','mousemove','mousedown','mouseup'])document.addEventListener(name,record,true);
    document.addEventListener('click',event=>{
      const r=window.__solution;
      if(r.start===null&&event.target.closest('.menu-action')&&!game.scene.getScene('game').menuOpen){r.start=performance.now();r.upgrades=[...profile.upgrades];}
    });
  });
  await select(page,root,level,null);
  console.log(`Play level ${level}. Choose your loadout and click RESUME. The recorder saves only after GOAL. Close the browser to cancel.`);
  try {
    await page.waitForFunction(level=>{const s=window.game?.scene.getScene('game');return s?.i===level-1&&s.won;},level,{timeout:0});
    const recording=await page.evaluate(()=>({actions:window.__solution.actions,upgrades:window.__solution.upgrades}));
    const file=path.join(root, '..', 'evidence','solutions',`level-${level}.json`);
    await fs.writeFile(file,JSON.stringify({version:1,source,recordedAt:new Date().toISOString(),level,buildSha256:await hash(root),viewport:{width:1280,height:720},...recording},null,2));
    await page.screenshot({path:path.join(out,`level-${level}-goal.png`)});
    console.log(`Saved real-input solution: ${file}`);
  } finally {await context.close();}
}
export async function replaySolutions(browser,root,levels=[1,2,3,4,5,6,7,8,9]) {
  const build=await hash(root),results=[];
  for(const level of levels) {
    const file=path.join(root, '..', 'evidence','solutions',`level-${level}.json`);
    let r;try{r=JSON.parse(await fs.readFile(file,'utf8'));}catch{throw new Error(`Missing normal-input solution for level ${level}. Record it using npm run record -- ${level}.`);}
    assert.equal(r.buildSha256,build,`Level ${level} recording belongs to another build; record it again`);
    assert.ok(r.actions.length>0,'Empty recording is not a solution');
    const context=await browser.newContext({viewport:r.viewport});const page=await context.newPage();
    try {
      await select(page,root,level,r.upgrades[0]);await page.locator('.menu-action').click();
      const start=Date.now();
      for(const event of r.actions){
        const delay=event.t-(Date.now()-start);if(delay>0)await page.waitForTimeout(delay);
        if(event.type==='keydown')await page.keyboard.down(event.key);
        else if(event.type==='keyup')await page.keyboard.up(event.key);
        else if(event.type==='mousemove')await page.mouse.move(event.x,event.y);
        else if(['mousedown','mouseup'].includes(event.type)){
          await page.mouse.move(event.x,event.y);await page.mouse[event.type==='mousedown'?'down':'up']({button:['left','middle','right'][event.button]});
        }else throw new Error('Unsupported input event');
      }
      await page.waitForFunction(level=>{const s=game.scene.getScene('game');return s.i===level-1&&s.won;},level,{timeout:1500});
      results.push({level,passed:true});
    } finally {await context.close();}
  }
  console.log(JSON.stringify(results));
}
