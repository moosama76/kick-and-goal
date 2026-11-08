window.game=new Phaser.Game({
  type:Phaser.AUTO,parent:'g',width:window.innerWidth,height:window.innerHeight,backgroundColor:'#111a31',pixelArt:true,roundPixels:true,antialias:false,
  physics:{default:'arcade',arcade:{gravity:{y:1000},fps:120}},
  scale:{mode:Phaser.Scale.RESIZE},
  scene:[Title,Game]
});
window.addEventListener('pointerdown',()=>{window.focus();audio.start()});
window.addEventListener('keydown',()=>audio.start());

const volumeSliders=[...document.querySelectorAll('[data-audio-channel]')];
const syncVolumes=()=>volumeSliders.forEach(slider=>{
  const value=document.getElementById(slider.id+'-value');
  slider.value=String(Math.round(audio[slider.dataset.audioChannel+'Volume']*100));
  value.textContent=slider.value+'%';slider.setAttribute('aria-valuetext',value.textContent);
});
syncVolumes();
volumeSliders.forEach(slider=>{
  slider.addEventListener('input',()=>{audio.setVolume(slider.dataset.audioChannel,Number(slider.value)/100);audio.start();syncVolumes()});
  slider.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))event.stopPropagation()});
});

drawHomeScene(document.getElementById("home-art"));

// Handle menu keys before Phaser receives them, so navigation cannot move the player
// or leave a jump held when a menu closes. Native Enter is suppressed to avoid
// activating a focused button twice.
window.addEventListener('keydown',event=>{
  const aliases={arrowup:'w',arrowdown:'s',arrowleft:'a',arrowright:'d'};
  const raw=event.key.toLowerCase(),key=aliases[raw]||raw;
  if(!['w','a','s','d','enter'].includes(key)||event.ctrlKey||event.altKey||event.metaKey)return;
  const visible=element=>element&&element.getClientRects().length>0;
  const menu=['menu','title-options','title-actions'].map(id=>document.getElementById(id)).find(visible);
  if(!menu)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(event.repeat&&key==='enter')return;
  const choices=[...menu.querySelectorAll('button:not(:disabled),input[type="range"]:not(:disabled)')].filter(visible);
  if(!choices.length)return;
  const index=choices.indexOf(document.activeElement);
  if(key==='enter'){
    const choice=choices[index<0?0:index];
    choice.focus();if(choice.tagName==='BUTTON')choice.click();
  }else{
    const backward=key==='w'||key==='a',horizontal=key==='a'||key==='d';
    const current=choices[index];
    if(horizontal&&current?.tagName==='INPUT'){
      if(backward)current.stepDown();else current.stepUp();
      current.dispatchEvent(new Event('input',{bubbles:true}));return;
    }
    let next=index<0?(backward?choices.length-1:0):(index+(backward?-1:1)+choices.length)%choices.length;
    const grid=current?.closest?.('.level-grid');
    if(grid&&!horizontal){
      const levels=[...grid.querySelectorAll('button:not(:disabled)')].filter(visible);
      // Follow the rendered grid, including its narrower responsive layout.
      const columns=window.getComputedStyle(grid).gridTemplateColumns.split(/\s+/).filter(Boolean).length;
      const rowTarget=levels.indexOf(current)+(backward?-columns:columns);
      next=rowTarget<0?choices.length-1:rowTarget>=levels.length?Math.min(choices.indexOf(levels.at(-1))+1,choices.length-1):choices.indexOf(levels[rowTarget]);
    }
    choices[next].focus();audio.sfx('select');
  }
},true);
