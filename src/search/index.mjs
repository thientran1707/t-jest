import glob from 'glob-all';

// Constatns
import { DEFAULT_TEST_MATCH, DEFAULT_TEST_PATH_IGNORE_PATTERNS } from './constants.mjs';

/**
 * Search for all test files
 * @param: testMatch: patterns to search for test files
 * @param: testPathIgnorePatterns: patterns to ignore the test files
 */
export function searchTestFiles({
  testMatch = DEFAULT_TEST_MATCH,
  testPathIgnorePatterns = DEFAULT_TEST_PATH_IGNORE_PATTERNS
}) {
  return glob.sync(testMatch, {
    onlyFiles: true,
    absolute: true,
    ignore: testPathIgnorePatterns,
  });
}
