var defaultMatch = function defaultMatch(array1, array2, index1, index2) {
  return array1[index1] === array2[index2];
};

var lengthMatrix = function lengthMatrix(array1, array2, match, context) {
  var len1 = array1.length;
  var len2 = array2.length;
  var x = void 0,
      y = void 0;

  // initialize empty matrix of len1+1 x len2+1
  var matrix = [len1 + 1];
  for (x = 0; x < len1 + 1; x++) {
    matrix[x] = [len2 + 1];
    for (y = 0; y < len2 + 1; y++) {
      matrix[x][y] = 0;
    }
  }
  matrix.match = match;
  // save sequence lengths for each coordinate
  for (x = 1; x < len1 + 1; x++) {
    for (y = 1; y < len2 + 1; y++) {
      if (match(array1, array2, x - 1, y - 1, context)) {
        matrix[x][y] = matrix[x - 1][y - 1] + 1;
      } else {
        matrix[x][y] = Math.max(matrix[x - 1][y], matrix[x][y - 1]);
      }
    }
  }
  return matrix;
};

var backtrack = function backtrack(matrix, array1, array2, context) {
  var index1 = array1.length;
  var index2 = array2.length;
  var subsequence = {
    sequence: [],
    indices1: [],
    indices2: []
  };

  while (index1 !== 0 && index2 !== 0) {
    var sameLetter = matrix.match(array1, array2, index1 - 1, index2 - 1, context);
    if (sameLetter) {
      subsequence.sequence.unshift(array1[index1 - 1]);
      subsequence.indices1.unshift(index1 - 1);
      subsequence.indices2.unshift(index2 - 1);
      --index1;
      --index2;
    } else {
      var valueAtMatrixAbove = matrix[index1][index2 - 1];
      var valueAtMatrixLeft = matrix[index1 - 1][index2];
      if (valueAtMatrixAbove > valueAtMatrixLeft) {
        --index2;
      } else {
        --index1;
      }
    }
  }
  return subsequence;
};

var lcs = {
  get: function get(array1, array2, match, context) {
    var innerContext = context || {};
    var matrix = lengthMatrix(array1, array2, match || defaultMatch, innerContext);
    var result = backtrack(matrix, array1, array2, innerContext);
    if (typeof array1 === 'string' && typeof array2 === 'string') {
      result.sequence = result.sequence.join('');
    }
    return result;
  }
};

var ARRAY_REMOVE = 0;
var ARRAY_MOVE = 3;

var REMOVE_PREFIX = '-';
var INSERT_PREFIX = '+';
var MODIFY_PREFIX = '!';

var INDEX_PREFIX = '@';
var HASH_PREFIX = '#';

var isArray = (typeof Array.isArray === 'function') ?
  // use native function
  Array.isArray :
  // use instanceof operator
  function(a) {
    return a instanceof Array;
  };

var arrayIndexOf = typeof Array.prototype.indexOf === 'function' ?
  function(array, item) {
    return array.indexOf(item);
  } : function(array, item) {
    var length = array.length;
    for (var i = 0; i < length; i++) {
      if (array[i] === item) {
        return i;
      }
    }
    return -1;
  };

function arraysHaveMatchByRef(array1, array2, len1, len2) {
  for (var index1 = 0; index1 < len1; index1++) {
    var val1 = array1[index1];
    for (var index2 = 0; index2 < len2; index2++) {
      var val2 = array2[index2];
      if (index1 !== index2 && val1 === val2) {
        return true;
      }
    }
  }
}

