```javascript
import * as client from 'react-dom/client';

const containerDomElement = document.createElement('div');
const root = client.createRoot(containerDomElement);
root.render(reactElem);
```

```javascript
//////////////////////////////////////////
// react-dom/src/client/ReactDOMRoot,js //
//////////////////////////////////////////

export function createRoot(
  container: Element | Document | DocumentFragment,
  options?: CreateRootOptions,
): RootType {
  const root = createContainer(container, options);
  markContainerAsRoot(root.current, container);
  Dispatcher.current = ReactDOMClientDispatcher;
  listenToAllSupportedEvents(container);
  return new ReactDOMRoot(root);
}

function ReactDOMRoot(internalRoot: FiberRoot) {
  this._internalRoot = internalRoot;
}

ReactDOMRoot.prototype.render =
  function (children: ReactNodeList): void {
    const root = this._internalRoot;
    if (root === null) {
      throw new Error('Cannot update an unmounted root.');
    }
    // react-reconciler/src/ReactFiberReconciler
    updateContainer(children, root, null, null);
  };

///////////////////////////////////////////////
// react-reconciler/src/ReactFiberReconciler //
///////////////////////////////////////////////

export function updateContainer(
  element: ReactNodeList,
  container: OpaqueRoot,
  parentComponent: ?React$Component<any, any>
): Lane {
  const current = container.current;
  const lane = requestUpdateLane(current);

  const update = createUpdate(lane);
  update.payload = {element};
  /* update =
    {
      lane: 32,
      tag: 0,
      payload: {
        element: {
          '$$typeof': Symbol(react.element),
          type: [Function: App],
          key: null,
          ref: null,
          props: {},
          _owner: null,
          _store: {}
        }
      },
      callback: null,
      next: null
    }
  */
  const root = enqueueUpdate(current, update, lane);
  if (root !== null) {
    scheduleUpdateOnFiber(root, current, lane);
    entangleTransitions(root, current, lane);
  }
  return lane;
}

/////////////////////////////////////////////////////
// react-reconciler/src/ReactFiberClassUpdateQueue //
/////////////////////////////////////////////////////

type Update<State> = {
  lane: Lane,
  tag: 0 | 1 | 2 | 3,
  payload: any,
  callback: (() => mixed) | null,
  next: Update<State> | null,
};

type SharedQueue<State> = {
  pending: Update<State> | null,
  lanes: Lanes,
  hiddenCallbacks: Array<() => mixed> | null,
};

type UpdateQueue<State> = {
  baseState: State,
  firstBaseUpdate: Update<State> | null,
  lastBaseUpdate: Update<State> | null,
  shared: SharedQueue<State>,
  callbacks: Array<() => mixed> | null,
};

export function enqueueUpdate<State>(
  fiber: Fiber,
  update: Update<State>,
  lane: Lane,
): FiberRoot | null {
  const updateQueue = fiber.updateQueue;
  const sharedQueue: SharedQueue<State> = updateQueue.shared;

  if (isUnsafeClassRenderPhaseUpdate(fiber)) {
    // ???
  } else {
    return enqueueConcurrentClassUpdate(fiber, sharedQueue, update, lane);
  }
}
```

