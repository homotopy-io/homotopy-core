import { _assert, _debug, _validate, isNatural, isInteger, _propertylist } from "~/util/debug";
import { DirectedQuotientGraph } from "~/util/quotient-graph";
import * as ArrayUtil from "~/util/array";

export class Monotone extends Array {

  constructor(target_size, values) {
    super();
    for (let i = 0; i < values.length; i++) {
      this[i] = values[i];
    }
    this.target_size = target_size;
    _validate(this);
  }

  validate() {
    if (!_debug) return;
    if (_debug) _assert(isNatural(this.target_size));
    for (let i = 0; i < this.length; i++) {
      if (_debug) _assert(isNatural(this[i]));
      if (i > 0) _assert(this[i - 1] <= this[i]);
    }
    if (this.length > 0) _assert(this.target_size > this[this.length - 1]);
  }

  static getIdentity(n) {
    let m = new Monotone(0, []);
    for (let i = 0; i < n; i++) {
      m.grow();
    }
    return m;
  }

  applyAdjusted(height) {
    if (_debug) {
      _assert(isInteger(height));
      _assert(height >= -1);
      _assert(height <= this.length);
    }
    if (height == -1) return -1;
    if (height == this.length) {
      return this.target_size;
    } else {
      return this[height];
    }
  }

  grow() {
    this.push(this.target_size);
    this.target_size++;
  }

  append(value) {
    this.push(value);
    this.target_size = value + 1;
  }

  compose(second) {
    if (_debug) _assert(second instanceof Monotone);
    let copy_second = second.copy();
    copy_second.target_size = this.target_size;
    for (let i = 0; i < second.length; i++) {
      copy_second[i] = this[second[i]];
    }
    return copy_second;
  }

  equals(second, n) {
    if (n == null) n = this.length;
    let first = this;
    if (first.length != second.length) return false;
    if (first.target_size != second.target_size) return false;
    for (let i = 0; i < n; i++) {
      if (first[i] != second[i]) return false;
    }
    return true;
  }

  imageComplement() {
    let n = 0;
    let complement = [];
    for (let i = 0; i < this.target_size; i++) {
      if (n == this.length || this[n] > i) complement.push(i);
      else n++;
    }
    return complement;
  }

  static union(first, second, swap) {
    let i1_array = [];
    for (let i = 0; i < first; i++) i1_array.push(i);
    let i2_array = [];
    for (let i = 0; i < second; i++) i2_array.push(first + i);
    let data = {
      first: new Monotone(first + second, i1_array),
      second: new Monotone(first + second, i2_array)
    };
    if (swap) return {
      first: data.second,
      second: data.first
    };
    return data;
  }

  copy() {
    let m = new Monotone(this.target_size, []);
    for (let i = 0; i < this.length; i++) m[i] = this[i];
    return m;
  }

  getFirstPreimage(value) {
    for (let i = 0; i < this.length; i++) {
      if (this[i] == value) return i;
    }
    return null;
  }

  getLastPreimage(value) {
    for (let i = this.length - 1; i >= 0; i--) {
      if (this[i] == value) return i;
    }
    return null;
  }

  preimage(value) {
    if (!isNatural(value)) {
      _propertylist(value, ["first", "last"]);
    }
    let min, max;
    if (isNatural(value)) {
      min = value;
      max = value + 1;
    } else {
      min = value.first;
      max = value.last;
    }
    let first = null;
    let last = null;
    let pos = 0;
    while (this[pos] < min) pos++;
    first = pos;
    while (pos < this.length && this[pos] < max) pos++;
    last = pos;
    return { first, last };
  }

  static identity(n) {
    if (_debug) _assert(isNatural(n));
    let arr = [];
    for (let i = 0; i < n; i++) {
      arr.push(i);
    }
    return new Monotone(n, arr);
  }

  // Buid a collapsing monotone that identifies the elements first and last
  static getCollapseMonotone(target_size, a, b) {
    if (a == b) return Monotone.getIdentity(target_size);
    let first = Math.min(a, b);
    let last = Math.max(a, b);
    let arr = [];
    for (let i = 0; i < first; i++) {
      arr.push(i);
    }
    for (let i = first; i <= last; i++) {
      arr.push(first);
    }
    for (let i = last + 1; i < target_size; i++) {
      arr.push(i - last + first);
    }
    return new Monotone(target_size - last + first, arr);
  }

  static pullbackFactorize(pullback, f, g) {
    if (_debug) _assert(f.length == g.length);
    if (_debug) _assert(pullback);
    if (_debug) _assert(pullback.left);
    if (_debug) _assert(pullback.right);
    if (_debug) _assert(pullback.left.length == pullback.right.length);
    let factorization = [];
    let p = 0;
    for (let i=0; i<f.length; i++) {
      while (pullback.left[p] != f[i] || pullback.right[p] != g[i]) {
        p ++;
        if (p >= pullback.left.length) return null;
        if (pullback.left[p] > f[i]) return null;
        if (pullback.right[p] > g[i]) return null;
      }
      factorization.push(p);
    }
    return new Monotone(pullback.left.length, factorization);
  }

  // If this monotone represents the forward function of singular levels,
  // build the 'adjoint', which represents the backward function of regular levels
  getAdjoint() {
    let regular = [];
    let level = 0;
    for (let i=0; i<=this.target_size; i++) {
      while (level < this.length && this[level] < i) {
        level ++;
      }
      regular.push(level);
    }
    return new Monotone(this.length + 1, regular);
  }

  static multiUnify({ lower, upper }) {
    // Build a graph from unions of the upper monotones
    let g = new DirectedQuotientGraph();
    let upper_elements = [];

    for (let { size, bias } of upper) {
      upper_elements.push(g.addLinearGraph(ArrayUtil.init(size, () => +bias)));
    }

    // Quotient by the data of the lower monotones
    for (let { left, right } of lower) {
      if (_debug) _assert(left.monotone.length == right.monotone.length);
      for (let j = 0; j < left.monotone.length; j++) {
        let left_label = upper_elements[left.target][left.monotone[j]];
        let right_label = upper_elements[right.target][right.monotone[j]];
        g.quotient(left_label, right_label, Math.min);
      }
    }

    // Get the resulting linear order
    let order = g.linearize(id => g.getValue(id), Math.min);
    let positions = new Map();

    for (let i = 0; i < order.length; i++) {
      positions.set(order[i], i);
    }

    // Build the cocones, which should be monotones
    let monotones = [];

    for (let i = 0; i < upper.length; i++) {
      let arr = [];
      for (let j = 0; j < upper[i].size; j++) {
        arr.push(positions.get(g.findId(upper_elements[i][j])));
      }
      monotones.push(new Monotone(order.length, arr));
    }

    // Return the cocone maps
    return monotones;
  }

}