function matchItems(array1, array2, index1, index2, context) {
  var value1 = array1[index1];
  var value2 = array2[index2];
  if (value1 === value2) {
    return true;
  }
  if (typeof value1 !== 'object' || typeof value2 !== 'object') {
    return false;
  }
  var objectHash = context.objectHash;
  if (!objectHash) {
    // no way to match objects was provided, try match by position
    return Boolean(context.matchByPosition) && index1 === index2;
  }
  var hash1;
  var hash2;
  if (typeof index1 === 'number') {
    context.hashCache1 = context.hashCache1 || [];
    hash1 = context.hashCache1[index1];
    if (typeof hash1 === 'undefined') {
      context.hashCache1[index1] = hash1 = objectHash(value1, index1);
    }
  } else {
    hash1 = objectHash(value1);
  }

  if (typeof index2 === 'number') {
    context.hashCache2 = context.hashCache2 || [];
    hash2 = context.hashCache2[index2];
    if (typeof hash2 === 'undefined') {
      context.hashCache2[index2] = hash2 = objectHash(value2, index2);
    }
  } else {
    hash2 = objectHash(value2);
  }

  // If at least one of the objects has a hash, compare them
  if (hash1 !== undefined || hash2 !== undefined) {
    return hash1 === hash2;
  }
  // Otherwise, fall back to matching by position if enabled
  if (context.matchByPosition) {
    return index1 === index2;
  }
  // Finally, assume the items dont match
  return false;
}

function hashOrIndex(object, index, matchContext) {
  var hash;
  if (matchContext.objectHash) {
    hash = matchContext.objectHash(object, index);
  }
  if (hash !== undefined) {
    return HASH_PREFIX + hash;
  }
  return INDEX_PREFIX + index;
}

