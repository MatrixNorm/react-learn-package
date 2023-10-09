/**
 * @flow
 */

import type { Fiber, FiberRoot } from 'react-reconciler/src/ReactInternalTypes';
import { fiberInfoShort } from './print'

export * from './print';
export { fiberTreeToXMLv2 as fiberTreeToXML } from './fiberTree';
export { fiberTreeToXMLv4 as fiberTreeToXML2 } from './fiberTree2';

type Phase = "enter" | "leave" | "leaf";
type FiberTreeGenerator = Generator<[Phase, Fiber], void, void>

function* iterFiberTree(node: Fiber): FiberTreeGenerator {
  if (node.child) {
    yield ["enter", node];
    yield* iterFiberTree(node.child);
    yield ["leave", node];
  } else {
    yield ["leaf", node];
  }
  if (node.sibling) {
    yield* iterFiberTree(node.sibling);
  }
}

function* iterFiberTreeX(node: Fiber): FiberTreeGenerator {
  if (node.child) {
    yield ["enter", node];
    for (let res of iterFiberTreeX(node.child)) {
      yield res;
    }
    yield ["leave", node];
  } else {
    yield ["leaf", node];
  }
  if (node.sibling) {
    for (let res of iterFiberTreeX(node.sibling)) {
      yield res;
    }
  }
}

function* iterFiberTreeY(node: Fiber): FiberTreeGenerator {
  while (node) {
    if (node.child) {
      yield ["enter", node];
      for (let res of iterFiberTreeY(node.child)) {
        yield res;
      }
      yield ["leave", node];
    } else {
      yield ["leaf", node];
    }

    if (node.sibling) {
      node = node.sibling;
    } else {
      break;
    }
  };
}

const fiberTreeToXMLWithGenerator = (generator: Fiber => FiberTreeGenerator) => (startNode: Fiber): string => {
  const tab = "  ";
  let result = "";
  let d = -1;

  for (let [phase, fiber] of generator(startNode)) {
    const fibInfo = fiberInfoShort(fiber);
    if (phase === "enter") {
      d++;
      result += `${tab.repeat(d)}<${fibInfo}>\n`;
    } else if (phase === "leave") {
      result += `${tab.repeat(d)}</${fibInfo}>\n`;
      d--;
    } else {
      d++;
      result += `${tab.repeat(d)}<${fibInfo} />\n`;
      d--;
    }
  }
  return result;
}

export const fiberTreeToXML3: Fiber => string = fiberTreeToXMLWithGenerator(iterFiberTree);
export const fiberTreeToXML3X: Fiber => string = fiberTreeToXMLWithGenerator(iterFiberTreeX);
export const fiberTreeToXML3Y: Fiber => string = fiberTreeToXMLWithGenerator(iterFiberTreeY);



// const fiberTreeToObject2 = (wipNode: Fiber, curNode: Fiber) => {
//   if (wipNode === curNode) {
//     let { child: firstChild } = wipNode;
//     if (firstChild) {
//       let children = __getAllChildrenOfFiber(wipNode);
//       return { [`(!)${fiberInfo(wipNode)}`]: children.map(fiberTreeToObject) };
//     } else {
//       return `(!)${fiberInfo(wipNode)}`;
//     }
//   } else {
//     let { child: wipFirstChild } = wipNode;
//     let { child: curFirstChild } = curNode;
//     // XXX
//   }
// }

export const getStackTrace = (depth: number): string => {
  let obj = {stack: ''};
  Error.captureStackTrace(obj, getStackTrace);
  //console.log(obj.stack)
  let stackStr = obj.stack
    .split('\n')
    .slice(1, depth + 1)
    .map((frame, j) => {
      let num = j + 1 + ' ';
      return num + frame.trim().slice(3).replace('/home/ubuntu/projects/react-fork/', '');
    })
    // .map(({functionName, fileName}) => `${functionName}:: ${fileName}`)
    .join('\n');

  return '\n\n' + stackStr;
};

export function dedent(str: string): string {
  return str.replace(/  +/gm, '');
}