## Algo for building fiber tree

```javascript
//
let workInProgressRoot: FiberRoot | null = null;
let workInProgress: Fiber | null = null;

while (workInProgress !== null) {
  // The current, flushed, state of this fiber is the alternate.
  const current = workInProgress.alternate;
  const next = beginWork(current, workInProgress);
  if (next === null) {
    // Attempt to complete the current unit of work, then move to the next
    // sibling. If there are no more siblings, return to the parent fiber.
    do {
        const current = workInProgress.alternate;
        const returnFiber = workInProgress.return;
        const next = completeWork(current, workInProgress);
        if (next !== null) {
            // Completing this fiber spawned new work. Work on that next.
            workInProgress = next;
            break;
        }
        const siblingFiber = workInProgress.sibling;
        if (siblingFiber !== null) {
            // If there is more work to do in this returnFiber, do that next.
            workInProgress = siblingFiber;
            break;
        }
        // Otherwise, return to the parent
        workInProgress = returnFiber;
    } while (workInProgress !== null);
  } else {
    workInProgress = next;
  }
}
```

```javascript
function completeWork(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  const newProps = workInProgress.pendingProps;
  popTreeContext(workInProgress);
  switch (workInProgress.tag) {
    case IndeterminateComponent:
    case LazyComponent:
    case SimpleMemoComponent:
    case FunctionComponent:
    case ForwardRef:
    case Fragment:
    case Mode:
    case Profiler:
    case ContextConsumer:
    case MemoComponent:
      bubbleProperties(workInProgress);
      return null;
    case HostComponent: {
      popHostContext(workInProgress);
      const type = workInProgress.type;
      if (current !== null && workInProgress.stateNode != null) {
        updateHostComponent(
          current,
          workInProgress,
          type,
          newProps
        );
      } else {
        if (!newProps) {
          // This can happen when we abort work.
          bubbleProperties(workInProgress);
          return null;
        }
        const currentHostContext = getHostContext();
        const rootContainerInstance = getRootHostContainer();
        // create DOM element
        const instance = createInstance(
          type,
          newProps,
          rootContainerInstance,
          currentHostContext,
          workInProgress,
        );
        // log workInProgress, instance
        appendAllChildren(instance, workInProgress);
        workInProgress.stateNode = instance;
      }
      bubbleProperties(workInProgress);
      return null;
    }            
  }
}
```

## Building element tree fromb bottom to top

```javascript
function appendAllChildren(parent: Instance, workInProgress: Fiber) {
  // We only have the top Fiber that was created but we need recurse down its
  // children to find all the terminal nodes.
  let node = workInProgress.child;
  while (node !== null) {
    if (node.tag === HostComponent) {
      parent.appendChild(node.stateNode);
    } else if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    // на всякий случай?
    if (node === workInProgress) {
      return;
    }
    while (node.sibling === null) {
      if (node.return === null || node.return === workInProgress) {
        return;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}
```

It's recursive variant
----------------------

```javascript
let node = workInProgress.child;

function appendAllChildrenRec(parent, node) {
  if (node !== null) {
    if (node.tag === HostComponent) {
      parent.appendChild(node.stateNode);
    } else if (node.child !== null) {
      node.child.return = node;
      appendAllChildrenRec(parent, node.child);
    }
    if (node.sibling !== null) {
      appendAllChildrenRec(parent, node.sibling);
    }
  }
}
```

```javascript
let node = workInProgress.child;

function appendAllChildrenRec(parent, workInProgress) {
  while (node !== null) {
    if (node.tag === HostComponent) {
      parent.appendChild(node.stateNode);
    } else if (node.child !== null) {
      node.child.return = node;
      appendAllChildrenRec(parent, node.child);
    }
    if (node.sibling === null) {
      break;      
    }
    node = node.sibling;
  }
}
```

```javascript
let node = workInProgress.child;

function appendAllChildrenIter(parent, workInProgress) {
  while (node !== null) {
    if (node.tag === HostComponent) {
      parent.appendChild(node.stateNode);
    } else if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    while (node.sibling === null) {
      if (node.return === workInProgress) {
        return;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}
```