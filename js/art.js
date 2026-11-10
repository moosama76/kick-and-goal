// Shared pixel textures and animations for the game and title screen.
function createGameArt(scene) {
  const tex = (key, w, h, draw) => {
    const t = scene.textures.createCanvas(key, w, h),
      c = t.getContext();
    c.imageSmoothingEnabled = false;
    draw(c);
    t.refresh();
  };
  const rect = (c, col, x, y, w = 1, h = 1) => {
    c.fillStyle = col;
    c.fillRect(x, y, w, h);
  };
  tex('tile', 16, 16, (c) => {
    rect(c, '#18233f', 0, 0, 16, 16);
    rect(c, '#293a5d', 1, 1, 14, 14);
    rect(c, '#344b72', 2, 2, 12, 2);
    rect(c, '#202e4c', 2, 9, 12, 5);
    rect(c, '#3c5279', 3, 6, 5, 1);
    rect(c, '#121a30', 0, 15, 16, 1);
    rect(c, '#53688e', 2, 2, 2, 1);
    rect(c, '#1a2540', 10, 11, 3, 2);
  });
  tex('tileTop', 16, 16, (c) => {
    rect(c, '#18233f', 0, 0, 16, 16);
    rect(c, '#314765', 1, 5, 14, 10);
    rect(c, '#43aa8b', 0, 2, 16, 4);
    rect(c, '#7bd88f', 0, 1, 16, 2);
    rect(c, '#b2f09b', 2, 0, 3, 1);
    rect(c, '#b2f09b', 11, 0, 2, 1);
    rect(c, '#27415a', 2, 10, 5, 1);
    rect(c, '#22364f', 10, 12, 4, 2);
    rect(c, '#121a30', 0, 15, 16, 1);
  });
  const poses = [
    [5, 12, 3, 3, 9, 12, 3, 3],
    [5, 12, 3, 3, 9, 12, 3, 3],
    [3, 12, 4, 2, 9, 11, 3, 3],
    [5, 11, 3, 3, 10, 12, 4, 2],
    [4, 11, 3, 3, 9, 12, 4, 2],
    [3, 12, 4, 2, 10, 11, 3, 3],
    [5, 11, 3, 3, 9, 10, 3, 3],
    [3, 11, 4, 3, 10, 11, 4, 3],
    [5, 12, 3, 3, 9, 11, 5, 2]
  ];
  for (let i = 0; i < 9; i++)
    tex('p' + i, 16, 16, (c) => {
      const bob = i === 1 ? 1 : 0,
        q = poses[i];
      rect(c, '#101522', 5, 1 + bob, 7, 6);
      rect(c, '#50384c', 5, 1 + bob, 7, 2);
      rect(c, '#f2b37c', 6, 3 + bob, 5, 3);
      rect(c, '#fff1d0', 10, 4 + bob, 1, 1);
      rect(c, '#101522', 11, 4 + bob, 1, 1);
      rect(c, '#101522', 3, 6 + bob, 10, 6);
      rect(c, '#f2c14e', 4, 7 + bob, 8, 4);
      rect(c, '#e66b4f', 4, 10 + bob, 8, 1);
      rect(c, '#fff1d0', 7, 7 + bob, 2, 3);
      rect(c, '#f2b37c', 2, 7 + bob, 2, 4);
      rect(c, '#f2b37c', 12, 7 + bob, 2, 4);
      rect(c, '#101522', 4, 11, 8, 2);
      rect(c, '#334ca0', 5, 11, 6, 2);
      rect(c, '#101522', q[0] - 1, q[1], q[2] + 2, q[3]);
      rect(c, '#f2b37c', q[0], q[1], q[2], q[3] - 1);
      rect(c, '#101522', q[4] - 1, q[5], q[6] + 2, q[7]);
      rect(c, '#f2b37c', q[4], q[5], q[6], q[7] - 1);
      rect(c, '#f4f1de', q[0], q[1] + q[3] - 1, q[2] + 1, 1);
      rect(c, '#f4f1de', q[4], q[5] + q[7] - 1, q[6] + 1, 1);
      if (i === 8) rect(c, '#f4f1de', 13, 12, 3, 2);
    });
  const patches = [
    [
      [4, 1],
      [1, 4],
      [7, 6]
    ],
    [
      [2, 2],
      [6, 1],
      [4, 6]
    ],
    [
      [1, 5],
      [5, 2],
      [7, 7]
    ],
    [
      [3, 1],
      [7, 4],
      [2, 7]
    ]
  ];
  for (let i = 0; i < 4; i++)
    tex('ball' + i, 10, 10, (c) => {
      const rows = [
        '...oooo...',
        '.oooooooo.',
        'oooooooooo',
        'oooooooooo',
        'oooooooooo',
        'oooooooooo',
        'oooooooooo',
        'oooooooooo',
        '.oooooooo.',
        '...oooo...'
      ];
      rows.forEach((r, y) =>
        [...r].forEach((v, x) => {
          if (v === 'o') rect(c, '#101522', x, y);
        })
      );
      rect(c, '#f4f1de', 2, 2, 6, 6);
      rect(c, '#ffffff', 3, 2, 4, 2);
      rect(c, '#c8d2dc', 2, 6, 6, 2);
      patches[i].forEach(([x, y]) => {
        rect(c, '#29334d', x, y, 2, 2);
        rect(c, '#101522', x + 1, y + 1, 1, 1);
      });
    });
  for (let f = 0; f < 2; f++)
    tex('goal' + f, 48, 48, (c) => {
      rect(c, f ? '#294c5b' : '#203c51', 1, 1, 46, 46);
      c.strokeStyle = f ? '#66d9d1' : '#436c7a';
      c.lineWidth = 1;
      for (let x = 5; x < 47; x += 6) {
        c.beginPath();
        c.moveTo(x, 2);
        c.lineTo(x, 46);
        c.stroke();
      }
      for (let y = 5; y < 47; y += 6) {
        c.beginPath();
        c.moveTo(2, y);
        c.lineTo(46, y);
        c.stroke();
      }
      rect(c, '#101522', 0, 0, 48, 3);
      rect(c, '#101522', 0, 0, 3, 48);
      rect(c, '#101522', 45, 0, 3, 48);
      rect(c, '#101522', 0, 45, 48, 3);
      rect(c, '#f4f1de', 1, 1, 46, 2);
      rect(c, '#f4f1de', 1, 1, 2, 46);
      rect(c, '#f4f1de', 45, 1, 2, 46);
      rect(c, '#f4f1de', 1, 45, 46, 2);
    });
  for (let f = 0; f < 2; f++)
    tex('switch' + f, 12, 12, (c) => {
      const col = f ? '#7bd88f' : '#ff6b4a';
      rect(c, '#101522', 1, 1, 10, 10);
      rect(c, col, 2, 2, 8, 8);
      rect(c, '#18233f', 4, 4, 4, 4);
      rect(c, '#f4f1de', 5, 5, 2, 2);
      rect(c, col, 0, 5, 2, 2);
      rect(c, col, 10, 5, 2, 2);
      rect(c, col, 5, 0, 2, 2);
      rect(c, col, 5, 10, 2, 2);
    });
  for (let f = 0; f < 2; f++)
    tex('routeControl' + f, 16, 16, (c) => {
      // A lever console, distinct from the cross-shaped checkpoint relay.
      rect(c, '#101522', 1, 3, 14, 12);
      rect(c, '#53688e', 2, 4, 12, 10);
      rect(c, '#293a5d', 3, 5, 10, 8);
      rect(c, '#101522', 4, 7, 7, 3);
      const x = f ? 9 : 4,
        col = f ? '#7fe3ff' : '#f2c14e';
      rect(c, '#b8c6e8', x, 3, 2, 7);
      rect(c, col, x - 1, 1, 4, 4);
      rect(c, col, 11, 11, 2, 2);
      rect(c, '#91a2bd', 3, 13, 2, 1);
      rect(c, '#18233f', 0, 15, 16, 1);
    });
  tex('gate', 16, 16, (c) => {
    rect(c, '#101522', 0, 0, 16, 16);
    rect(c, '#6d3f68', 2, 0, 4, 16);
    rect(c, '#6d3f68', 10, 0, 4, 16);
    rect(c, '#ff6b4a', 3, 1, 2, 14);
    rect(c, '#ff6b4a', 11, 1, 2, 14);
    rect(c, '#f2c14e', 6, 6, 4, 5);
  });
  tex('gateHorizontal', 16, 16, (c) => {
    rect(c, '#101522', 0, 0, 16, 16);
    rect(c, '#6d3f68', 0, 2, 16, 4);
    rect(c, '#6d3f68', 0, 10, 16, 4);
    rect(c, '#ff6b4a', 1, 3, 14, 2);
    rect(c, '#ff6b4a', 1, 11, 14, 2);
    rect(c, '#f2c14e', 6, 6, 5, 4);
  });
  tex('slotCap', 16, 2, (c) => {
    rect(c, '#101522', 0, 0, 16, 2);
    rect(c, '#7fe3ff', 1, 0, 14, 1);
    rect(c, '#f4f1de', 3, 1, 10, 1);
  });
  for (let f = 0; f < 2; f++) {
    tex('walker' + f, 16, 16, (c) => {
      rect(c, '#101522', 3, 3, 11, 10);
      rect(c, '#e66b4f', 4, 4, 9, 7);
      rect(c, '#f2c14e', 6, 6, 5, 2);
      rect(c, '#f4f1de', 10, 6, 1, 2);
      rect(c, '#101522', 3, 11, 4, 3);
      rect(c, '#101522', 10, 11, 4, 3);
      rect(c, '#b8c6e8', f ? 2 : 3, 14, 5, 2);
      rect(c, '#b8c6e8', f ? 10 : 9, 14, 5, 2);
    });
  }
  // Eight rotor frames keep the drone's fan visibly spinning instead of
  // snapping between two near-identical silhouettes.
  for (let f = 0; f < 8; f++) {
    const a = (f * Math.PI) / 8;
    tex('drone' + f, 16, 16, (c) => {
      c.globalAlpha = 0.22;
      c.fillStyle = '#7fe3ff';
      c.beginPath();
      c.ellipse(8, 2.5, 6.4, 1.8, 0, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
      c.strokeStyle = '#b8c6e8';
      c.lineWidth = 1;
      c.lineCap = 'round';
      for (let blade = 0; blade < 2; blade++) {
        const ang = a + blade * Math.PI;
        c.beginPath();
        c.moveTo(8, 2.5);
        c.lineTo(8 + Math.cos(ang) * 6.4, 2.5 + Math.sin(ang) * 1.8);
        c.stroke();
      }
      rect(c, '#101522', 7, 2, 2, 2);
      rect(c, '#f4f1de', 7, 2, 1, 1);
      rect(c, '#53688e', 7, 4, 2, 2);
      rect(c, '#101522', 3, 5, 10, 8);
      rect(c, '#7f5aa2', 4, 6, 8, 5);
      rect(c, '#ff6b4a', 6, 7, 5, 3);
      rect(c, '#ffe66d', 9, 7, 2, 2);
      rect(c, '#53688e', 2, 12, 3, 2);
      rect(c, '#53688e', 11, 12, 3, 2);
    });
  }
  tex('shot', 6, 6, (c) => {
    rect(c, '#ff6b4a', 2, 0, 2, 6);
    rect(c, '#ff6b4a', 0, 2, 6, 2);
    rect(c, '#ffe66d', 2, 2, 2, 2);
  });
  tex('cloud', 32, 16, (c) => {
    rect(c, '#53688e', 3, 7, 26, 6);
    rect(c, '#6f83a6', 7, 4, 17, 7);
    rect(c, '#91a2bd', 11, 2, 8, 5);
    rect(c, '#3c4d72', 3, 12, 26, 2);
  });
  tex('spark', 3, 3, (c) => rect(c, '#ffffff', 0, 0, 3, 3));
  tex('abilityRing', 26, 26, (c) => {
    c.strokeStyle = '#7fe3ff';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(13, 13, 11, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = '#f4f1de';
    c.lineWidth = 1;
    c.beginPath();
    c.arc(13, 13, 9, 0, Math.PI * 2);
    c.stroke();
    rect(c, '#ffffff', 12, 1, 2, 3);
    rect(c, '#7fe3ff', 1, 12, 3, 2);
    rect(c, '#7fe3ff', 22, 12, 3, 2);
  });
  tex('glove', 18, 14, (c) => {
    c.fillStyle = '#101522';
    c.beginPath();
    c.moveTo(2, 4);
    c.lineTo(12, 4);
    c.lineTo(17, 7);
    c.lineTo(12, 10);
    c.lineTo(2, 10);
    c.fill();
    rect(c, '#f4f1de', 3, 5, 10, 4);
    rect(c, '#e66b4f', 12, 5, 2, 4);
    rect(c, '#7fe3ff', 8, 5, 3, 3);
    rect(c, '#ffffff', 8, 5, 1, 1);
    c.fillStyle = '#e66b4f';
    c.beginPath();
    c.moveTo(4, 4);
    c.lineTo(7, 1);
    c.lineTo(9, 4);
    c.moveTo(4, 10);
    c.lineTo(7, 13);
    c.lineTo(9, 10);
    c.fill();
    rect(c, '#ffe66d', 0, 5, 3, 4);
    rect(c, '#ff8a7a', 0, 6, 2, 2);
  });
}

function createGameAnimations(scene) {
  if (scene.anims.exists('idle')) return;
  scene.anims.create({
    key: 'idle',
    frames: [{ key: 'p0' }, { key: 'p1' }],
    frameRate: 2.5,
    repeat: -1
  });
  scene.anims.create({
    key: 'run',
    frames: ['p2', 'p3', 'p4', 'p5'].map((key) => ({ key })),
    frameRate: 12,
    repeat: -1
  });
  scene.anims.create({
    key: 'goalGlow',
    frames: [{ key: 'goal0' }, { key: 'goal1' }],
    frameRate: 3,
    repeat: -1
  });
}
