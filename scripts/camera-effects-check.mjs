import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
export async function cameraEffectsCheck(browser,root,url){
 const out=path.join(root,'..','artifacts','camera-effects');await fs.mkdir(out,{recursive:true});
 const context=await browser.newContext({viewport:{width:960,height:540},recordVideo:{dir:out}});
 const page=await context.newPage(),errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url||pathToFileURL(path.join(root,'index.html')).href);
  await page.locator('[data-title-action="play"]').click();
  await page.locator('[data-level="2"]').click();
  await page.waitForFunction(()=>window.game?.scene.getScene('game')?.p);
  // Staged effect checks: use real game events, not a puzzle-completion claim.
  for(const [width,height] of [[960,540],[1920,1080],[2560,1080],[390,844]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(200);
   for(const event of ['kick','enemy','checkpoint','ball-jump']){
    await page.evaluate(()=>game.scene.getScene('game').levelMenu(true));
    await page.locator('[data-level="2"]').click();await page.waitForTimeout(100);
    const result=await page.evaluate(event=>{
     const s=game.scene.getScene('game'),c=s.cameras.main;
     s.physics.world.pause();c.shakeEffect.reset();c.flashEffect.reset();
     profile.upgrades=['bounce'];s.ballJumpCool=0;
     if(event==='kick')s.shoot(0);
     else if(event==='enemy')s.killEnemy(s.enemies[0]);
     else if(event==='checkpoint')s.activateSwitch(s.switches[0]);
     else{
      s.p.body.velocity.y=80;s.ball.body.blocked.down=false;s.ball.setPosition(s.p.x,s.p.y+10);s.bj=0;(s.ball.body.setVelocityY(-100),s.updateBallPullRise(true),s.tryBallJump());
     }
     const strength=c.shakeEffect.intensity;
     return {event,width:c.width,height:c.height,zoom:c.zoom,duration:c.shakeEffect.duration,
      worldAmplitude:{x:strength.x*c.width*c.zoom,y:strength.y*c.height*c.zoom}};
    },event);
    const tuning={kick:[80,.0035],enemy:[120,.005],checkpoint:[100,.003],'ball-jump':[90,.003]}[event];
    assert.equal(result.duration,tuning[0]);
    assert.ok(Math.abs(result.worldAmplitude.x-960*2*tuning[1])<1e-6);
    assert.ok(Math.abs(result.worldAmplitude.y-540*2*tuning[1])<1e-6);
    results.push(result);await page.waitForTimeout(25);
    await page.screenshot({path:path.join(out,`${event}-${width}.png`)});await page.waitForTimeout(150);
   }
  }
  assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'results.json'),JSON.stringify({results,errors},null,2));
  console.log('PASS: original kick, enemy, checkpoint and Ball Jump effects retain consistent world displacement across viewport sizes; footage and screenshots captured');
 }finally{await context.close()}
}
