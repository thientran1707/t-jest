#!/usr/bin/env node
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import path from 'path';
import runTests from '../src/index.mjs';

const { config } = yargs(hideBin(process.argv)).argv;
const configPath = path.join(process.cwd(), config);

runTests({ configPath });
