// Menu artwork shares the game's tile geometry and deliberately uses whole pixels.
function drawHomeScene(canvas, level) {
  const w = canvas.width,
    h = canvas.height,
    c = canvas.getContext('2d');
  c.imageSmoothingEnabled = false;
  const rect = (x, y, a, b, col) => {
    c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), Math.round(a), Math.round(b));
  };
  rect(0, 0, w, h, '#111a31');
  for (let i = 0; i < 24; i++)
    rect(
      (i * 47 + 19) % w,
      (i * 17 + 7) % Math.floor(h * 0.6),
      i % 4 ? 1 : 2,
      1,
      i % 3 ? '#53688e' : '#b8c6e8'
    );
  for (let i = 0; i < 7; i++) {
    const x = (i * w) / 6 - 24,
      base = h - 10,
      peak = h * (0.35 + (i % 3) * 0.1);
    for (let y = Math.round(peak / 2) * 2; y < base; y += 2) {
      const spread = Math.round(((y - peak) / (base - peak)) * 22) * 2;
      rect(x - spread, y, spread * 2 + 2, 2, i % 2 ? '#1d2c48' : '#203552');
    }
    rect(x + 9, base - 18, 15, 18, '#293a5d');
  }
  if (level) {
    const scale = Math.min((w - 16) / (level.w * 16), (h - 10) / (level.h * 16)),
      ox = (w - level.w * 16 * scale) / 2,
      oy = h - 4 - level.h * 16 * scale;
    const tile = (x, y, a, b, color) =>
      rect(
        ox + x * 16 * scale,
        oy + y * 16 * scale,
        Math.max(2, a * 16 * scale),
        Math.max(2, b * 16 * scale),
        color
      );
    tile(0, level.h - 1, level.w, 1, '#53688e');
    for (const [x, y, a, b] of level.x || []) {
      tile(x, y, a, b, '#53688e');
      tile(x, y, a, 0.25, '#7bd88f');
    }
    const [gx, gy, gw, gh] = level.g;
    tile(gx, gy, gw, gh, '#7bd88f');
    tile(gx + 0.3, gy + 0.3, gw - 0.6, gh - 0.6, '#203d3b');
    tile(level.p[0], level.p[1], 0.6, 1, '#ffe66d');
    tile(level.b[0], level.b[1], 0.5, 0.5, '#f4f1de');
    return;
  }
  // Floating platforms, a recall trail, and the familiar gold-shirted player.
  for (const [x, y, a] of [
    [0, 105, 360],
    [148, 79, 34],
    [210, 56, 38],
    [274, 34, 60]
  ]) {
    rect(x, y, a, 4, '#7bd88f');
    rect(x, y + 4, a, 12, '#293a5d');
    for (let j = 0; j < a; j += 16) {
      rect(x + j, y + 5, 14, 1, '#53688e');
      rect(x + j + 7, y + 7, 1, 7, '#1d2c48');
    }
  }
  for (let i = 0; i < 8; i++)
    rect(93 + i * 15, 86 - Math.sin((i / 7) * Math.PI) * 24, 3, 2, '#53688e');
  rect(62, 83, 10, 8, '#080c18');
  rect(64, 81, 7, 3, '#b86848');
  rect(64, 84, 7, 6, '#ffca8a');
  rect(69, 85, 2, 2, '#111a31');
  rect(61, 91, 13, 8, '#ffe66d');
  rect(64, 94, 7, 2, '#d99b43');
  rect(58, 92, 3, 5, '#ffca8a');
  rect(74, 92, 3, 5, '#ffca8a');
  rect(62, 99, 4, 4, '#53688e');
  rect(69, 99, 4, 4, '#53688e');
  rect(60, 103, 7, 2, '#f4f1de');
  rect(69, 103, 7, 2, '#f4f1de');
  rect(189, 62, 6, 6, '#f4f1de');
  rect(191, 61, 2, 8, '#b8c6e8');
  rect(191, 64, 2, 2, '#293a5d');
  rect(303, 7, 25, 27, '#7bd88f');
  rect(305, 9, 21, 23, '#203d3b');
  for (let i = 0; i < 4; i++) {
    rect(306 + i * 6, 9, 1, 23, '#43645b');
    rect(305, 11 + i * 6, 21, 1, '#43645b');
  }
  rect(26, 24, 23, 3, '#53688e');
  rect(31, 20, 12, 4, '#53688e');
  rect(28, 27, 27, 2, '#293a5d');
}
