export const last = (array) => {
  return array[array.length - 1];
};

export const reverseGen = function*(array) {
  for (let i = array.length - 1; i >= 0; i--) {
    yield array[i];
  }
};

export const reverse = (array) => {
  return [...reverseGen(array)];
};

export const penultimate = (array) => {
  return array[array.length - 2];
};

export const mean = (array) => {
  //return (array[0] + array[array.length - 1])/2;
  let total = 0;
  for (let i=0; i<array.length; i++) {
    total += array[i];
  }
  return total / array.length;
};

export const consecutive = function*(array) {
  for (let i = 0; i < array.length - 1; i++) {
    yield [array[i], array[i + 1]];
  }
};

export const init = (length, f) => {
  const array = [];

  for (let i = 0; i < length; i++) {
    array.push(f(i));
  }

  return array;
};
