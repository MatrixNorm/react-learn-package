/**
 * @flow
 */

import type { Fiber, FiberRoot } from 'react-reconciler/src/ReactInternalTypes';
import { fiberInfoShort } from './print'

function __getAllChildrenOfFiber(fiber: Fiber): Fiber[] {
  let children = [];
  let child = fiber.child;
  while (child) {
    children.push(child);
    child = child.sibling;
  }
  return children;
}

export const fiberTreeToObject = (node: Fiber): Object => {
  let { child: firstChild } = node;
  if (firstChild) {
    let children = __getAllChildrenOfFiber(node);
    return { [fiberInfoShort(node)]: children.map(fiberTreeToObject) };
  } else {
    return fiberInfoShort(node);
  }
};

export function fiberTreeToXMLv1(wipHostRoot: Fiber, curHostRoot: Fiber | null = null): string {
  const tab = " ".repeat(2);
  // how deep from the root tree is traversed
  let depth = 0;

  function __doWorkRecur(node: Fiber): string {
    const children = __getAllChildrenOfFiber(node);
    const padding = tab.repeat(depth);
    const fibInfo = fiberInfoShort(node);

    let result = '';
    if (children.length === 0) {
      // leaf node
      result += `${padding}<${fibInfo} />\n`;
    } else {
      result += `${padding}<${fibInfo}>\n`;
      depth++;
      for (let kid of children) {
        result += __doWorkRecur(kid);
      }
      depth--;
      result += `${padding}</${fibInfo}>\n`;
    }
    return result;
  }

  function __doWorkRecur2(node: Fiber, curNodesSet: Set<Fiber>): string {
    const children = __getAllChildrenOfFiber(node);
    const padding = tab.repeat(depth);
    const fibInfo = fiberInfoShort(node);
    const hasThisNodeInCurTree = curNodesSet.has(node);
    const prefix = hasThisNodeInCurTree ? '!!' : '';
    const recurTo = hasThisNodeInCurTree ?
      __doWorkRecur :
      (kid: Fiber) => __doWorkRecur2(kid, curNodesSet);

    let result = '';
    if (children.length === 0) {
      result += `${padding}${prefix}<${fibInfo} />\n`;
    } else {
      result += `${padding}${prefix}<${fibInfo}>\n`;
      depth++;
      for (let kid of children) {
        result += recurTo(kid);
      }
      depth--;
      result += `${padding}${prefix}</${fibInfo}>\n`;
    }
    return result;
  }

  function putFiberTreeNodesInSet(rootNode: Fiber, resultSet: Set<Fiber>): void {
    resultSet.add(rootNode);
    const children = __getAllChildrenOfFiber(rootNode);
    for (let kid of children) {
      putFiberTreeNodesInSet(kid, resultSet);
    }
  }

  if (curHostRoot) {
    let curNodesSet = new Set < Fiber > ();
    putFiberTreeNodesInSet(curHostRoot, curNodesSet);
    return __doWorkRecur2(wipHostRoot, curNodesSet)
  } else {
    return __doWorkRecur(wipHostRoot);
  }
};

export function fiberTreeToXMLv2(wipHostRoot: Fiber, curHostRoot: Fiber | null = null): string {
  const tab = " ".repeat(2);
  // how deep from the root tree is traversed
  let depth = 0;

  function __doWorkRecur(node: Fiber, curNodesSet: Set<Fiber> | null = null): string {
    const children = __getAllChildrenOfFiber(node);
    const padding = tab.repeat(depth);
    const fibInfo = fiberInfoShort(node);
    const hasThisNodeInCurTree = curNodesSet !== null && curNodesSet.has(node);
    const prefix = hasThisNodeInCurTree ? '!!' : '';
    const recurTo = hasThisNodeInCurTree ?
      __doWorkRecur :
      (kid: Fiber) => __doWorkRecur(kid, curNodesSet);

    let result = '';
    if (children.length === 0) {
      result += `${padding}${prefix}<${fibInfo} />\n`;
    } else {
      result += `${padding}${prefix}<${fibInfo}>\n`;
      depth++;
      for (let kid of children) {
        result += recurTo(kid);
      }
      depth--;
      result += `${padding}${prefix}</${fibInfo}>\n`;
    }
    return result;
  }

  function putFiberTreeNodesInSet(rootNode: Fiber, resultSet: Set<Fiber>): void {
    resultSet.add(rootNode);
    const children = __getAllChildrenOfFiber(rootNode);
    for (let kid of children) {
      putFiberTreeNodesInSet(kid, resultSet);
    }
  }

  if (curHostRoot) {
    let curNodesSet = new Set < Fiber > ();
    putFiberTreeNodesInSet(curHostRoot, curNodesSet);
    return __doWorkRecur(wipHostRoot, curNodesSet)
  } else {
    return __doWorkRecur(wipHostRoot);
  }
};

export function fiberTreeToXMLv3(wipHostRoot: Fiber, curHostRoot: Fiber | null = null): string {

  const tab = " ".repeat(2);

  function __doWorkRecur(node: Fiber, depth: number, curNodesSet: Set<Fiber> | null = null): string {
    const children = __getAllChildrenOfFiber(node);
    const padding = tab.repeat(depth);
    const fibInfo = fiberInfoShort(node);
    const hasThisNodeInCurTree = curNodesSet !== null && curNodesSet.has(node);
    const prefix = hasThisNodeInCurTree ? '!!' : '';
    const recurTo = hasThisNodeInCurTree ?
      (kid: Fiber) => __doWorkRecur(kid, depth + 1) :
      (kid: Fiber) => __doWorkRecur(kid, depth + 1, curNodesSet);

    let result = '';
    if (children.length === 0) {
      result += `${padding}${prefix}<${fibInfo} />\n`;
    } else {
      result += `${padding}${prefix}<${fibInfo}>\n`;
      for (let kid of children) {
        result += recurTo(kid);
      }
      result += `${padding}${prefix}</${fibInfo}>\n`;
    }
    return result;
  }

  function putFiberTreeNodesInSet(rootNode: Fiber, resultSet: Set<Fiber>): void {
    resultSet.add(rootNode);
    const children = __getAllChildrenOfFiber(rootNode);
    for (let kid of children) {
      putFiberTreeNodesInSet(kid, resultSet);
    }
  }

  if (curHostRoot) {
    let curNodesSet = new Set < Fiber > ();
    putFiberTreeNodesInSet(curHostRoot, curNodesSet);
    return __doWorkRecur(wipHostRoot, 0, curNodesSet)
  } else {
    return __doWorkRecur(wipHostRoot, 0);
  }
};