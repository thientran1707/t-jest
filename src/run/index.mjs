import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import path from 'path';

// similar to __dirname
const filename = fileURLToPath(import.meta.url);
const { dir: currentFilePath } = path.parse(filename);

export async function runTestFiles(testFiles, rootDir) {
  await Promise.all(testFiles.map(async testFile => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(path.join(currentFilePath, './worker.mjs'), { workerData: { testFile }});
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', code => {
        if (code !== 0) {
          if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`));
          }
        }
      })
    }).
    then(({ result}) => {
      console.log('result = ', result);
    })
  }));
}
