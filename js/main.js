window.game=new Phaser.Game({
  type:Phaser.AUTO,parent:'g',width:960,height:540,backgroundColor:'#111a31',pixelArt:true,roundPixels:true,antialias:false,
  physics:{default:'arcade',arcade:{gravity:{y:1000},fps:120}},
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
  scene:Game
});
window.addEventListener('pointerdown',()=>{window.focus();audio.start()});
window.addEventListener('keydown',()=>audio.start());

for(const channel of ['music','effects']){
  const slider=document.getElementById(channel+'-volume'),value=document.getElementById(channel+'-volume-value');
  const sync=()=>{slider.value=String(Math.round(audio[channel+'Volume']*100));value.textContent=slider.value+'%';slider.setAttribute('aria-valuetext',value.textContent)};
  sync();
  slider.addEventListener('input',()=>{audio.setVolume(channel,Number(slider.value)/100);audio.start();sync()});
  slider.addEventListener('keydown',event=>event.stopPropagation());
}