var diffFilter = function arraysDiffFilter(context) {
  if (!context.leftIsArray) {
    return;
  }

  var matchContext = {
    objectHash: context.options && context.options.objectHash,
    matchByPosition: context.options && context.options.matchByPosition
  };
  var commonHead = 0;
  var commonTail = 0;
  var index;
  var index1;
  var index2;
  var array1 = context.left;
  var array2 = context.right;
  var len1 = array1.length;
  var len2 = array2.length;

  var child;
  var hashKey;

  if (len1 > 0 && len2 > 0 && !matchContext.objectHash &&
    typeof matchContext.matchByPosition !== 'boolean') {
    matchContext.matchByPosition = !arraysHaveMatchByRef(array1, array2, len1, len2);
  }

  // separate common head
  while (commonHead < len1 && commonHead < len2 &&
    matchItems(array1, array2, commonHead, commonHead, matchContext)) {
    index = commonHead;
    child = new context.constructor(context.left[index], context.right[index]);
    hashKey = hashOrIndex(array1[index], index, matchContext);
    context.push(child, MODIFY_PREFIX + hashKey);
    commonHead++;
  }
  // separate common tail
  while (commonTail + commonHead < len1 && commonTail + commonHead < len2 &&
    matchItems(array1, array2, len1 - 1 - commonTail, len2 - 1 - commonTail, matchContext)) {
    index1 = len1 - 1 - commonTail;
    index2 = len2 - 1 - commonTail;
    child = new context.constructor(context.left[index1], context.right[index2]);
    hashKey = hashOrIndex(array2[index2], index2, matchContext);
    context.push(child, MODIFY_PREFIX + hashKey);
    commonTail++;
  }
  var result;
  if (commonHead + commonTail === len1) {
    if (len1 === len2) {
      // arrays are identical
      context.setResult(undefined).exit();
      return;
    }
    // trivial case, a block (1 or more consecutive items) was added
    result = result || {
      _t: 'a'
    };
    for (index = commonHead; index < len2 - commonTail; index++) {
      result[INSERT_PREFIX + INDEX_PREFIX + index] = [array2[index]];
    }
    context.setResult(result).exit();
    return;
  }
  if (commonHead + commonTail === len2) {
    // trivial case, a block (1 or more consecutive items) was removed
    result = result || {
      _t: 'a'
    };
    for (index = commonHead; index < len1 - commonTail; index++) {
      hashKey = hashOrIndex(array1[index], index, matchContext);
      result[REMOVE_PREFIX + hashKey] = [array1[index], index, 0, ARRAY_REMOVE];
    }
    context.setResult(result).exit();
    return;
  }
  // reset hash cache
  delete matchContext.hashCache1;
  delete matchContext.hashCache2;

  // diff is not trivial, find the LCS (Longest Common Subsequence)
  var trimmed1 = array1.slice(commonHead, len1 - commonTail);
  var trimmed2 = array2.slice(commonHead, len2 - commonTail);
  var seq = lcs.get(
    trimmed1, trimmed2,
    matchItems,
    matchContext
  );
  var removedItems = [];
  result = result || {
    _t: 'a'
  };
  for (index = commonHead; index < len1 - commonTail; index++) {
    if (arrayIndexOf(seq.indices1, index - commonHead) < 0) {
      // removed
      hashKey = hashOrIndex(array1[index], index, matchContext);
      result[REMOVE_PREFIX + hashKey] = [array1[index], index, 0, ARRAY_REMOVE];
      removedItems.push(index);
    }
  }

  var detectMove = true;
  if (context.options && context.options.arrays && context.options.arrays.detectMove === false) {
    detectMove = false;
  }
  var includeValueOnMove = false;
  if (context.options && context.options.arrays && context.options.arrays.includeValueOnMove) {
    includeValueOnMove = true;
  }

  var removedItemsLength = removedItems.length;
  for (index = commonHead; index < len2 - commonTail; index++) {
    var indexOnArray2 = arrayIndexOf(seq.indices2, index - commonHead);
    if (indexOnArray2 < 0) {
      // added, try to match with a removed item and register as position move
      var isMove = false;
      if (detectMove && removedItemsLength > 0) {
        for (var removeItemIndex1 = 0; removeItemIndex1 < removedItemsLength; removeItemIndex1++) {
          index1 = removedItems[removeItemIndex1];
          if (matchItems(trimmed1, trimmed2, index1 - commonHead,
            index - commonHead, matchContext)) {
            hashKey = hashOrIndex(array1[index1], index1, matchContext);
            // store position move as: [originalValue, originalPosition, newPosition, ARRAY_MOVE]
            result[REMOVE_PREFIX + hashKey].splice(1, 3, index1, index, ARRAY_MOVE);
            if (!includeValueOnMove) {
              // don't include moved value on diff, to save bytes
              result[REMOVE_PREFIX + hashKey][0] = '';
            }

            index2 = index;
            child = new context.constructor(context.left[index1], context.right[index2]);
            context.push(child, MODIFY_PREFIX + hashKey);
            removedItems.splice(removeItemIndex1, 1);
            isMove = true;
            break;
          }
        }
      }
      if (!isMove) {
        // added
        result[INSERT_PREFIX + INDEX_PREFIX + index] = [array2[index]];
      }
    } else {
      // match, do inner diff
      index1 = seq.indices1[indexOnArray2] + commonHead;
      index2 = seq.indices2[indexOnArray2] + commonHead;
      child = new context.constructor(context.left[index1], context.right[index2]);
      hashKey = hashOrIndex(array2[index2], index2, matchContext);
      context.push(child, MODIFY_PREFIX + hashKey);
    }
  }

  context.setResult(result).exit();

};
diffFilter.filterName = 'arrays';

var compare = {
  numerically: function(a, b) {
    return a - b;
  },
  numericallyBy: function(name) {
    return function(a, b) {
      return a[name] - b[name];
    };
  }
};

