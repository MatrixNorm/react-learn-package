/**
 * @flow
 */

import prettier from 'prettier';
import type {Fiber, FiberRoot} from 'react-reconciler/src/ReactInternalTypes';
import type {Hook} from 'react-reconciler/src/ReactFiberHooks';

export const getFiberType = (fiber: Fiber): string => {
  switch (fiber.tag) {
    case 0: {
      return `func {${fiber.type.name}}`;
    }
    case 2: {
      return `indeterminate {${fiber.type.name}}`;
    }
    case 3: {
      return 'hostRoot';
    }
    case 7: {
      return 'Fragment';
    }
    case 13: {
      return `SuspenseComponent`;
    }
    case 14: {
      return `memo type:${fiber.elementType.type.name}`;
    }
    case 15: {
      return `simpleMemo type:${fiber.type.name}`;
    }
    case 22: {
      return `OffscreenComponent`;
    }
    default: {
      let id = fiber.pendingProps['id'];
      return id ? `${fiber.type}#${id}` : fiber.type;
    }
  }
};

export const fiberInfo = (fiber: Fiber | null): string => {
  return fiber ? `Fib <tag=${fiber.tag} ${getFiberType(fiber)}>` : 'Fib <NULL>';
};

export const fiberInfoShort = (fiber: Fiber | null): string => {
  return fiber ? `${getFiberType(fiber)}` : 'NULL';
};

export const elementInfo = (element: any): string | null => {
  if (!element) return null;

  if (Array.isArray(element)) {
    return element.map(el => elementInfo(el));
  }

  if (typeof element === 'object') {
    const _element = {...element};

    _element._owner = fiberInfo(_element._owner);
    if (_element.type?.constructor === Function) {
      _element.type = `func <${_element.type.name}>`;
    }

    let children = _element.props?.children;
    // && (Array.isArray(children) || Object.isObject(children)
    if (children) {
      _element.props = {..._element.props, children: elementInfo(children)};
    }
    return _element;
  } else {
    return element;
  }
};

export const domElementInfo = (domElement: any): string => {
  return `DOM elem <${domElement?.tagName}>`;
};

export const prettyHtml = (html: string): string => {
  return prettier.format(html, {parser: 'html'});
};

export function listHooks(fiber: Fiber): Hook[] {
  // XXX pass memoizedState ?
  const result = [];
  let hook = fiber.memoizedState;
  while (hook !== null) {
    const copyHook = {...hook};
    delete copyHook.next;
    result.push(copyHook);
    hook = hook.next;
  }
  return result;
}
