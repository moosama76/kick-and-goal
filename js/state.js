const T=16,JD=Phaser.Input.Keyboard.JustDown,$=id=>document.getElementById(id);
const ap=(v,t,d)=>v<t?Math.min(v+d,t):Math.max(v-d,t);
let profile={unlocked:1,best:{},upgrades:[],used:{}};
try{profile={...profile,...JSON.parse(localStorage.getItem('kickGoalSave')||'{}')}}catch{}
profile.used=profile.used||{};
const saveProfile=()=>{try{localStorage.setItem('kickGoalSave',JSON.stringify(profile))}catch{}};
if((profile.levelOrderVersion||0)<2){
  const old2=profile.best[1],old5=profile.best[4];
  delete profile.best[1];delete profile.best[4];
  if(old5)profile.best[1]=old5;if(old2)profile.best[4]=old2;
  profile.levelOrderVersion=2;saveProfile();
}
if(profile.levelOrderVersion<3){
  const old4=profile.best[3],old6=profile.best[5];
  delete profile.best[3];delete profile.best[5];
  if(old6)profile.best[3]=old6;if(old4)profile.best[5]=old4;
  profile.levelOrderVersion=3;saveProfile();
}
const UP=[{id:'bounce',name:'BALL JUMP',unlockLevel:1,desc:'Bounce off the ball · 1.5s cooldown'},{id:'teleport',name:'BALL BLINK',unlockLevel:6,desc:'Q/E: teleport to the ball · 15s cooldown'},{id:'glove',name:'HOMING ROCKET',unlockLevel:3,desc:'Automatic homing attack · 10s cooldown'}];
const hasUp=id=>profile.upgrades.includes(id);
function earnLoadoutsAt(level){
  const previous=profile.earnedLoadouts||[];
  profile.highestLevelReached=Math.max(1,profile.highestLevelReached||1,level);
  profile.earnedLoadouts=UP.filter(u=>u.unlockLevel<=profile.highestLevelReached).map(u=>u.id);
  profile.upgrades=(profile.upgrades||[]).filter(id=>profile.earnedLoadouts.includes(id)).slice(0,1);
  if(!profile.upgrades.length)profile.upgrades=['bounce'];
  saveProfile();return UP.filter(u=>profile.earnedLoadouts.includes(u.id)&&!previous.includes(u.id));
}
// The old build offered every ability freely; those selections are not earned unlocks.
// Start the new unlock track with Jump while retaining all level scores.
if(profile.loadoutProgressVersion!==1){
  profile.highestLevelReached=1;profile.earnedLoadouts=['bounce'];profile.upgrades=['bounce'];profile.loadoutProgressVersion=1;
}
earnLoadoutsAt(profile.highestLevelReached||1);
