
/*
  ReactFiberHooks.js
*/

// The work-in-progress fiber. I've named it differently to distinguish it from
// the work-in-progress hook.
let currentlyRenderingFiber: Fiber = (null: any);

// Hooks are stored as a linked list on the fiber's memoizedState field. The
// current hook list is the list that belongs to the current fiber. The
// work-in-progress hook list is a new list that will be added to the
// work-in-progress fiber.
let currentHook: Hook | null = null;
let workInProgressHook: Hook | null = null;

export function renderWithHooks<Props, SecondArg>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: (p: Props, arg: SecondArg) => any,
  props: Props,
  secondArg: SecondArg,
  nextRenderLanes: Lanes,
): any {
  renderLanes = nextRenderLanes;
  currentlyRenderingFiber = workInProgress;

  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;
  workInProgress.lanes = NoLanes;

  // The following should have already been reset:
  // currentHook = null;
  // workInProgressHook = null;
  // didScheduleRenderPhaseUpdate = false;
  // localIdCounter = 0;
  // thenableIndexCounter = 0;
  // thenableState = null;

  ReactCurrentDispatcher.current =
      current === null || current.memoizedState === null
        ? HooksDispatcherOnMount
        : HooksDispatcherOnUpdate;

  const shouldDoubleRenderDEV =
    __DEV__ &&
    debugRenderPhaseSideEffectsForStrictMode &&
    (workInProgress.mode & StrictLegacyMode) !== NoMode;

  shouldDoubleInvokeUserFnsInHooksDEV = shouldDoubleRenderDEV;
  let children = Component(props, secondArg);
  shouldDoubleInvokeUserFnsInHooksDEV = false;

  if (didScheduleRenderPhaseUpdateDuringThisPass) {
    children = renderWithHooksAgain(
      workInProgress,
      Component,
      props,
      secondArg,
    );
  }

  if (shouldDoubleRenderDEV) {
    // In development, components are invoked twice to help detect side effects.
    setIsStrictModeForDevtools(true);
    try {
      children = renderWithHooksAgain(
        workInProgress,
        Component,
        props,
        secondArg,
      );
    } finally {
      setIsStrictModeForDevtools(false);
    }
  }

  finishRenderingHooks(current, workInProgress);

  return children;
}

// WITHOUT DOUBLE RENDER IN DEVELOPMENT

export function renderWithHooksSimplified<Props, SecondArg>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: (p: Props, arg: SecondArg) => any,
  props: Props,
  secondArg: SecondArg,
  nextRenderLanes: Lanes,
): any {
  renderLanes = nextRenderLanes;
  currentlyRenderingFiber = workInProgress;

  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;
  workInProgress.lanes = NoLanes;

  ReactCurrentDispatcher.current =
      current === null || current.memoizedState === null
        ? HooksDispatcherOnMount
        : HooksDispatcherOnUpdate;

  let children = Component(props, secondArg);

  if (didScheduleRenderPhaseUpdateDuringThisPass) {
    children = renderWithHooksAgain(
      workInProgress,
      Component,
      props,
      secondArg,
    );
  }

  finishRenderingHooks(current, workInProgress);
  return children;
}

function finishRenderingHooks(current: Fiber | null, workInProgress: Fiber) {
  ReactCurrentDispatcher.current = ContextOnlyDispatcher;
  // This check uses currentHook so that it works the same in DEV and prod bundles.
  // hookTypesDev could catch more cases (e.g. context) but only in DEV bundles.
  const didRenderTooFewHooks =
    currentHook !== null && currentHook.next !== null;

  renderLanes = NoLanes;
  currentlyRenderingFiber = (null: any);

  currentHook = null;
  workInProgressHook = null;

  didScheduleRenderPhaseUpdate = false;
  // This is reset by checkDidRenderIdHook
  // localIdCounter = 0;

  thenableIndexCounter = 0;
  thenableState = null;

  if (didRenderTooFewHooks) {
    throw new Error(
      'Rendered fewer hooks than expected. This may be caused by an accidental ' +
        'early return statement.',
    );
  }

  if (enableLazyContextPropagation) {
    if (current !== null) {
      if (!checkIfWorkInProgressReceivedUpdate()) {
        // If there were no changes to props or state, we need to check if there
        // was a context change. We didn't already do this because there's no
        // 1:1 correspondence between dependencies and hooks. Although, because
        // there almost always is in the common case (`readContext` is an
        // internal API), we could compare in there. OTOH, we only hit this case
        // if everything else bails out, so on the whole it might be better to
        // keep the comparison out of the common path.
        const currentDependencies = current.dependencies;
        if (
          currentDependencies !== null &&
          checkIfContextChanged(currentDependencies)
        ) {
          markWorkInProgressReceivedUpdate();
        }
      }
    }
  }
}

