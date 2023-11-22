'use strict';

function __queue(label) {
  const msg = label ? `wait for microtasks ${label}` : 'wait for microtasks';
  const line = '-'.repeat(21 + label.toString().length);
  console.log(line + '\n', msg, '\n' + line);
  return new Promise(queueMicrotask);
}

function disableLogging() {
  const CONSOLE_LOG = console.log;
  console.log = () => {};
  return () => {
    console.log = CONSOLE_LOG;
  };
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

  async function scheduleMount() {
    const [App, actions] = zzz();

    const root = ReactDOMClient.createRoot(containerForReactComponent);
    root.render(<App />);
    await __queue('<SCHEDULE MOUNT>');
    console.log(document.body.innerHTML);
    return actions;
  }

  async function executeMount() {
    Scheduler.unstable_flushUntilNextPaint();
    console.log(document.body.innerHTML);
    await __queue('<AFTER MOUNT>');
  }

  it('t0 schedule mount', async () => {
    await scheduleMount();
    console.log('end of test');
  });

  it('t1 execute mount', async () => {
    const enableLogging = disableLogging();
    await scheduleMount();
    enableLogging();
    await executeMount();
    console.log('end of test');
  });

  it('t2 enqueu updates & schedule render', async () => {
    const enableLogging = disableLogging();
    const actions = await scheduleMount();
    await executeMount();
    enableLogging();
    console.log('ENQUEUE UPDATES');
    actions.incrementCount();
    console.log('SCHEDULE RENDER');
    await __queue(3);
    console.log(document.body.innerHTML);
    console.log('end of test');
  });

  it('t3 render update', async () => {
    const enableLogging = disableLogging();
    const actions = await scheduleMount();
    await executeMount();
    actions.incrementCount();
    await __queue(3);
    enableLogging();

    Scheduler.unstable_flushUntilNextPaint();
    await __queue(4);
    // Scheduler.unstable_flushUntilNextPaint();
    // await __queue(5);
    console.log(document.body.innerHTML);
    console.log('end of test');
  });
});
