import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
export async function recallChamber(browser,root){
 const out=path.join(root, '..', 'artifacts','recall-chamber');await fs.mkdir(out,{recursive:true});
 const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out}}),page=await context.newPage();
 try{
 await page.goto(pathToFileURL(path.join(root,'index.html')).href);
 await page.waitForFunction(()=>window.game?.scene.getScene('game')?.p);
 await page.locator('[data-level="5"]').click();await page.waitForTimeout(100);await page.locator('.upgrade-grid button').nth(1).click();
 await page.evaluate(()=>{const original=audio.sfx.bind(audio);window.__trappedSounds=0;audio.sfx=name=>{if(name==='trapped')window.__trappedSounds++;original(name)}});
 await page.locator('.menu-action').click();
 await page.waitForTimeout(400);await page.screenshot({path:path.join(out,'start.png')});
 const state=()=>page.evaluate(()=>{const s=game.scene.getScene('game');return {x:s.p.x,y:s.p.y,bx:s.ball.x,by:s.ball.y,drib:s.drib,won:s.won,ground:s.p.body.blocked.down,plen:s.plen}});
 assert.equal(await page.evaluate(()=>game.scene.getScene('game').cameras.main.zoom),2,'Camera must retain normal zoom');
 if(process.argv.includes('--feedback-only')){
  const warningState=()=>page.evaluate(()=>{const s=game.scene.getScene('game');return [s.ballTrapped,s.ball.tintTopLeft,window.__trappedSounds]});
  assert.deepEqual(await warningState(),[false,0xffffff,0],'A sealed ball must stay normal until recall is attempted');
  await page.evaluate(()=>{const s=game.scene.getScene('game');s.p.body.reset(680,553)});await page.waitForTimeout(400);
  assert.deepEqual(await warningState(),[false,0xffffff,0],'Waiting near a sealed ball must not trigger feedback');
  await page.keyboard.down('KeyR');await page.waitForTimeout(100);
  assert.deepEqual(await warningState(),[true,0xff6262,1],'A failed retract must trigger a red flash and sound');
  await page.screenshot({path:path.join(out,'trapped-ball.png')});
  await page.waitForTimeout(700);
  assert.deepEqual(await warningState(),[true,0xffffff,1],'Holding retract must let the short flash expire without repeating its sound');
  await page.keyboard.up('KeyR');await page.waitForTimeout(80);await page.keyboard.down('KeyR');await page.waitForTimeout(100);
  assert.deepEqual(await warningState(),[true,0xff6262,2],'A new retract attempt may warn again');
  await page.keyboard.up('KeyR');await page.waitForTimeout(400);
  await page.mouse.down({button:'right'});await page.waitForTimeout(100);
  assert.deepEqual(await warningState(),[true,0xff6262,3],'Right mouse recall must use the same brief warning');
  await page.mouse.up({button:'right'});await page.waitForTimeout(400);
  assert.deepEqual(await warningState(),[false,0xffffff,3]);
  await page.evaluate(()=>{const s=game.scene.getScene('game');s.ball.body.reset(600,555);s.ball.body.setVelocity(0,0);s.selectRecallRoute(1)});
  await page.keyboard.down('KeyR');await page.waitForTimeout(400);
  assert.deepEqual(await warningState(),[false,0xffffff,3],'A long open recall route must not trigger the sealed-ball warning');
  assert.equal(await page.evaluate(()=>game.scene.getScene('game').plen>720),true,'Fixture must exceed the former recall cap');
  assert.ok((await state()).bx<560,'Recall must move the ball along a route beyond the former distance cap');
  await page.screenshot({path:path.join(out,'open-long-route.png')});
  await page.waitForFunction(()=>game.scene.getScene('game').drib,null,{timeout:15000});
  await page.screenshot({path:path.join(out,'long-recall-complete.png')});await page.keyboard.up('KeyR');
  await page.evaluate(()=>{profile.best[0]={time:12,kicks:2};profile.best[1]={time:34,kicks:3};profile.best[2]={time:56,kicks:4};game.scene.getScene('game').levelMenu(true)});
  console.log('Level-button heights:',await page.locator('.level-grid button').evaluateAll(buttons=>buttons.map(b=>b.getBoundingClientRect().height)));
  await page.screenshot({path:path.join(out,'level-buttons.png')});
  const rendered=await page.evaluate(async()=>{
    const c=new OfflineAudioContext(1,11025,22050),a=new ChipAudio();a.ctx=c;a.effects=c.createGain();a.effects.connect(c.destination);a.noiseBuffer=c.createBuffer(1,5513,22050);a.sfx('trapped');
    const samples=(await c.startRendering()).getChannelData(0);return {rms:Math.sqrt(samples.reduce((sum,v)=>sum+v*v,0)/samples.length),samples:Array.from(samples)};
  });
  assert.ok(rendered.rms>.005,'The special warning must render audible audio');
  const wav=Buffer.alloc(44+rendered.samples.length*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(22050,24);wav.writeUInt32LE(44100,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(wav.length-44,40);rendered.samples.forEach((v,i)=>wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+i*2));await fs.writeFile(path.join(out,'trapped-warning.wav'),wav);
  console.log('PASS: brief failed-retract feedback, unlimited long-route recall completion, rendered audio and equal-row level-menu preview');return;
 }
 const recovery=async()=>{
 // Separate fixtures: shared contact range and unsafe Blink rejection.
 await page.keyboard.up('KeyR');
 await page.evaluate(()=>game.scene.getScene('game').scene.restart({i:4}));
 await page.waitForFunction(()=>document.getElementById('menu').style.display==='grid');await page.locator('.menu-action').click();
 await page.evaluate(()=>{const s=game.scene.getScene('game');s.selectRecallRoute(0);s.ball.body.reset(600,555);s.ball.body.setVelocity(0,0);s.p.body.reset(650,553)});await page.waitForTimeout(150);
 assert.equal(await page.evaluate(()=>game.scene.getScene('game').activeRoute),0,'Switch 2 must not trigger from 18px away');
 const before=await state();await page.keyboard.press('KeyQ',{delay:60});await page.waitForTimeout(100);
 assert.ok(Math.abs((await state()).x-before.x)<1,'Blink must reject a sealed destination with no return route');
 assert.equal(await page.evaluate(()=>game.scene.getScene('game').teleportCool),0,'Rejected Blink must not spend its cooldown');
 await page.evaluate(()=>game.scene.getScene('game').p.body.reset(640,553));await page.waitForTimeout(150);
 assert.equal(await page.evaluate(()=>game.scene.getScene('game').activeRoute),1,'Switch 2 must activate on body contact');
 await page.screenshot({path:path.join(out,'switch-contact.png')});
 await page.keyboard.press('KeyQ',{delay:60});await page.waitForTimeout(150);
 assert.ok((await state()).x<610,'Blink may enter after transfer opens an escape route');
 await page.keyboard.down('KeyR');await page.keyboard.down('ArrowLeft');await page.waitForTimeout(3100);await page.keyboard.up('ArrowLeft');
 assert.ok((await state()).x<300&&(await state()).bx<304,'Blink cannot trap either body inside the holding tray');
 await page.screenshot({path:path.join(out,'blink-recovery-fixture.png')});
 };
 if(process.argv.includes('--recovery-only')){await recovery();return;}
 const start=await state();await page.keyboard.press('KeyQ',{delay:60});await page.waitForTimeout(100);assert.ok(Math.abs((await state()).x-start.x)<1,'Blink cannot bypass the trough');
 await page.keyboard.down('KeyR');await page.waitForTimeout(700);assert.equal((await state()).drib,false,'Recall cannot leave the sealed starting vault');await page.keyboard.up('KeyR');
 const move=async(x,jump=false)=>{
  if(jump){await page.waitForFunction(()=>game.scene.getScene('game').p.body.blocked.down);await page.keyboard.down('Space');}
  for(let n=0;n<180;n++){
   const s=await state(),vx=await page.evaluate(()=>game.scene.getScene('game').p.body.velocity.x);
   if(Math.abs(s.x-x)<2.5&&Math.abs(vx)<12&&(!jump||s.ground)&&n>12)break;
   const desired=Math.max(-150,Math.min(150,(x-s.x)*7));
   const dir=Math.abs(desired-vx)<14?null:desired>vx?'ArrowRight':'ArrowLeft';
   for(const k of ['ArrowLeft','ArrowRight'])await page.keyboard[k===dir?'down':'up'](k);
   await page.waitForTimeout(20);
  }
  await page.keyboard.up('ArrowLeft');await page.keyboard.up('ArrowRight');await page.keyboard.up('Space');await page.waitForTimeout(150);
 };
 const climbRoof=async()=>{
   await move(706);await page.keyboard.down('Space');
   await page.waitForFunction(()=>game.scene.getScene('game').p.y<=39,null,{timeout:1500});
   await page.keyboard.down('ArrowLeft');
   await page.waitForFunction(()=>{const p=game.scene.getScene('game').p;return p.body.blocked.down&&p.y<=44},null,{timeout:2000});
   await page.keyboard.up('ArrowLeft');await page.keyboard.up('Space');await move(664);
 };
 if(process.argv.includes('--roof-only')){
   await page.evaluate(()=>game.scene.getScene('game').p.body.reset(696,169));await page.waitForTimeout(150);await move(668,true);assert.ok((await state()).y<=124);await move(712,true);assert.ok((await state()).y<=108);await climbRoof();console.log('PASS: normal jump through right roof opening');return;
 }
 // Three doors in series: release by gravity, transfer by recall, then score.
 assert.deepEqual(await page.evaluate(()=>{const s=game.scene.getScene('game');return [s.doors.length,s.routePads.length,s.activeRoute]}),[3,3,2]);
 assert.deepEqual(await page.evaluate(()=>game.scene.getScene('game').routePads.map(p=>p.o.texture.key)),['routeControl0','routeControl0','routeControl1']);
 // Cross the roof and descend the central gap in the right-hand stairs.
 await move(216);await move(184,true);
 for(const [x,y] of [[232,425],[184,361],[232,297],[184,233],[232,169],[184,105],[232,41]]){
   await move(x,true);assert.ok((await state()).y<=y+3,'Left ascent to '+y);
 }
 await move(696);await page.waitForTimeout(500);await move(680);await page.waitForTimeout(1200);await move(712);
 assert.ok((await state()).x>690,'Release requires the far-right edge of the map');
 assert.equal(await page.evaluate(()=>game.scene.getScene('game').activeRoute),0,'Door 1 must open the release hatch');
 await page.waitForFunction(()=>game.scene.getScene('game').ball.y>548,null,{timeout:3000});
 await page.screenshot({path:path.join(out,'release.png')});
 await page.keyboard.down('KeyR');await page.waitForTimeout(600);assert.equal((await state()).drib,false,'Door 1 alone must not let recall retrieve the ball');await page.keyboard.up('KeyR');
 await move(629);await page.waitForTimeout(200);
 assert.equal(await page.evaluate(()=>game.scene.getScene('game').activeRoute),1,'Door 2 must open the holding-tray exit');
 await page.keyboard.down('KeyR');await page.waitForTimeout(700);assert.equal((await state()).drib,false,'Recall must still travel through the left-hand transfer exit');await page.keyboard.up('KeyR');
 await page.screenshot({path:path.join(out,'right-side-transfer.png')});
 // Return with ordinary jumps; no teleport or ball jump is used.
 await move(664,true);assert.ok((await state()).y<=508,'First right return ledge');
 for(const [x,y] of [[696,457],[664,409],[696,361],[664,313],[696,265],[664,217],[696,169],[668,121],[712,105]]){
   await move(x,true);assert.ok((await state()).y<=y+3,'Right ascent to '+y);
 }
 await climbRoof();
 await move(200);await page.waitForTimeout(1400);await move(280);
 await page.keyboard.down('KeyR');await page.waitForFunction(()=>game.scene.getScene('game').drib,null,{timeout:6000});
 await move(280);await page.screenshot({path:path.join(out,'transfer.png')});
 assert.equal(await page.evaluate(()=>game.scene.getScene('game').goalUnlocked()),false,'Door 2 must not unlock delivery');
 await move(216);await move(184,true);
 for(const [x,y] of [[232,425],[184,361],[232,297],[184,233]]){
   await move(x,true);assert.ok((await state()).y<=y+3,'Normal-jump ascent to '+y);
 }
 await move(136);await page.waitForTimeout(300);await page.screenshot({path:path.join(out,'delivery.png')});
 assert.equal(await page.evaluate(()=>game.scene.getScene('game').activeRoute),2,'Door 3 must open the goal room');
 await move(40);await page.waitForTimeout(1300);await move(216);await page.waitForTimeout(800);
 await move(72);await page.waitForFunction(()=>game.scene.getScene('game').won,null,{timeout:5000});await page.screenshot({path:path.join(out,'goal.png')});
 await recovery();
 console.log('PASS: required far-right release and transfer setup, normal-jump return, left-side retrieval and full real-input completion; shared switch contact and staged Blink recovery also passed');
 }finally{await context.close()}
}
