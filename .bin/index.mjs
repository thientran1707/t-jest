#!/usr/bin/env node
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';
import runTest from '../src/index.mjs';

const { config } = yargs(hideBin(process.argv)).argv;
const configPath = path.join(process.cwd(), config);

runTest({ configPath });