var patchFilter = function nestedPatchFilter(context) {
  if (!context.nested) {
    return;
  }
  if (context.delta._t !== 'a') {
    return;
  }
  var index;

  var delta = context.delta;
  var array = context.left;

  var matchContext = {
    objectHash: context.options && context.options.objectHash,
  };

  // first, separate removals, insertions and modifications
  var toRemove = {};
  var toInsert = [];
  var toModify = {};
  for (index in delta) {
    if (index !== '_t') {
      if (index[0] === REMOVE_PREFIX) {
        // removed item from original array
        if (delta[index][3] === ARRAY_REMOVE || delta[index][3] === ARRAY_MOVE) {
          toRemove[index.slice(1)] = true;
        } else {
          throw new Error('only removal or move can be applied at original array indices' +
            ', invalid diff type: ' + delta[index][3]);
        }
      } else {
        if (index[0] === INSERT_PREFIX) {
          // added item at new array
          toInsert.push({
            index: parseInt(index.slice(2), 10),
            value: delta[index][0]
          });
        } else if (index[0] === MODIFY_PREFIX){
          // modified item at new array
          toModify[index.slice(1)] = delta[index];
        }
      }
    }
  }

  // remove items, by key
  var hashKey;
  var indexDiff;
  var toRemoveIndexes = [];
  for (index = 0; index < array.length; index++) {
    hashKey = hashOrIndex(array[index], index, matchContext);
    if (toRemove[hashKey]) {
      toRemoveIndexes.push(index);
      indexDiff = delta[REMOVE_PREFIX + hashKey];
      if (indexDiff[3] === ARRAY_MOVE) {
        // reinsert later
        toInsert.push({
          index: indexDiff[2],
          value: array[index]
        });
      }
      continue;
    }
  }

  // remove items, in reverse order to avoid sawing our own floor
  toRemoveIndexes = toRemoveIndexes.sort(compare.numerically);
  for (index = toRemoveIndexes.length - 1; index >= 0; index--) {
    array.splice(toRemoveIndexes[index], 1);
  }

  // insert items, in reverse order to avoid moving our own floor
  toInsert = toInsert.sort(compare.numericallyBy('index'));
  var toInsertLength = toInsert.length;
  for (index = 0; index < toInsertLength; index++) {
    var insertion = toInsert[index];
    array.splice(insertion.index, 0, insertion.value);
  }

  // apply modifications
  var keysToModify = Object.keys(toModify);
  var toModifyLength = keysToModify.length;
  for (var j = 0; toModifyLength && j < array.length; j++) {
    hashKey = hashOrIndex(array[j], j, matchContext);
    if (toModify[hashKey]) {
      var child = new context.constructor(context.left[j], toModify[hashKey]);
      context.push(child, j);
    }
  }

  if (!context.children) {
    context.setResult(context.left).exit();
    return;
  }
  context.exit();
};
patchFilter.filterName = 'arrays';

var collectChildrenPatchFilter = function collectChildrenPatchFilter(context) {
  if (!context || !context.children) {
    return;
  }
  if (context.delta._t !== 'a') {
    return;
  }
  var length = context.children.length;
  var child;
  for (var index = 0; index < length; index++) {
    child = context.children[index];
    context.left[child.childName] = child.result;
  }
  context.setResult(context.left).exit();
};
collectChildrenPatchFilter.filterName = 'arraysCollectChildren';

var reverseFilter = function arraysReverseFilter(context) {
  if (!context.nested || context.delta._t !== 'a') {
    return;
  }
  var name, child;
  for (name in context.delta) {
    if (name === '_t') {
      continue;
    }
    child = new context.constructor(context.delta[name]);
    context.push(child, name);
  }
  context.exit();
};
reverseFilter.filterName = 'arrays';

var reverseArrayDeltaIndex = function(delta, index, itemDelta) {
  // We neednt worry about hash indexes here
  if (index[1] === HASH_PREFIX) {
    return index;
  }

  // Return a new index based on sequences of moves, inserts, and removes
  var reverseIndex = +index.slice(2);
  for (var deltaIndex in delta) {
    var deltaItem = delta[deltaIndex];
    if (isArray(deltaItem)) {
      // Handle moves
      if (deltaItem[3] === ARRAY_MOVE) {
        var moveFromIndex = deltaItem[1];
        var moveToIndex = deltaItem[2];
        if (moveToIndex === +index) {
          return moveFromIndex;
        }
        if (moveFromIndex <= reverseIndex && moveToIndex > reverseIndex) {
          reverseIndex++;
        } else if (moveFromIndex >= reverseIndex && moveToIndex < reverseIndex) {
          reverseIndex--;
        }
      // Handle removals
      } else if (deltaItem[3] === ARRAY_REMOVE) {
        var deleteIndex = deltaItem[1];
        if (deleteIndex <= reverseIndex) {
          reverseIndex++;
        }
      // Handle inserts
      } else if (deltaItem.length === 1 && deltaIndex <= reverseIndex) {
        reverseIndex--;
      }
    }
  }

  return index[0] + INDEX_PREFIX + reverseIndex;
};

