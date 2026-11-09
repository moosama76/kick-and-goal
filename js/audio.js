class ChipAudio{
  constructor(){
    this.ctx=null;this.muted=false;this.step=0;this.next=0;this.musicVolume=1;this.effectsVolume=1;
    try{
      const saved=JSON.parse(localStorage.getItem('kickGoalAudio')||'{}');
      for(const key of ['musicVolume','effectsVolume'])if(Number.isFinite(saved[key]))this[key]=Math.max(0,Math.min(1,saved[key]));
    }catch{}
  }
  setVolume(channel,value){
    if(channel!=='music'&&channel!=='effects')return;
    const volume=Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
    this[channel+'Volume']=volume;
    if(this.ctx)this[channel].gain.setTargetAtTime(volume*(channel==='music'?.2:.38),this.ctx.currentTime,.015);
    try{localStorage.setItem('kickGoalAudio',JSON.stringify({musicVolume:this.musicVolume,effectsVolume:this.effectsVolume}))}catch{}
  }
  start(){
    if(!this.ctx){
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
      const c=this.ctx=new AC();this.master=c.createGain();this.music=c.createGain();this.effects=c.createGain();
      this.master.gain.value=this.muted?0:.6;this.music.gain.value=.2*this.musicVolume;this.effects.gain.value=.38*this.effectsVolume;
      this.music.connect(this.master);this.effects.connect(this.master);this.master.connect(c.destination);
      const buffer=c.createBuffer(1,c.sampleRate*.25,c.sampleRate),data=buffer.getChannelData(0);
      for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;this.noiseBuffer=buffer;
      this.next=c.currentTime+.06;this.timer=setInterval(()=>this.schedule(),50);
    }
    if(this.ctx.state==='suspended')this.ctx.resume();
    if(this.next<this.ctx.currentTime-.2)this.next=this.ctx.currentTime+.05;
  }
  note(midi,time,dur=.1,type='square',vol=.045,out){
    if(!midi)return;const c=this.ctx,o=c.createOscillator(),g=c.createGain(),f=440*2**((midi-69)/12);
    o.type=type;o.frequency.setValueAtTime(f,time);g.gain.setValueAtTime(.0001,time);g.gain.linearRampToValueAtTime(vol,time+.006);g.gain.setValueAtTime(vol,time+dur*.55);g.gain.linearRampToValueAtTime(.0001,time+dur);
    o.connect(g);g.connect(out||this.music);o.start(time);o.stop(time+dur+.02);
  }
  noise(time,dur=.05,vol=.04,out,highpass=true){
    const c=this.ctx,src=c.createBufferSource(),filter=c.createBiquadFilter(),g=c.createGain();src.buffer=this.noiseBuffer;filter.type=highpass?'highpass':'lowpass';filter.frequency.value=highpass?4500:700;
    g.gain.setValueAtTime(vol,time);g.gain.exponentialRampToValueAtTime(.0001,time+dur);src.connect(filter);filter.connect(g);g.connect(out||this.music);src.start(time);src.stop(time+dur);
  }
  schedule(){
    const c=this.ctx;if(!c||c.state!=='running')return;
    const beat=60/132/4,lead=[69,0,72,76,74,0,72,69,67,0,71,74,76,0,74,71,69,0,72,76,79,76,74,72,67,0,71,74,72,69,67,0],bass=[45,45,41,41,43,43,40,40];
    while(this.next<c.currentTime+.12){
      const s=this.step%32,t=this.next;this.note(lead[s],t,beat*.82,'square',.038);
      if(s%2===0)this.noise(t,.035,s%4===0?.035:.018);
      if(s%4===0){this.note(bass[(s/4)%8],t,beat*3.2,'triangle',.12);this.noise(t,.09,.055,undefined,false)}
      if(s%8===6)this.note(lead[s]+12,t,beat*1.5,'square',.018);
      this.next+=beat;this.step++;
    }
  }
  sweep(from,to,dur,type='square',vol=.16,delay=0){
    if(!this.ctx)return;const c=this.ctx,t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(from,t);o.frequency.exponentialRampToValueAtTime(to,t+dur);
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(this.effects);o.start(t);o.stop(t+dur+.02);
  }
  sfx(name){
    if(!this.ctx||this.muted)return;const t=this.ctx.currentTime;
    if(name==='kick'){this.sweep(210,65,.13,'square',.2);this.noise(t,.06,.1,this.effects,false)}
    else if(name==='talk'){const notes=[62,65,64,69,67,64],index=this.talkStep||0;this.talkStep=index+1;this.note(notes[index%notes.length],t,.075,'square',.14,this.effects)}
    else if(name==='jump')this.sweep(240,480,.1,'square',.09);
    else if(name==='bounce'){this.sweep(170,650,.18,'square',.15);this.sweep(340,900,.12,'triangle',.12,.06)}
    else if(name==='recall')this.sweep(420,760,.08,'triangle',.08);
    else if(name==='switch')[72,76,79].forEach((n,i)=>this.note(n,t+i*.055,.09,'square',.13,this.effects));
    else if(name==='hurt'){this.sweep(150,48,.22,'sawtooth',.16);this.noise(t,.12,.1,this.effects,false)}
    else if(name==='break'){this.noise(t,.18,.18,this.effects,false);this.sweep(180,55,.16,'square',.13)}
    else if(name==='goal')[72,76,79,84].forEach((n,i)=>this.note(n,t+i*.1,.18,'square',.16,this.effects));
    else if(name==='land')this.noise(t,.045,.035,this.effects,false);
    else if(name==='select')this.sweep(420,620,.06,'square',.07);
    else if(name==='teleport'){this.sweep(110,1400,.2,'sine',.16);this.sweep(1500,180,.24,'square',.1,.07)}
    else if(name==='trapped'){this.sweep(460,170,.13,'square',.12);this.sweep(300,90,.16,'triangle',.12,.14);this.noise(t,.07,.045,this.effects,false)}
    else if(name==='deny')this.sweep(180,120,.1,'square',.09);
    else if(name==='gloveLaunch'){this.sweep(140,520,.12,'sawtooth',.13);this.noise(t,.06,.07,this.effects,false)}
    else if(name==='gloveHit'){this.sweep(100,42,.16,'square',.22);this.noise(t,.12,.16,this.effects,false);this.sweep(700,260,.08,'triangle',.1,.03)}
    else if(name==='gloveReturn')this.sweep(500,260,.1,'triangle',.08);
    else if(name==='waveClear')[72,76,79].forEach((n,i)=>this.note(n,t+i*.07,.12,'triangle',.12,this.effects));
    else if(name==='waveStart'){[50,57,64,69].forEach((n,i)=>this.note(n,t+i*.045,.09,'square',.1,this.effects));this.noise(t,.1,.05,this.effects,false)}
    else if(name==='unlock')[60,64,67,72,76,79].forEach((n,i)=>this.note(n,t+i*.065,.16,'square',.13,this.effects));
  }
  toggle(){this.muted=!this.muted;if(this.master)this.master.gain.setTargetAtTime(this.muted?0:.6,this.ctx.currentTime,.02);return this.muted}
}
const audio=new ChipAudio();
