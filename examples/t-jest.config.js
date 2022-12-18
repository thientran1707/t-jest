module.exports = {
  testMatch: [ "**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)" ],
  testPathIgnorePatterns: ["/node_modules/", '**/exclude.test.js', '**/add.test.js', '**/multiply.test.js'],
}
