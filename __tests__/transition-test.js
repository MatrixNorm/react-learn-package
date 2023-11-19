'use strict';

function __queue(label) {
  const msg = label ? `wait for microtasks ${label}` : 'wait for microtasks';
  const line = '-'.repeat(21 + label.toString().length);
  console.log(line + '\n', msg, '\n' + line);
  return new Promise(queueMicrotask);
}

describe('force concurrent render', () => {
  // ???
  let containerForReactComponent = null;
  let React;
  let ReactDOM;
  let ReactDOMClient;
  let ReactTestUtils;
  let Scheduler;

  beforeEach(() => {
    jest.resetModules(); // ???

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    ReactTestUtils = require('react-dom/test-utils');
    Scheduler = require('scheduler');

    containerForReactComponent = document.createElement('div');
    document.body.appendChild(containerForReactComponent);

    global.IS_REACT_ACT_ENVIRONMENT = false;
    global.__DEV__ = false;
  });

  afterEach(() => {
    document.body.removeChild(containerForReactComponent);
    containerForReactComponent = null;
  });

  function zzz() {
    let actions = {};

    function App() {
      console.log('=== App ===');
      const [isPending, startTransition] = React.useTransition();
      const [count, setCount] = React.useState(0);

      actions.incrementCount = () => {
        console.log('=== incrementCount ===');
        startTransition(() => {
          setCount(prev => prev + 1);
        });
      };

      return <div>{count}</div>;
    }

    return [App, actions];
  }

  it('t0 just mount', async () => {
    const [App, _] = zzz();

    const root = ReactDOMClient.createRoot(containerForReactComponent);
    root.render(<App />);
    await __queue(1);
    Scheduler.unstable_flushUntilNextPaint();
    console.log(document.body.innerHTML);
    await __queue(2);
    console.log('end of test');
  });

  it('t1 update', async () => {
    const [App, action] = zzz();

    const CONSOLE_LOG = console.log;
    console.log = () => {};

    const root = ReactDOMClient.createRoot(containerForReactComponent);
    root.render(<App />);
    await __queue(1);
    Scheduler.unstable_flushUntilNextPaint();
    console.log(document.body.innerHTML);
    await __queue(2);

    console.log = CONSOLE_LOG;
    action.incrementCount();
    await __queue(3);
    // Scheduler.unstable_flushUntilNextPaint();
    // await __queue(4);
    // Scheduler.unstable_flushUntilNextPaint();
    // await __queue(5);
    console.log(document.body.innerHTML);
    console.log('end of test');
  });

  it('t2 update', async () => {
    const [App, action] = zzz();

    const CONSOLE_LOG = console.log;
    console.log = () => {};

    const root = ReactDOMClient.createRoot(containerForReactComponent);
    root.render(<App />);
    await __queue(1);
    Scheduler.unstable_flushUntilNextPaint();
    console.log(document.body.innerHTML);
    await __queue(2);

    action.incrementCount();
    console.log = CONSOLE_LOG;
    await __queue(3);
    Scheduler.unstable_flushUntilNextPaint();
    await __queue(4);
    // Scheduler.unstable_flushUntilNextPaint();
    // await __queue(5);
    console.log(document.body.innerHTML);
    console.log('end of test');
  });
});
