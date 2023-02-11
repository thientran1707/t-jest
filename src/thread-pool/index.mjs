// https://amagiacademy.com/blog/posts/2021-04-09/node-worker-threads-pool
// Modify from the example of code of Nodejs using AsyncResources
// https://nodejs.org/api/async_hooks.html#async_hooks_using_asyncresource_for_a_worker_thread_pool
import { AsyncResource } from 'async_hooks';
import { EventEmitter } from 'events';
import { Worker } from 'worker_threads';
import path from 'path';

// Constants
const kTaskInfo = Symbol('kTaskInfo');
const kWorkerFreedEvent = Symbol('kWorkerFreedEvent');

class WorkerPoolTaskInfo extends AsyncResource {
  constructor(callback) {
    super('WorkerPoolTaskInfo');
    this.callback = callback;
  }

  done(err, result) {
    this.runInAsyncScope(this.callback, null, err, result);
    this.emitDestroy(); // Task Info is used only once
  }
}

export class WorkerPool extends EventEmitter {
  constructor(numThreads, workerFile) {
    super();

    this.numThreads = numThreads;
    this.workerFile = workerFile;

    this.workers = [];
    this.freeWorkers = [];

    // init workers
    for (let i = 0; i < numThreads; i++) {
      this.addNewWorker();
    }
  }

  addNewWorker() {
    const worker = new Worker(path.resolve(this.workerFile));

    // once there is one worker that has completed, we emit the freeEvent
    worker.on('message', result => {
      // call the callback passed to `runTask`
      // remove the `TaskInfo` linked to the Worker and mark it as free
      worker[kTaskInfo].done(null, result);
      worker[kTaskInfo] = null;

      this.freeWorkers.push(worker);
      this.emit(kWorkerFreedEvent);
    });

    worker.on('error', err => {
      // call the called passed with error
      if (worker[kTaskInfo]) {
        worker[kTaskInfo].done(err, null);
      } else {
        this.emit('error', err);
      }

      // remove current worker from the list and start a new Worker to replace
      this.workers.splice(this.workers.indexOf(worker), 1);
      this.addNewWorker();
    });

    this.workers.push(worker);
    this.freeWorkers.push(worker);
    this.emit(kWorkerFreedEvent);
  }

  runTask(task, callback) {
    if (this.freeWorkers.length === 0) {
      // no free threads, wait unitl there is a free worker
      this.once(kWorkerFreedEvent, () => this.runTask(task, callback));
      return;
    }

    const worker = this.freeWorkers.pop();
    worker[kTaskInfo] = new WorkerPoolTaskInfo(callback);
    worker.postMessage(task);
  }

  close() {
    for (const worker of this.workers) {
      worker.terminate();
    }
  }
}
