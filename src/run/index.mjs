import { Worker } from 'worker_threads';
import os from 'os';
import { fileURLToPath } from 'url';
import path from 'path';
import chalk from 'chalk';

const cpuCount = os.cpus().length;

const filename = fileURLToPath(import.meta.url);
const { dir: currentFilePath } = path.parse(filename);

export async function runTestFiles(testFiles, rootDir) {
  // Spawn the new worker for each testFile
  // Note that this is not very efficient, since creating worker is costly
  // It will be more efficient to use thread pool
  let hasFailedTestCase = false;

  // run the tasks in batch
  // max number of worker creates should be equal to cpuCount - 1
  const workerPoolSize = cpuCount - 1;

  for (let i = 0; i < testFiles.length; i = i + workerPoolSize) {
    console.log(chalk.green.bold(`Running test batch ${Math.floor(i / workerPoolSize)}`));
    await Promise.all(
      testFiles.slice(i, i + workerPoolSize).map(async testFile => {
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
  }

  if (hasFailedTestCase) {
    console.log(chalk.red.bold('Test run failed, please fix the failing tests'));
    process.exitCode = 1;
  }
}
