const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const profile = { upgrades: [], used: {} };
const elements = { hud: {}, help: {}, tip: {}, health: {setAttribute(){},children:[]} };
const html = require('../scripts/game-source.cjs').readGameLogic();
const context = vm.createContext({
  T: 16, Phaser: { Scene: class {} }, profile,
  hasUp: id => profile.upgrades.includes(id), saveProfile() {},
  UP: ['bounce', 'teleport', 'glove'].map(id => ({ id, name: id })),
  $: id => elements[id], audio: { sfx() {}, muted: true }
});
vm.runInContext(html + '\nglobalThis.fixture = { Game, LV, build };', context);
const { Game, LV, build } = context.fixture;
function player(x, y) {
  const p = { x, y };
  p.body = { reset(x, y) { p.x = x; p.y = y; }, setVelocity() {} };
  return p;
}
for (const upgrades of [[], ['bounce'], ['glove'], ['teleport']]) {
  profile.upgrades = upgrades;
  const scene = Object.assign(Object.create(Game.prototype), {
    i: 6, S: build(LV[6]), won: false, teleportCool: 0, ballJumpCool:0, gloveCool:0,
    p: player(56,344), ball:{x:272,y:344},
    time:{now:0},health:3,kicks:0,gloveState:'orbit',switches:[],enemies:[],particle(){},burst(){},
    teleportArt:{setVisible(){return this;}},cameras:{main:{flash(){}}}
  });
  if (!upgrades.includes('teleport')) {
    scene.teleport();assert.equal(scene.p.x,56,'Blink requires its selected loadout');continue;
  }
  scene.teleport();assert.equal(scene.p.x,272);assert.equal(scene.ball.x,272);assert.equal(scene.teleportCool,15);
  scene.ball.x=300;scene.teleport();assert.equal(scene.p.x,272,'Blink must wait for its cooldown');
  scene.tickCooldowns(14.999);scene.teleport();assert.equal(scene.p.x,272);
  scene.tickCooldowns(.002);scene.teleport();assert.equal(scene.p.x,300,'Blink must be reusable after fifteen seconds');
}
assert.equal(LV[6].x.find(([x])=>x===27)[1],19,'Second barrier must be reachable with a normal jump when Blink is selected');

// Flood-fill the actual solid pixels using each body's full AABB. This allows
// unrestricted flight, so an unreachable player route also rules out ball-bounce bypasses.
const L = LV[6], W = L.w * 16, H = L.h * 16;
const solids = build(L);
const solidScene = Object.assign(Object.create(Game.prototype), { i: 6, S: solids });
const stride = W + 1, sums = new Int32Array((W + 1) * (H + 1));
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const k = (y + 1) * stride + x + 1;
  sums[k] = Number(solidScene.sp(x, y)) + sums[k - 1] + sums[k - stride] - sums[k - stride - 1];
}
function reachable(halfWidth, halfHeight) {
  const clear = (x, y) => {
    const a = x - halfWidth, b = y - halfHeight, c = x + halfWidth, d = y + halfHeight;
    if (a < 0 || b < 0 || c > W || d > H) return false;
    return sums[d * stride + c] - sums[b * stride + c] - sums[d * stride + a] + sums[b * stride + a] === 0;
  };
  const seen = new Uint8Array(W * H), queue = new Int32Array(W * H);
  let head = 0, tail = 1;
  queue[0] = 360 * W + 120;
  seen[queue[0]] = 1;
  while (head < tail) {
    const id = queue[head++], x = id % W, y = Math.floor(id / W);
    if (x > 256) return true;
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
      const next = ny * W + nx;
      if (!seen[next] && clear(nx, ny)) { seen[next] = 1; queue[tail++] = next; }
    }
  }
  return false;
}
assert.equal(reachable(5, 5), true, '10px ball must fit through the slot');
assert.equal(reachable(5, 7), false, '14px player must have no route across, even with unlimited flight');
assert.equal(solidScene.los(216, 360, 248, 360), true, 'Recall route must recognize slot clearance');
assert.equal(solidScene.sp(232, 353), true, 'Top cap must participate in route collision checks');
assert.equal(solidScene.sp(232, 367), true, 'Bottom cap must participate in route collision checks');
console.log('PASS: level 7 slot passes ball and blocks every player route; teleport requires equipped loadout and recharges after fifteen seconds');
