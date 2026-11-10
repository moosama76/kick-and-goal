// Pixel map for the coach: 16x32, drawn from a palette so the art stays readable.
// Rows 0-8 are the head (they bob as one unit); rows 9-31 are the body.
const COACH_PALETTE = {
  o: '#101522',
  c: '#293a5d',
  C: '#3c5279',
  s: '#f2b37c',
  S: '#d99560',
  e: '#101522',
  m: '#8a4a3a',
  t: '#2b6f5b',
  T: '#43aa8b',
  w: '#f4f1de',
  y: '#ffe66d',
  n: '#18233f'
};
// 16x32 coach: navy cap, teal tracksuit, whistle on a white lanyard. Deliberately a
// different silhouette and palette from the player, so the two never read as the same sprite.
const COACH_ROWS = [
  '.....cccccc.....',
  '....cCCCCCCc....',
  '...cccccccccc...',
  '..CCCCCCCCCCCC..',
  '....ssssssss....',
  '....sesssses....',
  '....ssssssss....',
  '....sssmmsss....',
  '....ssssssss....',
  '...tttttttttt...',
  '..tttttttttttt..',
  '.stttwtttttwtts.',
  '.sttttwtttwttts.',
  '.stttttwtwtttts.',
  '.sttttttyttttts.',
  '.stttttttttttts.',
  '.stttttttttttts.',
  '..tttttttttttt..',
  '...nnnnnnnnnn...',
  '...nnnnnnnnnn...',
  '...nnnnnnnnnn...',
  '...nnnnn.nnnn...',
  '...nnnnn.nnnn...',
  '....sss..sss....',
  '....sss..sss....',
  '....sss..sss....',
  '....ooo..ooo....',
  '....ooo..ooo....',
  '....ooo..ooo....',
  '...ooooo.ooooo..',
  '................',
  '................'
];
class CoachTutorial {
  constructor(scene, position) {
    this.scene = scene;
    this.stage = 0;
    this.pullSeen = false;
    this.jumpPerformed = false;
    this.platform = null;
    audio.start();
    this.dialogue = document.getElementById('coach-dialogue');
    this.tail = document.getElementById('coach-tail');
    this.buildCoachArt(scene);
    if (!scene.anims.exists('coachIdle'))
      scene.anims.create({
        key: 'coachIdle',
        frames: [{ key: 'coach0' }, { key: 'coach1' }],
        frameRate: 2,
        repeat: -1
      });
    if (!scene.anims.exists('coachTalk'))
      scene.anims.create({
        key: 'coachTalk',
        frames: [{ key: 'coach0' }, { key: 'coach2' }],
        frameRate: 9,
        repeat: -1
      });
    const [x, y] = position;
    // A soft ground shadow seats the coach on the tile instead of floating him.
    this.shadow = scene.add.rectangle(x * T + 8, y * T - 1, 15, 4, 0x080c18, 0.4).setDepth(1);
    this.npc = scene.add
      .sprite(x * T + 8, y * T, 'coach0')
      .setOrigin(0.5, 1)
      .setDepth(2)
      .play('coachIdle');
    this.paintAvatar();
    const positionBubble = () => this.positionDialogue();
    scene.game.events.on('postrender', positionBubble);
    this.show();
    scene.events.once('shutdown', () => {
      scene.game.events.off('postrender', positionBubble);
      this.typingTimer?.remove(false);
      this.dialogue.hidden = true;
      this.setTailVisible(false);
    });
  }
  buildCoachArt(scene) {
    const paint = (c, rows, headShift) => {
      const plot = (row, y) => {
        for (let x = 0; x < row.length; x++) {
          const color = COACH_PALETTE[row[x]];
          if (!color) continue;
          c.fillStyle = color;
          c.fillRect(x, y, 1, 1);
        }
      };
      // Body first, head last, so a bobbing head always sits over the collar.
      for (let y = 9; y < rows.length; y++) plot(rows[y], y);
      for (let y = 0; y < 9; y++) plot(rows[y], y + headShift);
    };
    const make = (key, rows, headShift) => {
      if (scene.textures.exists(key)) return;
      const texture = scene.textures.createCanvas(key, 16, 32),
        c = texture.getContext();
      c.imageSmoothingEnabled = false;
      paint(c, rows, headShift);
      texture.refresh();
    };
    make('coach0', COACH_ROWS, 0);
    make('coach1', COACH_ROWS, 1);
    // Talking frame: the same idle pose with an open mouth.
    const talking = COACH_ROWS.slice();
    talking[7] = '....shhoohhs....';
    make('coach2', talking, 0);
  }
  paintAvatar() {
    const canvas = this.dialogue?.querySelector('.coach-avatar');
    if (!canvas || !canvas.getContext) return;
    const c = canvas.getContext('2d');
    c.imageSmoothingEnabled = false;
    // Head plus collar, so the portrait reads as a person rather than a floating face.
    for (let y = 0; y < 12; y++)
      for (let x = 0; x < 16; x++) {
        const color = COACH_PALETTE[COACH_ROWS[y][x]];
        if (!color) continue;
        c.fillStyle = color;
        c.fillRect(x, y, 1, 1);
      }
  }
  get done() {
    return this.stage === 3;
  }
  show() {
    const lines = [
      [
        'COME ON IN!',
        'Let’s start with the ball. Hold right-click or R to pull it all the way to your feet.',
        ['HOLD', 'RIGHT-CLICK', 'R']
      ],
      [
        'NICE CONTROL!',
        'A defender is on the pitch. Aim with your mouse and left-click to kick the ball into him. Give it a go!',
        ['AIM', 'LEFT-CLICK', 'KILL']
      ],
      [
        'LET’S GET SOME AIR!',
        'Equip Ball Jump with 1. Jump, then briefly pull the ball upward beneath your feet to bounce higher. Land on the new platform!',
        ['1', 'JUMP', 'PULL', 'LAND']
      ],
      [
        'YOU’RE READY!',
        'That’s it! Pull the ball back, then bring yourself and the ball into the goal on the right.',
        ['REACH THE GOAL']
      ]
    ];
    const [heading, text, keys] = lines[this.stage];
    this.dialogue.querySelector('.coach-progress').textContent = this.done
      ? 'TRAINING COMPLETE'
      : 'STEP ' + (this.stage + 1) + ' OF 3';
    this.dialogue.querySelector('.coach-heading').textContent = heading;
    this.renderPips();
    this.renderKeys(keys);
    this.writeDialogue(text);
    this.dialogue.hidden = this.scene.menuOpen || this.scene.won;
    // Replay the entrance pop on every new line.
    if (this.dialogue.classList) {
      this.dialogue.classList.remove('pop');
      void this.dialogue.offsetWidth;
      this.dialogue.classList.add('pop');
    }
  }
  renderPips() {
    const pips = this.dialogue.querySelector('.coach-pips');
    if (!pips) return;
    // Completed steps are solid, the current step is highlighted, the rest stay empty.
    [...pips.children].forEach((pip, index) => {
      pip.classList.toggle('on', this.done || index < this.stage);
      pip.classList.toggle('current', !this.done && index === this.stage);
    });
  }
  renderKeys(keys) {
    const box = this.dialogue.querySelector('.coach-action');
    if (!box) return;
    box.textContent = '';
    box.setAttribute('aria-label', keys.join(' '));
    keys.forEach((key) => {
      const chip = document.createElement('kbd');
      chip.textContent = key;
      box.appendChild(chip);
    });
  }
  writeDialogue(text) {
    this.typingTimer?.remove(false);
    const paragraph = this.dialogue.querySelector('.coach-text');
    const reveal = paragraph.querySelector('.coach-reveal');
    paragraph.querySelector('.coach-measure').textContent = text;
    paragraph.setAttribute('aria-label', text);
    reveal.textContent = '';
    paragraph.classList?.toggle('typing', true);
    this.npc?.play('coachTalk');
    let index = 0,
      letters = 0;
    this.typingTimer = this.scene.time.addEvent({
      delay: 32,
      loop: true,
      callback: () => {
        if (this.scene.menuOpen || this.dialogue.hidden) return;
        if (this.scene.won) {
          this.typingTimer.remove(false);
          return;
        }
        const letter = text[index++];
        reveal.textContent = text.slice(0, index);
        if (/[\p{L}\p{N}]/u.test(letter) && letters++ % 2 === 0) audio.sfx('talk');
        if (index >= text.length) {
          this.typingTimer.remove(false);
          paragraph.classList?.toggle('typing', false);
          this.npc?.play('coachIdle');
        }
      }
    });
  }
  setTailVisible(visible) {
    if (!this.tail) return;
    this.tail.hidden = !visible;
    if (visible) this.tail.style.display = 'block';
    else this.tail.style.display = 'none';
  }
  positionDialogue() {
    const scene = this.scene,
      camera = scene.cameras.main,
      canvas = scene.game.canvas.getBoundingClientRect();
    // Use the rendered camera transform, so the tail follows the mouth through
    // camera movement, zoom, shaking, viewport resizing, and both idle frames.
    const bob = this.npc.texture.key === 'coach1' ? 1 : 0;
    const mouth = camera.matrixCombined.transformPoint(
      this.npc.x + (this.npc.flipX ? -2 : 2),
      this.npc.y - 32 + 8 + bob
    );
    const x = canvas.left + (mouth.x * canvas.width) / scene.scale.gameSize.width;
    const y = canvas.top + (mouth.y * canvas.height) / scene.scale.gameSize.height;
    const visible =
      !scene.menuOpen &&
      !scene.won &&
      x >= canvas.left &&
      x <= canvas.right &&
      y >= canvas.top &&
      y <= canvas.bottom;
    this.dialogue.hidden = !visible;
    this.setTailVisible(visible);
    if (!visible) return;
    const width = this.dialogue.offsetWidth,
      height = this.dialogue.offsetHeight;
    // Bias the panel toward the mouth rather than always sitting to its right, so the
    // tail stays a short triangle instead of stretching into a sliver near a screen edge.
    const left = Math.max(8, Math.min(x - width * 0.35, window.innerWidth - width - 8));
    const top = Math.max(8, y - height - 26);
    this.dialogue.style.left = Math.round(left) + 'px';
    this.dialogue.style.top = Math.round(top) + 'px';
    // The tail lives inside the panel and hangs off its bottom edge, so it can never be
    // clipped; only its horizontal position needs to track the coach.
    const attach = Math.max(20, Math.min(x - left, width - 20));
    this.tail.style.left = Math.round(attach - 11) + 'px';
  }
  advance() {
    if (this.done) return;
    this.stage++;
    if (this.stage === 1) this.spawnTarget();
    if (this.stage === 2) this.revealPlatform();
    this.show();
    audio.sfx('select');
    if (this.npc.setTint) {
      this.npc.setTint(0xfff1d0);
      if (typeof Phaser !== 'undefined' && Phaser.TintModes && this.npc.setTintMode)
        this.npc.setTintMode(Phaser.TintModes.FILL);
      this.scene.time.delayedCall(120, () => this.npc.clearTint());
    }
    this.whistlePuff();
    this.scene.updateGoalUnlock();
  }
  whistlePuff() {
    const scene = this.scene;
    if (!scene.add || !scene.tweens) return;
    for (let i = 0; i < 3; i++) {
      const puff = scene.add
        .rectangle(this.npc.x + (this.npc.flipX ? -6 : 6), this.npc.y - 24, 2, 2, 0xf4f1de, 0.9)
        .setDepth(3);
      scene.tweens.add({
        targets: puff,
        x: puff.x + (this.npc.flipX ? -1 : 1) * (10 + i * 5),
        y: puff.y - 6 - i * 3,
        alpha: 0,
        duration: 320 + i * 60,
        onComplete: () => puff.destroy()
      });
    }
  }
  revealPlatform() {
    const scene = this.scene,
      [x, y, w, h] = LV[scene.i].tutorialPlatform;
    this.platform = scene.physics.add
      .staticImage((x + w / 2) * T, (y + h / 2) * T, 'tile')
      .setDisplaySize(w * T, h * T)
      .setVisible(false)
      .refreshBody();
    scene.physics.add.collider(scene.p, this.platform);
    scene.physics.add.collider(scene.ball, this.platform);
    // Tiles snap in one after another, so the new footing reads as built rather than popped.
    const tiles = [];
    for (let row = y; row < y + h; row++)
      for (let col = x; col < x + w; col++) {
        scene.S[row][col] = true;
        tiles.push(
          scene.add
            .image(col * T + 8, row * T + 8, row === y ? 'tileTop' : 'tile')
            .setDepth(-1)
            .setScale(0)
        );
      }
    tiles.forEach((tile, index) =>
      scene.tweens?.add({
        targets: tile,
        scale: 1,
        duration: 170,
        delay: index * 20,
        ease: 'Back.easeOut'
      })
    );
    scene.burst((x + w / 2) * T, y * T, 0x7bd88f, 18, 65);
    audio.sfx('switch');
  }
  onBallJump() {
    if (this.stage === 2) this.jumpPerformed = true;
  }
  // The aim lesson gets a live target: a walker patrols the training ground floor so
  // the player has something to line the shot up on, and killing it is the lesson.
  spawnTarget() {
    const scene = this.scene,
      spot = LV[scene.i].tutorialTarget;
    if (!spot || this.target || !scene.spawnEnemy) return;
    const [x, y, patrol] = spot;
    this.target = scene.spawnEnemy('w', x, y, patrol, 0);
    // Level 1 stays hazard-free: this walker is a target to shoot, not a threat to bump into.
    this.target.harmless = true;
    this.target.practiceTarget = true;
    scene.enemies.push(this.target);
    // Arrive with a puff so the new target is noticed rather than just appearing.
    scene.burst(this.target.o.x, this.target.o.y, 0xff6b4a, 14, 80);
    scene.tweens?.add({
      targets: this.target.o,
      scaleX: { from: 0, to: 1 },
      scaleY: { from: 0, to: 1 },
      duration: 260,
      ease: 'Back.easeOut'
    });
    scene.hud();
  }
  // Kicking alone no longer clears the aim lesson: the shot has to actually land.
  onKick() {}
  reachedPlatform() {
    if (!this.platform) return false;
    const player = this.scene.p.body,
      platform = this.platform.body;
    return (
      player.blocked.down &&
      Math.abs(player.bottom - platform.top) <= 2 &&
      player.right > platform.left &&
      player.left < platform.right
    );
  }
  update(recall, pulling) {
    if (this.npc) this.npc.setFlipX(this.scene.p.x < this.npc.x);
    if (this.shadow && this.npc) this.shadow.setPosition(this.npc.x, this.shadow.y);
    if (this.scene.won) {
      this.dialogue.hidden = true;
      return;
    }
    if (this.stage === 0) {
      if (recall && (pulling || this.scene.drib)) this.pullSeen = true;
      if (this.pullSeen && this.scene.drib) this.advance();
    } else if (this.stage === 1) {
      // Killing the target is what completes the aim lesson, not merely kicking.
      if (this.target && this.target.dead) this.advance();
    } else if (this.stage === 2 && this.jumpPerformed && this.reachedPlatform()) this.advance();
  }
  onLoadoutChange() {}
}
