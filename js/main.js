window.game=new Phaser.Game({
  type:Phaser.AUTO,parent:'g',width:960,height:540,backgroundColor:'#111a31',pixelArt:true,roundPixels:true,antialias:false,
  physics:{default:'arcade',arcade:{gravity:{y:1000},fps:120}},
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
  scene:Game
});
window.addEventListener('pointerdown',()=>{window.focus();audio.start()});
window.addEventListener('keydown',()=>audio.start());
