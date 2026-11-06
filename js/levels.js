// Tile data: floors/openings, extra solids, goal, player/ball, targets, and linked gates.
const LV=[
{n:'1 · Remote Delivery',m:'RECALL',diff:'EASY',hint:'Hold R: the ball finds a route around walls.',w:38,h:24,f:[],o:{},x:[[10,16,1,7],[18,16,1,7],[27,18,1,5]],g:[2,18,3,3],p:[3,21],b:[34,21]},
{n:'2 · Across the Divide',m:'TRAVERSAL',diff:'EASY',hint:'Cross the barrier with your selected loadout, clear every enemy and score with the ball.',w:40,h:24,f:[],o:{},x:[[10,17,2,1],[20,10,2,1],[30,6,2,1],[36,4,3,1]],g:[36,1,3,3],p:[3,21],b:[7,21]},
{n:'3 · Sky Relay',m:'RECALL',diff:'MEDIUM',hint:'Use normal jumps, touch the relay and defeat the guards. Rocket helps clear the route.',w:38,h:28,f:[],o:{},x:[[5,24,8,1],[14,20,8,1],[5,16,8,1],[14,12,8,1],[23,8,8,1],[29,4,8,1]],g:[33,2,3,3],p:[3,26],b:[7,26],s:[[9,15]],d:[[28,2,1,5]],normalJumps:true},
{n:'4 · Relay Ascent',m:'CIRCUIT',diff:'EASY',hint:'',overview:true,ceilingLift:24,w:32,h:18,f:[],o:{},x:[],g:[28,-.5,3,3],p:[3,16],b:[7,16]},
makeRecallChamber(),
{n:'6 · Overload',m:'CIRCUIT',diff:'MEDIUM',hint:'Touch locks 1 > 2 > 3. Lock 2 opens the upper route; lock 3 completes the final gate.',w:44,h:29,f:[4,8,14,20,24],o:{4:[[8,10]],8:[[34,36]],14:[[5,7]],20:[[4,6]],24:[[38,40]]},x:[[12,26,2,2],[24,25,2,1],[10,23,5,1],[28,21,1,1],[20,22,1,2],[14,19,3,1],[26,17,1,1],[30,18,1,2],[10,14,1,2],[24,13,1,1],[28,15,4,1],[14,10,1,2],[22,9,1,1],[26,11,5,1],[12,5,1,1],[20,6,1,2],[28,7,5,1],[20,2,1,2],[30,1,1,1]],g:[39,1,3,3],p:[3,27],b:[8,27],s:[[16,27],[18,19],[33,7]],requires:[[],[0],[1]],gateLinks:[[0,1,2],[0,1]],d:[[37,1,1,3],[35,5,1,3]]},
{n:'7 · Blink Bastion',m:'TRAVERSAL',diff:'MEDIUM',hint:'The ball fits through the slot. Blink across, then use a normal jump over the second barrier.',w:40,h:24,f:[],o:{},x:[[14,1,1,21],[27,19,1,5],[18,19,3,1],[31,17,3,1]],partials:[[224,352,16,2],[224,366,16,2]],g:[35,20,3,3],p:[3,21],b:[7,21]},
makeReturnTower(),
{n:'9 · Circuit Training',m:'CIRCUIT',diff:'HARD',hint:'Survive the patrols, clear the room, then join the trapped ball in the goal.',w:32,h:22,f:[],o:{},x:[[10,17,4,1],[28,19,1,1],[28,20,1,1],[29,19,1,1],[30,19,1,1],[30,20,1,1]],g:[27,18,3,3],p:[3,19],b:[29,20],normalJumps:true}
];
// Three distinct jobs: gravity release, tray transfer, then goal-room access.
function makeRecallChamber(){
  const x=[
    [1,29,6,1],[6,30,1,1],
    [19,3,20,1],[19,4,1,30],[38,4,1,31],
    [20,29,18,1],[20,31,17,3],
    [7,31,5,1],[13,27,5,1],[7,23,5,1],[13,19,5,1],
    [7,15,5,1],[13,11,5,1],[7,7,5,1],[13,3,5,1],
    [18,3,1,1],[39,3,4,1],
    [40,32,2,1],[43,29,2,1],[40,26,2,1],[43,23,2,1],[40,20,2,1],
    [43,17,2,1],[40,14,2,1],[43,11,2,1],[40,8,2,1],[44,7,1,1]
  ];
  return {n:'5 · Recall Chamber',m:'RECALL',diff:'HARD',hint:'One door at a time. Let the ball settle before changing the route.',
    w:46,h:36,f:[],o:{},x,partials:[[320,480,288,2],[320,544,272,2]],
    g:[2,32,3,3],p:[8,34],b:[37,30],
    d:[[37,31,1,1],[19,34,1,1],[6,31,1,4]],
    routeSelectors:[[44,34],[44,6],[39,34]],initialRoute:2,deliveryRoute:2};
}
// Existing left shaft, relocated upper lock, and right-side combat tower.
function makeReturnTower(){
  const x=[[12,8,1,95],[1,8,2,1],[8,8,4,1]],ascent=[],descent=[];
  for(let step=0;step<=30;step++){
    const ledge=[step%2?26:15,100-step*3,10,1];x.push(ledge);ascent.push(ledge);
  }
  for(let step=0;step<11;step++){
    const ledge=[step%2?7:1,16+step*8,5,1];x.push(ledge);descent.push(ledge);
  }
  return {n:'8 · Summit Lock',m:'TRAVERSAL',diff:'HARD',capstone:true,returnTower:true,localRecovery:true,cover:false,
    hint:'',
    w:48,h:104,f:[],o:{},x,g:[26,99,3,3],p:[4,101],b:[6,101],
    s:[[4,15],[17,9],[18,45],[32,72]],requires:[[],[0],[1],[2]],gateLinks:[[0]],combatGates:[],d:[[3,8,5,1]],
    checkpoints:[{p:[4,15],b:[5,15]},{p:[19,9],b:[21,9]},{p:[20,45],b:[22,45]},{p:[28,72],b:[30,72]}],ascent,descent};
}
// Level 1 is a hazard-free recall tutorial. Patrols spawn above solid ground, never inside it.
const EN={2:[['w',24,21],['d',32,14]],3:[['w',9,23],['d',18,25],['w',18,19],['d',27,21],['w',9,15],['d',18,15],['w',18,11],['d',27,10],['w',27,7],['w',33,3],['d',18,22],['d',28,18],['d',4,14],['d',20,6],['d',6,22],['d',32,18],['d',30,6]],4:[],5:[],6:[['w',18,27],['w',30,23],['d',32,17],['w',20,19],['w',18,13],['d',36,10],['w',18,7],['w',24,3]],7:[['w',10,21],['d',19,14],['w',22,21],['d',32,12],['w',34,21]],8:[['w',22,99,[21,24]],['d',31,94],['w',17,81,[16,18]],['d',18,79],['w',17,63,[16,18]],['d',31,58],['w',17,39,[16,18]],['d',18,31],['w',17,15,[16,18]],['d',31,16],['d',18,91],['d',31,82],['d',18,67],['d',31,70],['d',18,49],['d',31,40],['d',18,19]],9:[['d',10,14],['d',18,15],['d',27,12],['d',14,10],['d',22,8],['d',6,12],['d',28,9],['d',16,7],['d',24,17],['d',8,8]]};
const DRONE_RANGE=368;
const MENU_ORDER=[0,1,2,3,4,5,6,7,8];
// Campaign progression follows the displayed level numbers.
const LEVEL_ORDER=[0,1,2,3,4,5,6,7,8];
const nextLevelIndex=i=>LEVEL_ORDER[(LEVEL_ORDER.indexOf(i)+1)%LEVEL_ORDER.length];
function build(L){
  const s=[];
  for(let y=0;y<L.h;y++){s[y]=[];for(let x=0;x<L.w;x++)s[y][x]=x==0||(y==0&&!L.ceilingLift)||x==L.w-1||y==L.h-1}
  L.f.forEach(r=>{for(let x=1;x<L.w-1;x++)s[r][x]=!(L.o[r]||[]).some(([a,b])=>x>=a&&x<=b)});
  L.x.forEach(([a,b,w,h])=>{for(let y=b;y<b+h;y++)for(let x=a;x<a+w;x++)s[y][x]=true});
  return s;
}
