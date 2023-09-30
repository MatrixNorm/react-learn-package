
```javascript

do {
  try {
    if (
      workInProgressSuspendedReason !== NotSuspended &&
      workInProgress !== null
    ) {
      const unitOfWork = workInProgress;
      const thrownValue = workInProgressThrownValue;
      switch (workInProgressSuspendedReason) {
        case SuspendedOnHydration: {
          // ...
          break outer;
        }
        default: {
          workInProgressSuspendedReason = NotSuspended;
          workInProgressThrownValue = null;
          throwAndUnwindWorkLoop(unitOfWork, thrownValue);
          break;
        }
      }
    }
    while (workInProgress !== null) {
      performUnitOfWork(workInProgress);
    } 
    break;
  } catch (thrownValue) {
    console.log({thrownValue});
    handleThrow(root, thrownValue);
  }
} while (true);
```