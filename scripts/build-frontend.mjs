import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function loadConfig() {
  const configModule = await import(pathToFileURL(path.join(projectRoot, 'rollup.config.js')));
  const config = configModule.default ?? configModule;
  if (!config || !config.input || !config.output || !config.output.file) {
    throw new Error('Invalid Rollup config: expected input and output.file');
  }
  return config;
}

async function copyFileSafe(src, dest) {
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  await fs.promises.copyFile(src, dest);
}

async function buildOnce() {
  const config = await loadConfig();
  const inputPath = path.resolve(projectRoot, config.input);
  const outputFile = path.resolve(projectRoot, config.output.file);

  await fs.promises.mkdir(path.dirname(outputFile), { recursive: true });
  const source = await fs.promises.readFile(inputPath, 'utf8');
  await fs.promises.writeFile(outputFile, source, 'utf8');

  const dataSrc = path.resolve(projectRoot, 'data.js');
  const dataDest = path.resolve(projectRoot, 'public', 'data.js');
  await copyFileSafe(dataSrc, dataDest);

  console.log(`[frontend] built ${path.relative(projectRoot, outputFile)}`);
}

function collectWatchDirs(root) {
  const dirs = [root];
  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      dirs.push(...collectWatchDirs(path.join(root, entry.name)));
    }
  }
  return dirs;
}

async function run() {
  const watchMode = process.argv.includes('--watch');
  if (!watchMode) {
    await buildOnce();
    return;
  }

  let building = false;
  let pending = false;

  async function triggerBuild() {
    if (building) {
      pending = true;
      return;
    }
    building = true;
    try {
      await buildOnce();
    } catch (err) {
      console.error('[frontend] build failed:', err);
    } finally {
      building = false;
      if (pending) {
        pending = false;
        triggerBuild();
      }
    }
  }

  await triggerBuild();

  const watchRoot = path.resolve(projectRoot, 'src/frontend');
  const watchDirs = collectWatchDirs(watchRoot);
  console.log('[frontend] watching for changes in src/frontend (Ctrl+C to exit)');

  for (const dir of watchDirs) {
    fs.watch(dir, { persistent: true }, (eventType, filename) => {
      if (!filename) return;
      triggerBuild();
    });
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
