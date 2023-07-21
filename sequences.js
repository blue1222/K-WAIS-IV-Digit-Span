Array.prototype.pop = function (index = -1) {
  return this.splice(index < 0 ? this.length + index : index, 1)[0];
};

function randomShuffle(unshuffled) {
  let shuffled = unshuffled
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  return shuffled;
};

const BASED_FORWARD = [
  [9, 7],
  [6, 3],
  [5, 8, 2],
  [6, 9, 4],
  [7, 2, 8, 6],
  [6, 4, 3, 9],
  [4, 2, 7, 3, 1],
  [7, 5, 8, 3, 1],
  [3, 9, 2, 4, 8, 7],
  [6, 1, 9, 4, 7, 3],
  [4, 1, 7, 9, 3, 8, 6],
  [6, 9, 1, 7, 4, 2, 8],
  [3, 8, 2, 9, 6, 1, 7, 4],
  [5, 8, 1, 3, 2, 6, 4, 7],
  [2, 7, 5, 8, 6, 3, 1, 9, 4],
  [7, 1, 3, 9, 4, 2, 5, 6, 8],
];

const BASED_BACKWARD = [
  [3, 1],
  [2, 4],
  [4, 6],
  [5, 7],
  [6, 2, 9],
  [4, 7, 5],
  [8, 2, 7, 9],
  [4, 9, 6, 8],
  [6, 5, 8, 4, 3],
  [1, 5, 4, 8, 6],
  [5, 3, 7, 4, 1, 8],
  [7, 2, 4, 8, 5, 6],
  [8, 1, 4, 9, 3, 6, 2],
  [4, 7, 3, 9, 6, 2, 8],
  [9, 4, 3, 7, 6, 2, 1, 8],
  [7, 2, 8, 1, 5, 6, 4, 3],
];

const BASED_SEQUENCING = [
  [1, 2],
  [4, 2],
  [3, 1, 6],
  [0, 9, 4],
  [8, 7, 9, 2],
  [4, 8, 7, 1],
  [2, 6, 9, 1, 7],
  [3, 8, 3, 5, 8],
  [2, 1, 7, 4, 3, 6],
  [6, 2, 5, 2, 3, 4],
  [7, 5, 7, 6, 8, 6, 2],
  [4, 8, 2, 5, 4, 3, 5],
  [5, 8, 7, 2, 7, 5, 4, 5],
  [9, 4, 9, 7, 3, 0, 8, 4],
  [5, 0, 1, 1, 3, 2, 1, 0, 5],
  [2, 7, 1, 4, 8, 4, 2, 9, 6],
];

function generate(based_array, digits) {
  let r = [];
  for (let i = 0, n = based_array.length; i < n; ++i) {
    let a = [], d = new Map(), ds = randomShuffle(digits.slice());
    for (let j = 0, m = based_array[i].length; j < m; ++j) {
      let key = based_array[i][j];
      if (d.has(key) === false) {
        d.set(key, ds.pop());
      }
      a.push(d.get(key));
    }
    r.push(randomShuffle(a));
  }
  return r;
}

export function generate_forward() {
  return generate(BASED_FORWARD, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
}

export function generate_backward() {
  return generate(BASED_BACKWARD, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
}

export function generate_sequencing() {
  return generate(BASED_SEQUENCING, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
}
