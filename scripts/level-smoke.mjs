import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function levelSmoke(browser, root, url) {
  const out = path.join(root, '..', 'artifacts', 'levels');
  await fs.mkdir(out, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: out }
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto(url || pathToFileURL(path.join(root, 'index.html')).href);
    await page.locator('[data-title-action="play"]').click();
    for (let level = 1; level <= 9; level++) {
      if (level > 1) {
        await page.keyboard.down('l');
        await page.waitForTimeout(100);
        await page.keyboard.up('l');
      }
      await page.locator(`[data-level="${level}"]`).click();
      await page.waitForFunction((index) => {
        const scene = game.scene.getScene('game');
        return scene.i === index && !scene.menuOpen && scene.p?.body;
      }, level - 1);
      const state = await page.evaluate(() => {
        const scene = game.scene.getScene('game');
        const clear = (body) =>
          [
            [body.left + 0.01, body.top + 0.01],
            [body.right - 0.01, body.top + 0.01],
            [body.left + 0.01, body.bottom - 0.01],
            [body.right - 0.01, body.bottom - 0.01]
          ].every(([x, y]) => !scene.sp(x, y));
        return {
          index: scene.i,
          playerClear: clear(scene.p.body),
          ballClear: clear(scene.ball.body),
          goalVisible: scene.goal.visible,
          enemies: scene.enemies.length,
          expectedEnemies: (EN[scene.i + 1] || []).length
        };
      });
      assert.equal(state.index, level - 1);
      assert.equal(state.playerClear, true, `Player starts inside geometry in level ${level}`);
      assert.equal(state.ballClear, true, `Ball starts inside geometry in level ${level}`);
      assert.equal(state.goalVisible, true);
      assert.equal(state.enemies, state.expectedEnemies);
      await page.screenshot({ path: path.join(out, `level-${level}.png`) });
    }
    assert.deepEqual(errors, []);
    console.log(
      'PASS: all nine levels start with clear player/ball bodies, visible goals and correct enemies; screenshots and footage captured'
    );
  } finally {
    await context.close();
  }
}
