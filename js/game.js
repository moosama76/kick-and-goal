// Original camera framing is the reference for movement scale and effect tuning.
const GAME_VIEW=Object.freeze({width:960,height:540,zoom:2,narrowWidth:640});
class Game extends Phaser.Scene{
  constructor(){super('game')}
  makeArt(){
    const tex=(key,w,h,draw)=>{const t=this.textures.createCanvas(key,w,h),c=t.getContext();c.imageSmoothingEnabled=false;draw(c);t.refresh()};
    const rect=(c,col,x,y,w=1,h=1)=>{c.fillStyle=col;c.fillRect(x,y,w,h)};
    tex('tile',16,16,c=>{
      rect(c,'#18233f',0,0,16,16);rect(c,'#293a5d',1,1,14,14);rect(c,'#344b72',2,2,12,2);
      rect(c,'#202e4c',2,9,12,5);rect(c,'#3c5279',3,6,5,1);rect(c,'#121a30',0,15,16,1);
      rect(c,'#53688e',2,2,2,1);rect(c,'#1a2540',10,11,3,2);
    });
    tex('tileTop',16,16,c=>{
      rect(c,'#18233f',0,0,16,16);rect(c,'#314765',1,5,14,10);rect(c,'#43aa8b',0,2,16,4);
      rect(c,'#7bd88f',0,1,16,2);rect(c,'#b2f09b',2,0,3,1);rect(c,'#b2f09b',11,0,2,1);
      rect(c,'#27415a',2,10,5,1);rect(c,'#22364f',10,12,4,2);rect(c,'#121a30',0,15,16,1);
    });
    const poses=[[5,12,3,3,9,12,3,3],[5,12,3,3,9,12,3,3],[3,12,4,2,9,11,3,3],[5,11,3,3,10,12,4,2],[4,11,3,3,9,12,4,2],[3,12,4,2,10,11,3,3],[5,11,3,3,9,10,3,3],[3,11,4,3,10,11,4,3],[5,12,3,3,9,11,5,2]];
    for(let i=0;i<9;i++)tex('p'+i,16,16,c=>{
      const bob=i===1?1:0,q=poses[i];rect(c,'#101522',5,1+bob,7,6);rect(c,'#50384c',5,1+bob,7,2);
      rect(c,'#f2b37c',6,3+bob,5,3);rect(c,'#fff1d0',10,4+bob,1,1);rect(c,'#101522',11,4+bob,1,1);
      rect(c,'#101522',3,6+bob,10,6);rect(c,'#f2c14e',4,7+bob,8,4);rect(c,'#e66b4f',4,10+bob,8,1);
      rect(c,'#fff1d0',7,7+bob,2,3);rect(c,'#f2b37c',2,7+bob,2,4);rect(c,'#f2b37c',12,7+bob,2,4);
      rect(c,'#101522',4,11,8,2);rect(c,'#334ca0',5,11,6,2);
      rect(c,'#101522',q[0]-1,q[1],q[2]+2,q[3]);rect(c,'#f2b37c',q[0],q[1],q[2],q[3]-1);
      rect(c,'#101522',q[4]-1,q[5],q[6]+2,q[7]);rect(c,'#f2b37c',q[4],q[5],q[6],q[7]-1);
      rect(c,'#f4f1de',q[0],q[1]+q[3]-1,q[2]+1,1);rect(c,'#f4f1de',q[4],q[5]+q[7]-1,q[6]+1,1);
      if(i===8)rect(c,'#f4f1de',13,12,3,2);
    });
    const patches=[[[4,1],[1,4],[7,6]],[[2,2],[6,1],[4,6]],[[1,5],[5,2],[7,7]],[[3,1],[7,4],[2,7]]];
    for(let i=0;i<4;i++)tex('ball'+i,10,10,c=>{
      const rows=['...oooo...','.oooooooo.','oooooooooo','oooooooooo','oooooooooo','oooooooooo','oooooooooo','oooooooooo','.oooooooo.','...oooo...'];
      rows.forEach((r,y)=>[...r].forEach((v,x)=>{if(v==='o')rect(c,'#101522',x,y)}));
      rect(c,'#f4f1de',2,2,6,6);rect(c,'#ffffff',3,2,4,2);rect(c,'#c8d2dc',2,6,6,2);
      patches[i].forEach(([x,y])=>{rect(c,'#29334d',x,y,2,2);rect(c,'#101522',x+1,y+1,1,1)});
    });
    for(let f=0;f<2;f++)tex('goal'+f,48,48,c=>{
      rect(c,f?'#294c5b':'#203c51',1,1,46,46);
      c.strokeStyle=f?'#66d9d1':'#436c7a';c.lineWidth=1;
      for(let x=5;x<47;x+=6){c.beginPath();c.moveTo(x,2);c.lineTo(x,46);c.stroke()}
      for(let y=5;y<47;y+=6){c.beginPath();c.moveTo(2,y);c.lineTo(46,y);c.stroke()}
      rect(c,'#101522',0,0,48,3);rect(c,'#101522',0,0,3,48);rect(c,'#101522',45,0,3,48);rect(c,'#101522',0,45,48,3);
      rect(c,'#f4f1de',1,1,46,2);rect(c,'#f4f1de',1,1,2,46);rect(c,'#f4f1de',45,1,2,46);
      rect(c,'#f4f1de',1,45,46,2);
    });
    for(let f=0;f<2;f++)tex('switch'+f,12,12,c=>{
      const col=f?'#7bd88f':'#ff6b4a';rect(c,'#101522',1,1,10,10);rect(c,col,2,2,8,8);rect(c,'#18233f',4,4,4,4);rect(c,'#f4f1de',5,5,2,2);
      rect(c,col,0,5,2,2);rect(c,col,10,5,2,2);rect(c,col,5,0,2,2);rect(c,col,5,10,2,2);
    });
    for(let f=0;f<2;f++)tex('routeControl'+f,16,16,c=>{
      // A lever console, distinct from the cross-shaped checkpoint relay.
      rect(c,'#101522',1,3,14,12);rect(c,'#53688e',2,4,12,10);
      rect(c,'#293a5d',3,5,10,8);rect(c,'#101522',4,7,7,3);
      const x=f?9:4,col=f?'#7fe3ff':'#f2c14e';
      rect(c,'#b8c6e8',x,3,2,7);rect(c,col,x-1,1,4,4);
      rect(c,col,11,11,2,2);rect(c,'#91a2bd',3,13,2,1);
      rect(c,'#18233f',0,15,16,1);
    });
    tex('gate',16,16,c=>{rect(c,'#101522',0,0,16,16);rect(c,'#6d3f68',2,0,4,16);rect(c,'#6d3f68',10,0,4,16);rect(c,'#ff6b4a',3,1,2,14);rect(c,'#ff6b4a',11,1,2,14);rect(c,'#f2c14e',6,6,4,5)});
    tex('gateHorizontal',16,16,c=>{rect(c,'#101522',0,0,16,16);rect(c,'#6d3f68',0,2,16,4);rect(c,'#6d3f68',0,10,16,4);rect(c,'#ff6b4a',1,3,14,2);rect(c,'#ff6b4a',1,11,14,2);rect(c,'#f2c14e',6,6,5,4)});
    tex('slotCap',16,2,c=>{rect(c,'#101522',0,0,16,2);rect(c,'#7fe3ff',1,0,14,1);rect(c,'#f4f1de',3,1,10,1)});
    for(let f=0;f<2;f++){
      tex('walker'+f,16,16,c=>{rect(c,'#101522',3,3,11,10);rect(c,'#e66b4f',4,4,9,7);rect(c,'#f2c14e',6,6,5,2);rect(c,'#f4f1de',10,6,1,2);rect(c,'#101522',3,11,4,3);rect(c,'#101522',10,11,4,3);rect(c,'#b8c6e8',f?2:3,14,5,2);rect(c,'#b8c6e8',f?10:9,14,5,2)});
    }
    // Eight rotor frames keep the drone's fan visibly spinning instead of
    // snapping between two near-identical silhouettes.
    for(let f=0;f<8;f++){
      const a=f*Math.PI/8;
      tex('drone'+f,16,16,c=>{
        c.globalAlpha=.22;c.fillStyle='#7fe3ff';
        c.beginPath();c.ellipse(8,2.5,6.4,1.8,0,0,Math.PI*2);c.fill();
        c.globalAlpha=1;c.strokeStyle='#b8c6e8';c.lineWidth=1;c.lineCap='round';
        for(let blade=0;blade<2;blade++){
          const ang=a+blade*Math.PI;
          c.beginPath();c.moveTo(8,2.5);
          c.lineTo(8+Math.cos(ang)*6.4,2.5+Math.sin(ang)*1.8);c.stroke();
        }
        rect(c,'#101522',7,2,2,2);rect(c,'#f4f1de',7,2,1,1);
        rect(c,'#53688e',7,4,2,2);
        rect(c,'#101522',3,5,10,8);rect(c,'#7f5aa2',4,6,8,5);rect(c,'#ff6b4a',6,7,5,3);
        rect(c,'#ffe66d',9,7,2,2);rect(c,'#53688e',2,12,3,2);rect(c,'#53688e',11,12,3,2);
      });
    }
    tex('shot',6,6,c=>{rect(c,'#ff6b4a',2,0,2,6);rect(c,'#ff6b4a',0,2,6,2);rect(c,'#ffe66d',2,2,2,2)});
    tex('cloud',32,16,c=>{rect(c,'#53688e',3,7,26,6);rect(c,'#6f83a6',7,4,17,7);rect(c,'#91a2bd',11,2,8,5);rect(c,'#3c4d72',3,12,26,2)});
    tex('spark',3,3,c=>rect(c,'#ffffff',0,0,3,3));
    tex('abilityRing',26,26,c=>{
      c.strokeStyle='#7fe3ff';c.lineWidth=2;c.beginPath();c.arc(13,13,11,0,Math.PI*2);c.stroke();
      c.strokeStyle='#f4f1de';c.lineWidth=1;c.beginPath();c.arc(13,13,9,0,Math.PI*2);c.stroke();
      rect(c,'#ffffff',12,1,2,3);rect(c,'#7fe3ff',1,12,3,2);rect(c,'#7fe3ff',22,12,3,2);
    });
    tex('glove',18,14,c=>{
      c.fillStyle='#101522';c.beginPath();c.moveTo(2,4);c.lineTo(12,4);c.lineTo(17,7);c.lineTo(12,10);c.lineTo(2,10);c.fill();
      rect(c,'#f4f1de',3,5,10,4);rect(c,'#e66b4f',12,5,2,4);rect(c,'#7fe3ff',8,5,3,3);rect(c,'#ffffff',8,5,1,1);
      c.fillStyle='#e66b4f';c.beginPath();c.moveTo(4,4);c.lineTo(7,1);c.lineTo(9,4);c.moveTo(4,10);c.lineTo(7,13);c.lineTo(9,10);c.fill();
      rect(c,'#ffe66d',0,5,3,4);rect(c,'#ff8a7a',0,6,2,2);
    });
  }
  makeAnims(){
    if(this.anims.exists('idle'))return;
    this.anims.create({key:'idle',frames:[{key:'p0'},{key:'p1'}],frameRate:2.5,repeat:-1});
    this.anims.create({key:'run',frames:['p2','p3','p4','p5'].map(key=>({key})),frameRate:12,repeat:-1});
    this.anims.create({key:'goalGlow',frames:[{key:'goal0'},{key:'goal1'}],frameRate:3,repeat:-1});
  }
  init(d){this.i=d.i||0;this.entryScreen=d.showLevels||d.i===undefined?'home':'play'}
  create(){
    if(this.winTimer)this.winTimer.remove();
    const L=LV[this.i],K=this.input.keyboard;
    this.k=K.addKeys({l:'LEFT',r:'RIGHT',u:'UP',d:'DOWN',a:'A',dd:'D',w:'W',s:'S',sp:'SPACE',rc:'R',tp:'Q',tp2:'E',n:'N',menu:'L',cancel:'ESC',reset:'BACKSPACE',mute:'M',loadout1:'ONE',loadout2:'TWO',loadout3:'THREE'});
    this.input.mouse.disableContextMenu();this.physics.world.resume();$('menu').style.display='none';
    this.events.once('shutdown',()=>{$('menu').style.display='none'});
    if(!this.textures.exists('tile'))this.makeArt();
    this.makeAnims();
    const W=L.w*T,H=L.h*T,lift=L.ceilingLift||0,S=this.S=build(L),walls=this.physics.add.staticGroup();
    this.physics.world.setBounds(0,-lift,W,H+lift);
    this.levelBackdrop=this.add.graphics().setDepth(-20);
    this.clouds=[];
    for(let i=0;i<Math.ceil(W/170);i++)this.clouds.push(this.add.image(35+i*173,38+(i%3)*35,'cloud').setDepth(-10).setAlpha(.45));
    // One image per visible tile; merged hidden bodies keep collision seams smooth.
    const used=S.map(r=>r.map(()=>false));
    S.forEach((row,y)=>row.forEach((v,x)=>{
      if(!v)return;
      this.add.image(x*T+8,y*T+8,(y===0?!lift:!S[y-1][x])?'tileTop':'tile').setDepth(-1);
      if(used[y][x])return;
      let w=1,h=1;
      while(x+w<L.w&&S[y][x+w]&&!used[y][x+w])w++;
      grow:while(y+h<L.h){for(let i=0;i<w;i++)if(!S[y+h][x+i]||used[y+h][x+i])break grow;h++}
      for(let j=0;j<h;j++)for(let i=0;i<w;i++)used[y+j][x+i]=true;
      const extra=lift&&y===0&&(x===0||x+w===L.w)?lift:0;
      walls.create((x+w/2)*T,(y+h/2)*T-extra/2,'tile').setDisplaySize(w*T,h*T+extra).setVisible(false).refreshBody();
    }));
    if(lift){
      for(let x=0;x<L.w;x++)this.add.image(x*T+8,8-lift,'tileTop').setDepth(-1);
      for(let y=T-lift;y<0;y+=T)for(const x of [0,L.w-1])this.add.image(x*T+8,y,'tile').setOrigin(.5,0).setCrop(0,0,T,Math.min(T,-y)).setDepth(-1);
      walls.create(W/2,T/2-lift,'tile').setDisplaySize(W-2*T,T).setVisible(false).refreshBody();
    }
    // Pixel-sized caps make a 12px slot: the 10px ball fits, the 14px player does not.
    (L.partials||[]).forEach(([x,y,w,h])=>{
      walls.create(x+w/2,y+h/2,'spark').setDisplaySize(w,h).setTint(0x66ffff).setDepth(-1).refreshBody();
    });
    const [gx,gy,gw,gh]=L.g;
    this.G={x:gx*T,y:gy*T,w:gw*T,h:gh*T};
    this.doors=(L.d||[]).map(([x,y,w,h])=>{
      for(let ty=y;ty<y+h;ty++)for(let tx=x;tx<x+w;tx++)S[ty][tx]=true;
      const o=this.physics.add.staticImage((x+w/2)*T,(y+h/2)*T,w>h?'gateHorizontal':'gate').setDisplaySize(w*T,h*T);o.refreshBody();return {o,x,y,w,h,open:false};
    });
    this.routePads=(L.routeSelectors||[]).map(([x,y],index)=>{
      const o=this.add.sprite(x*T+8,y*T+8,'routeControl0').setDepth(1);
      this.add.text(x*T+8,y*T-6,String(index+1),{fontFamily:'monospace',fontSize:'9px',color:'#ffe66d',backgroundColor:'#111a31'}).setOrigin(.5,1).setDepth(2);
      const d=this.doors[index];
      this.add.text((d.x+d.w/2)*T,d.y*T-3,String(index+1),{fontFamily:'monospace',fontSize:'9px',color:'#ffe66d',backgroundColor:'#111a31'}).setOrigin(.5,1).setDepth(2);
      return {o,index,x:x*T+8,y:y*T+8};
    });
    this.switches=(L.s||[]).map(([x,y],i)=>{
      const o=this.add.sprite(x*T+8,y*T+8,'switch0').setDepth(1),wire=this.add.graphics().setDepth(-8);
      const label=this.add.text(x*T+8,y*T-5,String(i+1),{fontFamily:'monospace',fontSize:'9px',color:'#ffe66d',backgroundColor:'#111a31'}).setOrigin(.5,1).setDepth(2);
      return {o,label,index:i,x:x*T+8,y:y*T+8,on:false,wire,door:this.doors[i],requires:(L.requires||[])[i]||[]};
    });
    this.switches.forEach(sw=>this.drawWire(sw));
    // All goal artwork shares this depth so every other object renders above it.
    this.goal=this.add.sprite(this.G.x,this.G.y,'goal0').setOrigin(0).setDepth(-2).setDisplaySize(this.G.w,this.G.h).play('goalGlow').setTint(0xff8a7a);
    // Presence indicators must remain visible even when a goal meets ceiling tiles.
    this.goalBars=this.add.graphics().setDepth(7);
    this.gfx=this.add.graphics().setDepth(5);
    this.p=this.physics.add.sprite(L.p[0]*T+8,L.p[1]*T+8,'p0').setDepth(6);
    this.p.body.setSize(10,14).setOffset(3,1);
    this.ball=this.physics.add.sprite(L.b[0]*T+8,L.b[1]*T+8,'ball0').setCircle(5).setBounce(.6).setDepth(3);
    this.p.body.setMaxVelocity(300,700);
    this.ball.body.setMaxVelocity(900,800);
    this.physics.add.collider(this.p,walls);
    this.physics.add.collider(this.ball,walls);   // player and ball don't collide: ball control is scripted
    this.doors.forEach(d=>{this.physics.add.collider(this.p,d.o);this.physics.add.collider(this.ball,d.o)});
    this.enemies=(EN[this.i+1]||[]).map(([type,x,y,patrol],i)=>{
      const o=this.physics.add.sprite(x*T+8,y*T+8,type==='w'?'walker0':'drone0').setDepth(2),e={type,o,patrol:patrol?.map(tile=>tile*T+8),dir:i%2?1:-1,baseX:o.x,baseY:o.y,phase:i*1.7,cool:1.6+i*.4,dead:false};
      if(type==='w'){o.body.setSize(12,12).setOffset(2,3);this.physics.add.collider(o,walls);this.doors.forEach(d=>this.physics.add.collider(o,d.o))}
      else{o.body.setCircle(6,2,3);o.body.setAllowGravity(false);this.physics.add.collider(o,walls);this.doors.forEach(d=>this.physics.add.collider(o,d.o))}
      return e;
    });
    this.shots=this.physics.add.group();
    // The tower uses physical cover between combat floors. Other levels retain their existing projectile rules.
    if(L.cover){this.physics.add.collider(this.shots,walls,shot=>shot.destroy());this.doors.forEach(d=>this.physics.add.collider(this.shots,d.o,shot=>shot.destroy()))}
    this.physics.add.overlap(this.p,this.shots,(p,shot)=>{shot.destroy();this.hurt(shot)});
    profile.used={};
    Object.assign(this,{coy:0,buf:0,kc:0,bj:0,face:1,kicks:0,bounces:0,won:false,goalReady:false,drib:false,slotOffset:11,rt:0,path:null,plen:0,recallTarget:null,recalling:false,recallAge:0,recallSide:0,ballTrapped:false,ballWarning:0,ballWarned:false,was:false,shotActive:false,fx:[],fxClock:0,kickAnim:0,ballSpin:0,wasGrounded:false,menuOpen:false,started:this.time.now,attemptStarted:false,checkpoint:null,activeRoute:null,deaths:0,dyingUntil:0,health:3,invuln:0,ballJumpCool:0,teleportCool:0,gloveCool:0,gloveState:'orbit',gloveTarget:null,gloveAngle:0,gloveFx:0,rocketMaterialized:false,ballPullRising:false,acquireFxArmed:true});
    this.ballJumpArt=this.add.image(this.ball.x,this.ball.y,'abilityRing').setTint(0x7bd88f).setScale(.6).setDepth(2).setVisible(hasUp('bounce'));
    this.teleportArt=this.add.image(this.ball.x,this.ball.y,'abilityRing').setTint(0xd49aff).setScale(.6).setDepth(2).setVisible(hasUp('teleport'));
    this.gloveArt=this.add.image(this.p.x,this.p.y-25,'glove').setScale(.65).setDepth(4).setVisible(false);
    this.loadoutTimer=this.add.graphics().setDepth(9).setVisible(false);
    this.tg=this.add.zone(this.p.x,this.p.y,1,1);
    const camera=this.cameras.main;
    camera.setRoundPixels(true).startFollow(this.tg,false,.12,.12);
    const resize=()=>this.resizeGameView();
    this.scale.on('resize',resize);this.events.once('shutdown',()=>this.scale.off('resize',resize));
    this.resizeGameView();
    if(this.routePads.length)this.selectRecallRoute(L.initialRoute);
    this.tutorial=L.tutorial?new CoachTutorial(this,L.coach):null;
    this.updateGoalUnlock();this.hud();
    $('msg').style.display='none';this.setupLoadoutHud();this.levelMenu(this.entryScreen==='home');
  }
  levelMenu(open,screen='home'){
    if(this.winTimer)this.winTimer.paused=open;
    if(this.tutorial)this.tutorial.dialogue.hidden=open;
    this.menuOpen=open;const menu=$('menu');menu.style.display=open?'grid':'none';
    if(!open){if(!this.attemptStarted){this.started=this.time.now;this.attemptStarted=true}this.ball.body.setMaxVelocity(900,800);this.was=true;this.physics.world.resume();this.hud();return}
    this.menuScreen=screen;menu.dataset.screen=screen;menu.setAttribute('aria-label',screen==='home'?'Home · level select':'Choose loadout');
    this.physics.world.pause();const grid=menu.querySelector('.level-grid');grid.textContent='';

    MENU_ORDER.forEach(i=>{const L=LV[i],current=i===this.i;
      const best=profile.best[i],button=document.createElement('button');
      button.dataset.difficulty=L.diff.toLowerCase();button.dataset.level=String(i+1);button.className=current?'current':'';button.disabled=false;
      if(current)button.setAttribute('aria-current','step');
      button.innerHTML='<span class="level-number">'+String(i+1).padStart(2,'0')+'</span><span class="level-name">'+L.n.replace(/^\d+ · /,'')+'</span><small class="difficulty">'+L.diff+'</small>'+(current?'<small class="current-level">CURRENT LEVEL</small>':'')+(best?'<small class="best">BEST '+best.time.toFixed(1)+'s · '+best.kicks+' KICKS</small>':'');
      const preview=document.createElement('canvas');preview.width=180;preview.height=72;preview.className='level-preview';preview.setAttribute('aria-hidden','true');drawHomeScene(preview,L);button.prepend(preview);
      button.onclick=()=>{audio.sfx('select');menu.style.display='none';this.physics.world.resume();this.scene.restart({i})};grid.appendChild(button);
    });
    const action=menu.querySelector('.menu-action');action.disabled=false;action.hidden=!this.attemptStarted;action.textContent='RESUME';
    menu.querySelector('.panel > p').textContent='SELECT A LEVEL';
    action.onclick=()=>this.levelMenu(false);
    menu.querySelector('.level-menu-back').onclick=()=>this.backToTitle();
  }
  backToTitle(){
    $('menu').style.display='none';
    this.scene.start('title');
  }
  setupLoadoutHud(){
    this.lastLoadoutWheel=-Infinity;
    const slots=$('loadout-hud').querySelector('.loadout-slots');slots.textContent='';
    UP.forEach((u,i)=>{
      const button=document.createElement('button');button.type='button';button.dataset.loadout=u.id;
      button.title=u.desc;button.setAttribute('aria-label',u.name+' · '+u.desc);
      button.innerHTML='<span class="loadout-key" aria-hidden="true">'+(i+1)+'</span><span class="loadout-icon icon-'+u.id+'" aria-hidden="true"></span><span class="loadout-copy"><span class="loadout-name">'+u.name+'</span><span class="loadout-meta"></span></span><span class="loadout-fill" aria-hidden="true"></span>';
      button.onclick=()=>this.changeLoadout(i);slots.appendChild(button);
    });
    const wheel=(_pointer,_objects,_dx,dy)=>{
      if(this.menuOpen||!dy||this.time.now-this.lastLoadoutWheel<140)return;
      this.lastLoadoutWheel=this.time.now;
      const index=UP.findIndex(u=>hasUp(u.id));this.changeLoadout((index+(dy>0?1:-1)+UP.length)%UP.length);
    };
    const hudWheel=event=>{event.preventDefault();wheel(null,null,0,event.deltaY)};
    const hud=$('loadout-hud');hud.onpointerdown=event=>event.stopPropagation();hud.addEventListener('wheel',hudWheel,{passive:false});
    this.input.on('wheel',wheel);this.events.once('shutdown',()=>{this.input.off('wheel',wheel);hud.removeEventListener('wheel',hudWheel)});
    this.updateLoadoutHud();
  }
  loadoutCooldown(){
    return [{remaining:this.ballJumpCool||0,full:1.5},{remaining:this.teleportCool||0,full:15},{remaining:this.gloveCool||0,full:10}]
      .reduce((longest,state)=>state.remaining>longest.remaining?state:longest,{remaining:0,full:1});
  }
  changeLoadout(index){
    if(this.menuOpen||this.won||!UP[index]||hasUp(UP[index].id))return false;
    profile.upgrades=[UP[index].id];saveProfile();
    this.gloveState=this.loadoutCooldown().remaining>0?'cooldown':'orbit';this.gloveTarget=null;this.rocketMaterialized=false;
    this.ballJumpArt.setVisible(false);this.teleportArt.setVisible(false);this.gloveArt.setVisible(false);
    this.updateLoadoutHud();audio.sfx('select');this.tutorial?.onLoadoutChange();return true;
  }
  updateLoadoutHud(){
    const hud=$('loadout-hud');
    const cooldown=this.loadoutCooldown();
    hud.querySelectorAll('button').forEach(button=>{
      const id=button.dataset.loadout,active=hasUp(id),remaining=active?cooldown.remaining:0;
      button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
      button.dataset.state=active?(remaining>0?'cooling':'ready'):'idle';
      const meta=button.querySelector('.loadout-meta');
      if(meta)meta.textContent=active?(remaining>0?Math.ceil(remaining)+'s':'READY'):'';
      const fill=button.querySelector('.loadout-fill');
      if(fill)fill.style.width=active?(remaining>0?Math.max(0,(1-remaining/cooldown.full)*100).toFixed(1)+'%':'100%'):'0%';
    });
  }

