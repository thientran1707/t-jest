import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const { dir: currentFilePath } = path.parse(filename);

export async function runTestFiles(testFiles) {
  // Spawn the new worker for each testFile
  // Note that this is not very efficient, since creating worker is costly
  // It will be more efficient to use thread pool
  await Promise.all(
    testFiles.map(async testFile => {
      return new Promise((resolve, reject) => {
        const worker = new Worker(path.join(currentFilePath, './worker.mjs'), { workerData: { testFile } });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', code => {
          if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`));
          }
        });
      });
    })
  );
}
