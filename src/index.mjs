// Native module
import path from 'path';

export default async function runTests({ configPath }) {
  const { dir: rootDir, base: configFileName } = path.parse(configPath);;

  const config = await import(configPath).then(module => module.default);
  console.log('config = ', config);
}
