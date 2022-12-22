// function add(number1, number2) {
//   return number1 + number2;
// }
//

const { add } = require('./src/add.js');

function multiply(number1, number2) {
  return number1 * number2;
}

module.exports = {
  add,
  multiply
};
