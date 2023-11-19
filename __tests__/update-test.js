'use strict';

function __queue() {
  console.log('wait for microtasks');
  return new Promise(queueMicrotask);
}

describe('update and re-render', () => {
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

  it('t1 update', async () => {
    function App() {
      console.log('=== App ===');
      const [count, setCount] = React.useState(0);

      const incrementCount = () => {
        console.log('=== incrementCount ===');
        setCount(prev => prev + 1);
      };

      return (
        <div>
          <button onClick={incrementCount}></button>
          <div>{count}</div>
        </div>
      );
    }

    const root = ReactDOMClient.createRoot(containerForReactComponent);
    root.render(<App />);
    await __queue();
    Scheduler.unstable_flushNumberOfYields(0);
    console.log(document.body.innerHTML);
    await __queue();
    // console.log('=== /// === UPDATE === /// ===');
    // containerForReactComponent
    //   .querySelector('button')
    //   .dispatchEvent(new MouseEvent('click', {bubbles: true}));
    // await __queue();
    console.log(document.body.innerHTML);
    console.log('end of test');
  });

  it('t2 update', async () => {
    let incrementCount;
    
    function App() {
      console.log('=== App ===');
      const [count, setCount] = React.useState(0);

      incrementCount = () => {
        console.log('=== incrementCount ===');
        setCount(prev => prev + 1);
      };

      return <div>{count}</div>;
    }

    const root = ReactDOMClient.createRoot(containerForReactComponent);
    root.render(<App />);
    await __queue();
    Scheduler.unstable_flushNumberOfYields(1);
    console.log(document.body.innerHTML);
    await __queue();
    console.log('=== /// === UPDATE === /// ===');
    incrementCount();
    await __queue();
    Scheduler.unstable_flushNumberOfYields(1);
    console.log(document.body.innerHTML);
    console.log('end of test');
  });
});
