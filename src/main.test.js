const jsondiffpatchArraysByHash = require('../dist/jsondiffpatch-arrays-by-hash.cjs.js');
const jsondiffpatchCreator = require('jsondiffpatch');

const tests = [{
    name: 'simple values',
    left: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    right: [1, 3, 4, 5, 8, 9, 9.1, 10],
    delta: {
      _t: 'a',
      '-@1': [2, 1, 0, 0],
      '-@5': [6, 5, 0, 0],
      '-@6': [7, 6, 0, 0],
      '+@6': [9.1]
    },
    reverse: {
      _t: 'a',
      '+@1': [2],
      '+@5': [6],
      '+@6': [7],
      '-@6': [9.1, 6, 0, 0]
    }
  }, {
    name: 'added block',
    left: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    right: [1, 2, 3, 4, 5, 5.1, 5.2, 5.3, 6, 7, 8, 9, 10],
    delta: {
      _t: 'a',
      '+@5': [5.1],
      '+@6': [5.2],
      '+@7': [5.3]
    },
    reverse: {
      _t: 'a',
      '-@5': [5.1, 5, 0, 0],
      '-@6': [5.2, 6, 0, 0],
      '-@7': [5.3, 7, 0, 0]
    }
  }, {
    name: 'movements',
    left: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    right: [1, 2, 3, 7, 5, 6, 8, 9, 4, 10],
    delta: {
      _t: 'a',
      '-@3': ['', 3, 8, 3],
      '-@6': ['', 6, 3, 3]
    },
    reverse: {
      _t: 'a',
      '-@3': ['', 3, 6, 3],
      '-@8': ['', 8, 3, 3]
    }
  }, {
    name: 'movements(2)',
    left: [1, 2, 3, 4],
    right: [2, 4, 1, 3],
    delta: {
      _t: 'a',
      '-@1': ['', 1, 0, 3],
      '-@3': ['', 3, 1, 3]
    },
    reverse: {
      _t: 'a',
      '-@2': ['', 2, 0, 3],
      '-@3': ['', 3, 2, 3]
    },
    exactReverse: false
  }, {
    name: 'nested no hash',
    left: [1, 2, {
        id: 4,
        width: 10
      },
      4, {
        id: 'five',
        width: 4
      },
      6, 7, 8, 9, 10
    ],
    right: [1, 2, {
        id: 4,
        width: 12
      },
      4, {
        id: 'five',
        width: 4
      },
      6, 7, 8, 9, 10
    ],
    delta: {
      _t: 'a',
      '!@2': {
        width: [10, 12]
      }
    },
    reverse: {
      _t: 'a',
      '!@2': {
        width: [12, 10]
      }
    }
  }, {
    name: 'nested',
    options: {
      objectHash: function(obj) {
        if (obj && obj.id) {
          return obj.id;
        }
      }
    },
    left: [1, 2, {
        id: 4,
        width: 10
      },
      4, {
        id: 'five',
        width: 4
      },
      6, 7, 8, 9, 10
    ],
    right: [1, 2, {
        id: 4,
        width: 12
      },
      4, {
        id: 'five',
        width: 4
      },
      6, 7, 8, 9, 10
    ],
    delta: {
      _t: 'a',
      '!#4': {
        width: [10, 12]
      }
    },
    reverse: {
      _t: 'a',
      '!#4': {
        width: [12, 10]
      }
    }
  }, {
    name: 'nested with movement',
    options: {
      objectHash: function(obj) {
        if (obj && obj.id) {
          return obj.id;
        }
      }
    },
    left: [1, 2, 4, {
      id: 'five',
      width: 4
    },
    6, 7, 8, {
      id: 4,
      width: 10,
      height: 3
    },
    9, 10
    ],
    right: [1, 2, {
      id: 4,
      width: 12
    },
    4, {
      id: 'five',
      width: 4
    },
    6, 7, 8, 9, 10
    ],
    delta: {
      _t: 'a',
      '!#4': {
        width: [10, 12],
        height: [3, 0, 0]
      },
      '-#4': ['', 7, 2, 3]
    },
    reverse: {
      _t: 'a',
      '!#4': {
        width: [12, 10],
        height: [3]
      },
      '-#4': ['', 2, 7, 3]
    }
  }, {
    name: 'nested changes among array insertions and deletions',
    options: {
      objectHash: function(obj) {
        if (obj && obj.id) {
          return obj.id;
        }
      }
    },
    left: [
      {
        id: 1
      },
      {
        id: 2
      },
      {
        id: 4
      },
      {
        id: 5
      },
      {
        id: 6,
        inner: {
          property: 'abc'
        }
      },
      {
        id: 7
      },
      {
        id: 8
      },
      {
        id: 10
      },
      {
        id: 11
      },
      {
        id: 12
      }
      ],
    right: [
      {
        id: 3
      },
      {
        id: 4
      },
      {
        id: 6,
        inner: {
          property: 'abcd'
        }
      },
      {
        id: 9
      }
    ],
    delta: {
      _t: 'a',
      '+@0': [ { id: 3 } ],
      '!#6': {
        inner: {
          property: [ 'abc', 'abcd' ]
        }
      },
      '+@3': [ { id: 9 } ],
      '-#1': [ { id: 1 }, 0, 0, 0 ],
      '-#2': [ { id: 2 }, 1, 0, 0 ],
      '-#5': [ { id: 5 }, 3, 0, 0 ],
      '-#7': [ { id: 7 }, 5, 0, 0 ],
      '-#8': [ { id: 8 }, 6, 0, 0 ],
      '-#10': [ { id: 10 }, 7, 0, 0 ],
      '-#11': [ { id: 11 }, 8, 0, 0 ],
      '-#12': [ { id: 12 }, 9, 0, 0 ]
    },
    reverse: {
      _t: 'a',
      '+@0': [ { id: 1 } ],
      '+@1': [ { id: 2 } ],
      '+@3': [ { id: 5 } ],
      '!#6': {
        inner: {
          property: [ 'abcd', 'abc' ]
        }
      },
      '+@5': [ { id: 7 } ],
      '+@6': [ { id: 8 } ],
      '+@7': [ { id: 10 } ],
      '+@8': [ { id: 11 } ],
      '+@9': [ { id: 12 } ],
      '-#3': [ { id: 3 }, 0, 0, 0 ],
      '-#9': [ { id: 9 }, 3, 0, 0 ]
    }
  }, {
    name: 'nested change with item moved above',
    options: {
      objectHash: function(obj) {
        if (obj && obj.id) {
          return obj.id;
        }
      }
    },
    left: [
      {
        id: 1
      },
      {
        id: 2
      },
      {
        id: 3,
        inner: {
          property: 'abc'
        }
      },
      {
        id: 4
      },
      {
        id: 5
      },
      {
        id: 6
      }
    ],
    right: [
      {
        id: 1
      },
      {
        id: 2
      },
      {
        id: 6
      },
      {
        id: 3,
        inner: {
          property: 'abcd'
        }
      },
      {
        id: 4
      },
      {
        id: 5
      }
    ],
    delta: {
      _t: 'a',
      '!#3': {
        inner:{
          property:[ 'abc', 'abcd' ]
        }
      },
      '-#6':['', 5, 2, 3 ]
    },
    reverse: {
      _t: 'a',
      '!#3': {
        inner:{
          property:[ 'abcd', 'abc' ]
        }
      },
      '-#6':['', 2, 5, 3 ]
    }
  }, {
    name: 'nested change with item moved right above',
    options: {
      objectHash: function(obj) {
        if (obj && obj.id) {
          return obj.id;
        }
      }
    },
    left: [
      {
        id: 1
      },
      {
        id: 2,
        inner: {
          property: 'abc'
        }
      },
      {
        id: 3
      }
    ],
    right: [
      {
        id: 1
      },
      {
        id: 3
      },
      {
        id: 2,
        inner: {
          property: 'abcd'
        }
      }
    ],
    delta: {
      _t: 'a',
      '!#2': {
        inner:{
          property:[ 'abc', 'abcd' ]
        }
      },
      '-#3':['', 2, 1, 3 ]
    },
    reverse: {
      _t: 'a',
      '!#2': {
        inner:{
          property:[ 'abcd', 'abc' ]
        }
      },
      '-#2':['', 2, 1, 3 ]
    },
    exactReverse: false
  }, {
    name: 'nested change with item moved right below',
    options: {
      objectHash: function(obj) {
        if (obj && obj.id) {
          return obj.id;
        }
      }
    },
    left: [
      {
        id: 1
      },
      {
        id: 2
      },
      {
        id: 3,
        inner: {
          property: 'abc'
        }
      },
      {
        id: 4
      }
    ],
    right: [
      {
        id: 2
      },
      {
        id: 3,
        inner: {
          property: 'abcd'
        }
      },
      {
        id: 1
      },
      {
        id: 4
      }
    ],
    delta: {
      _t: 'a',
      '!#3': {
        inner:{
          property:[ 'abc', 'abcd' ]
        }
      },
      '-#1':['', 0, 2, 3 ]
    },
    reverse: {
      _t: 'a',
      '!#3': {
        inner:{
          property:[ 'abcd', 'abc' ]
        }
      },
      '-#1':['', 2, 0, 3 ]
    }
  }, {
    name: 'nested with movements using custom objectHash',
    options: {
      objectHash: function(obj) {
        if (obj && obj.item_key) {
          return obj.item_key;
        }
      }
    },
    left: [1, 2, 4, {
        item_key: 'five',
        width: 4
      },
      6, 7, 8, {
        item_key: 'eight',
        width: 10,
        height: 3
      },
      9, 10
    ],
    right: [1, 2, {
        item_key: 'eight',
        width: 12
      },
      4, {
        item_key: 'five',
        width: 4
      },
      6, 7, 8, 9, 10
    ],
    delta: {
      _t: 'a',
      '!#eight': {
        width: [10, 12],
        height: [3, 0, 0]
      },
      '-#eight': ['', 7, 2, 3]
    },
    reverse: {
      _t: 'a',
      '!#eight': {
        width: [12, 10],
        height: [3]
      },
      '-#eight': ['', 2, 7, 3]
    }
  }, {
    name: 'using property filter',
    options: {
      propertyFilter: function(name/*, context */) {
        return name.slice(0, 1) !== '$';
      }
    },
    left: {
      inner: {
        $volatileData: 345,
        $oldVolatileData: 422,
        nonVolatile: 432
      }
    },
    right: {
      inner: {
        $volatileData: 346,
        $newVolatileData: 32,
        nonVolatile: 431
      }
    },
    delta: {
      inner: {
        nonVolatile: [432, 431]
      }
    },
    reverse: {
      inner: {
        nonVolatile: [431, 432]
      }
    },
    noPatch: true
  }, {
    name: 'adding an element w/ hash',
    options: {
      objectHash: function(obj) {
        if (obj && obj.id) {
          return obj.id;
        }
      }
    },
    left: [{id:'a',v:1},{id:'c',v:3}],
    right: [{id:'a',v:1},{id:'b',v:2},{id:'c',v:3}],
    delta: {
      _t:'a',
      '+@1':[{id:'b',v:2}]
    },
    reverse: {
      _t:'a',
      '-#b':[{id:'b',v:2}, 1, 0, 0]
    }
  }, {
    name: 'adding an element w/o hash',
    left: [{id:'a',v:1},{id:'c',v:3}],
    right: [{id:'a',v:1},{id:'b',v:2},{id:'c',v:3}],
    delta: {
      _t: 'a',
      '+@2': [{id: 'c', v: 3}],
      '!@1': {
        id: ['c', 'b'],
        v: [3, 2]
      }
    },
    reverse: {
      _t: 'a',
      '-@2': [{id: 'c', v: 3}, 2, 0, 0],
      '!@1': {
        id: ['b', 'c'],
        v: [2, 3]
      }
    }
  }, {
    name: 'removing, moving, adding, modifying element with hash',
    options: {
      objectHash: function(obj) {
        if (obj && obj.id) {
          return obj.id;
        }
      }
    },
    left: [
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 5 },
      { id: 7 },
      { id: 8 },
      { id: 9, inner: { value: 2 } },
      { id: 10 },
      { id: 11, inner: { value: 4 } },
      { id: 12 },
    ],
    right: [
      { id: 1 },
      { id: 3 },
      { id: 4 },
      { id: 5 },
      { id: 6 },
      { id: 8 },
      { id: 11, inner: { value: 8 } },
      { id: 9, inner: { value: 3 } },
      { id: 10 },
      { id: 13 },
      { id: 12 },
    ],
    delta: {
      _t: 'a',
      '-#2': [ { id: 2 }, 1, 0, 0 ],
      '-#7': [ { id: 7 }, 4, 0, 0 ],
      '-#11': [ '', 8, 6, 3 ],
      '+@2': [ { id: 4 } ],
      '+@4': [ { id: 6 } ],
      '+@9': [ { id: 13 } ],
      '!#11': { inner: {value: [4, 8]}},
      '!#9': { inner: {value: [2, 3]}}
    },
    reverse: {
      _t: 'a',
      '+@1': [ { id: 2 } ],
      '+@4': [ { id: 7 } ],
      '-#4': [ { id: 4 }, 2, 0, 0 ],
      '-#6': [ { id: 6 }, 4, 0, 0 ],
      '-#11': [ '', 6, 8, 3 ],
      '-#13': [ { id: 13 }, 9, 0, 0 ],
      '!#11': { inner: {value: [8, 4]}},
      '!#9': { inner: {value: [3, 2]}},
    }
  },
];

function runTest(testCase) {
	let instance = jsondiffpatchCreator.create(testCase.options);

  // Set up plugin
  instance.processor.pipes.diff
    .replace('arrays', jsondiffpatchArraysByHash.diffFilter);
  instance.processor.pipes.patch
    .replace('arrays', jsondiffpatchArraysByHash.patchFilter)
    .replace('arraysCollectChildren', jsondiffpatchArraysByHash.collectChildrenPatchFilter);
  instance.processor.pipes.reverse
    .replace('arrays', jsondiffpatchArraysByHash.reverseFilter)
    .replace('arraysCollectChildren', jsondiffpatchArraysByHash.collectChildrenReverseFilter);

  test(`${testCase.name} - Create diff`, () => {
    expect(instance.diff(testCase.left, testCase.right))
      .toEqual(testCase.delta);
  });
}

function runAllTests() {
	tests.forEach(runTest);
}

runAllTests();
