const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = require('../scripts/game-source.cjs').readGameLogic();
const source = html;
const context = vm.createContext({
  T: 16, Phaser: { Scene: class {} }, hasUp: () => false, audio: { sfx() {} },
  profile: { used: {} }, saveProfile() {}
});
vm.runInContext(source + '\nglobalThis.fixture = { LV, Game, build };', context);
const { LV, Game, build } = context.fixture;

// Stub rendering and physics setters, but exercise the real damage/reset handlers.
function sprite(x, y) {
  const object = { x, y, setTexture(texture) { this.texture = texture; return this; } };
  object.body = {
    allowGravity: false, gravityY: -650, vx: 700, vy: -200, bounce: 0,
    reset(x, y) { object.x = x; object.y = y; this.vx = this.vy = 0; return this; },
    setAllowGravity(value) { this.allowGravity = value; return this; },
    setGravityY(value) { this.gravityY = value; return this; },
    setVelocity(x, y) { this.vx = x; this.vy = y; return this; },
    setBounce(value) { this.bounce = value; return this; }
  };
  return object;
}

for (let i = 0; i < LV.length; i++) {
  for (const state of ['kick', 'recall', 'possession']) {
    const s = Object.assign(Object.create(Game.prototype), {
      i, health: 2, invuln: 0, won: false, deaths: 0, face: -1,
      p: sprite(100, 100), ball: sprite(200, 200),
      shotActive: state === 'kick', drib: state === 'possession',
      recalling: state === 'recall', recallTarget: { x: 50, y: 50 },
      path: [[50, 50]], recallAge: 2, recallSide: -1, plen: 200,
      burst() {}, hud() {}, cameras: { main: { shake() {} } },
      gfx: { clear() {} }
    });
    s.hurt({ x: 150 });
    assert.equal(s.health, 1);
    assert.equal(s.ball.x, 200, 'Nonfatal damage must leave the ball in play');
    s.invuln = 0;
    s.teleportCool = 4; s.ballJumpCool = 1.2; s.gloveCool = 3;
    s.hurt({ x: 150 });
    assert.equal(s.deaths, 1);
    assert.equal(s.teleportCool,4,'Death must preserve the active teleport cooldown');
    assert.equal(s.ballJumpCool,1.2,'Death must preserve the active Ball Jump cooldown');
    assert.equal(s.gloveCool,3,'Death must preserve the active rocket cooldown');
    assert.equal(s.health, 3);
    assert.equal(s.p.x, LV[i].p[0] * 16 + 8);
    assert.equal(s.p.y, LV[i].p[1] * 16 + 8);
    assert.equal(s.ball.x, LV[i].b[0] * 16 + 8, 'Death must return ball to its level spawn');
    assert.equal(s.ball.y, LV[i].b[1] * 16 + 8);
    assert.equal(s.ball.body.vx, 0);
    assert.equal(s.ball.body.vy, 0);
    assert.equal(s.ball.body.allowGravity, true, 'Interrupted recall must restore gravity');
    assert.equal(s.ball.body.gravityY, 0, 'Kick gravity must be cleared');
    assert.equal(s.ball.body.bounce, .6);
    assert.equal(s.shotActive, false);
    assert.equal(s.drib, false);
    assert.equal(s.recalling, false);
    assert.equal(s.path, null);
    assert.equal(s.recallTarget, null);
    assert.equal(s.recallAge, 0);
    assert.equal(s.recallSide, 0);
    assert.equal(s.plen, 0);
    assert.equal(s.ball.texture, 'ball0');
    if(LV[i].s){
      Object.assign(s,{S:build(LV[i]),enemies:[{dead:true},{dead:false}],
        switches:LV[i].s.map(([x,y],index)=>({index,x:x*16+8,y:y*16+8,on:false,requires:LV[i].requires?.[index]||[],o:{setTexture(){},clearTint(){}}})),
        drawWire(){},openReadyDoors(){},updateGoalUnlock(){}});
      for(let pass=0;pass<s.switches.length;pass++)for(const sw of s.switches){
        if(sw.on||!s.switchReady(sw))continue;
        s.health=1;assert.equal(s.activateSwitch(sw),true);assert.equal(s.health,1,'Checkpoint activation must preserve existing health');
        const point=LV[i].s[sw.index],expected=LV[i].checkpoints?.[sw.index]||{p:point,b:point};
        if(LV[i].checkpoints?.[sw.index])assert.equal(s.checkpoint,expected,'Authored tower checkpoint must be preserved');
        for(const key of ['p','b'])for(let axis=0;axis<2;axis++)assert.equal(s.checkpoint[key][axis],expected[key][axis]);
        for(const [key,left,right,top,bottom] of [['p',-5,4,-7,6],['b',-5,4,-5,4]])for(let dx=left;dx<=right;dx++)for(let dy=top;dy<=bottom;dy++){
          assert.equal(!!s.sp(expected[key][0]*16+8+dx,expected[key][1]*16+8+dy),false,'Checkpoint must have full body clearance');
        }
        const progress=s.switches.map(lock=>lock.on).join(',');
        s.health=1;s.invuln=0;s.p.body.reset(100,100);s.ball.body.reset(200,200);
        s.shotActive=state==='kick';s.drib=state==='possession';s.recalling=state==='recall';
        s.hurt({x:150});
        assert.equal(s.p.x,expected.p[0]*16+8);assert.equal(s.p.y,expected.p[1]*16+8);
        assert.equal(s.ball.x,expected.b[0]*16+8);assert.equal(s.ball.y,expected.b[1]*16+8);
        assert.equal(s.switches.map(lock=>lock.on).join(','),progress,'Death must preserve the activated locks');
        assert.equal(s.enemies[0].dead,true,'Death must preserve defeated enemies');
        assert.equal(s.teleportCool,4);assert.equal(s.ballJumpCool,1.2);assert.equal(s.gloveCool,3);
        s.ball.body.reset(200,200);s.recoverBall();
        assert.equal(s.ball.x,expected.b[0]*16+8);assert.equal(s.ball.y,expected.b[1]*16+8);
      }
      assert.ok(s.switches.every(sw=>sw.on));
    }
    if(i===7){
      s.checkpoint=LV[i].checkpoints[1];s.health=1;s.invuln=0;
      s.hurt({x:150});
      assert.equal(s.p.x,s.checkpoint.p[0]*16+8,'Tower death must use the saved player checkpoint');
      assert.equal(s.p.y,s.checkpoint.p[1]*16+8);
      assert.equal(s.ball.x,s.checkpoint.b[0]*16+8,'Tower ball must reset at the same checkpoint');
      assert.equal(s.ball.y,s.checkpoint.b[1]*16+8);
      assert.equal(s.teleportCool,4,'Checkpoint respawn must preserve the teleport cooldown');
      s.S=build(LV[i]);s.p.body.blocked={down:true};s.recoverBall(true);
      assert.ok(Math.abs(s.ball.x-s.p.x)<=16,'Tower C recovery must restore the ball locally');
      assert.ok(Math.abs(s.ball.y-s.p.y)<=2);
    }
  }
}
console.log('PASS: death resets both bodies in all 9 levels; every lock saves a safe checkpoint without healing; checkpoint death/recovery preserve progress and cooldowns during kick, recall and possession');
