// Utils
import { searchTestFiles } from './search/index.mjs';

// Native modules
import path from 'path';
import fs from 'fs';

export default async function runTest({
  configPath
}) {
  const { dir: rootDir, base: configFileName } = path.parse(configPath);

  const {
    testMatch,
    testPathIgnorePatterns,
  } = await import(configPath).then(module => module.default);

  const testFiles = searchTestFiles({ testMatch, testPathIgnorePatterns });

  console.log('testFiles = ', testFiles);
}