/**
 * Reverse for arrays is a little bit tricky. We have two main filters–
 * collectChildrenReverseFilter and reverseFilter–where collect is one of the
 * first filters to run in the pipe, and reverse is one of the last filters to
 * run.
 *
 * In the default jsondiffpatch arrays implementation, the key of the array
 * delta object for a removal/move represents the old index of the item. However,
 * in this implementation we want to use the key to track the objectHash of the
 * item, so we need to figure out another place to store old index information.
 *
 * To do so we change the remove/move array structure to support four elements
 * instead of three:
 * [ value, oldIndex, newIndex, remove/move flag ]  (we added oldIndex)
 *
 * However, this caused an issue where array removals were first being processed
 * by trivialReverseFilter – which still uses the three-item array syntax. To
 * work around this, we move processing of array child elements into the collect
 * filter since it is one of the first filters to run and we can intercept a
 * change before its handled by trivialFilter
 *
 * So in practice, here is how an array is processed in these filters
 *
 * 1. collectChildrenReverseFilter
 *   Receives array but children haven't been processed yet, so it's ignored
 * 2. reverseFilter
 *   Receives array, iterates over child keys and pushes them onto context children
 * 3. collectChildrenReverseFilter
 *   Executed for each child, we reverse each child delta
 *   (except for modify, which can still be handled by trivialReverseFilter)
 * 4. collectChildrenReverseFilter
 *   Receives array again, fix array keys if necessary and mark array as complete
 */
var collectChildrenReverseFilter = function collectChildrenReverseFilter(context) {
  if (!context) {
    return;
  }
  var matchContext = {
    objectHash: context.options && context.options.objectHash,
  };

  // Handle array element children (see function description)
  if (context.parent && context.parent.delta && context.parent.delta._t === 'a') {

    // Change inserts to removals
    if (context.childName[0] === INSERT_PREFIX) {
      var oldindex = parseInt(context.childName.slice(2), 10);
      context.newName = REMOVE_PREFIX + hashOrIndex(context.delta[0], oldindex, matchContext);
      context.setResult([context.delta[0], oldindex, 0, ARRAY_REMOVE]).exit();
      return;
    }

    // Handle move/remove
    if (context.childName[0] === REMOVE_PREFIX) {
      // If it was originally a move, reverse the move
      if (context.delta[3] === ARRAY_MOVE) {
        if (context.childName[1] === HASH_PREFIX) {
          // Continue using hash for new name
          context.newName = context.childName;
        } else {
          // Use index for new name
          context.newName = REMOVE_PREFIX + INDEX_PREFIX + context.delta[2];
        }
        context.setResult([
          context.delta[0],
          context.delta[2],
          context.delta[1],
          ARRAY_MOVE
        ]).exit();
        return;
      }

      // If it was originally a removal, change to an insert
      if (context.delta[3] === ARRAY_REMOVE) {
        context.newName = INSERT_PREFIX + INDEX_PREFIX + context.delta[1];
        context.setResult([context.delta[0]]).exit();
        return;
      }
    }

    // If it was originally a MODIFY, let the "trivialReverseFilter" handle it
    if (context.childName[0] === MODIFY_PREFIX) {
      return;
    }

    return;
  }

  // Handle processed array (see function description)
  if (context.children && context.delta._t === 'a') {
    var length = context.children.length;
    var child;
    var delta = {
      _t: 'a'
    };

    for (var index = 0; index < length; index++) {
      child = context.children[index];
      // Assign new name/index for child if not already assigned
      var name = child.newName;
      if (typeof name === 'undefined') {
        name = reverseArrayDeltaIndex(context.delta, child.childName, child.result);
      }
      if (delta[name] !== child.result) {
        delta[name] = child.result;
      }
    }
    context.setResult(delta).exit();
  }
};
collectChildrenReverseFilter.filterName = 'arraysCollectChildren';

export default {
	diffFilter,
	patchFilter,
	collectChildrenPatchFilter,
	reverseFilter,
	collectChildrenReverseFilter,
};
