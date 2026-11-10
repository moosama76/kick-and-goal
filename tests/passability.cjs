const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

module.exports = (async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack));
  await page.addInitScript(() => {
    localStorage.setItem('kickGoalSave', JSON.stringify({ unlocked: 9, best: {}, upgrades: ['teleport'], used: {} }));
  });
  await page.goto(pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href);
  await page.waitForFunction(() => window.game?.scene.getScene('game')?.p);
  assert.equal(await page.locator('#menu').isVisible(), true, 'Level start did not show loadout selection');
  await page.locator('.menu-action').click();

  // Clear the defender, then complete the tutorial using real movement inputs.
  await page.evaluate(() => {
    const s = game.scene.getScene('game'), enemy = s.enemies[0];
    if(enemy){s.shotActive = true;s.drib = false;s.ball.body.reset(enemy.o.x, enemy.o.y);s.ball.body.setVelocity(300, 0);s.updateEnemies(1 / 60);}
  });
  assert.equal(await page.evaluate(() => game.scene.getScene('game').goalUnlocked()), true);
  await page.keyboard.down('KeyR');
  await page.waitForFunction(() => game.scene.getScene('game').drib, null, { timeout: 12000 });
  await page.keyboard.down('Space');
  await page.waitForFunction(() => game.scene.getScene('game').won, null, { timeout: 3000 });
  await page.keyboard.up('Space');
  await page.keyboard.up('KeyR');
  console.log('PASS level 1: recall and jump into unlocked goal using keyboard input');

  await page.evaluate(() => game.scene.getScene('game').scene.restart({ i: 4 }));
  await page.waitForTimeout(150);
  await page.locator('.menu-action').click();
  assert.equal(await page.evaluate(() => game.scene.getScene('game').enemies.length), 0, 'Recall chamber must have no combat');
  console.log('PASS level 5: combat-free recall chamber; full input route checked by --recall-chamber');

  for (let i = 0; i < 9; i++) {
    await page.evaluate(index => { game.scene.stop('game'); game.scene.start('game', { i: index }); }, i);
    await page.waitForFunction(index => game.scene.getScene('game').i === index && document.getElementById('menu').style.display === 'grid', i);
    assert.equal(await page.locator('#menu').isVisible(), true, `Level ${i + 1} did not show loadout selection`);
    await page.locator('.menu-action').click();
    if(i===7){
      const wallShot=await page.evaluate(async()=>{
        const s=game.scene.getScene('game'),spawn=LV[7].p;
        s.p.body.reset(72,1400);s.p.body.setAllowGravity(false);s.invuln=5;
        const drone=s.enemies.find(e=>e.type==='d'&&Math.abs(e.baseX-296)<1&&Math.abs(e.baseY-1464)<1);
        s.fire(drone);const shot=s.shots.getChildren().at(-1),wall=s.sp(200,1437);
        await new Promise(resolve=>setTimeout(resolve,1250));
        const result={wall,active:shot.active,x:shot.x};
        s.p.body.reset(spawn[0]*16+8,spawn[1]*16+8);s.p.body.setAllowGravity(true);
        return result;
      });
      assert.equal(wallShot.wall,true,'Projectile probe must cross an actual wall');
      assert.equal(wallShot.active,true,'Level 8 drone shot was blocked by a wall');
      assert.ok(wallShot.x<192,'Level 8 drone shot did not pass through the spine wall');
      const rangeProbe=await page.evaluate(()=>{
        const s=game.scene.getScene('game'),e=s.enemies.find(e=>e.type==='d'),saved={x:s.p.x,y:s.p.y,fire:s.fire,cool:e.cool};
        let fired=0;const samples=[];
        try{
          s.fire=enemy=>{if(enemy===e)fired++};
          for(const distance of [277,276.01,275.99]){
            s.p.body.reset(e.o.x+distance,e.o.y);e.cool=0;s.updateEnemies(0);
            samples.push({distance,fired});
          }
          return samples;
        }finally{s.fire=saved.fire;e.cool=saved.cool;s.p.body.reset(saved.x,saved.y);}
      });
      assert.deepEqual(rangeProbe.map(p=>p.fired),[0,0,1],'Drone targeting must retain the reduced 276px boundary');
    }
    const result = await page.evaluate(() => {
      const s = game.scene.getScene('game');
      const remainingEnemies = () => s.enemies.filter(enemy => !enemy.dead).length;
      const closedGates = () => s.doors.filter((door,i) => !door.open&&(!LV[s.i].routeSelectors||i===LV[s.i].deliveryRoute)).length;
      const initialEnemies = remainingEnemies();
      const initialGates = closedGates();
      const initiallyUnlocked = s.goalUnlocked();
      const initialTint = s.goal.tintTopLeft;
      const dronesClear = s.enemies.filter(enemy => enemy.type === 'd').every(enemy =>
        [[-6, -6], [6, -6], [-6, 6], [6, 6]].every(([dx, dy]) => !s.sp(enemy.o.x + dx, enemy.o.y + dy))
      );
      s.ball.body.reset(s.G.x + s.G.w / 2, s.G.y + s.G.h / 2);
      s.p.body.reset(s.G.x + s.G.w / 2, s.G.y + s.G.h / 2);
      s.won = false;
      s.update(0, 16);
      const blockedInitially = initialEnemies > 0 && !s.won && !s.goalUnlocked();

      const L=LV[s.i],checkpointChecks=[];
      for(let pass=0;pass<s.switches.length;pass++)s.switches.forEach(sw => {
        if(sw.on)return;
        s.health=1;s.p.body.reset(sw.x, sw.y);s.updatePuzzles();
        if(!sw.on)return;
        const expected=L.checkpoints?.[sw.index]||{p:L.s[sw.index],b:L.s[sw.index]};
        const healthPreserved=s.health===1,saved=s.checkpoint;
        s.p.body.reset(L.p[0]*16+8,L.p[1]*16+8);s.ball.body.reset(L.b[0]*16+8,L.b[1]*16+8);
        s.health=1;s.invuln=0;s.hurt({x:s.p.x+20});
        const clear=(o)=>[[o.body.left+.01,o.body.top+.01],[o.body.right-.01,o.body.top+.01],[o.body.left+.01,o.body.bottom-.01],[o.body.right-.01,o.body.bottom-.01]].every(([x,y])=>!s.sp(x,y));
        checkpointChecks.push({index:sw.index,healthPreserved,saved,expected,player:[s.p.x,s.p.y],ball:[s.ball.x,s.ball.y],clear:clear(s.p)&&clear(s.ball),lockPreserved:sw.on});
      });
      const gatesAfterTargets = closedGates();
      s.p.body.reset(L.p[0]*16+8,L.p[1]*16+8);
      const counts = [remainingEnemies()];
      s.enemies.forEach(enemy => {
        s.shotActive = true;
        s.drib = false;
        s.ball.body.reset(enemy.o.x, enemy.o.y);
        s.ball.body.setVelocity(300, 0);
        s.updateEnemies(1 / 60);
        counts.push(remainingEnemies());
      });
      if(L.waves){
        while(!s.wavesComplete){s.enemies.forEach(enemy=>{if(!enemy.dead)s.killEnemy(enemy,null)});s.updateWaves()}
        s.updateGoalUnlock();
      }
      const combatUnlocked=s.goalUnlocked(),combatTint=s.goal.tintTopLeft,blinkUsedBeforeFixture=!!profile.used.teleport;
      // Rule-only fixture: traversal achievement is validated by the input suite separately.
      if(LV[s.i].requiredAction==='bounce')s.bounces=1;
      if(LV[s.i].requiredAction==='teleport')profile.used.teleport=true;
      s.updateGoalUnlock();
      const unlocked = s.goalUnlocked();
      const ballInGoal=L.b[0]>=L.g[0]&&L.b[0]<L.g[0]+L.g[2]&&L.b[1]>=L.g[1]&&L.b[1]<L.g[1]+L.g[3];
      const goalBall=ballInGoal?{x:L.b[0]*16+8,y:L.b[1]*16+8}:{x:s.G.x+s.G.w/2,y:s.G.y+s.G.h/2};
      const goalPlayer=ballInGoal?{x:L.g[0]*16+8,y:(L.g[1]+L.g[3]-1)*16+8}:{x:s.G.x+s.G.w/2,y:s.G.y+s.G.h/2};
      s.ball.body.reset(L.p[0]*16+8,L.p[1]*16+8);
      s.p.body.reset(goalPlayer.x,goalPlayer.y);s.won=false;s.update(0,16);
      const playerCannotScore=!s.won;
      s.p.body.reset(L.p[0]*16+8,L.p[1]*16+8);
      s.ball.body.reset(goalBall.x,goalBall.y);s.update(0,16);
      const ballCannotScore=!s.won;
      s.p.body.reset(goalPlayer.x,goalPlayer.y);s.update(0,16);
      return { playerCannotScore, ballCannotScore, checkpointChecks, level: s.i + 1, initialEnemies, initialGates, dronesClear, combatUnlocked, combatTint, blinkUsedBeforeFixture, cyanCaps: s.children.list.filter(o => o.tintTopLeft === 0x66ffff).length, initiallyUnlocked, initialTint, finalTint: s.goal.tintTopLeft, gatesAfterTargets, finalGates:closedGates(), counts, blockedInitially, unlocked, won: s.won };
    });
    if(i===1){
      assert.equal(result.blinkUsedBeforeFixture,false,'Level 5 must be checked without forcing blink use');
      assert.equal(result.combatUnlocked,true,'Level 5 goal stayed locked after all enemies were defeated');
      assert.equal(result.combatTint,0x7bd88f,'Level 5 goal did not turn green on the last enemy defeat');
      const out=path.resolve(__dirname,'..','..','artifacts','passability');fs.mkdirSync(out,{recursive:true});
      await page.evaluate(()=>{const s=game.scene.getScene('game');s.cameras.main.stopFollow().setZoom(1).centerOn(320,192);});
      await page.waitForTimeout(150);
      await page.screenshot({path:path.join(out,'level-5-green-goal.png')});
      fs.writeFileSync(path.join(out,'level-5.json'),JSON.stringify({fixture:'enemy-hit rule test; not normal-input solution',...result},null,2));
    }
    assert.equal(result.cyanCaps, await page.evaluate(()=> (LV[game.scene.getScene('game').i].partials||[]).length), `Level ${i + 1} cyan partial-wall count is incorrect`);
    if(i===3)assert.deepEqual(await page.evaluate(()=>game.scene.getScene('game').switches.map(sw=>sw.label.text)),['1','2','3'],'Level 4 labels must stay numeric after unlocking');
    assert.equal(result.dronesClear, true, `Level ${i + 1} has a drone inside a wall`);
    assert.equal(result.initialTint, result.initiallyUnlocked ? 0x7bd88f : 0xff8a7a, `Level ${i + 1} initial goal color is incorrect`);
    assert.equal(result.finalTint, 0x7bd88f, `Level ${i + 1} goal did not turn green`);
    if (result.initialEnemies) assert.equal(result.blockedInitially, true, `Level ${i + 1} ignored living enemies`);
    assert.equal(result.gatesAfterTargets, 0, `Level ${i + 1} left a gate closed after its required targets`);
    assert.equal(result.checkpointChecks.length,await page.evaluate(()=>game.scene.getScene('game').switches.length),'Every lock must save a checkpoint');
    for(const cp of result.checkpointChecks){
      assert.equal(cp.healthPreserved,true,'Checkpoint activation must not heal');
      assert.deepEqual(cp.saved,cp.expected,'Lock must save its authored checkpoint or its own position');
      assert.deepEqual(cp.player,cp.expected.p.map(v=>v*16+8),'Death must restore the player to the activated checkpoint');
      assert.deepEqual(cp.ball,cp.expected.b.map(v=>v*16+8),'Death must restore the ball to the activated checkpoint');
      assert.equal(cp.clear,true,'Checkpoint respawn must be outside walls and closed gates');
      assert.equal(cp.lockPreserved,true,'Checkpoint respawn must preserve lock progress');
    }
    assert.equal(result.finalGates,0,`Level ${i + 1} left a gate closed after all objectives`);
    result.counts.forEach((count, index) => {
      assert.equal(count, Math.max(0, result.initialEnemies - index), `Level ${i + 1} enemy count incorrect after hit ${index}`);
    });
    assert.equal(result.counts.at(-1), 0, `Level ${i + 1} has enemies remaining`);
    assert.equal(result.unlocked, true, `Level ${i + 1} did not unlock at zero enemies and zero gates`);
    assert.equal(result.playerCannotScore,true,'The player alone must not score');
    assert.equal(result.ballCannotScore,true,'The ball alone must not score, even after the player previously touched the goal');
    assert.equal(result.won, true, `Level ${i + 1} could not be completed`);
    console.log(`PASS level ${i + 1}: ${result.initialEnemies} enemies, ${result.initialGates} gates, ${result.checkpointChecks.length} checkpoint respawns; neither alone scores, both together complete`);
  }

  const fresh=async(level,upgrade)=>{
    await page.goto(pathToFileURL(path.resolve(__dirname,'..','index.html')).href);
    await page.waitForFunction(()=>window.game?.scene.getScene('game')?.p);
    const active=page.locator('.upgrade-grid button.active');if(await active.count())await active.click();
    if(upgrade!==null)await page.locator('.upgrade-grid button').nth(upgrade).click();
    await page.locator(`[data-level="${level}"]`).click();await page.waitForTimeout(100);await page.locator('.menu-action').click();
  };
  for(const level of [2,7]){
    await fresh(level,1);
    const result=await page.evaluate(()=>{
      const s=game.scene.getScene('game');s.ball.body.reset(300,344);s.teleport();
      const first=s.p.x,cool=s.teleportCool;s.ball.body.reset(288,344);s.teleport();const blocked=s.p.x===first;
      s.tickCooldowns(14.999);s.teleport();const earlyBlocked=s.p.x===first;
      s.tickCooldowns(.002);s.teleport();return {cool,blocked,earlyBlocked,reused:s.p.x===288};
    });
    assert.deepEqual(result,{cool:15,blocked:true,earlyBlocked:true,reused:true});
    console.log(`PASS level ${level}: Blink is reusable after exactly its fifteen-second cooldown`);
  }
  for(const upgrade of [null,0,1,2]){
    await fresh(1,upgrade);
    const result=await page.evaluate(()=>{
      const s=game.scene.getScene('game');s.p.body.reset(200,200);s.p.body.setVelocityY(80);s.ball.body.reset(200,210);s.ball.body.blocked.down=false;s.bj=0;
      const fired=(s.ball.body.setVelocityY(-100),s.updateBallPullRise(true),s.tryBallJump()),cool=s.ballJumpCool;
      s.p.body.setVelocityY(80);s.bj=0;const blocked=!(s.ball.body.setVelocityY(-100),s.updateBallPullRise(true),s.tryBallJump());
      s.tickCooldowns(1.499);s.p.body.setVelocityY(80);s.bj=0;const earlyBlocked=!(s.ball.body.setVelocityY(-100),s.updateBallPullRise(true),s.tryBallJump());
      s.tickCooldowns(.002);s.p.body.setVelocityY(80);s.bj=0;
      return {fired,cool,blocked,earlyBlocked,reused:(s.ball.body.setVelocityY(-100),s.updateBallPullRise(true),s.tryBallJump())};
    });
    assert.equal(result.fired,upgrade===0);assert.equal(result.reused,upgrade===0);
    if(upgrade===0){assert.equal(result.cool,1.5);assert.equal(result.blocked,true);assert.equal(result.earlyBlocked,true);}
  }
  console.log('PASS: Ball Jump is unavailable without its loadout and reusable only after 1.5 seconds');
  await fresh(9,2);
  const rocket=await page.evaluate(()=>{
    const s=game.scene.getScene('game');s.enemies.forEach((e,i)=>e.o.setPosition(s.p.x+40+i*12,s.p.y));
    for(let n=0;n<595;n++){s.tickCooldowns(1/60);s.updateLoadouts(1/60)}
    const first=s.enemies.filter(e=>e.dead).length;
    for(let n=0;n<50;n++){s.tickCooldowns(1/60);s.updateLoadouts(1/60)}
    return {first,second:s.enemies.filter(e=>e.dead).length};
  });
  assert.deepEqual(rocket,{first:1,second:2});console.log('PASS: Rocket kills once per ten-second cooldown and returns for repeated use');

  assert.deepEqual(errors, [], 'Browser runtime errors');
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exit(1);
});
