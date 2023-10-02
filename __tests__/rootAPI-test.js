'use strict';

describe('root API', () => {
  // ???
  let containerForReactComponent = null;
  let React;
  let ReactDOM;
  let ReactDOMClient;
  let ReactTestUtils;
  let SchedulerMock;

  beforeEach(() => {
    jest.resetModules(); // ???

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    ReactTestUtils = require('react-dom/test-utils');
    SchedulerMock = require('scheduler/unstable_mock');

    containerForReactComponent = document.createElement('div');
    document.body.appendChild(containerForReactComponent);

    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    document.body.removeChild(containerForReactComponent);
    containerForReactComponent = null;
  });

  function App() {
    console.log('=== App ===');
    const [count, setCount] = React.useState(0);

    return <span>{count}</span>;
  }

  it('new_act', () => {
    ReactTestUtils.act(() => {
      const root = ReactDOMClient.createRoot(containerForReactComponent);
      root.render(<App />);
    });
    /**
     * ReactFiberAct.js###isConcurrentActEnvironment:
     * console.error(
     *   'The current testing environment is not configured to support ' +
     *     'act(...)',
     * );
     * https://github.com/reactwg/react-18/discussions/102
     *
     */
  });

  it('new_noact', async () => {
    global.IS_REACT_ACT_ENVIRONMENT = false;

    const root = ReactDOMClient.createRoot(containerForReactComponent);
    root.render(<App />);
    // wait for processRootScheduleInMicrotask to be called
    console.log('BEFORE: await new Promise(queueMicrotask)');
    await new Promise(queueMicrotask);
    console.log(document.body.innerHTML);
    SchedulerMock.unstable_flushNumberOfYields(1);
    console.log(document.body.innerHTML);
  });

  it('old_act', () => {
    ReactTestUtils.act(() => {
      ReactDOM.render(<App />, containerForReactComponent);
    });
  });

  it('old_noact', () => {
    ReactDOM.render(<App />, containerForReactComponent);
    console.log(document.body.innerHTML);
  });
});
