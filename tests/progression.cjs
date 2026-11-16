const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,'js',name+'.js'),'utf8');
function load(saved){
 let storage=saved?JSON.stringify(saved):null;
 const c=vm.createContext({localStorage:{getItem:()=>storage,setItem:(_key,value)=>storage=value},document:{},Phaser:{Scene:class{},Input:{Keyboard:{JustDown(){}}}},audio:{sfx(){}}});
 vm.runInContext(read('state')+read('levels')+read('game')+';globalThis.data={profile,UP,earnLoadoutsAt,Game,LV,EN}',c);
 return {data:c.data,saved:()=>JSON.parse(storage)};
}
const test=load(),{profile,earnLoadoutsAt,Game,LV,EN}=test.data;
assert.deepEqual(Array.from(profile.upgrades),['bounce']);assert.deepEqual(Array.from(profile.earnedLoadouts),['bounce']);
const s=Object.assign(new Game(),{ballJumpCool:1,teleportCool:0,gloveCool:0,ballJumpArt:{setVisible(){}},teleportArt:{setVisible(){}},gloveArt:{setVisible(){}},updateLoadoutHud(){}});
assert.equal(s.changeLoadout(1),false);assert.equal(s.changeLoadout(2),false);
earnLoadoutsAt(2);assert.equal(profile.earnedLoadouts.length,1);
assert.deepEqual(Array.from(earnLoadoutsAt(3),u=>u.id),['glove']);assert.equal(s.changeLoadout(2),true);assert.equal(s.ballJumpCool,1);assert.equal(s.changeLoadout(1),false);
earnLoadoutsAt(5);assert.equal(s.loadoutAvailable('teleport'),false);
assert.deepEqual(Array.from(earnLoadoutsAt(6),u=>u.id),['teleport']);assert.equal(s.changeLoadout(1),true);
earnLoadoutsAt(1);assert.equal(profile.earnedLoadouts.length,3,'Earned abilities survive replaying earlier levels');
assert.equal(load(test.saved()).data.profile.earnedLoadouts.length,3,'Unlocks persist after reload');
assert.match(LV[3].n,/4 · Overload/);assert.equal(LV[3].s.length,3);assert.equal(EN[4].length,8);
assert.match(LV[5].n,/6 · Relay Ascent/);assert.equal(LV[5].overview,true);assert.equal(EN[6].length,0);
const old={levelOrderVersion:2,unlocked:9,best:{1:{time:12},3:{time:44},4:{time:55},5:{time:66}},upgrades:['teleport']};
const migrated=load(old);assert.equal(migrated.data.profile.best[3].time,66);assert.equal(migrated.data.profile.best[5].time,44);assert.equal(migrated.data.profile.best[1].time,12);assert.equal(migrated.data.profile.best[4].time,55);
assert.deepEqual(Array.from(migrated.data.profile.upgrades),['bounce'],'Old unearned selections reset safely');assert.deepEqual(Array.from(migrated.data.profile.earnedLoadouts),['bounce'],'Old free abilities do not count as earned');
assert.equal(load(migrated.saved()).data.profile.best[3].time,66,'Score migration runs once');
console.log('PASS: Jump-only start; Rocket at 3; Blink at new 6; locked input rejected; unlocks persist; level geometry/enemies and saved scores swap correctly');
