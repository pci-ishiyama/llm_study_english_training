const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const functions = [
  'chat-handler',
  'feedback-generator',
  'session-manager',
  'user-manager',
  'history-manager',
  'transcribe-handler',
];

const buildAll = async () => {
  // distディレクトリを作成
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }

  for (const func of functions) {
    const entryPoint = path.join('src', 'functions', func, 'index.ts');

    if (!fs.existsSync(entryPoint)) {
      console.warn(`Warning: Entry point not found: ${entryPoint}`);
      continue;
    }

    console.log(`Bundling ${func}...`);

    await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      platform: 'node',
      target: 'node20',
      // buildspec.yml の zip コマンドが dist/${func}/index.js を参照しているため
      outfile: path.join('dist', func, 'index.js'),
      external: ['@aws-sdk/*'],
      sourcemap: false,
      minify: false,
    });

    console.log(`  -> dist/${func}/index.js`);
  }

  console.log('Bundle complete!');
};

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
