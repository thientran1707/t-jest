import path from 'path';
import fs from 'fs';
import { DEFAULT_FILE_EXTENSIONS } from './constants.mjs';

export const loadFile = filePath => {
  const { ext } = path.parse(filePath);

  if (ext) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      // ignore error
    }
  }

  // try to load the file with extensions
  for (const extension of DEFAULT_FILE_EXTENSIONS) {
    try {
      return fs.readFileSync(`${filePath}${extension}`, 'utf8');
    } catch (error) {
      // ignore error
    }
  }
}
