# jsondiffpatch-arrays-by-hash

A plugin for jsondiffpatch that supports tracking changes in arrays based on object hashes instead of indexes.

### Why?

[benjamine/jsondiffpatch](https://github.com/benjamine/jsondiffpatch/commits/master) is an awesome library for creating json patch objects from the difference between two JSON objects.

One nice feature is that it supports an [objectHash function](https://github.com/benjamine/jsondiffpatch/blob/master/docs/arrays.md#an-object-hash) to better track items moving within an array. For example:

```js
var withoutHash = jsondiffpatch.create();
var withHash = jsondiffpatch.create({objectHash: obj => obj.id});

var before = [{id: 1}, {id: 2}];
var after = [{id: 2}, {id: 1}];

// Without hash - Treated like objects didn't move, but their ids changed
withoutHash.diff(before, after);
// { '0': { id: [ 1, 2 ] }, '1': { id: [ 2, 1 ] }, _t: 'a' }

// With hash - Treated like a simple array re-order
with.diff(before, after);
// { _t: 'a', _1: [ '', 0, 3 ] }
```

This works within the context of one patch where the underlying JSON hasn't changed, but what if my underlying object changes or if I have multiple patches that I want to apply to the object? (like a merge)

```js
var before = [{id: 1}, {id: 2}];
var flagged = [{id: 1}, {id: 2, foo: true}];

// Create two separate patches
// 1. Reorder patch just swaps objects 1 and 2 order
var reordered = [{id: 2}, {id: 1}];
var reorderPatch = withHash.diff(before, reordered);

// 2. Flag patch adds a property to object with ID 2
var flagged = [{id: 1}, {id: 2, foo: true}];
var flaggedPatch = withHash.diff(before, flagged);

// After some time passes, we apply the redorder patch
var after = withHash.patch(before, reorderPatch);

// And then apply the flagged patch, essentially doing a merge
after = withHash.patch(after, flaggedPatch);

// Oh no! The flag was instead applied to object with id 1, instead of 2
// [{id: 2}, {id: 1, foo: true}]
```

This plugin attempts to fix this shortcoming, by storing the result of `objectHash` with each array change, and then reapplying those changes to the element with the specified object hash instead of the specified array index.

### Array Delta JSON Representation

You can see the default jsondiffpatch array delta format [here](https://github.com/benjamine/jsondiffpatch/blob/master/docs/arrays.md#representation).

In our version, we update the keys with some prefixes that have special meaning:

- `-` - An array element was removed or moved
- `+` - An array element was added
- `!` - An array element was modified
- `@` - The array key is an array index
- `#` - The array key is an object hash

In practice deltas look liks this:

```js
{
  _t: 'a',
  '+@4': [ { id: 'red' } ], // red item added at index 4
  '-#blue': [ { id: 'blue' }, 6, 0, 0 ], // blue item removed from index 6
  '-#green': [ '', 9, 4, 3 ], // green item moved
  '!#green': { value: [1, 2] }, // green item also had its value changed
}
```

### How to use this plugin

Coming soon
