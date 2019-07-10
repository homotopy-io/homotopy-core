import * as Match from "~/matches";
import { _assert, _debug } from "~/util/debug";

/**
 * @param {Diagram} diagram
 * @param {number[]} point The point in geometric coordinates.
 */
export const getPath = (diagram, point) => {
  if (point.length == 0 /*diagram.n == 0*/) {
    return {
      boundary: null,
      depth: null,
      point: point
    };
  }

  if (_debug) _assert(point.length > 0);

  let [height, ...rest] = point;

  let adj_height = Math.max(0, height);
  adj_height = Math.min(diagram.data.length * 2, adj_height);

  // Obtain the path in the slice diagram.
  let path = getPath(diagram.getSlice(adj_height), rest);

  // Increase the boundary depth
  if (path.boundary) {
    path.depth += 1;
    return path;
  }

  // On the interior in the slice, on the target boundary here.
  if (height > diagram.data.length * 2) {
    path.depth = 1;
    path.boundary = "target";
    return path;
  }

  // On the interior in the slice, on the source boundary here.
  if (height < 0) {
    path.depth = 1;
    path.boundary = "source";
    return path;
  }

  // On the interior both in the slice and here.
  return {
    boundary: null,
    depth: null,
    point: point
  };
};

export const followPath = (diagram, path) => {
  if (path.boundary != null) {
    for (let i = 0; i < path.depth - 1; i++) {
      diagram = diagram.source;
    }

    diagram = path.boundary == "source" ? diagram.source : diagram.target;
  }

  return diagram;
};

export const containsPoint = (diagram, point, path, subdiagram) => {
  if (diagram.n == 0) {
    return true;
  } else if (point.length == 0) {
    return true;
  }

  let [height, ...rest] = point;

  if (path.depth == 1) {
    if (path.boundary == "source" && height > 0) {
      return false;
    } else if (path.boundary == "target" && height < diagram.data.length * 2) {
      return false;
    }

    let slice = path.boundary == "source" ? diagram.source : diagram.target;
    return containsPoint(slice, rest, {
      ...path,
      boundary: null,
      depth: null,
    }, subdiagram);
  }

  if (path.boundary && path.depth > 1) {
    //let slice = path.boundary == 'source' ? diagram.source : diagram.getTarget();
    let slice = height <= 0 ? diagram.source : diagram.getTarget();
    return containsPoint(slice, rest, {
      ...path,
      depth: path.depth - 1
    }, subdiagram);
  }

  return Match.containsPoint(subdiagram, path.point.map(x => Math.floor(x / 2)), point);
};

export const shiftPath = (path, depth) => {
  if (depth <= 0) {
    return path;
  }

  if (path.depth == 1) {
    return shiftPath({
      boundary: null,
      depth: null,
      point: path.point
    }, depth - 1); 
  }

  if (path.boundary && path.depth > 1) {
    return shiftPath({
      boundary: path.boundary,
      depth: path.depth - 1,
      point: path.point
    }, depth - 1);
  }

  return {
    boundary: null,
    depth: null,
    point: path.point.slice(depth)
  };
};