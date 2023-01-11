// Utils
import { searchTestFiles } from './search/index.mjs';

// Native module
import path from 'path';

export default async function runTests({ configPath }) {
  const { dir: rootDir, base: configFileName } = path.parse(configPath);;

  const {
    testMatch,
    testPathIgnorePatterns,
  } = await import(configPath).then(module => module.default);

  const testFiles = searchTestFiles({ testMatch, testPathIgnorePatterns });
  console.log('testFiles = ', testFiles);
}
