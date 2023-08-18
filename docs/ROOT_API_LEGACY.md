
```javascript

export function render(
  element: React$Element<any>,
  container: Container
): React$Component<any, any> | PublicInstance | null {

  if (!isValidContainerLegacy(container)) {
    throw new Error('Target container is not a DOM element.');
  }

  const maybeRoot = container._reactRootContainer;
  let root: FiberRoot;
  if (!maybeRoot) {
    // Initial mount
    root = legacyCreateRootFromDOMContainer(
      container, // container
      element, // initialChildren
    );
  } else {
    root = maybeRoot;
    // Update
    updateContainer(element, root);
  }
  return getPublicRootInstance(root);
}

function legacyCreateRootFromDOMContainer(
  container: Container,
  initialChildren: ReactNodeList,
): FiberRoot {
  // First clear any existing content.
  clearContainer(container);

  const root = createContainer(container, ...);
  container._reactRootContainer = root;
  markContainerAsRoot(root.current, container);
  listenToAllSupportedEvents(container);

  // Initial mount should not be batched.
  // // // flushSync(() => {
  // // //  updateContainer(initialChildren, root);
  // // //});
  updateContainer(initialChildren, root);

  return root;
}
```

```javascript
//////////////////////////
// ReactFiberReconciler //
//////////////////////////

export function updateContainer(
  element: ReactNodeList,
  container: OpaqueRoot,
): Lane {
  const current = container.current; // hostRoot
  const lane = requestUpdateLane(current);

  const update = createUpdate(lane);
  update.payload = {element};

  const root = enqueueUpdate(current, update, lane);
  if (root !== null) {
    scheduleUpdateOnFiber(root, current, lane); // !!!
    entangleTransitions(root, current, lane);
  }

  return lane;
}

////////////////////////
// ReactFiberWorkLoop //
////////////////////////

export function scheduleUpdateOnFiber(
  root: FiberRoot,
  fiber: Fiber,
  lane: Lane,
) {
  // Mark that the root has a pending update.
  markRootUpdated(root, lane);
  warnIfUpdatesNotWrappedWithActDEV(fiber);

  ensureRootIsScheduled(root); // !!!

  if (
    lane === SyncLane && // true
    executionContext === NoContext && // true
    (fiber.mode & ConcurrentMode) === NoMode // true
  ) {
    resetRenderTimer();
    flushSyncWorkOnLegacyRootsOnly(); // flushSyncWorkAcrossRoots_impl(true);
  }
}

/////////////////////////////
// ReactFiberRootScheduler //
/////////////////////////////

export function ensureRootIsScheduled(root: FiberRoot): void {
  if (__DEV__ && ReactCurrentActQueue.current !== null) {
    // We're inside an `act` scope.
    if (!didScheduleMicrotask_act) {
      didScheduleMicrotask_act = true;
      scheduleImmediateTask(processRootScheduleInMicrotask);
    }
  } else {
    if (!didScheduleMicrotask) {
      didScheduleMicrotask = true;
      scheduleImmediateTask(processRootScheduleInMicrotask);
    }
  }
}

function scheduleImmediateTask(cb: () => mixed) {
  if (__DEV__ && ReactCurrentActQueue.current !== null) {
    ReactCurrentActQueue.current.push(() => {
      cb();
      return null;
    });
  }
  queueMicrotask(cb);
}

function processRootScheduleInMicrotask() {
  // This function is always called inside a microtask. It should never be
  // called synchronously.
  didScheduleMicrotask = false;
  if (__DEV__) {
    didScheduleMicrotask_act = false;
  }

  flushSyncWorkOnAllRoots(); // flushSyncWorkAcrossRoots_impl(false);
}

function flushSyncWorkAcrossRoots_impl(onlyLegacy: boolean) {
  ...
  performSyncWorkOnRoot(root);
  ...
}

```