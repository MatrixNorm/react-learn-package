```javascript
import * as client from 'react-dom/client';

const containerDomElement = document.createElement('div');
const root = client.createRoot(containerDomElement);
root.render(reactElem);
```

##

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
  const current = container.current; // hostRootFiber
  const lane = requestUpdateLane(current); // lane = DefaultLane

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
  const root = enqueueUpdate(current /* host root*/, update, lane);
  // root === container
  if (root !== null) {
    scheduleUpdateOnFiber(root, current, lane);
    // ???
    entangleTransitions(root, current, lane);
  }
  return lane;
}
```

##

```javascript
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

type UpdateQueue<State> = {
  baseState: State,
  firstBaseUpdate: Update<State> | null,
  lastBaseUpdate: Update<State> | null,
  shared: SharedQueue<State>,
  callbacks: Array<() => mixed> | null,
};

type SharedQueue<State> = {
  pending: Update<State> | null,
  lanes: Lanes,
  hiddenCallbacks: Array<() => mixed> | null,
};

export function enqueueUpdate<State>(
  fiber: Fiber,
  update: Update<State>,
  lane: Lane,
): FiberRoot | null {
  const updateQueue = fiber.updateQueue;
  const sharedQueue: SharedQueue<State> = updateQueue.shared;
  // === ReactFiberConcurrentUpdates
  return enqueueConcurrentClassUpdate(fiber, sharedQueue, update, lane);
}

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
  // ???
  concurrentlyUpdatedLanes = mergeLanes(concurrentlyUpdatedLanes, lane);
  fiber.lanes = mergeLanes(fiber.lanes, lane);
  const alternate = fiber.alternate;
  if (alternate !== null) {
    alternate.lanes = mergeLanes(alternate.lanes, lane);
  }
}
```

##

```javascript
////////////////////////
// ReactFiberWorkLoop //
////////////////////////

// workInProgressRoot === null
export function scheduleUpdateOnFiber(
  root: FiberRoot,
  fiber: Fiber,
  lane: Lane,
) {
  markRootUpdated(root, lane);
  ensureRootIsScheduled(root);    
}

// === ReactFiberRootScheduler.js === // 
// mightHavePendingSyncWork = false
// didScheduleMicrotask = false
// firstScheduledRoot = null
export function ensureRootIsScheduled(root: FiberRoot): void {
  mightHavePendingSyncWork = true;
  firstScheduledRoot = root
  if (!didScheduleMicrotask) {
    didScheduleMicrotask = true;
    queueMicrotask(processRootScheduleInMicrotask);
  }
}

function processRootScheduleInMicrotask() {
  didScheduleMicrotask = false;
  mightHavePendingSyncWork = false;
  const currentTime = now();
  let root = firstScheduledRoot;
  const nextLanes = scheduleTaskForRootDuringMicrotask(root, currentTime);
}

function scheduleTaskForRootDuringMicrotask(
  root: FiberRoot,
  currentTime: number,
): Lane {
  markStarvedLanesAsExpired(root, currentTime);
  const nextLanes = getNextLanes(root, NoLanes);
  const newCallbackPriority = getHighestPriorityLane(nextLanes);
  // !!!
  const newCallbackNode = scheduleCallback(
    NormalSchedulerPriority,
    performConcurrentWorkOnRoot.bind(null, root),
  );
  root.callbackPriority = newCallbackPriority;
  root.callbackNode = newCallbackNode;
  return newCallbackPriority;
}

function scheduleCallback(
  priorityLevel: PriorityLevel,
  callback: RenderTaskFn,
) {
  // SchedulerMock.unstable_scheduleCallback
  return Scheduler_scheduleCallback(priorityLevel, callback);
}
```

```javascript
export function performConcurrentWorkOnRoot(
  root: FiberRoot,
  didTimeout: boolean,
): RenderTaskFn | null {
  const shouldTimeSlice =
    !includesBlockingLane(root, lanes) &&
    !includesExpiredLane(root, lanes);

  let exitStatus = shouldTimeSlice
    ? renderRootConcurrent(root, lanes)
    : renderRootSync(root, lanes);
  
  // more stuff ... 

  ensureRootIsScheduled(root);
  return getContinuationForRoot(root, originalCallbackNode);
}

// workInProgressRoot = null
//  workInProgressRootRenderLanes = NoLanes
function renderRootSync(root: FiberRoot, lanes: Lanes) {
  const prevExecutionContext = executionContext;
  executionContext |= RenderContext;
  const prevDispatcher = pushDispatcher(root.containerInfo);
  const prevCacheDispatcher = pushCacheDispatcher();

  workInProgressTransitions = getTransitionsForLanes(root, lanes); // ???
  prepareFreshStack(root, lanes);

  outer: do {
    try {
      workLoopSync();
      break;
    } catch (thrownValue) {
      handleThrow(root, thrownValue);
    }
  } while (true);

  resetContextDependencies();
  executionContext = prevExecutionContext;
  popDispatcher(prevDispatcher);
  popCacheDispatcher(prevCacheDispatcher);

  workInProgressRoot = null;
  workInProgressRootRenderLanes = NoLanes;
  finishQueueingConcurrentUpdates();
  return workInProgressRootExitStatus;
}

function prepareFreshStack(root: FiberRoot, lanes: Lanes): Fiber {
  root.finishedWork = null;
  root.finishedLanes = NoLanes;
  workInProgressRoot = root;
  const rootWorkInProgress = createWorkInProgress(root.current, null);
  workInProgress = rootWorkInProgress;
  workInProgressRootRenderLanes = renderLanes = lanes;
  workInProgressSuspendedReason = NotSuspended;
  workInProgressThrownValue = null;
  workInProgressRootDidAttachPingListener = false;
  workInProgressRootExitStatus = RootInProgress;
  workInProgressRootFatalError = null;
  workInProgressRootSkippedLanes = NoLanes;
  workInProgressRootInterleavedUpdatedLanes = NoLanes;
  workInProgressRootRenderPhaseUpdatedLanes = NoLanes;
  workInProgressRootPingedLanes = NoLanes;
  workInProgressRootConcurrentErrors = null;
  workInProgressRootRecoverableErrors = null;

  finishQueueingConcurrentUpdates();

  return rootWorkInProgress;
}

export function finishQueueingConcurrentUpdates(): void {
  const endIndex = concurrentQueuesIndex;
  concurrentQueuesIndex = 0;

  concurrentlyUpdatedLanes = NoLanes;

  let i = 0;
  while (i < endIndex) {
    const fiber: Fiber = concurrentQueues[i];
    concurrentQueues[i++] = null;
    const queue: ConcurrentQueue = concurrentQueues[i];
    concurrentQueues[i++] = null;
    const update: ConcurrentUpdate = concurrentQueues[i];
    concurrentQueues[i++] = null;
    const lane: Lane = concurrentQueues[i];
    concurrentQueues[i++] = null;

    if (queue !== null && update !== null) {
      const pending = queue.pending;
      if (pending === null) {
        // This is the first update. Create a circular list.
        update.next = update;
      } else {
        update.next = pending.next;
        pending.next = update;
      }
      queue.pending = update;
    }

    if (lane !== NoLane) {
      markUpdateLaneFromFiberToRoot(fiber, update, lane);
    }
  }
}
```