function renderWithHooksAgain<Props, SecondArg>(
  workInProgress: Fiber,
  Component: (p: Props, arg: SecondArg) => any,
  props: Props,
  secondArg: SecondArg,
): any {
  // This is used to perform another render pass. It's used when setState is
  // called during render, and for double invoking components in Strict Mode
  // during development.
  //
  // The state from the previous pass is reused whenever possible. So, state
  // updates that were already processed are not processed again, and memoized
  // functions (`useMemo`) are not invoked again.
  //
  // Keep rendering in a loop for as long as render phase updates continue to
  // be scheduled. Use a counter to prevent infinite loops.

  currentlyRenderingFiber = workInProgress;

  let numberOfReRenders: number = 0;
  let children;
  do {
    if (didScheduleRenderPhaseUpdateDuringThisPass) {
      // It's possible that a use() value depended on a state that was updated in
      // this rerender, so we need to watch for different thenables this time.
      thenableState = null;
    }
    thenableIndexCounter = 0;
    didScheduleRenderPhaseUpdateDuringThisPass = false;

    if (numberOfReRenders >= RE_RENDER_LIMIT) {
      throw new Error(
        'Too many re-renders. React limits the number of renders to prevent ' +
          'an infinite loop.',
      );
    }

    numberOfReRenders += 1;
    // Start over from the beginning of the list
    currentHook = null;
    workInProgressHook = null;
    workInProgress.updateQueue = null;

    ReactCurrentDispatcher.current = __DEV__
      ? HooksDispatcherOnRerenderInDEV
      : HooksDispatcherOnRerender;

    children = Component(props, secondArg);
  } while (didScheduleRenderPhaseUpdateDuringThisPass);
  return children;
}


// mount:rerender //
// current == null
// currentlyRenderingFiber.memoizedState == <first hook>
function updateWorkInProgressHook_mount_rerender(): Hook {
  if (workInProgressHook === null) {
    // first hook
    workInProgressHook = currentlyRenderingFiber.memoizedState;
  } else {
    // n-th hook
    workInProgressHook = workInProgressHook.next;
  }
  return workInProgressHook;
}

// update:first_render:first_hook //
// current != null
// currentlyRenderingFiber == workInProgress == current.alt
// currentlyRenderingFiber.memoizedState == null
// currentHook == null
// workInProgressHook == null
function updateWorkInProgressHook_update_firstRender_firstHook(): Hook {
  const current = currentlyRenderingFiber.alternate;
  let nextCurrentHook = current.memoizedState;

  if (nextCurrentHook === null) {
    const currentFiber = currentlyRenderingFiber.alternate;
    if (currentFiber === null) {
      // This is the initial render. This branch is reached when the component
      // suspends, resumes, then renders an additional hook.
      // Should never be reached because we should switch to the mount dispatcher first.
      throw new Error(
        'Update hook called on initial render. This is likely a bug in React. Please file an issue.',
      );
    } else {
      // This is an update. We should always have a current hook.
      throw new Error('Rendered more hooks than during the previous render.');
    }
  }

  currentHook = nextCurrentHook;

  const newHook: Hook = {
    memoizedState: currentHook.memoizedState,
    baseState: currentHook.baseState,
    baseQueue: currentHook.baseQueue,
    queue: currentHook.queue,
    next: null,
  };
  currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
  return workInProgressHook;
}

// update:first_render:nth_hook //
// current != null
// currentlyRenderingFiber == workInProgress == current.alt
// workInProgressHook = currentlyRenderingFiber.memoizedState != null
// currentHook != null
function updateWorkInProgressHook_update_firstRender_nthHook(): Hook {
  let nextCurrentHook = currentHook.next;
  let nextWorkInProgressHook = workInProgressHook.next;

  if (nextCurrentHook === null) {
    const currentFiber = currentlyRenderingFiber.alternate;
    if (currentFiber === null) {
      // This is the initial render. This branch is reached when the component
      // suspends, resumes, then renders an additional hook.
      // Should never be reached because we should switch to the mount dispatcher first.
      throw new Error(
        'Update hook called on initial render. This is likely a bug in React. Please file an issue.',
      );
    } else {
      // This is an update. We should always have a current hook.
      throw new Error('Rendered more hooks than during the previous render.');
    }
  }

  currentHook = nextCurrentHook;

  const newHook: Hook = {
    memoizedState: currentHook.memoizedState,

    baseState: currentHook.baseState,
    baseQueue: currentHook.baseQueue,
    queue: currentHook.queue,

    next: null,
  };

  workInProgressHook = workInProgressHook.next = newHook;
  return workInProgressHook;
}