// Built-in moduldes
import { parentPort, threadId } from 'worker_threads';
import path from 'path';
import vm from 'vm';
import chalk from 'chalk';

// JS Environment
// TODO add jsdom env for testing browser code
import { TestEnvironment } from 'jest-environment-node';

// Utils
import { loadFile } from '../file/index.mjs';

// Code transformation
import { transformSync } from '@babel/core';

// Assertions
import { expect } from '../assertion/index.mjs';

export async function runTestFile(testFile) {
  const testResult = {
    success: false,
    errorMessage: null,
  };

  let testName;
  try {
    const describeFns = [];
    let currentDescribeFn;

    const describe = (name, fn) => describeFns.push([name, fn]);
    const it = (name, fn) => currentDescribeFn.push([name, fn]);

    // create NodeEnvironment and run it with VMContext to isolate the running of each test case
    const environment = new TestEnvironment({
      projectConfig: {
        testEnvironmentOptions: { describe, it, expect },
      },
    });

    const stack = [];
    const moduleCache = {};

    const customRequire = fileName => {
      const currentDir = stack[stack.length - 1]; // stack.peek()
      const filePath = path.join(currentDir, fileName);

      // this will make sure the module is executated only once
      // != will catch both undefined and null
      if (moduleCache[filePath] != null) {
        return moduleCache[filePath];
      }

      const rawCode = loadFile(filePath);

      // Transform code to CommonJS with Babel
      const { code } = transformSync(rawCode, {
        plugins: ['@babel/plugin-transform-modules-commonjs'],
      });

      stack.push(path.dirname(filePath));

      // Output
      /**
       *
       Statement: const test = require('./file.js');

       Will be equivalent to
       const test = () => {
         const module = { exports: {} };
         (function(module, exports, require) {
           // file.js code
         })(module, module.exports, customRequrie)

         return module.exports
       })
       */

      // Create module factory
      const moduleFactory = vm.runInContext(
        `(function(module, exports, require) {${code}})`,
        environment.getVmContext()
      );

      const module = { exports: {} };

      // Run the code
      moduleFactory(module, module.exports, customRequire);

      stack.pop();

      moduleCache[filePath] = module.exports;
      return module.exports;
    };

    // customRequire will run the code
    stack.push(path.dirname(testFile));
    customRequire(path.basename(testFile));

    for (const [name, fn] of describeFns) {
      currentDescribeFn = [];
      testName = name;
      await fn();

      for (const [itName, itFn] of currentDescribeFn) {
        testName += ` ${itName}`;
        await itFn();
      }
    }

    // Update success to be true after all are executed
    testResult.success = true;
  } catch (error) {
    testResult.errorMessage = `${testName}: ${error.message}`;
  }

  return testResult;
}

parentPort.on('message', async task => {
  const { testFile } = task;
  console.log(chalk.blue(`Running task on thread: ${threadId}`));
  const result = await runTestFile(testFile);
  parentPort.postMessage(result);
});
