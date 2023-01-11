import fs from 'fs';

export async function runTestFiles(testFiles, rootDir) {
  await Promise.all(testFiles.map(async testFile => {
    const code = await fs.promises.readFile(testFile, 'utf-8');
    console.log('testFile = ', testFile);
    console.log('code = ', code);
  }));
}
