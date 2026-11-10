const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the actual level data and routing code without a browser or CDN.
const html = require('../scripts/game-source.cjs').readGameLogic();
const source = html;
const context = vm.createContext({ T: 16, Phaser: { Scene: class {} } });
vm.runInContext(source + '\nglobalThis.layout = { LV, EN, build, Game };', context);
const { LV, EN, build, Game } = context.layout;
const tutorial = LV[0];
assert.equal((EN[1] || []).length, 0, 'Tutorial must have no enemies');
assert.equal((tutorial.s || []).length, 0, 'Tutorial must have no target locks');
assert.equal((tutorial.d || []).length, 0, 'Tutorial must have no gates');
const scene = Object.create(Game.prototype);
scene.S = build(tutorial);
scene.switches = [];
scene.enemies = [];
scene.tutorial={done:false};assert.equal(scene.goalUnlocked(),false,'Coach objectives must be finished before scoring');
scene.tutorial.done=true;assert.equal(scene.goalUnlocked(),true,'Completing coach objectives unlocks the goal');
const [trainingX,trainingY,trainingW]=tutorial.tutorialPlatform;
assert.ok(trainingX>tutorial.p[0]&&trainingX+trainingW<tutorial.g[0],'Ball Jump platform belongs between the practice spot and goal');
const platformRise=(tutorial.h-1-trainingY)*16;
assert.ok(platformRise>400*400/(2*1000),'The training platform needs more height than a normal jump');
assert.ok(platformRise<400*400/(2*530),'The training platform is within Ball Jump height');
assert.equal(scene.S[trainingY][trainingX],false,'The platform must not exist before its lesson');
const route = scene.astar(...tutorial.b, ...tutorial.p);
assert.ok(route, 'Tutorial ball must have a route back to the player');
assert.ok(scene.astar(...tutorial.p, tutorial.g[0] + 1, tutorial.g[1] + 1), 'Tutorial goal must be reachable');

// Revised levels' enemy bodies must start inside the map and outside walls/gates.
for (const [level, enemies] of [[5, EN[5]], [4, EN[4]]]) {
  assert.ok(enemies, `Level ${level} must define its enemy roster`);
  const solids = build(LV[level - 1]);
  for (const [x, y, w, h] of LV[level - 1].d || []) {
    for (let ty = y; ty < y + h; ty++) for (let tx = x; tx < x + w; tx++) solids[ty][tx] = true;
  }
  for (const [type, x, y] of enemies) {
    for (const dx of [-6, 6]) for (const dy of [-5, 7]) {
      const tx = Math.floor((x * 16 + 8 + dx) / 16);
      const ty = Math.floor((y * 16 + 8 + dy) / 16);
      assert.equal(solids[ty]?.[tx], false, `Level ${level} ${type} at ${x},${y} overlaps solid geometry or map bounds`);
    }
  }
}
// Level 6 patrols have footing; drones have clearance across their full hover range.
const level6 = build(LV[3]);
for (const [type, x, y] of EN[4]) {
  if (type === 'w') assert.equal(level6[y + 1][x], true, 'Level 6 patrol needs solid footing');
  else {
    for (let px = x * 16 + 8 - 24; px <= x * 16 + 8 + 24; px++) {
      for (let py = y * 16 + 8 - 12; py <= y * 16 + 8 + 13; py++) {
        assert.equal(level6[Math.floor(py / 16)]?.[Math.floor(px / 16)], false, 'Level 6 drone hover crosses a wall');
      }
    }
  }
}
scene.switches = LV[3].s.map(() => ({ on: true }));
scene.enemies = EN[4].map(() => ({ dead: false }));
assert.equal(scene.goalUnlocked(), false, 'Level 6 goal must require clearing enemies even after all targets are lit');
scene.enemies.forEach(enemy => { enemy.dead = true; });
assert.equal(scene.goalUnlocked(), true, 'Level 6 goal must unlock after clearing enemies and targets');

// Both level 2 patrols start one clear tile above a supporting platform.
const level2 = build(LV[4]);
for (const [type, x, y] of EN[5]) {
  if (type === 'w') assert.equal(level2[y + 1][x], true, 'Level 2 patrol needs solid footing');
}
console.log('PASS: hazard-free coach tutorial, recall/goal routes, level 2/6 spawn clearance and patrol footing, level 6 drone hover clearance and combat goal lock');

const finale=LV[5],empty=build(finale);
assert.equal(EN[6].length,0,'Level 4 must have no enemies');
assert.equal((finale.s||[]).length,0,'Level 4 must have no locks');
assert.equal((finale.d||[]).length,0,'Level 4 must have no gates');
for(let y=1;y<finale.h-1;y++)for(let x=1;x<finale.w-1;x++)assert.equal(empty[y][x],false,'Level 4 interior must be completely empty, including below the goal');
assert.equal(finale.g[0]+finale.g[2],finale.w-1,'Goal must meet the inside of the right boundary');
assert.equal(finale.ceilingLift,40,'Level 4 ceiling must rise one additional block');
assert.equal(finale.g[1]*16,-16,'Level 4 goal must rise half a block');
const sky=Object.assign(Object.create(Game.prototype),{i:5,S:empty});
for(let x=1;x<finale.w-1;x++)assert.equal(empty[0][x],false,'Old ceiling must not remain as an invisible barrier');
assert.equal(!!sky.sp(100,-23),false,'Space below the raised ceiling must be open');
assert.equal(!!sky.sp(100,-25),true,'Raised ceiling must remain solid');
assert.equal(!!sky.sp(8,-4),true,'Left boundary must extend to the raised ceiling');
assert.equal(!!sky.sp(504,-4),true,'Right boundary must extend to the raised ceiling');
assert.equal(finale.overviewHeight,312,'Keep the previous level 4 camera framing height');

