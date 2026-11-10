const fs = require('node:fs');
const path = require('node:path');

// Reassemble split assets for existing VM fixtures and recording fingerprints.
function readGameHtml(root) {
  return fs
    .readFileSync(path.join(root, 'index.html'), 'utf8')
    .replace(
      '<link rel="stylesheet" href="css/game.css">',
      () => '<style>' + fs.readFileSync(path.join(root, 'css/game.css'), 'utf8') + '</style>'
    )
    .replace(
      /<script src="js\/state.js"><\/script>[\s\S]*?<script src="js\/main.js"><\/script>/,
      () =>
        '<script>\n' +
        ['state', 'audio', 'levels', 'home-art', 'tutorial', 'art', 'game', 'title', 'main']
          .map((name) => fs.readFileSync(path.join(root, 'js', name + '.js'), 'utf8'))
          .join('') +
        '</script>'
    );
}
exports.readGameHtml = readGameHtml;

// Test the game definitions without booting Phaser or depending on source formatting.
function readGameLogic(root = path.resolve(__dirname, '..')) {
  return ['levels', 'home-art', 'tutorial', 'art', 'game', 'title']
    .map((name) => fs.readFileSync(path.join(root, 'js', name + '.js'), 'utf8'))
    .join('\n');
}
exports.readGameLogic = readGameLogic;