```javascript
//////////////////////////////////////////////////////
// react-reconciler/src/ReactFiberConcurrentUpdates //
//////////////////////////////////////////////////////

type ConcurrentUpdate = {
  next: ConcurrentUpdate,
  lane: Lane,
};

type ConcurrentQueue = {
  pending: ConcurrentUpdate | null,
};

const concurrentQueues: Array<any> = [];
let concurrentQueuesIndex = 0;
let concurrentlyUpdatedLanes: Lanes = NoLanes;

export function enqueueConcurrentClassUpdate<State>(
  fiber: Fiber,
  queue: SharedQueue<State>,
  update: Update<State>,
  lane: Lane,
): FiberRoot | null {
  const concurrentQueue: ConcurrentQueue = (queue: any);
  const concurrentUpdate: ConcurrentUpdate = (update: any);
  enqueueUpdate(fiber, concurrentQueue, concurrentUpdate, lane);
  return getRootForUpdatedFiber(fiber);
}

function enqueueUpdate(
  fiber: Fiber,
  queue: ConcurrentQueue | null,
  update: ConcurrentUpdate | null,
  lane: Lane,
) {
  concurrentQueues[concurrentQueuesIndex++] = fiber;
  concurrentQueues[concurrentQueuesIndex++] = queue;
  concurrentQueues[concurrentQueuesIndex++] = update;
  concurrentQueues[concurrentQueuesIndex++] = lane;

  concurrentlyUpdatedLanes = mergeLanes(concurrentlyUpdatedLanes, lane);

  fiber.lanes = mergeLanes(fiber.lanes, lane);
  const alternate = fiber.alternate;
  if (alternate !== null) {
    alternate.lanes = mergeLanes(alternate.lanes, lane);
  }
}
```

```javascript
////////////////////////
// ReactFiberWorkLoop //
////////////////////////

export function scheduleUpdateOnFiber(
  root: FiberRoot,
  fiber: Fiber,
  lane: Lane,
) {
  // Check if the work loop is currently suspended and waiting for data to
  // finish loading.
  if (
    // Suspended render phase
    (root === workInProgressRoot &&
      workInProgressSuspendedReason === SuspendedOnData) ||
    // Suspended commit phase
    root.cancelPendingCommit !== null
  ) {
    // The incoming update might unblock the current render. Interrupt the
    // current attempt and restart from the top.
    prepareFreshStack(root, NoLanes);
    markRootSuspended(root, workInProgressRootRenderLanes);
  }

  // Mark that the root has a pending update.
  markRootUpdated(root, lane);

  if (
    (executionContext & RenderContext) !== NoLanes &&
    root === workInProgressRoot
  ) {
    // This update was dispatched during the render phase. This is a mistake
    // if the update originates from user space (with the exception of local
    // hook updates, which are handled differently and don't reach this
    // function), but there are some internal React features that use this as
    // an implementation detail, like selective hydration.
    warnAboutRenderPhaseUpdatesInDEV(fiber);

    // Track lanes that were updated during the render phase
    workInProgressRootRenderPhaseUpdatedLanes = mergeLanes(
      workInProgressRootRenderPhaseUpdatedLanes,
      lane,
    );
  } else {
    // This is a normal update, scheduled from outside the render phase. For
    // example, during an input event.
    if (root === workInProgressRoot) {
      // Received an update to a tree that's in the middle of rendering. Mark
      // that there was an interleaved update work on this root.
      if ((executionContext & RenderContext) === NoContext) {
        workInProgressRootInterleavedUpdatedLanes = mergeLanes(
          workInProgressRootInterleavedUpdatedLanes,
          lane,
        );
      }
      if (workInProgressRootExitStatus === RootSuspendedWithDelay) {
        // The root already suspended with a delay, which means this render
        // definitely won't finish. Since we have a new update, let's mark it as
        // suspended now, right before marking the incoming update. This has the
        // effect of interrupting the current render and switching to the update.
        // TODO: Make sure this doesn't override pings that happen while we've
        // already started rendering.
        markRootSuspended(root, workInProgressRootRenderLanes);
      }
    }

    ensureRootIsScheduled(root);
    
    if (
      lane === SyncLane &&
      executionContext === NoContext &&
      (fiber.mode & ConcurrentMode) === NoMode
    ) {
      if (__DEV__ && ReactCurrentActQueue.isBatchingLegacy) {
        // Treat `act` as if it's inside `batchedUpdates`, even in legacy mode.
      } else {
        // Flush the synchronous work now, unless we're already working or inside
        // a batch. This is intentionally inside scheduleUpdateOnFiber instead of
        // scheduleCallbackForFiber to preserve the ability to schedule a callback
        // without immediately flushing it. We only do this for user-initiated
        // updates, to preserve historical behavior of legacy mode.
        resetRenderTimer();
        flushSyncWorkOnLegacyRootsOnly();
      }
    }
  }
}
```