  resizeGameView(){
    const L=LV[this.i],camera=this.cameras.main;
    const width=this.scale.gameSize.width,height=this.scale.gameSize.height;
    camera.setViewport(0,0,width,height);
    const zoom=L.overview?Math.min(width/(L.w*T),height/(L.overviewHeight||L.h*T+(L.ceilingLift||0))):GAME_VIEW.zoom*Math.min(height/GAME_VIEW.height,width/GAME_VIEW.narrowWidth);
    camera.setZoom(zoom);this.setLevelCameraBounds();
    // Continue the scenery past short rooms when a wide viewport shows beyond them.
    const W=L.w*T,H=L.h*T,pad=Math.ceil(Math.max(width,height)/zoom),bg=this.levelBackdrop;
    bg.clear().fillStyle(0x111a31).fillRect(-pad,-pad-(L.ceilingLift||0),W+pad*2,H+pad*2);
    // Upright, evenly spaced mountains: only height varies, independent of room height.
    const mountainSpacing=8*T,mountainWidth=7*T;
    bg.fillStyle(0x1b2b49);
    for(let x=-Math.ceil(pad/mountainSpacing)*mountainSpacing-32;x<W+pad;x+=mountainSpacing){
      let seed=Math.imul(((x+32)/mountainSpacing)^0x9e3779b9,0x85ebca6b)>>>0;
      seed=(seed^(seed>>>13))>>>0;
      const mountainHeight=T*(3+(seed%9));
      bg.fillTriangle(x,H,x+mountainWidth/2,H-mountainHeight,x+mountainWidth,H);
    }
    bg.fillStyle(0x253a59);
    for(let x=8-Math.ceil(pad/29)*29;x<W+pad;x+=29){const h=24+Math.abs((x*7)%65);bg.fillRect(x,H-h,22,h);if(x%3)bg.fillStyle(0x3c5272).fillRect(x+5,H-h+8,3,4).fillStyle(0x253a59)}
    bg.fillStyle(0x91a2bd);
    for(let x=23-Math.ceil(pad/47)*47;x<W+pad;x+=47)for(let y=26-Math.ceil(pad/67)*67;y<H*.45;y+=67)if((x+y)%4)bg.fillRect(x,y,1,1);
    const target=L.overview?{x:W/2,y:(H-(L.ceilingLift||0))/2}:this.tg;
    camera.centerOn(target.x,target.y);
  }
  setLevelCameraBounds(){
    const L=LV[this.i];
    const lift=L.ceilingLift||0,camera=this.cameras.main;
    const worldWidth=L.w*T,boundsWidth=Math.max(worldWidth,camera.width/camera.zoom);
    camera.setBounds((worldWidth-boundsWidth)/2,-lift,boundsWidth,L.h*T+lift);
  }
  updateCameraTarget(){
    const L=LV[this.i];
    if(L.overview){
      this.tg.setPosition(L.w*T/2,(L.h*T-(L.ceilingLift||0))/2);
      this.cameras.main.centerOn(this.tg.x,this.tg.y);return;
    }
    const p=this.p,b=this.ball,c=this.cameras.main,v=c.worldView;
    const dx=(b.x-p.x)*.3,dy=(b.y-p.y)*.3;
    const far=Math.abs(dx)>c.width/c.zoom/2-32||Math.abs(dy)>c.height/c.zoom/2-32;
    const outside=p.x<v.left||p.x>v.right||p.y<v.top||p.y>v.bottom;
    this.tg.setPosition(far||outside?p.x:p.x+dx,far||outside?p.y:p.y+dy);
    if(outside)c.centerOn(p.x,p.y);
  }
  spawnPoints(){return this.checkpoint||LV[this.i]}
  recoverBall(atPlayer=false){
    const L=this.spawnPoints();this.burst(this.ball.x,this.ball.y,0x7fe3ff,8,55);
    // Resetting the ball clears old motion, including an interrupted recall.
    const bb=this.ball.body;
    const foot=atPlayer&&LV[this.i].localRecovery?this.footTarget():null;
    bb.reset(foot&&this.ballClear(foot.x,foot.y)?foot.x:L.b[0]*T+8,foot&&this.ballClear(foot.x,foot.y)?foot.y:L.b[1]*T+8);
    bb.setAllowGravity(true).setGravityY(0).setVelocity(0,0).setBounce(.6);
    Object.assign(this,{shotActive:false,drib:false,slotOffset:this.face*11,path:null,plen:0,recallTarget:null,recalling:false,recallAge:0,recallSide:0,ballTrapped:false,ballWarning:0,ballWarned:false,rt:0,kc:.4,ballSpin:0,ballPullRising:false,acquireFxArmed:true});
    this.ball.setTexture('ball0');this.gfx.clear();
    this.burst(this.ball.x,this.ball.y,0x7fe3ff,12,75);
  }
  completeLevel(){
    const time=(this.time.now-this.started)/1000,old=profile.best[this.i]||{};
    profile.best[this.i]={time:old.time===undefined?time:Math.min(old.time,time),kicks:old.kicks===undefined?this.kicks:Math.min(old.kicks,this.kicks)};
    profile.unlocked=Math.max(profile.unlocked,Math.min(LV.length,this.i+2));saveProfile();
    return time;
  }
  hud(){
    const L=LV[this.i],lit=this.switches?this.switches.filter(s=>s.on).length:0,left=this.enemies?this.enemies.filter(e=>!e.dead).length:0;
    this.updateLoadoutTimer();
    $('hud').textContent=L.n+'  ·  '+L.diff+'  ·  kicks: '+this.kicks+(this.switches&&this.switches.length?'  ·  locks: '+lit+'/'+this.switches.length:'')+(this.enemies&&this.enemies.length?'  ·  enemies: '+left+'/'+this.enemies.length:'');
    const health=Math.max(0,Math.min(3,this.health??3));
    $('health').setAttribute('aria-label',health+' of 3 hearts');
    [...$('health').children].forEach((heart,index)=>heart.classList.toggle('empty',index>=health));
  }
  goalUnlocked(){
    return (!this.tutorial||this.tutorial.done)&&this.switches.every(s=>s.on)&&this.enemies.every(e=>e.dead)&&(!this.doors||this.doors.every((d,i)=>d.open||(LV[this.i].routeSelectors&&i!==LV[this.i].deliveryRoute)));
  }
  updateGoalUnlock(){
    const unlocked=this.goalUnlocked();
    if(unlocked&&!this.goalReady){this.goalReady=true;this.goal.setVisible(true).setTint(0x7bd88f);this.cameras.main.flash(90,123,216,143)}
  }
  goalPresence(){
    const G=this.G,b=this.ball;
    return {player:this.playerTouchesRect(G.x,G.y,G.w,G.h),ball:b.x>G.x&&b.x<G.x+G.w&&b.y>G.y&&b.y<G.y+G.h};
  }
  updateGoalPresence(presence=this.goalPresence()){
    const G=this.G,g=this.goalBars;
    g.clear();
    if(!this.goalReady)return;
    const h=3,y=G.y-h,w=G.w/2;
    [this.won||presence.player,this.won||presence.ball].forEach((active,i)=>{
      const inset=i===0?1:0;
      g.fillStyle(active?0xffe66d:0x53688e,1).fillRect(G.x+i*w+inset,y,w-1-inset,h);
    });
  }
  drawWire(sw){
    const L=LV[this.i];
    const doors=L.gateLinks?this.doors.filter((d,i)=>L.gateLinks[i].includes(sw.index)):(sw.door?[sw.door]:[]);
    const ends=doors.length?doors.map(d=>({x:(d.x+d.w/2)*T,y:(d.y+d.h/2)*T})):[{x:this.G.x+this.G.w/2,y:this.G.y+this.G.h/2}];
    sw.wire.clear().lineStyle(2,sw.on?0x43aa8b:0x6d3f68,.8);
    ends.forEach(end=>sw.wire.lineBetween(sw.x,sw.y,(sw.x+end.x)/2,sw.y).lineBetween((sw.x+end.x)/2,sw.y,(sw.x+end.x)/2,end.y).lineBetween((sw.x+end.x)/2,end.y,end.x,end.y));
  }
  switchReady(sw){return (sw.requires||[]).every(i=>this.switches[i].on)}
  openReadyDoors(){
    const L=LV[this.i];
    this.doors.forEach((d,i)=>{
      const links=L.gateLinks?L.gateLinks[i]:[i];
      if(d.open||!links||!links.every(k=>this.switches[k]?.on)||((L.combatGates||[]).includes(i)&&this.enemies.some(e=>!e.dead)))return;
      d.open=true;d.o.disableBody(true,true);
      for(let y=d.y;y<d.y+d.h;y++)for(let x=d.x;x<d.x+d.w;x++)this.S[y][x]=false;
      this.path=null;this.rt=0;
      if(L.returnTower){this.burst((d.x+d.w/2)*T,(d.y+d.h/2)*T,0x7fe3ff,28,150);this.setLevelCameraBounds();audio.sfx('switch')}
    });
  }
  activateSwitch(sw){
    if(sw.on||!this.switchReady(sw))return false;
    sw.on=true;sw.o.setTexture('switch1');sw.o.clearTint();this.drawWire(sw);
    this.burst(sw.x,sw.y,0x7bd88f,14,90);this.shakeCamera(100,.003);audio.sfx('switch');
    const L=LV[this.i],point=L.s[sw.index];
    this.checkpoint=L.checkpoints?.[sw.index]||{p:[...point],b:[...point]};
    this.burst(sw.x,sw.y,0x7fe3ff,18,110);
    this.openReadyDoors();this.updateGoalUnlock();this.hud();return true;
  }
  playerTouchesRect(x,y,w,h){const p=this.p.body;return p.right>x&&p.left<x+w&&p.bottom>y&&p.top<y+h}
  playerTouchesSwitch(sw){const size=12;return this.playerTouchesRect(sw.x-size/2,sw.y-size/2,size,size)}
  selectRecallRoute(index){
    if(index===this.activeRoute)return true;
    // Never close a shutter through either body. Keep the previous route until clear.
    const blocked=this.doors.some((d,i)=>i!==index&&d.open&&(
      this.playerTouchesRect(d.x*T,d.y*T,d.w*T,d.h*T)||
      (this.ball.x+5>d.x*T&&this.ball.x-5<(d.x+d.w)*T&&this.ball.y+5>d.y*T&&this.ball.y-5<(d.y+d.h)*T)));
    if(blocked)return false;
    this.doors.forEach((d,i)=>{
      d.open=i===index;d.o.setVisible(!d.open);d.o.body.enable=!d.open;
      for(let y=d.y;y<d.y+d.h;y++)for(let x=d.x;x<d.x+d.w;x++)this.S[y][x]=!d.open;
    });
    this.activeRoute=index;this.path=null;this.rt=0;
    this.routePads.forEach(pad=>pad.o.setTexture(pad.index===index?'routeControl1':'routeControl0'));
    this.goalReady=false;this.goal.setTint(0xff8a7a);this.updateGoalUnlock();
    return true;
  }
  updatePuzzles(){
    this.routePads?.forEach(pad=>{
      if(pad.index!==this.activeRoute&&this.playerTouchesSwitch(pad)&&this.selectRecallRoute(pad.index)){
        this.burst(pad.x,pad.y,0x7bd88f,14,90);audio.sfx('switch');
      }
    });
    this.switches.forEach(sw=>{if(!sw.on){
      const ready=this.switchReady(sw);
      sw.o.setAlpha(ready?.75+Math.sin(this.time.now*.006)*.2:.4).setTint(ready?0xffffff:0x7f5aa2);
      sw.label.setText(ready||this.i===5||LV[this.i].returnTower?String(sw.index+1):String(sw.index+1)+': NEED '+sw.requires.map(i=>i+1).join('+'));
      if(ready&&this.playerTouchesSwitch(sw))this.activateSwitch(sw);
    }});
  }
  hurt(from){
    if(this.invuln>0||this.won)return;
    this.health--;this.invuln=1.25;this.deaths+=this.health<=0?1:0;
    this.p.body.setVelocity(this.p.x<from.x?-180:180,-260);this.burst(this.p.x,this.p.y,0xff6b4a,12,95);this.shakeCamera(140,.006);audio.sfx('hurt');
    if(this.health<=0){
      const death={x:this.p.x,y:this.p.y},spawn=this.spawnPoints().p;
      this.health=3;this.p.body.reset(spawn[0]*T+8,spawn[1]*T+8);this.recoverBall();this.invuln=1.8;
      this.beginDeathFx(death);
    }
    this.hud();
  }
  beginDeathFx(death){
    // Keep gameplay state synchronous, but sell the respawn with a short
    // hold at the death spot. Update() freezes the hidden player and camera
    // until this finishes, then bursts the player back in at the checkpoint.
    if(!this.add||!this.tweens||!this.time||!this.cameras?.main||!this.p.setVisible)return;
    this.dyingUntil=this.time.now+520;
    this.tg.setPosition(death.x,death.y);
    this.p.setVisible(false);
    this.p.body.setVelocity(0,0);this.p.body.setAllowGravity(false);
    const c=this.cameras.main,key=this.p.texture?.key||'p5';
    c.flash(70,255,107,74);this.shakeCamera(240,.008);
    this.burst(death.x,death.y,0xff6b4a,22,145);
    this.burst(death.x,death.y,0xffe66d,14,105);
    this.burst(death.x,death.y,0xf4f1de,8,70);
    const ghost=this.add.image(death.x,death.y,key).setDepth(7).setTint(0xff6b4a);
    this.tweens.add({targets:ghost,y:death.y-28,angle:360,scaleX:1.45,scaleY:1.45,alpha:0,duration:540,ease:'Cubic.easeOut',onComplete:()=>ghost.destroy()});
    const echo=this.add.image(death.x,death.y,key).setDepth(6).setTint(0xffffff).setAlpha(.65);
    this.tweens.add({targets:echo,y:death.y-14,angle:-180,scaleX:.45,scaleY:.45,alpha:0,duration:380,ease:'Cubic.easeOut',onComplete:()=>echo.destroy()});
    const ring=this.add.image(death.x,death.y,'abilityRing').setDepth(7).setTint(0xff6b4a).setScale(.15);
    this.tweens.add({targets:ring,scaleX:3.4,scaleY:3.4,alpha:0,duration:430,ease:'Cubic.easeOut',onComplete:()=>ring.destroy()});
    for(let i=0;i<10;i++){
      const a=Math.PI*2*i/10;
      this.particle(death.x+Math.cos(a)*4,death.y+Math.sin(a)*4,i%2?0xffe66d:0xff6b4a,Math.cos(a)*70,Math.sin(a)*70-35,.55,i%3?2:3,20);
    }
  }
  endDeathFx(){
    if(!this.dyingUntil)return;
    this.dyingUntil=0;
    if(!this.add||!this.tweens||!this.cameras?.main||!this.p.setVisible)return;
    const p=this.p;
    p.setVisible(true).setAlpha(1);
    if(p.body.setAllowGravity)p.body.setAllowGravity(true);
    p.setScale(.35);
    this.tweens.add({targets:p,scaleX:1,scaleY:1,duration:240,ease:'Back.easeOut'});
    this.burst(p.x,p.y,0x7fe3ff,18,110);
    this.burst(p.x,p.y,0xf4f1de,10,70);
    const ring=this.add.image(p.x,p.y,'abilityRing').setDepth(7).setTint(0x7fe3ff).setScale(.4).setAlpha(.9);
    this.tweens.add({targets:ring,scaleX:2.4,scaleY:2.4,alpha:0,duration:360,ease:'Cubic.easeOut',onComplete:()=>ring.destroy()});
    this.cameras.main.flash(140,127,227,255);
    this.updateCameraTarget();
    this.cameras.main.centerOn(this.tg.x,this.tg.y);
  }
  shakeCamera(duration,strength){
    // Phaser multiplies shake intensity by viewport size AND zoom, then applies
    // the zoomed camera matrix. Keep displacement in world units so resizing
    // scales shake once, just like the player and scenery.
    const intensity=camera=>({
      x:strength*GAME_VIEW.width*GAME_VIEW.zoom/(camera.width*camera.zoom),
      y:strength*GAME_VIEW.height*GAME_VIEW.zoom/(camera.height*camera.zoom)
    });
    const camera=this.cameras.main;
    camera.shake(duration,intensity(camera),false,c=>{
      // Recompute each frame: resizing or zooming during a shake must not amplify it.
      const value=intensity(c);c.shakeEffect.intensity.set(value.x,value.y);
    });
  }
  killEnemy(e,burstColor=0xff6b4a){
    if(e.dead)return;e.dead=true;e.o.disableBody(true,true);if(burstColor!==null)this.burst(e.o.x,e.o.y,burstColor,18,115);this.shakeCamera(120,.005);audio.sfx('break');this.openReadyDoors();this.hud();this.updateGoalUnlock();
  }
  fire(e){
    const o=e.o,p=this.p,a=Math.atan2(p.y-o.y,p.x-o.x),speed=125,shot=this.shots.create(o.x,o.y,'shot');shot.body.setAllowGravity(false);shot.body.setCircle(3);shot.body.setVelocity(Math.cos(a)*speed,Math.sin(a)*speed);
    this.time.delayedCall(5000,()=>{if(shot.active)shot.destroy()});
    this.burst(o.x,o.y,0xffe66d,6,55);
  }
  updateEnemies(dt){
    const bb=this.ball.body,speed=Math.hypot(bb.velocity.x,bb.velocity.y);
    this.enemies.forEach(e=>{
      if(e.dead)return;const o=e.o,pb=o.body;
      if(e.type==='w'){
        const hitWall=(pb.blocked.left&&e.dir<0)||(pb.blocked.right&&e.dir>0);
        const atLedge=pb.blocked.down&&!this.sp(o.x+e.dir*11,o.y+12);
        // Turn only away from the blocking side, and never flip twice in one frame.
        const atPatrolEnd=e.patrol&&((o.x<=e.patrol[0]&&e.dir<0)||(o.x>=e.patrol[1]&&e.dir>0));
        if(hitWall||atLedge||atPatrolEnd)e.dir*=-1;
        pb.setVelocityX(e.dir*42);o.flipX=e.dir<0;o.setTexture('walker'+Math.floor(this.time.now/140%2));
      }else{
        const tx=e.baseX+Math.sin(this.time.now*.0015+e.phase)*18,ty=e.baseY+Math.sin(this.time.now*.002+e.phase)*6;
        pb.setVelocity((tx-o.x)*2.5,(ty-o.y)*2.5);o.setTexture('drone'+Math.floor(this.time.now/55)%8);
        const tracking=Math.hypot(this.p.x-o.x,this.p.y-o.y)<DRONE_RANGE&&(!LV[this.i].cover||this.los(o.x,o.y,this.p.x,this.p.y));
        if(tracking)e.cool-=dt;
        if(tracking&&e.cool<.55)o.setTint(Math.floor(this.time.now/90)%2?0xffe66d:0xff6b4a);else o.clearTint();
        if(tracking&&e.cool<=0){this.fire(e);e.cool=2.5;o.clearTint()}
      }
      // shotActive survives wall rebounds; starting a recall clears it.
      if(this.shotActive&&!this.drib&&speed>210&&Math.hypot(this.ball.x-o.x,this.ball.y-o.y)<15){
        // Reflect off the impact face with the same restitution as a solid tile.
        // Use the incoming position so a fast shot cannot pick the far face.
        const dx=this.ball.x-bb.velocity.x*dt-o.x,dy=this.ball.y-bb.velocity.y*dt-o.y;
        const vx=bb.velocity.x,vy=bb.velocity.y;
        this.killEnemy(e);
        this.ballPullRising=false;
        if(Math.abs(dx)>=Math.abs(dy))bb.setVelocity(-vx*.6,vy);
        else bb.setVelocity(vx,-vy*.6);
      }else if(Math.hypot(this.p.x-o.x,this.p.y-o.y)<15)this.hurt(o);
    });
  }
  teleport(){
    if(!hasUp('teleport')||this.won)return;
    if(this.loadoutCooldown().remaining>0){audio.sfx('deny');return}
    const p=this.p,b=this.ball,px=p.x,py=p.y,bx=b.x,by=b.y;
    const clearAt=y=>[[-5,-7],[5,-7],[-5,7],[5,7],[0,0]].every(([dx,dy])=>!this.sp(bx+dx,y+dy));
    const offset=[0,-2,-4,-6,-8,-10,2,4,6,8,10].find(dy=>clearAt(by+dy)),ty=by+(offset??0);
    if(Math.hypot(bx-px,by-py)>640||offset===undefined||(!this.los(bx,ty,px,py)&&!this.astar(bx/T|0,ty/T|0,px/T|0,py/T|0))){audio.sfx('deny');this.burst(p.x,p.y,0xff6b4a,5,35);return}
    for(let i=0;i<18;i++){
      const t=i/17;this.particle(px+(bx-px)*t,py+(ty-py)*t,0x7fe3ff,0,-15,.25+i*.012,2,0);
    }
    p.body.reset(bx,ty);p.body.setVelocity(0,0);
    this.drib=false;this.recalling=false;this.path=null;this.recallTarget=null;this.shotActive=false;this.kc=.25;this.teleportCool=15;
    this.burst(px,py,0xd49aff,16,100);this.burst(bx,by,0x7fe3ff,16,100);this.cameras.main.flash(80,127,227,255);audio.sfx('teleport');this.hud();
  }
  updateLoadoutTimer(){
    if(!this.loadoutTimer)return;
    this.updateLoadoutHud();
    const {remaining:cool,full}=this.loadoutCooldown(),g=this.loadoutTimer;
    const head=this.p.getTopCenter(),radius=Math.max(1,Math.round(this.p.displayWidth/4));
    // Every ability uses the same player-relative layout, including scaled sprites.
    g.setPosition(Math.round(head.x),Math.round(head.y-radius*2)).setVisible(cool>0).clear();
    if(cool<=0)return;
    const remaining=Math.min(1,cool/full)*Math.PI*2;
    // A tiny pixel pie empties clockwise as the ability recharges.
    for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++){
      const r=x*x+y*y;if(r>radius*radius)continue;
      const angle=(Math.atan2(y,x)+Math.PI*2.5)%(Math.PI*2);
      const active=angle<remaining;
      g.fillStyle(active?0xffe66d:0x293a5d,active?.5:1).fillRect(x,y,1,1);
    }
  }
  acquireBallFeedback(){
    this.ballPullRising=false;
    if(this.acquireFxArmed===false)return;
    this.acquireFxArmed=false;
    this.p.setTintFill(0xfff1d0);
    this.time.delayedCall(100,()=>this.p.clearTint());
    this.burst(this.p.x,this.p.y-2,0x7fe3ff,6,35);
  }
  updateLoadouts(dt){
    this.updateLoadoutTimer();
    const p=this.p;
    this.gloveFx=(this.gloveFx||0)-dt;
    this.ballJumpArt.setVisible(hasUp('bounce')&&this.loadoutCooldown().remaining<=0).setPosition(this.ball.x,this.ball.y).setAlpha(.8);
    this.teleportArt.setVisible(hasUp('teleport')&&this.loadoutCooldown().remaining<=0).setPosition(this.ball.x,this.ball.y).setScale(.6+Math.sin(this.time.now*.01)*.08).setAlpha(.8);
    if(this.gloveState==='cooldown'){this.rocketMaterialized=false;if(this.loadoutCooldown().remaining<=0)this.gloveState='orbit'}
    this.gloveArt.setVisible(hasUp('glove')&&this.gloveState!=='cooldown');if(!hasUp('glove')||this.gloveState==='cooldown')return;
    const g=this.gloveArt;this.gloveAngle+=dt*1.6;
    if(this.gloveState==='orbit'){
      // Hover above the player with a gentle bob, facing the same way as the player.
      g.setPosition(p.x+Math.sin(this.gloveAngle*.8)*5,p.y-25+Math.sin(this.gloveAngle*2.2)*2.5).setRotation(0).setFlipX(this.face<0);
      if(!this.rocketMaterialized){this.rocketMaterialized=true;this.rocketAppear(g.x,g.y)}
      let target=null,near=187.5;
      this.enemies.forEach(e=>{if(e.dead)return;const d=Math.hypot(e.o.x-p.x,e.o.y-p.y);if(d<near&&this.los(p.x,p.y,e.o.x,e.o.y)){near=d;target=e}});
      if(target&&this.loadoutCooldown().remaining<=0){this.gloveTarget=target;this.gloveState='out';this.gloveCool=10;audio.sfx('gloveLaunch');this.hud()}
    }else if(this.gloveState==='out'){
      const e=this.gloveTarget;
      if(!e||e.dead){this.extinguishRocket();this.gloveState=this.loadoutCooldown().remaining>0?'cooldown':'orbit';this.gloveArt.setVisible(false);this.hud();return}
      const dx=e.o.x-g.x,dy=e.o.y-g.y,d=Math.hypot(dx,dy),step=Math.min(d,161.25*dt);g.x+=dx/(d||1)*step;g.y+=dy/(d||1)*step;g.setRotation(Math.atan2(dy,dx)).setFlipX(false);
      if(d<13){
        this.killEnemy(e,null);this.rocketImpact(e.o.x,e.o.y);audio.sfx('gloveHit');this.cameras.main.flash(60,127,227,255);this.gloveState=this.loadoutCooldown().remaining>0?'cooldown':'orbit';this.gloveArt.setVisible(false);this.hud();
        this.extinguishRocket();return;
      }
    }
    // A two-tone pixel exhaust: a hot yellow core inside a shorter red-orange flame.
    if(this.gloveFx<=0){
      const back=g.rotation+(g.flipX?0:Math.PI),jitter=(Math.random()-.5)*.5,power=this.gloveState==='out'?90:38;
      const tx=g.x+Math.cos(back)*8,ty=g.y+Math.sin(back)*8;
      this.particle(tx,ty,0xff6b4a,Math.cos(back+jitter)*power,Math.sin(back+jitter)*power-8,.24,3,-30,true);
      this.particle(tx,ty,0xffe66d,Math.cos(back+jitter*.5)*power*.6,Math.sin(back+jitter*.5)*power*.6-6,.16,2,-20,true);
      this.gloveFx=this.gloveState==='out'?.025:.065;
    }
  }
  tickCooldowns(dt){
    this.ballJumpCool=Math.max(0,this.ballJumpCool-dt);
    this.teleportCool=Math.max(0,this.teleportCool-dt);
    this.gloveCool=Math.max(0,this.gloveCool-dt);
  }
  updateBallPullRise(pulledUp=false){
    const body=this.ball.body;
    this.ballPullRising=!this.drib&&!this.shotActive&&body.velocity.y<0&&(!body.blocked.down||pulledUp)&&!body.blocked.up&&(pulledUp||this.ballPullRising===true);
  }
  tryBallJump(){
    const p=this.p,b=this.ball;
    if(!hasUp('bounce')||this.loadoutCooldown().remaining>0||!this.ballPullRising||b.body.velocity.y>=0||p.body.velocity.y<=b.body.velocity.y||this.bj>0||Math.abs(b.x-p.x)>=11||b.y-p.y<=0||b.y-p.y>=18)return false;
    this.ballPullRising=false;
    p.body.setVelocityY(-400).setGravityY(-470);b.body.setVelocityY(260);this.bj=.8;this.ballJumpCool=1.5;this.bounces++;this.tutorial?.onBallJump();
    this.burst(b.x,b.y,0x7fe3ff,12,95);this.shakeCamera(90,.003);audio.sfx('bounce');this.hud();return true;
  }
  particle(x,y,col,vx,vy,life=.4,size=2,gravity=120,flame=false){
    const o=this.add.rectangle(Math.round(x),Math.round(y),size,size,col).setDepth(4);
    this.fx.push({o,vx,vy,life,gravity,flame});
  }
  extinguishRocket(){
    for(let i=this.fx.length-1;i>=0;i--){
      if(!this.fx[i].flame)continue;
      this.fx[i].o.destroy();this.fx.splice(i,1);
    }
  }
  burst(x,y,col,count=8,speed=75){
    for(let i=0;i<count;i++){const a=Math.PI*2*i/count+Math.random()*.4,s=speed*(.45+Math.random()*.65);this.particle(x,y,col,Math.cos(a)*s,Math.sin(a)*s,.25+Math.random()*.3,i%3?2:3)}
  }
  rocketAppear(x,y){
    // A brief stepped energy frame and hot pixel sparks mark each fresh rocket.
    const flash=this.add.graphics({x:Math.round(x),y:Math.round(y)}).setDepth(7);
    flash.lineStyle(1,0x7fe3ff,.9).strokeRect(-10,-7,20,14);
    flash.lineStyle(1,0xffe66d,1);
    for(const side of [-1,1]){
      flash.lineBetween(side*14,-3,side*14,3);
      flash.lineBetween(-3,side*11,3,side*11);
    }
    this.tweens.add({targets:flash,scaleX:1.8,scaleY:1.8,alpha:0,duration:380,ease:'Cubic.easeOut',onComplete:()=>flash.destroy()});
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6;
      this.particle(x+Math.cos(a)*5,y+Math.sin(a)*4,i%2?0xffe66d:0x7fe3ff,Math.cos(a)*45,Math.sin(a)*35,.32,i%3?2:3,0);
    }
    this.gloveArt.setScale(.2).setTint(0xffffff);
    this.tweens.add({targets:this.gloveArt,scaleX:.65,scaleY:.65,duration:240,ease:'Back.easeOut',onComplete:()=>this.gloveArt.clearTint()});
    audio.sfx('teleport');
  }
  rocketImpact(x,y){
    this.burst(x,y,0xff6b4a,18,150);this.burst(x,y,0xffe66d,10,95);
    for(let i=0;i<16;i++){const a=i*Math.PI/8;this.particle(x+Math.cos(a)*5,y+Math.sin(a)*5,0xfff1d0,Math.cos(a)*85,Math.sin(a)*85,.28,2,0)}
  }
  updateFx(dt){
    for(let i=this.fx.length-1;i>=0;i--){const f=this.fx[i];f.life-=dt;if(f.life<=0){f.o.destroy();this.fx.splice(i,1);continue}f.vy+=f.gravity*dt;f.o.x+=f.vx*dt;f.o.y+=f.vy*dt;f.o.setAlpha(Math.min(1,f.life*5))}
  }
  sp(x,y){const L=LV[this.i];if(L?.ceilingLift&&y<T)return x<T||x>=(L.w-1)*T||y<T-L.ceilingLift;const tx=Math.floor(x/T),ty=Math.floor(y/T),S=this.S;return tx<0||ty<0||ty>=S.length||tx>=S[0].length||S[ty][tx]||(LV[this.i]?.partials||[]).some(([rx,ry,w,h])=>x>=rx&&x<rx+w&&y>=ry&&y<ry+h)}
  // clear corridor for a ball of radius 5 along a segment
  los(ax,ay,bx,by){
    const dx=bx-ax,dy=by-ay,d=Math.hypot(dx,dy);
    if(d<1)return true;
    const n=Math.ceil(d/3),nx=-dy/d*5.5,ny=dx/d*5.5;
    for(let i=0;i<=n;i++){const x=ax+dx*i/n,y=ay+dy*i/n;if(this.sp(x,y)||this.sp(x+nx,y+ny)||this.sp(x-nx,y-ny))return false}
    return true;
  }
  // A* on the tile grid, 8-way, no corner cutting
  astar(sx,sy,ex,ey){
    const S=this.S,W=S[0].length,H=S.length,id=(x,y)=>y*W+x,sol=(x,y)=>x<0||y<0||x>=W||y>=H||S[y][x];
    if(sol(sx,sy)||sol(ex,ey))return null;
    const gS=new Map([[id(sx,sy),0]]),from=new Map(),closed=new Set(),open=[[sx,sy,0]];
    const h=(x,y)=>{const a=Math.abs(x-ex),b=Math.abs(y-ey);return Math.max(a,b)+.414*Math.min(a,b)};
    while(open.length){
      let bi=0;for(let i=1;i<open.length;i++)if(open[i][2]<open[bi][2])bi=i;
      const [x,y]=open.splice(bi,1)[0],k=id(x,y);
      if(closed.has(k))continue;closed.add(k);
      if(x==ex&&y==ey){const r=[];let c=k;while(c!==undefined){r.push([c%W,(c/W)|0]);c=from.get(c)}return r.reverse()}
      for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
        if(!dx&&!dy)continue;
        const nx=x+dx,ny=y+dy;
        if(sol(nx,ny)||(dx&&dy&&(sol(x+dx,y)||sol(x,y+dy))))continue;
        if(LV[this.i]?.partials?.length&&!this.los(x*T+8,y*T+8,nx*T+8,ny*T+8))continue;
        const nk=id(nx,ny),ng=gS.get(k)+(dx&&dy?1.414:1);
        if(closed.has(nk)||ng>=(gS.get(nk)??1e9))continue;
        gS.set(nk,ng);from.set(nk,k);open.push([nx,ny,ng+h(nx,ny)]);
      }
    }
    return null;
  }
  // Leg-level return target. At ground level p.y+1 leaves clearance for a radius-5 ball.
  ballClear(x,y){
    const r=5.5;
    return [[0,0],[r,0],[-r,0],[0,r],[0,-r],[4,4],[-4,4],[4,-4],[-4,-4]]
      .every(([dx,dy])=>!this.sp(x+dx,y+dy));
  }
  footTarget(side=this.face){
    const p=this.p,y=p.y+1;
    if(!p.body.blocked.down&&this.ballClear(p.x,y))return {x:p.x,y,side};
    for(const offset of [side*11,-side*11,side*8,-side*8]){
      // Keep the selected side with the target. Otherwise a facing change can
      // move the anchor through the player and make the ball reverse course.
      if(this.ballClear(p.x+offset,y))return {x:p.x+offset,y,side:offset<0?-1:1};
    }
    // Never replace the leg target with the player's torso, even beside a wall.
    return {x:p.x+side*11,y,side};
  }
  // Ball -> leg target using the existing A* + line-of-sight route smoothing.
  route(target){
    const b=this.ball;
    target=target||this.footTarget(this.recallSide||this.face);
    this.recallSide=target.side;
    this.recallTarget=target;
    // In open space steer straight to the moving leg anchor. A* starts on tile
    // centers, and chasing the first tile center can briefly point backwards.
    if(this.los(b.x,b.y,target.x,target.y)){
      this.path=[[target.x,target.y]];
      this.plen=Math.hypot(target.x-b.x,target.y-b.y);
      return;
    }
    const path=this.astar(b.x/T|0,b.y/T|0,target.x/T|0,target.y/T|0);
    if(!path){this.path=null;return}
    // Skip the start tile's center: steering to it can initially reverse the ball.
    // Skip the goal tile's center too; the exact final waypoint is the player's foot.
    const pts=path.slice(1,-1).map(([x,y])=>[x*T+8,y*T+8]);
    pts.push([target.x,target.y]);
    const out=[];let ax=b.x,ay=b.y,i=0,len=0;
    while(i<pts.length){
      let j=pts.length-1;
      while(j>i&&!this.los(ax,ay,pts[j][0],pts[j][1]))j--;
      out.push(pts[j]);len+=Math.hypot(pts[j][0]-ax,pts[j][1]-ay);ax=pts[j][0];ay=pts[j][1];i=j+1;
    }
    this.path=out;this.plen=len;
  }
  updateBallConfinement(dt,recall){
    const b=this.ball;this.ballWarning=Math.max(0,this.ballWarning-dt);
    if(!recall||this.drib){this.ballWarned=false;this.ballTrapped=false}
    else if(this.recalling&&this.rt>0){
      const target=this.recallTarget||this.footTarget();
      // Reuse the actual recall result. A long open route is not a sealed ball.
      this.ballTrapped=!this.path&&!this.sp(b.x,b.y)&&this.ballClear(target.x,target.y);
      if(this.ballTrapped&&!this.ballWarned){
        this.ballWarned=true;this.ballWarning=.3;audio.sfx('trapped');this.shakeCamera(150,.0015);
        for(let i=0;i<6;i++){const a=i*Math.PI/3;this.particle(b.x,b.y,0xff6262,Math.cos(a)*25,Math.sin(a)*25,.2,2,0)}
      }
      if(this.path)this.ballWarning=0;
    }
    if(this.drib)this.ballWarning=0;
    if(this.ballWarning>0){
      b.setTint(0xff6262);
      const fade=this.ballWarning/.3;
      this.gfx.lineStyle(1.5,0xff6262,fade).strokeCircle(b.x,b.y,8+(1-fade)*4);
    }else b.clearTint();
  }
  kickSpeed(){return 800}
  shoot(ang){
    this.tutorial?.onKick();
    this.ballPullRising=false;
    const sp=this.kickSpeed(),bb=this.ball.body;
    bb.setGravityY(-650);bb.setVelocity(Math.cos(ang)*sp,Math.sin(ang)*sp);this.shotActive=true;
    this.drib=false;this.kc=.3;this.kickAnim=.22;this.kicks++;this.hud();
    this.burst(this.ball.x,this.ball.y,0xffe66d,10,115);
    this.shakeCamera(80,.0035);audio.sfx('kick');
  }
  update(_,ms){
    const dt=Math.min(ms,50)/1000,k=this.k,p=this.p,pb=p.body,b=this.ball,bb=b.body,c=this.cameras.main,gf=this.gfx;
    if(JD(k.mute)){audio.toggle();this.hud()}
    if(JD(k.menu)||JD(k.cancel)){this.levelMenu(!this.menuOpen);return}
    if(this.menuOpen)return;
    if(this.dyingUntil&&this.time.now>=this.dyingUntil)this.endDeathFx();
    const frozen=this.dyingUntil>this.time.now;
    if(!frozen)for(let i=0;i<UP.length;i++)if(JD(k['loadout'+(i+1)]))this.changeLoadout(i);
    if(JD(k.reset)){this.scene.restart({i:this.i});return}
    const dir=frozen?0:(k.r.isDown||k.dd.isDown?1:0)-(k.l.isDown||k.a.isDown?1:0);
    const jh=!frozen&&(k.sp.isDown||k.u.isDown||k.w.isDown),g=pb.blocked.down;
    if(pb.velocity.y>=0)pb.setGravityY(0);
    this.coy=g?.1:this.coy-dt; this.buf-=dt; this.kc-=dt; this.bj-=dt;this.kickAnim-=dt;this.fxClock-=dt;this.invuln=Math.max(0,this.invuln-dt);this.tickCooldowns(dt);
    if(frozen){pb.setVelocity(0,0);if(pb.setAllowGravity)pb.setAllowGravity(false);this.buf=0;this.coy=0}
    if(!frozen&&(JD(k.tp)||JD(k.tp2)))this.teleport();
    this.hudClock=(this.hudClock||0)-dt;if(this.hudClock<=0){this.hudClock=.1;this.hud()}
    p.setAlpha(this.invuln>0&&Math.floor(this.invuln*12)%2?.35:1);this.updateFx(dt);
    if(g&&!this.wasGrounded){for(let i=0;i<6;i++)this.particle(p.x,p.y+7,0xb8c6e8,(i-2.5)*18,-20-Math.random()*25,.3,2,90);audio.sfx('land')}
    this.wasGrounded=g;
    this.clouds.forEach((cl,i)=>{cl.x+=dt*(2+i%2);if(cl.x>this.physics.world.bounds.width+32)cl.x=-32});
    if(JD(k.sp)||JD(k.u)||JD(k.w))this.buf=.12;

    // --- momentum movement: accelerate, brake harder when reversing, slide to a stop
    let vx=pb.velocity.x;const boost=1;
    if(dir){
      this.face=dir;p.flipX=dir<0;
      const a=650*boost;
      vx=Phaser.Math.Clamp(vx+dir*a*dt*(vx*dir<0?2.4:1),-150*boost,150*boost);
    }else vx=ap(vx,0,(g?420:50)*dt);
    pb.setVelocityX(vx);
    if(this.buf>0&&this.coy>0){pb.setVelocityY(-400);this.buf=this.coy=0;audio.sfx('jump')}
    else if(!jh&&this.bj<=0&&pb.velocity.y<-150)pb.setVelocityY(-150);   // variable jump height
    if(this.kickAnim>0)p.setTexture('p8');
    else if(!g)p.setTexture(pb.velocity.y<0?'p6':'p7');
    else p.anims.play(Math.abs(vx)>12?'run':'idle',true);

    // --- ball
    // Move the ball to the new foot-side smoothly; reversing direction never drops possession.
    if(this.drib)this.slotOffset=ap(this.slotOffset,this.face*11,85*dt);
    const sx=p.x+(this.drib?this.slotOffset:this.face*11),sy=p.y+2;
    const dx=b.x-p.x,dy=b.y-p.y,d=Math.hypot(dx,dy),bg=bb.blocked.down;
    if(d>26)this.acquireFxArmed=true;
    gf.clear();
    let pull=false;
    const recall=k.rc.isDown||this.input.activePointer.rightButtonDown();
    const groundedForPickup=g&&pb.velocity.y>=0;
    const canAcquire=!hasUp('bounce')||groundedForPickup;
    if(!canAcquire)this.drib=false;
    this.updateBallPullRise();
    const ballJumped=this.tryBallJump();
    // Ball Jump needs the airborne ball to reach the feet before pickup can consume it.
    if(recall&&!this.drib&&d<16&&!ballJumped&&canAcquire){
      this.acquireBallFeedback();this.drib=true;this.slotOffset=Phaser.Math.Clamp(dx,-14,14);this.kc=0;this.shotActive=false;bb.setGravityY(0);bb.setVelocity(0,0);
    }
    // An acquired ball must stay acquired while either recall input is held.
    if(recall&&this.drib){
      this.recalling=false;this.path=null;this.recallTarget=null;this.rt=0;this.recallAge=0;
    }
    if(recall&&!this.drib&&!ballJumped){                                           // retract: same A* path, gentler startup
      let reroute=false;
      if(!this.recalling){
        this.recalling=true;this.recallAge=0;this.rt=0;this.path=null;this.shotActive=false;bb.setGravityY(0);bb.setVelocity(0,0);audio.sfx('recall');
        this.recallTarget=null;this.recallSide=this.face;
      }
      this.recallAge+=dt;this.rt-=dt;
      if(this.rt<=0){this.rt=.1;this.route();reroute=true}
      if(this.path){
        gf.lineStyle(1.5,0x7fe3ff,.75);
        let ax=b.x,ay=b.y;
        this.path.forEach(q=>{gf.lineBetween(ax,ay,q[0],q[1]);gf.fillStyle(0x7fe3ff,.9).fillCircle(q[0],q[1],1.5);ax=q[0];ay=q[1]});
        pull=true;this.kc=.2;
        const foot=this.recallTarget||this.footTarget(this.recallSide);
        const ex=foot.x-b.x,ey=foot.y-b.y,footDist=Math.hypot(ex,ey);
        let tx,ty,steerNow=true;
        if(footDist<13){
          // Match the player's foot motion; no abrupt center-to-feet snap.
          tx=pb.velocity.x+Phaser.Math.Clamp(ex*16,-220,220);
          ty=pb.velocity.y+Phaser.Math.Clamp(ey*16,-220,220);
          if(groundedForPickup&&Math.abs(dx)<16&&Math.abs(dy-2)<9){
            // Recall has reached its destination. Leave recall mode now;
            // otherwise the next frame's recall branch cancels acquisition.
            this.acquireBallFeedback();this.drib=true;this.slotOffset=Phaser.Math.Clamp(foot.x-p.x,-14,14);this.kc=0;
            this.recalling=false;this.path=null;this.recallTarget=null;this.rt=0;this.recallAge=0;
            steerNow=false;
          }
        }else{
          const rs=300;
          let q=this.path[0],vx=q[0]-b.x,vy=q[1]-b.y,m=Math.hypot(vx,vy);
          // Consume a reached/overshot waypoint instead of reversing back toward it
          // until the next A* refresh. The final waypoint is the player's feet.
          if(this.path.length>1){
            const arrival=Math.max(4,Math.hypot(bb.velocity.x,bb.velocity.y)*dt+2);
            const passed=(b.x-q[0])*bb.velocity.x+(b.y-q[1])*bb.velocity.y>0;
            if(m<=arrival||passed){
              this.path.shift();q=this.path[0];vx=q[0]-b.x;vy=q[1]-b.y;m=Math.hypot(vx,vy);
            }
          }
          m=m||1;tx=vx/m*rs;ty=vy/m*rs;
        }
        // Snap to each new route so stale momentum cannot carry the ball away from it.
        if(steerNow){
          const opposite=bb.velocity.x*tx+bb.velocity.y*ty<0;
          const steer=reroute||opposite?1:Math.min(1,dt*22);
          bb.setVelocity(bb.velocity.x+(tx-bb.velocity.x)*steer,
                         bb.velocity.y+(ty-bb.velocity.y)*steer);
          this.updateBallPullRise(ty<0);
        }
      }else{
        // No route: stop stale kick/recall motion instead of drifting the wrong way.
        bb.setVelocity(0,0);
      }
    }
    if(!recall){this.path=null;this.recallTarget=null;this.rt=0;this.recalling=false;this.recallAge=0;this.recallSide=0}
    bb.setAllowGravity(!pull);
    if(!pull){
      if(this.drib){                                                        // acquired ball remains acquired on turn
        if(!g||Math.abs(dx)>34||Math.abs(dy-2)>14)this.drib=false;
        else bb.setVelocityX(Phaser.Math.Clamp(pb.velocity.x+(sx-b.x)*18,-320,320));
      }else if(groundedForPickup&&this.kc<=0&&Math.abs(dx)<16&&Math.abs(dy-2)<8){
        // Acquire only close to the legs, regardless of facing direction.
        this.acquireBallFeedback();this.drib=true;this.slotOffset=dx>=0?11:-11;
      }
      if(!this.drib&&bg)bb.setVelocityX(bb.velocity.x*Math.exp(-1.3*dt));    // rolling friction
      if(bg&&Math.abs(bb.velocity.y)<50)bb.setVelocityY(0);                  // no endless micro-bounce
    }
    // Recalled balls must not rebound away from the player when clipping a wall.
    bb.setBounce(this.drib||this.recalling?0:.6);
    // Landing restores normal gravity without making a kicked ball harmless.
    if(this.shotActive&&bg)bb.setGravityY(0);

    // Left click fires toward the cursor at fixed power.
    const ptr=this.input.activePointer,down=ptr.leftButtonDown(),w=c.getWorldPoint(ptr.x,ptr.y),ang=Math.atan2(w.y-b.y,w.x-b.x),ok=d<26&&!pull,sp=this.kickSpeed();
    if(ok){
      let lx=b.x,ly=b.y;
      for(let i=1;i<=22;i++){
        const t=i*.05,x=b.x+Math.cos(ang)*sp*t,y=b.y+Math.sin(ang)*sp*t+175*t*t;if(this.sp(x,y))break;lx=x;ly=y;
        gf.fillStyle(0x101522,.65).fillRect(Math.round(x)-2,Math.round(y)-2,4,4);
        gf.fillStyle(i%2?0xf4f1de:0x7fe3ff,1-i/30).fillRect(Math.round(x)-1,Math.round(y)-1,2,2);
      }
      gf.lineStyle(2,0x101522,.7).lineBetween(lx-5,ly,lx+5,ly).lineBetween(lx,ly-5,lx,ly+5);
      gf.lineStyle(1,0x7fe3ff,.9).lineBetween(lx-4,ly,lx+4,ly).lineBetween(lx,ly-4,lx,ly+4);
    }
    if(down&&!this.was&&ok)this.shoot(ang);
    this.was=down;

    // Ball jumping is exclusive to the chosen Ball Jump loadout.

    const speed=Math.hypot(bb.velocity.x,bb.velocity.y);
    this.ballSpin=(this.ballSpin+speed*dt/12)%4;b.setTexture('ball'+Math.floor(this.ballSpin));
    if(this.fxClock<=0&&(pull||speed>180)&&!this.drib){
      this.particle(b.x,b.y,pull?0x7fe3ff:0xf4f1de,-bb.velocity.x*.04,-bb.velocity.y*.04,.2,3,0);this.fxClock=.035;
    }
    if(!frozen)this.tutorial?.update(recall,pull);
    // --- combat, puzzles, and level flow
    this.updateLoadouts(dt);this.updateEnemies(dt);
    if(!frozen)this.updateCameraTarget();
    const G=this.G;this.updatePuzzles();this.updateGoalUnlock();this.updateBallConfinement(dt,recall);
    const presence=this.goalPresence();this.updateGoalPresence(presence);
    if(!this.won&&this.goalUnlocked()&&presence.player&&presence.ball){
      this.won=true;const time=this.completeLevel();
      const m=$('msg');m.textContent='GOAL!\n'+time.toFixed(1)+'s · '+this.kicks+' KICKS';m.style.display='block';
      [0xffe66d,0x7bd88f,0x7fe3ff,0xff6b4a].forEach((col,i)=>this.burst(G.x+G.w/2,G.y+G.h/2,col,8,100+i*15));
      c.flash(120,255,230,109);this.shakeCamera(250,.006);audio.sfx('goal');
      this.winTimer=this.time.delayedCall(1800,()=>this.scene.restart({i:nextLevelIndex(this.i)}));
    }
    if(JD(k.n))this.scene.restart({i:nextLevelIndex(this.i)});
  }
}
