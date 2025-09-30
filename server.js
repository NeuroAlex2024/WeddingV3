const { start } = require('./src/server');

async function main() {
  await start();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Не удалось инициализировать сервер', error);
    process.exit(1);
  });
}

module.exports = {
  start
};
