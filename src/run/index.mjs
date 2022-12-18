import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import path from 'path';
import chalk from 'chalk';

const filename = fileURLToPath(import.meta.url);
const { dir: currentFilePath } = path.parse(filename);

export async function runTestFiles(testFiles, rootDir) {
  // Spawn the new worker for each testFile
  // Note that this is not very efficient, since creating worker is costly
  // It will be more efficient to use thread pool
  let hasFailedTestCase = false;
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
      })
      .then(({ result }) => {
        const { success, errorMessage } = result;
        const status = success ? chalk.green.inverse.bold(' PASS ' ) : chalk.red.inverse.bold(' FAIL ');
        console.log(`${status} ${chalk.dim(path.relative(rootDir, testFile))}`);
        if (!success) {
          hasFailedTestCase = true;
          console.log(`${errorMessage}`);
        }
      })
      .catch(error => {
        console.log('Error when running test: ', error.message);
      });
    })
  );

  if (hasFailedTestCase) {
    console.log(chalk.red.bold('Test run failed, please fix the failing tests'));
    process.exitCode = 1;
  }
}
