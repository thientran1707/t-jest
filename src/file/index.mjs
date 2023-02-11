// Native modules
import path from 'path';
import fs from 'fs';

// Constants
import { DEFAULT_FILE_EXTENSIONS } from './constants.mjs';

const fileCache = {}; // used to cache the files

export const readFileWithCache = filePath => {
  if (fileCache[filePath]) {
    return fileCache[filePath];
  }

  // read the file content and save to cache
  const content = fs.readFileSync(filePath, 'utf8');
  fileCache[filePath] = content;

  return content;
};

export const loadFile = (
  filePath,
  fileExtentions = DEFAULT_FILE_EXTENSIONS
) => {
  const { ext } = path.parse(filePath);

  // if there is a file extension, we will try to load it first
  if (ext) {
    try {
      return readFileWithCache(filePath);
    } catch (error) {
      // ignore error
    }
  }

  // try to load the file with extensions
  for (const extension of fileExtentions) {
    try {
      return readFileWithCache(`${filePath}${extension}`);
    } catch (error) {
      // ignore error
    }
  }
};
