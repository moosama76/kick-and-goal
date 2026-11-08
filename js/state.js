const T=16,JD=Phaser.Input.Keyboard.JustDown,$=id=>document.getElementById(id);
const ap=(v,t,d)=>v<t?Math.min(v+d,t):Math.max(v-d,t);
let profile={unlocked:1,best:{},upgrades:[],used:{}};
try{profile={...profile,...JSON.parse(localStorage.getItem('kickGoalSave')||'{}')}}catch{}
profile.used=profile.used||{};
const saveProfile=()=>{try{localStorage.setItem('kickGoalSave',JSON.stringify(profile))}catch{}};
if(profile.levelOrderVersion!==2){
  const old2=profile.best[1],old5=profile.best[4];
  delete profile.best[1];delete profile.best[4];
  if(old5)profile.best[1]=old5;if(old2)profile.best[4]=old2;
  profile.levelOrderVersion=2;saveProfile();
}
const UP=[{id:'bounce',name:'BALL JUMP',desc:'Bounce off the ball · 1.5s cooldown'},{id:'teleport',name:'BALL BLINK',desc:'Q/E: teleport to the ball · 15s cooldown'},{id:'glove',name:'HOMING ROCKET',desc:'Automatic homing attack · 10s cooldown'}],hasUp=id=>profile.upgrades.includes(id);
profile.upgrades=profile.upgrades.filter(id=>UP.some(u=>u.id===id)).slice(0,1);

if(!profile.upgrades.length){profile.upgrades=[UP[0].id];saveProfile()}
