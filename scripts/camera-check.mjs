import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export async function cameraCheck(browser,root,entryUrl=null){
 const out=path.join(root, '..', 'artifacts','camera');await fs.mkdir(out,{recursive:true});
 await fs.rm(path.join(out,'results.json'),{force:true});
 const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out}});
 const page=await context.newPage(),errors=[],results=[];
 page.on('pageerror',error=>errors.push(error.message));
 const read=()=>page.evaluate(()=>{
  const s=game.scene.getScene('game'),v=s.cameras.main.worldView;
  return {p:{x:s.p.x,y:s.p.y},target:{x:s.tg.x,y:s.tg.y},center:{x:v.centerX,y:v.centerY},
   visible:s.p.body.left>=v.left&&s.p.body.right<=v.right&&s.p.body.top>=v.top&&s.p.body.bottom<=v.bottom,
   outside:s.p.x<v.left||s.p.x>v.right||s.p.y<v.top||s.p.y>v.bottom};
 });
 try{
  await page.goto(entryUrl||pathToFileURL(path.join(root,'index.html')).href);
  await page.locator('[data-title-action="play"]').click();
  await page.locator('[data-level="8"]').click();await page.waitForTimeout(100);
  const cases=[
   {name:'ball-above',p:[360,800],b:[650,160],zoom:2},
   {name:'ball-below',p:[360,800],b:[650,1500],zoom:2},
   {name:'ball-right',p:[160,800],b:[730,800],zoom:4},
   {name:'ball-left',p:[608,800],b:[32,800],zoom:4},
   {name:'nearby-ball',p:[360,800],b:[400,810],zoom:2,near:true}
  ];
  for(const test of cases){
   await page.evaluate(test=>{
    const s=game.scene.getScene('game'),c=s.cameras.main;
    s.scene.pause();s.invuln=60;s.shotActive=false;s.drib=false;
    s.p.body.reset(...test.p);s.p.body.setAllowGravity(false).setVelocity(0,0);
    s.ball.body.reset(...test.b);s.ball.body.setAllowGravity(false).setGravityY(0).setVelocity(0,0);
    s.p.body.moves=false;s.ball.body.moves=false;
    const x=test.p[0]*.7+test.b[0]*.3,y=test.p[1]*.7+test.b[1]*.3;
    s.tg.setPosition(x,y);c.stopFollow().setZoom(test.zoom).centerOn(x,y);
   },test);
   await page.waitForTimeout(100);
   const before=await read();assert.equal(before.outside,!test.near,'Fixture must reproduce the offscreen-player bug');
   await page.screenshot({path:path.join(out,test.name+'-before.png')});
   await page.evaluate(()=>{const s=game.scene.getScene('game');s.cameras.main.startFollow(s.tg,false,.12,.12);s.scene.resume();});
   await page.waitForFunction(()=>{
    const s=game.scene.getScene('game'),view=s.cameras.main.worldView;
    return Math.abs(view.centerX-s.p.x)<2&&Math.abs(view.centerY-s.p.y)<2;
   },null,{timeout:3000});
   const after=await read();assert.equal(after.visible,true,'Camera lost the player: '+test.name);
   const expected=after.p;
   assert.ok(Math.abs(after.target.x-expected.x)<1&&Math.abs(after.target.y-expected.y)<1,'Wrong camera target: '+test.name);
   assert.ok(Math.abs(after.center.x-expected.x)<2&&Math.abs(after.center.y-expected.y)<2,'Camera failed to center: '+test.name);
   await page.screenshot({path:path.join(out,test.name+'-after.png')});
   results.push({case:test.name,before,after});
  }
  assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(out,'results.json'),JSON.stringify({url:entryUrl,fixture:'Player/ball positions and old camera framing are staged; real scene update must recover automatically.',cases:results,runtimeErrors:errors},null,2));
  console.log('PASS: distant ball above/below/left/right recenters the actual camera on the player; nearby ball cannot pull the camera off the player');
 }finally{await context.close();}
}