// Every door has a distinct role; there is only one ball route to the player.
const L=LV[4];assert.equal(L.overview,undefined,'Recall chamber must use normal camera zoom');
assert.equal(L.routeSelectors[0][0],L.w-2,'Release control must require visiting the far-right edge');
assert.equal(L.routeSelectors[1][0]*16+8,710,'Transfer control must move two pixels left while remaining on its platform');
assert.equal(L.routeSelectors[1][1],6,'Transfer control must rest on the far-right single-block platform');
assert.equal(L.routeSelectors[2][0],39,'Goal-room control must take the former transfer column');
assert.equal(L.routeSelectors[2][1],34,'Goal-room control must take the former transfer row');
assert.equal(L.d.length,3);assert.equal(L.routeSelectors.length,3);
const chamber=Object.assign(Object.create(Game.prototype),{i:4,S:build(L),ball:{x:L.b[0]*16+8,y:L.b[1]*16+8}});
function select(index){for(const [i,[x,y,w,h]] of L.d.entries())for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++)chamber.S[y+dy][x+dx]=i!==index;}
for(const mode of [0,1,2]){
 select(mode);chamber.route({x:280,y:551,side:-1});
 assert.equal(chamber.path,null,'No selector may pull the ball straight from its starting vault');
}
select(0);assert.equal(chamber.sp(600,504),false,'Door 1 must release the ball downward');
assert.equal(chamber.sp(312,552),true,'Door 2 must keep the holding tray closed during release');
chamber.ball.y=552;
select(1);chamber.route({x:280,y:551,side:-1});assert.ok(chamber.path,'Only door 2 transfers the released ball out of the tray');
let ax=chamber.ball.x,ay=chamber.ball.y;
for(const [x,y] of chamber.path){assert.ok(chamber.los(ax,ay,x,y),'Transfer path must clear the tray lip');ax=x;ay=y;}
select(2);chamber.route({x:280,y:551,side:-1});assert.equal(chamber.path,null,'Goal mode must not extract a ball still inside the tray');
chamber.ball.x=280;chamber.route({x:72,y:551,side:-1});assert.ok(chamber.path,'Door 3 must admit an already transferred ball to the goal');
chamber.ball.x=L.b[0]*16+8;chamber.ball.y=L.b[1]*16+8;
for(const dy of [0,-2,-4,-6,-8,-10,2,4,6,8,10])assert.ok([[-5,-7],[5,-7],[-5,7],[5,7],[0,0]].some(([dx,oy])=>chamber.sp(chamber.ball.x+dx,chamber.ball.y+dy+oy)),'Blink must not bypass the initial release');
assert.equal(EN[5].length,0,'Recall lesson must not require combat');

// Selectors are reversible, never checkpoints, and cannot crush either body.
const doors=L.d.map(([x,y,w,h])=>({x,y,w,h,open:false,o:{body:{enable:true},setVisible(){return this}}}));
const selector=Object.assign(Object.create(Game.prototype),{i:4,S:build(L),doors,activeRoute:null,routePads:L.routeSelectors.map((_,index)=>({index,o:{setTexture(){}}})),p:{body:{left:130,right:140,top:540,bottom:554}},ball:{x:600,y:491},goal:{setTint(){}},updateGoalUnlock(){},path:[],rt:1});
assert.equal(selector.selectRecallRoute(2),true);assert.deepEqual(Array.from(doors,d=>d.open),[false,false,true]);
assert.equal(selector.selectRecallRoute(0),true);assert.deepEqual(Array.from(doors,d=>d.open),[true,false,false]);
assert.equal(selector.checkpoint,undefined);
selector.ball.y=504;assert.equal(selector.selectRecallRoute(1),false,'Closing release hatch must wait for the ball to clear');
selector.ball.y=555;assert.equal(selector.selectRecallRoute(1),true);assert.deepEqual(Array.from(doors,d=>d.open),[false,true,false]);
assert.equal(selector.selectRecallRoute(0),true,'A premature transfer selection can always be corrected');

// Both cyan-lined horizontal channels pass the ball but exclude the player's body.
select(1);
const clearBody=(x,y,halfHeight)=>{
 for(let dx=-5;dx<5;dx++)for(let dy=-halfHeight;dy<halfHeight;dy++)if(chamber.sp(x+dx,y+dy))return false;
 return true;
};
for(const [x,top] of [[400,480],[400,544],[312,544]]){
 assert.ok(Array.from({length:16},(_,dy)=>top+dy).some(y=>clearBody(x,y,5)),'A 10px ball must fit the cyan-lined passage');
 assert.ok(!Array.from({length:16},(_,dy)=>top+dy).some(y=>clearBody(x,y,7)),'A 14px player must not fit either cyan-lined passage, including the exit');
}
console.log('PASS: both level 5 channels admit the ball and block the player');
