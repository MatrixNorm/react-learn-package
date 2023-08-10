/**
 * @flow
 */

import type { Fiber, FiberRoot } from 'react-reconciler/src/ReactInternalTypes';
import { fiberInfoShort } from './print'
import { node } from 'prop-types';

/*
a
|
b -- c -- - -- d -- p
     |         |    |
     e -- f    k    t
          |
          m
*/

export function fiberTreeToXMLv1(startNode: Fiber): string {
  const tab = " ".repeat(2);
  let depth = 0;

  function __doWorkRecur(node: Fiber): string {
    const padding = tab.repeat(depth);
    const fibInfo = fiberInfoShort(node);

    let result = '';
    if (node.child) {
      result += `${padding}<${fibInfo}>\n`;
      depth++;
      result += __doWorkRecur(node.child);
      depth--;
      result += `${padding}</${fibInfo}>\n`;
    } else {
      result = `${padding}<${fibInfo} />\n`;
    }
    // XXX tail recursion
    if (node.sibling) {
      result += __doWorkRecur(node.sibling);
    }
    return result;
  }

  return __doWorkRecur(startNode);
}

export function fiberTreeToXMLv2(startNode: Fiber): string {
  const tab = " ".repeat(2);
  let depth = 0;

  function __doWorkRecur(node: Fiber): string {
    let result = '';
    while(node) {
      let padding = tab.repeat(depth);
      let fibInfo = fiberInfoShort(node);

      if (node.child) {
        result += `${padding}<${fibInfo}>\n`;
        depth++;
        result += __doWorkRecur(node.child);
        depth--;
        result += `${padding}</${fibInfo}>\n`;
      } else {
        result += `${padding}<${fibInfo} />\n`;
      }
      if (node.sibling) {
        node = node.sibling;
      } else {
        break;
      }
    }
    return result;
  }

  return __doWorkRecur(startNode);
}

export function fiberTreeToXMLv3(startNode: Fiber): string {
  const tab = " ".repeat(2);

  function __doWorkRecur(node: Fiber, depth: number): string {
    let result = '';
    while(node) {
      let padding = tab.repeat(depth);
      let fibInfo = fiberInfoShort(node);

      if (node.child) {
        result += `${padding}<${fibInfo}>\n`;
        result += __doWorkRecur(node.child, depth + 1);
        result += `${padding}</${fibInfo}>\n`;
      } else {
        result += `${padding}<${fibInfo} />\n`;
      }
      if (node.sibling) {
        node = node.sibling;
      } else {
        break;
      }
    }
    return result;
  }

  return __doWorkRecur(startNode, 0);
}

type NodeVisitContext =
  {type: "arrive", meta: "child" | "sibling"} |
  {type: "return"};

export function fiberTreeToXMLv4(startNode: Fiber): string {
  const tab = " ".repeat(2);
  const pad = (depth: number) => tab.repeat(depth);
  
  let node: Fiber | null = startNode;
  let context: NodeVisitContext = {type: "arrive", meta: "child"};
  let depth = -1;
  let result = '';

  while (node) {
    let fibInfo = fiberInfoShort(node);

    if (context.type === "arrive") {
      if (context.meta === "child") {
        depth++;
      }
      if (node.child) {
        result += `${pad(depth)}<${fibInfo}>\n`;
        [context, node] = [{type: "arrive", meta: "child"}, node.child]
      } else {
        result += `${pad(depth)}<${fibInfo} />\n`;
        if (node.sibling) {
          [context, node] = [{type: "arrive", meta: "sibling"}, node.sibling];
        } else {
          [context, node] = [{type: "return"}, node.return];
        }
      }
    } else if (context.type === "return") {
      depth--;
      result += `${pad(depth)}</${fibInfo}>\n`;
      if (node.sibling) {
        [context, node] = [{type: "arrive", meta: "sibling"}, node.sibling];
      } else {
        [context, node] = [{type: "return"}, node.return];
      }
    } else {
      throw "This is bug";
    }
  }
  return result;
}