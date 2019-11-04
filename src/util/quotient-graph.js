import UnionFind from "union-find";
import * as ArrayUtil from "~/util/array";

export class DirectedQuotientGraph {
  constructor() {
    this.nodes = new Map();
    this.aliases = new UnionFind(0);
  }

  /**
   * Add a new node to the graph and tags it with the specified value. Then
   * return the id of the newly created node.
   */
  addNode(value) {
    const id = this.aliases.makeSet();
    const node = { value, successors: [] };
    this.nodes.set(id, node);
    return id;
  }

  /**
   * Add a directed edge between the nodes with the given ids.
   */
  addEdge(source, target) {
    const sourceNode = this.nodes.get(this.aliases.find(source));
    sourceNode.successors.push(this.aliases.find(target));
  }

  /**
   * Add new nodes to the graph tagged with each given value and linearly
   * connect them with directed edges. Then return an array containing the
   * ids of the newly created nodes.
   */
  addLinearGraph(values) {
    const ids = values.map(value => this.addNode(value));

    for (let [s, t] of ArrayUtil.consecutive(ids)) {
      this.addEdge(s, t);
    }

    return ids;
  }

  quotient(a, b, merge) {
    a = this.aliases.find(a);
    b = this.aliases.find(b);

    if (a != b) {
      this.aliases.link(a, b);

      const aNode = this.nodes.get(a);
      const bNode = this.nodes.get(b);

      if (a == this.aliases.find(a)) {
        aNode.value = merge(aNode.value, bNode.value);
        aNode.successors.push(...bNode.successors);
        this.nodes.delete(b);
      } else {
        bNode.value = merge(bNode.value, aNode.value);
        bNode.successors.push(...aNode.successors);
        this.nodes.delete(a);
      }
    }
  }

  nodes() {
    return this.nodes.keys();
  }

  successors(id) {
    id = this.aliases.find(id);
    const node = this.nodes.get(id);
    const successors = new Set();

    for (const successor of node.successors) {
      successors.add(this.aliases.find(successor));
    }

    successors.delete(id);
    node.successors = [...successors];
    return [...successors];
  }

  getValue(id) {
    return this.nodes.get(this.aliases.find(id)).value;
  }

  findId(id) {
    return this.aliases.find(id);
  }

  /**
   * The number of nodes in the graph.
   */
  get size() {
    return this.nodes.size;
  }

  /**
   * Determine the strongly connected components of the graph.
   * Returns an array of arrays of node ids in reverse topological order.
   */
  getSCCs() {
    // Tarjan's algorithm for SCCs.
    let nextIndex = 0;
    const index = new Map();
    const lowlink = new Map();
    const onstack = new Set();
    const stack = [];
    const components = [];

    const visit = (v) => {
      index.set(v, nextIndex);
      lowlink.set(v, nextIndex);
      onstack.add(v);
      nextIndex += 1;
      stack.push(v);

      for (const w of this.successors(v)) {
        if (!index.has(w)) {
          visit(w);
          lowlink.set(v, Math.min(lowlink.get(v), lowlink.get(w)));
        } else if (onstack.has(w)) {
          lowlink.set(v, Math.min(lowlink.get(v), index.get(w)));
        }
      }

      if (lowlink.get(v) == index.get(v)) {
        const component = [];
        let w = null;

        do {
          w = stack.pop();
          onstack.delete(w);
          component.push(w);
        } while (w != v);

        components.push(component);
      }
    };

    for (const v of this.nodes.keys()) {
      if (!index.has(v)) {
        visit(v);
      }
    }

    return components;
  }

  /**
   * Attempt to convert the graph into a union of linear orders.  On success,
   * an array of node ids is returned in the order determined by the graph as
   * biases.  When the linearization is ambiguous, a `LinearizationError` is
   * thrown.
   *
   * The function `biasFunc` determines an integer bias from a node id that is
   * used to break ties: the node with the smaller bias comes first in the
   * linear order when there is no order relation enforced by edges.
   *
   * The function `mergeFunc` is used to merge the values of nodes in the
   * same strongly connected component when they are merged into one node.
   */
  linearize(biasFunc, mergeFunc) {
    const sccs = this.getSCCs();
    const depths = new Map();
    const roots = new Set();
    const nodes = [];

    const addDirectSuccessors = direct => {
      direct.sort((a, b) => biasFunc(b) - biasFunc(a));

      for (const [a, b] of ArrayUtil.consecutive(direct)) {
        if (biasFunc(a) == biasFunc(b)) {
          throw new LinearizationError("The graph has an ambiguous linearization.");
        }
      }

      nodes.push(...direct);
    };

    for (const scc of sccs) {
      const id = scc.reduce((a, b) => {
        this.quotient(a, b, mergeFunc);
        return a;
      });

      // Set depth of current node
      let depth = 0;

      for (const successor of this.successors(id)) {
        depth = Math.max(depth, depths.get(successor) + 1);
        roots.delete(successor);
      }

      depths.set(id, depth);
      roots.add(id);

      // Push direct successors
      const direct = this.successors(id).filter(s => depths.get(s) + 1 == depth);
      addDirectSuccessors(direct);
    }

    // Finally add roots
    addDirectSuccessors([...roots]);

    // Reverse nodes
    return ArrayUtil.reverse(nodes);
  }

  /**
   * Convert this graph into the GraphViz dot format for debugging.
   */
  toDot(attrFunc) {
    let output = "digraph {";

    for (const id of this.nodes.keys()) {
      output += `  ${id} [${attrFunc(id)}];\n`;

      for (const successor of this.successors(id)) {
        output += `  ${id} -> ${successor};\n`;
      }
    }

    output += "}";
    return output;
  }

}

export class LinearizationError extends Error {
  constructor(message) {
    super(message);
  }
}
