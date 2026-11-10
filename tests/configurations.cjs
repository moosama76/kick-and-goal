const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = require('../scripts/game-source.cjs').readGameLogic();
const context = vm.createContext({ T: 16, Phaser: { Scene: class {} }, audio: { sfx() {} }, profile: { used: {} } });
vm.runInContext(html + '\nglobalThis.fixture={LV,EN,Game,build,MENU_ORDER,LEVEL_ORDER,nextLevelIndex};', context);
const { LV, EN, Game, build, MENU_ORDER, LEVEL_ORDER, nextLevelIndex } = context.fixture;
const groups = new Map();
assert.equal(LV.length, 9);
for (let i = 0; i < LV.length; i++) {
  const L = LV[i];
  assert.equal(L.g[2], 3, `Level ${i + 1}: goal width must stay fixed at 3 tiles`);
  assert.equal(L.g[3], 3, `Level ${i + 1}: goal height must stay fixed at 3 tiles`);
  groups.set(L.m, [...(groups.get(L.m) || []), L.diff]);
  const s = Object.assign(Object.create(Game.prototype), { i, S: build(L) });
  for (const [x, y, w, h] of L.d || []) for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) s.S[y + dy][x + dx] = true;
  const checkBody = (x, y, left, right, top, bottom, label) => {
    for (let dx = left; dx <= right; dx++) for (let dy = top; dy <= bottom; dy++) {
      assert.equal(!!s.sp(x * 16 + 8 + dx, y * 16 + 8 + dy), false, `Level ${i + 1}: ${label} intersects geometry at ${x},${y}`);
    }
  };
  checkBody(...L.p, -5, 4, -7, 6, 'player spawn');
  checkBody(...L.b, -5, 4, -5, 4, 'ball spawn');
  for (const [type, x, y] of EN[i + 1] || []) {
    checkBody(x, y, type === 'd' ? -24 : -6, type === 'd' ? 24 : 5, type === 'd' ? -12 : -5, type === 'd' ? 13 : 6, 'enemy spawn/hover');
  }
  for (const [x, y] of L.s || []) assert.equal(!!s.sp(x * 16 + 8, y * 16 + 8), false, 'Target buried in geometry');
  for (const deps of L.requires || []) for (const target of deps) assert.ok(target >= 0 && target < L.s.length, 'Invalid prerequisite');
  for (const links of L.gateLinks || []) for (const target of links) assert.ok(target >= 0 && target < L.s.length, 'Invalid gate link');
  const ready = new Set();
  for (let pass = 0; pass < (L.s || []).length; pass++) for (let target = 0; target < L.s.length; target++) {
    if (((L.requires || [])[target] || []).every(k => ready.has(k))) ready.add(target);
  }
  assert.equal(ready.size, (L.s || []).length, 'Target dependencies contain a cycle');
}
assert.equal(groups.size, 3, 'Exactly three puzzle families are required');
for (const [name, difficulties] of groups) {
 const expected=['EASY','HARD','MEDIUM'];
 assert.deepEqual([...difficulties].sort(),expected,`${name} difficulty configuration`);
}
assert.equal(LV[7].capstone,true,'User-requested tower replaces the former easy traversal tutorial');
assert.equal(new Set(LEVEL_ORDER).size, 9);
assert.deepEqual(Array.from(MENU_ORDER),[0,1,2,3,4,5,6,7,8],'Level menu must use the renumbered numeric order');
for (let i = 0; i < 9; i++) assert.equal(nextLevelIndex(i), (i + 1) % 9, `Level ${i + 1} must lead to level ${(i + 1) % 9 + 1}`);

for (const i of [3]) {
  const L = LV[i], texture = { setTexture() { return this; }, clearTint() {} };
  const s = Object.assign(Object.create(Game.prototype), {
    i, S: build(L), burst() {}, hud() {}, drawWire() {}, updateGoalUnlock() {},
    cameras: { main: { shake() {} } },
    doors: L.d.map(([x, y, w, h]) => ({ x, y, w, h, open: false, o: { disableBody() {} } })),
    switches: L.s.map(([x, y], index) => ({ x, y, index, on: false, o: texture, requires: L.requires[index] }))
  });
  const locked = s.switches.find(sw => sw.requires.length);
  assert.equal(s.activateSwitch(locked), false, 'Out-of-order hit must not advance puzzle');
  assert.equal(locked.on, false);
  const order = L.s.map((_,index)=>index);
  for (const target of order) {
    assert.equal(s.activateSwitch(s.switches[target]), true);
    L.gateLinks.forEach((links, gate) => assert.equal(s.doors[gate].open, links.every(k => s.switches[k].on)));
  }
  assert.ok(s.doors.every(d => d.open));
}
console.log('PASS: nine configurations and the requested Hard tower capstone, all spawn/hover clearance, target dependency DAGs, ordered-hit rejection and multi-target gates');

for(const i of [4,6])assert.equal(LV[i].requiredUpgrade,undefined,'Levels 5 and 7 must not force a loadout');

// Level 5's goal must respond to enemy clearing, independently of upgrade-use bookkeeping.
for(const i of [4,6])for(const used of [false,true]){
 const s=Object.assign(Object.create(Game.prototype),{i,switches:[],enemies:[{dead:false}]});
 context.profile.used={teleport:used};
 assert.equal(s.goalUnlocked(),false,'Goal must remain locked while an enemy lives');
 s.enemies[0].dead=true;
 assert.equal(s.goalUnlocked(),true,'Goals in levels 5 and 7 must unlock without forcing blink use');
}
