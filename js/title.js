class Title extends Phaser.Scene {
  constructor() {
    super('title');
  }
  create() {
    if (!this.textures.exists('tile')) Game.prototype.makeArt.call(this);
    this.busy = false;
    this.optionsOpen = false;
    this.lastTrail = 0;
    this.aiming = false;
    this.hoveredButton = null;
    document.body.dataset.screen = 'title';
    this.overlay = $('title-screen');
    this.overlay.hidden = false;
    this.actions = $('title-actions');
    this.actions.hidden = false;
    $('title-options').hidden = true;
    this.backdrop = this.add.graphics();
    this.shadowG = this.add.graphics();
    this.aim = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    this.player = this.add.image(0, 0, 'p0').setOrigin(0.5, 1);
    this.ball = this.add.image(0, 0, 'ball0');
    const resize = () => this.layoutTitle();
    this.scale.on('resize', resize);
    this.layoutTitle();
    this.actions.querySelectorAll('button').forEach((button) => {
      button.disabled = false;
      button.classList.remove('hit', 'aimed');
      button.onclick = () => this.kickMenuButton(button);
      button.addEventListener('pointerenter', () => this.hoverButton(button));
      button.addEventListener('focus', () => this.hoverButton(button));
      button.addEventListener('pointerleave', () => this.idleButton());
      button.addEventListener('blur', () => this.idleButton());
    });
    $('title-back').onclick = () => {
      this.optionsOpen = false;
      $('title-options').hidden = true;
      this.actions.hidden = false;
      this.resetTitleBall();
      audio.sfx('select');
      this.actions.querySelector('[data-title-action="options"]').focus();
    };
    this.keys = this.input.keyboard.addKeys({ levels: 'L', cancel: 'ESC', mute: 'M' });
    this.events.once('shutdown', () => {
      this.scale.off('resize', resize);
      this.overlay.hidden = true;
      delete document.body.dataset.screen;
      this.actions.querySelectorAll('button').forEach((button) => (button.onclick = null));
      $('title-back').onclick = null;
    });
  }
  layoutTitle() {
    const w = this.scale.gameSize.width,
      h = this.scale.gameSize.height;
    this.cameras.main.setViewport(0, 0, w, h);
    this.artScale = Math.max(2, Math.floor(Math.min(w / 180, h / 120)));
    const unit = this.artScale,
      ground = Math.round(h * 0.8),
      c = this.backdrop;
    this.ground = ground;
    c.clear().fillStyle(0x111a31).fillRect(0, 0, w, h);
    // Broad, stepped silhouettes use the same colors as the level backgrounds.
    for (let i = 0; i < 9; i++) {
      const x = (i * w) / 7 - w / 10,
        peak = ground - h * (0.23 + (i % 3) * 0.07),
        spread = w / 7;
      c.fillStyle(i % 2 ? 0x1b2b49 : 0x203552);
      for (let y = Math.round(peak / unit) * unit; y < ground; y += unit * 2) {
        const half = Math.round((((y - peak) / (ground - peak)) * spread) / unit) * unit;
        c.fillRect(x - half, y, half * 2, unit * 2);
      }
    }
    c.fillStyle(0x91a2bd);
    for (let i = 0; i < 38; i++) {
      const x = (i * 127 + 43) % w,
        y = (i * 67 + 19) % (h * 0.52);
      c.fillRect(Math.round(x / unit) * unit, Math.round(y / unit) * unit, unit, unit);
    }
    c.fillStyle(0x18233f).fillRect(0, ground, w, h - ground);
    c.fillStyle(0x43aa8b).fillRect(0, ground, w, unit * 3);
    c.fillStyle(0x7bd88f).fillRect(0, ground, w, unit);
    for (let x = 0; x < w; x += 16 * unit) {
      c.fillStyle(0x293a5d).fillRect(x + unit, ground + 5 * unit, 14 * unit, 5 * unit);
      c.fillStyle(0x344b72).fillRect(x + unit, ground + 5 * unit, 14 * unit, unit);
    }
    this.playerBaseX = Math.round(w * 0.27);
    this.player
      .setPosition(this.playerBaseX, ground)
      .setScale(unit)
      .setTexture('p0')
      .setFlipX(false);
    this.ball.setScale(unit).setTexture('ball0');
    this.ballHomeX = this.playerBaseX + this.player.displayWidth * 0.85;
    this.ballRestY = ground - unit * 5;
    if (!this.busy) this.resetTitleBall();
    else this.drawShadows();
  }
  resetTitleBall() {
    const unit = this.artScale || 1;
    this.ballHomeX = this.playerBaseX + this.player.displayWidth * 0.85;
    this.ballRestY = this.ground - unit * 5;
    this.ball
      .setPosition(Math.round(this.ballHomeX), Math.round(this.ballRestY))
      .setRotation(0)
      .setAlpha(1)
      .setScale(unit)
      .setTexture('ball0')
      .setVisible(true);
    this.player
      .setPosition(this.playerBaseX, this.ground)
      .setScale(unit)
      .setTexture('p0')
      .setFlipX(false);
    if (this.aim) {
      this.aim.clear();
      this.aim.setAlpha(1);
    }
    this.aiming = false;
    this.hoveredButton = null;
    if (this.actions)
      this.actions.querySelectorAll('button').forEach((button) => button.classList.remove('aimed'));
    this.drawShadows();
  }
  // Two small stepped shadows anchor the character and the resting ball to the ground.
  drawShadows() {
    if (!this.shadowG || !this.artScale) return;
    const unit = this.artScale,
      ground = this.ground,
      g = this.shadowG;
    g.clear();
    const shadow = (x, scale, alpha) => {
      const w = Math.round(10 * scale * unit),
        h = Math.max(1, Math.round(unit * 0.7));
      g.fillStyle(0x080c18, alpha).fillRect(Math.round((x - w / 2) / unit) * unit, ground, w, h);
      g.fillStyle(0x080c18, alpha * 0.6).fillRect(
        Math.round((x - w * 0.3) / unit) * unit,
        ground - h,
        w * 0.6,
        h
      );
    };
    shadow(this.player.x + unit * 2, 1, 0.4);
    if (!this.busy) shadow(this.ballHomeX, 1, 0.35);
  }
  // Hovering a choice turns the player toward it and sketches the shot it would take.
  hoverButton(button) {
    if (this.busy || this.optionsOpen) return;
    const end = this.titleShotPosition(button, 1, true),
      unit = this.artScale || 1;
    this.hoveredButton = button;
    this.aiming = true;
    this.player.setFlipX(end.x < this.player.x);
    this.actions.querySelectorAll('button').forEach((other) => other.classList.remove('aimed'));
    button.classList.add('aimed');
    this.aim.setAlpha(1).clear();
    // A dashed, colour-shifted pixel arc with brighter knots at regular intervals.
    const colours = [0xffe66d, 0xffffff, 0x7fe3ff, 0xffe66d];
    this.aim.lineStyle(Math.max(1, unit * 0.4), 0x7fe3ff, 0.16);
    let previous = this.titleShotPosition(button, 0, true);
    for (let i = 1; i <= 18; i++) {
      const position = this.titleShotPosition(button, i / 19, true);
      this.aim.lineBetween(previous.x, previous.y, position.x, position.y);
      previous = position;
      const big = i > 14 || i % 5 === 0,
        size = big ? unit * 2 : unit * 1.4;
      this.aim.fillStyle(colours[i % 4], 0.5 + i * 0.024);
      this.aim.fillRect(
        Math.round((position.x - size / 2) / unit) * unit,
        Math.round((position.y - size / 2) / unit) * unit,
        Math.round(size / unit) * unit,
        Math.round(size / unit) * unit
      );
    }
    this.drawShadows();
  }
  idleButton() {
    if (this.busy) return;
    this.hoveredButton = null;
    this.aiming = false;
    if (this.aim) this.aim.clear();
    if (this.actions)
      this.actions.querySelectorAll('button').forEach((button) => button.classList.remove('aimed'));
    this.player.setFlipX(false);
  }
  titleShotPosition(button, progress, centre = false) {
    // Measure the actual DOM button, so the shot stays aimed at it after resizing.
    // `centre` is opt-in so callers and tests that relied on the left edge keep their result.
    const canvas = this.game.canvas.getBoundingClientRect(),
      target = button.getBoundingClientRect();
    const sx = this.scale.gameSize.width / canvas.width,
      sy = this.scale.gameSize.height / canvas.height;
    const unit = this.artScale || (this.ball && this.ball.displayHeight / 10) || 1;
    const start = { x: this.player.x + this.player.displayWidth * 0.85, y: this.ground - unit * 5 };
    const end = {
      x: (target.left + (centre ? target.width / 2 : 0) - canvas.left) * sx,
      y: (target.top + target.height / 2 - canvas.top) * sy
    };
    const arc = Math.min(Math.abs(end.x - start.x) * 0.15, this.scale.gameSize.height * 0.12);
    return {
      x: start.x + (end.x - start.x) * progress,
      y: start.y + (end.y - start.y) * progress - Math.sin(progress * Math.PI) * arc
    };
  }
  // Ghost balls spin away behind the shot, with a handful of bright pixel sparks.
  ballTrail(x, y, unit, frame) {
    const tint = [0x7fe3ff, 0xffe66d, 0x7bd88f, 0xffffff][frame % 4];
    const ghost = this.add
      .image(Math.round(x), Math.round(y), 'ball' + frame)
      .setScale(unit * 0.82)
      .setAlpha(0.55)
      .setTint(tint)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: ghost,
      alpha: 0,
      scaleX: unit * 0.25,
      scaleY: unit * 0.25,
      duration: 210,
      ease: 'Quad.easeOut',
      onComplete: () => ghost.destroy()
    });
    if (Math.random() < 0.55) {
      const colours = [0xffe66d, 0x7bd88f, 0x7fe3ff, 0xffffff];
      const spark = this.add.rectangle(
        Math.round(x),
        Math.round(y),
        unit,
        unit,
        colours[Math.floor(Math.random() * 4)],
        0.9
      );
      this.tweens.add({
        targets: spark,
        x: x + (Math.random() - 0.5) * unit * 5,
        y: y + (Math.random() - 0.5) * unit * 5,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 150 + Math.random() * 120,
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy()
      });
    }
  }
  // White shoe flash plus a couple of dust pixels at the moment of contact.
  kickFlash(x, y, unit, facing) {
    const flash = this.add.rectangle(x, y, unit * 2.5, unit * 2.5, 0xffffff, 0.95);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2.2,
      scaleY: 2.2,
      duration: 150,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy()
    });
    for (let i = 0; i < 6; i++) {
      const spark = this.add.rectangle(x, y, unit, unit, i % 2 ? 0xffe66d : 0x7bd88f, 0.95);
      this.tweens.add({
        targets: spark,
        x: x - facing * unit * (3 + i * 1.4),
        y: y - unit * (0.5 + Math.random() * 3.5),
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 170 + i * 22,
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy()
      });
    }
  }
  kickMenuButton(button) {
    if (this.busy || this.optionsOpen) return;
    this.busy = true;
    this.actions.setAttribute('aria-busy', 'true');
    this.actions.querySelectorAll('button').forEach((b) => {
      b.disabled = true;
      b.classList.remove('aimed');
    });
    this.hoveredButton = null;
    this.aiming = false;
    audio.start();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      unit = this.artScale || 1;
    // Wind-up, snap, flight, then a brief impact hold so the button reaction can be seen.
    const duration = reduced ? 80 : 640,
      windupEnd = reduced ? 0 : 0.18,
      flightEnd = reduced ? 0.5 : 0.58;
    const end = this.titleShotPosition(button, 1, true),
      facing = end.x < this.player.x ? -1 : 1;
    this.player.setTexture('p0').setFlipX(facing < 0);
    if (this.aim) this.aim.clear();
    if (this.shadowG) this.shadowG.clear();
    this.lastTrail = 0;
    const start = this.titleShotPosition(button, 0, true);
    this.ball.setPosition(Math.round(start.x), Math.round(start.y)).setRotation(0).setScale(unit);
    const shot = { progress: 0 };
    let released = false,
      impacted = false;
    this.tweens.add({
      targets: shot,
      progress: 1,
      duration,
      ease: 'Linear',
      onUpdate: () => {
        const p = shot.progress;
        if (p < windupEnd) {
          // Crouch and pull the ball onto the boot before the strike.
          const w = p / windupEnd;
          this.player.setScale(unit * (1 + 0.08 * w), unit * (1 - 0.12 * w));
          this.ball
            .setPosition(Math.round(start.x - unit * 2.2 * w), Math.round(start.y + unit * 1.4 * w))
            .setScale(unit * (1 + 0.22 * w), unit * (1 - 0.3 * w))
            .setRotation(0);
          return;
        }
        if (!released) {
          released = true;
          this.player.setTexture('p8').setScale(unit * 1.07, unit * 0.93);
          this.kickFlash(start.x + facing * unit * 5, start.y + unit * 1.5, unit, facing);
          audio.sfx('kick');
          if (!reduced && this.cameras && this.cameras.main) this.cameras.main.shake(70, 0.003);
        }
        if (p < flightEnd) {
          const q = (p - windupEnd) / (flightEnd - windupEnd),
            eased = 1 - Math.pow(1 - q, 2.2);
          const position = this.titleShotPosition(button, eased, true),
            frame = Math.floor(q * 12) % 4,
            stretch = 1 + Math.sin(q * Math.PI) * 0.16;
          this.ball
            .setTexture('ball' + frame)
            .setPosition(Math.round(position.x), Math.round(position.y))
            .setRotation(0)
            .setScale(unit * stretch);
          const settle = Math.min(1, q * 3);
          this.player.setScale(unit * (1 + 0.07 * (1 - settle)), unit * (1 - 0.07 * (1 - settle)));
          this.player.x =
            this.playerBaseX + facing * unit * 1.4 * Math.sin((Math.min(1, q * 2.5) * Math.PI) / 2);
          if (!reduced && this.time.now - this.lastTrail > 26) {
            this.lastTrail = this.time.now;
            this.ballTrail(position.x, position.y, unit, frame);
          }
          return;
        }
        if (!impacted) {
          impacted = true;
          this.ball.setPosition(Math.round(end.x), Math.round(end.y)).setScale(unit).setAlpha(1);
          if (!reduced) this.ball.setVisible(false);
          this.player.setPosition(this.playerBaseX, this.ground).setScale(unit).setTexture('p0');
          button.classList.add('hit');
          audio.sfx('select');
          this.menuImpact(end.x, end.y, button);
        }
      },
      onComplete: () => {
        this.ball.setScale(unit).setRotation(0).setAlpha(1);
        if (!impacted) this.ball.setPosition(Math.round(end.x), Math.round(end.y));
        this.resetTitleBall();
        // Keep the impact hold visible for a beat before swapping screens.
        this.time.delayedCall(0, () => {
          this.busy = false;
          this.actions.removeAttribute('aria-busy');
          button.classList.remove('hit');
          this.actions.querySelectorAll('button').forEach((b) => (b.disabled = false));
          if (this.overlay)
            this.overlay.querySelectorAll('.title-pop').forEach((pop) => pop.remove());
          if (button.dataset.titleAction === 'play') {
            if (this.overlay) this.overlay.hidden = true;
            if (typeof document !== 'undefined' && document.body)
              delete document.body.dataset.screen;
            this.scene.start('game', { i: 0, showLevels: true });
          } else {
            this.optionsOpen = true;
            this.actions.hidden = true;
            $('title-options').hidden = false;
            this.resetTitleBall();
            $('title-options').scrollTop = 0;
            $('title-options').focus({ preventScroll: true });
          }
        });
      }
    });
  }
  menuImpact(x, y, button) {
    const unit = this.artScale || 4,
      reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced && this.cameras && this.cameras.main) this.cameras.main.shake(130, 0.008);
    // A pixel starburst reads as a flash without covering the button in a white square.
    if (!reduced) {
      const flash = this.add.graphics({ x, y }).setBlendMode(Phaser.BlendModes.ADD);
      flash.fillStyle(0xffffff, 0.95);
      flash.fillRect(-unit * 22, -unit, unit * 44, unit * 2);
      flash.fillRect(-unit, -unit * 11, unit * 2, unit * 22);
      flash.fillStyle(0xffe66d, 0.95);
      flash.fillRect(-unit * 12, -unit * 0.5, unit * 24, unit);
      flash.fillRect(-unit * 0.5, -unit * 7, unit, unit * 14);
      this.tweens.add({
        targets: flash,
        alpha: 0,
        scaleX: 1.9,
        scaleY: 1.9,
        duration: 170,
        ease: 'Quad.easeOut',
        onComplete: () => flash.destroy()
      });
    }
    for (let i = 0; i < 2; i++) {
      const ring = this.add
        .rectangle(x, y, unit * 2, unit * 2)
        .setFillStyle(0x000000, 0)
        .setStrokeStyle(unit, i ? 0x7fe3ff : 0xffe66d);
      this.tweens.add({
        targets: ring,
        scaleX: i ? 10 : 7,
        scaleY: i ? 10 : 7,
        alpha: 0,
        delay: i * 70,
        duration: reduced ? 1 : 320,
        ease: 'Cubic.easeOut',
        onComplete: () => ring.destroy()
      });
    }
    // Radial sparks: short, bright, evenly fanned so the burst reads instantly.
    const colours = [0xffe66d, 0x7bd88f, 0xf4f1de, 0x7fe3ff];
    for (let i = 0; i < 22; i++) {
      const angle = (i * Math.PI) / 11,
        distance = unit * (8 + (i % 4) * 5.5);
      const particle = this.add.rectangle(
        x,
        y,
        i % 3 ? unit : unit * 1.5,
        unit,
        i % 3 ? unit : unit * 1.5,
        colours[i % 4]
      );
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: reduced ? 1 : 220 + (i % 4) * 55,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      });
    }
    // Loose confetti tumbles down past the button.
    for (let i = 0; i < 8; i++) {
      const shard = this.add.rectangle(x + (i - 3.5) * unit * 3, y, unit * 2, unit, 0x53688e);
      this.tweens.add({
        targets: shard,
        x: x + (i - 3.5) * unit * 5,
        y: y + unit * (4 + i * 2.2),
        angle: 90 + (i % 3) * 90,
        alpha: 0,
        duration: reduced ? 1 : 360 + (i % 3) * 80,
        ease: 'Quad.easeIn',
        onComplete: () => shard.destroy()
      });
    }
    // A tiny comic-book word rides above the DOM button so it is never hidden by the menu.
    if (!reduced && button && this.overlay) {
      const word = button.dataset && button.dataset.titleAction === 'play' ? 'GO!' : 'NICE!';
      const target = button.getBoundingClientRect(),
        pop = document.createElement('span');
      pop.className = 'title-pop';
      pop.textContent = word;
      pop.setAttribute('aria-hidden', 'true');
      pop.style.left = target.left + target.width / 2 + 'px';
      pop.style.top = target.top - unit * 4 + 'px';
      this.overlay.appendChild(pop);
      pop.addEventListener('animationend', () => pop.remove(), { once: true });
    }
  }
  update() {
    if (JD(this.keys.levels) && !this.busy) {
      this.scene.start('game', { i: 0, showLevels: true });
      return;
    }
    if (JD(this.keys.mute)) audio.toggle();
    if (JD(this.keys.cancel) && this.optionsOpen && !this.busy) {
      $('title-back').click();
      return;
    }
    if (this.busy || !this.playerBaseX) return;
    const t = this.time.now,
      unit = this.artScale || 1;
    // Breathing idle, a gently bouncing ball, and a pulsing aiming arc.
    const breath = Math.sin(t / 300) * 0.014;
    this.player
      .setPosition(this.playerBaseX, this.ground)
      .setScale(unit * (1 - breath * 0.5), unit * (1 + breath))
      .setTexture(Math.floor(t / 320) % 2 ? 'p1' : 'p0');
    const hop = Math.max(0, Math.sin(t / 460)) * unit * 0.9;
    this.ball
      .setPosition(Math.round(this.ballHomeX), Math.round(this.ballRestY - hop))
      .setRotation(0);
    if (this.aiming && this.aim) this.aim.setAlpha(0.72 + Math.sin(t / 150) * 0.22);
    this.drawShadows();
  }
}
