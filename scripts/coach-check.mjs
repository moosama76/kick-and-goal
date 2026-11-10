import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
export async function coachCheck(browser,root,url){
 const out=path.join(root,'..','artifacts','coach');await fs.mkdir(out,{recursive:true});
 const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url||pathToFileURL(path.join(root,'index.html')).href);
  await page.locator('[data-title-action="play"]').click();await page.locator('[data-level="1"]').click();
  await page.locator('#coach-dialogue').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>game.scene.getScene('game').goalUnlocked()),false);
  await page.screenshot({path:path.join(out,'01-pull.png')});
  await page.mouse.move(700,400);await page.mouse.down({button:'right'});
  await page.waitForFunction(()=>game.scene.getScene('game').tutorial.stage===1,null,{timeout:10000});
  await page.mouse.up({button:'right'});await page.screenshot({path:path.join(out,'02-kick.png')});
  // The aim lesson now requires killing the walker, so aim at it and shoot for real.
  assert.equal(await page.evaluate(()=>!!game.scene.getScene('game').tutorial.target),true,'The aim lesson spawns a live target');
  assert.equal(await page.evaluate(()=>game.scene.getScene('game').tutorial.target.harmless),true,'Level 1 target cannot hurt the player');
  const aimAtTarget=async()=>page.evaluate(()=>{
    const s=game.scene.getScene('game'),cam=s.cameras.main,canvas=s.game.canvas.getBoundingClientRect();
    const t=s.tutorial.target.o,p=cam.matrixCombined.transformPoint(t.x,t.y);
    return {x:p.x*canvas.width/s.scale.gameSize.width+canvas.left,y:p.y*canvas.height/s.scale.gameSize.height+canvas.top};
  });
  // Shoot until the target dies: the ball rebounds off walls, so a shot can miss.
  for(let attempt=0;attempt<6;attempt++){
    if(await page.evaluate(()=>game.scene.getScene('game').tutorial.target.dead))break;
    // Re-pull the ball to the player's feet so the next shot is in range.
    await page.mouse.move(700,400);await page.mouse.down({button:'right'});
    await page.waitForTimeout(320);await page.mouse.up({button:'right'});
    const aim=await aimAtTarget();
    await page.mouse.move(aim.x,aim.y);await page.mouse.down();await page.waitForTimeout(120);await page.mouse.up();
    await page.waitForTimeout(420);
  }
  await page.waitForFunction(()=>game.scene.getScene('game').tutorial.stage===2,null,{timeout:15000});
  assert.equal(await page.evaluate(()=>game.scene.getScene('game').tutorial.target.dead),true,'A real shot killed the walker');
  await page.screenshot({path:path.join(out,'03-ball-jump.png')});
  assert.equal(await page.evaluate(()=>game.scene.getScene('game').goalUnlocked()),false);
  assert.equal(await page.evaluate(()=>!!game.scene.getScene('game').tutorial.platform?.body),true);
  await page.screenshot({path:path.join(out,'04-ball-jump-platform.png')});
  // Staged contact fixture validates the gate; it is not a real-input jump solution.
  await page.evaluate(()=>{
   const s=game.scene.getScene('game');profile.upgrades=['bounce'];s.ballJumpCool=s.teleportCool=s.gloveCool=0;
   s.p.body.reset(180,300);s.p.body.setVelocityY(80);s.ball.body.reset(180,310);s.ball.body.setVelocityY(-100);
   s.ball.body.blocked.down=false;s.bj=0;s.drib=false;s.shotActive=false;s.updateBallPullRise(true);
   if(!s.tryBallJump())throw new Error('Ball Jump failed to trigger');
   const platform=s.tutorial.platform.body;
   s.p.body.reset((platform.left+platform.right)/2,platform.top-7);s.p.body.blocked.down=true;
   s.tutorial.update(false,false);
  });
  await page.waitForFunction(()=>game.scene.getScene('game').tutorial.done);
  assert.equal(await page.evaluate(()=>game.scene.getScene('game').goalUnlocked()),true);
  await page.screenshot({path:path.join(out,'05-ready.png')});
  const tap=async key=>{await page.keyboard.down(key);await page.waitForTimeout(120);await page.keyboard.up(key)};
  await tap('l');await page.locator('#coach-dialogue').waitFor({state:'hidden'});
  await tap('l');await page.locator('#coach-dialogue').waitFor({state:'visible'});
  await tap('Backspace');await page.waitForTimeout(200);
  assert.equal(await page.evaluate(()=>game.scene.getScene('game').tutorial.stage),0);
  assert.deepEqual(errors,[]);console.log('PASS: real-input coach pull, aimed shot killing the spawned walker, staged Ball Jump/platform gate and goal unlock, menu visibility and restart; screenshots and footage captured');
 }finally{await context.close()}
}
