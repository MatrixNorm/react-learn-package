'use strict';

import {getStackTrace} from '../index';

describe('useState hook', () => {
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

    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    document.body.removeChild(containerForReactComponent);
    containerForReactComponent = null;
  });

  it('throws_promise', async () => {
    global.IS_REACT_ACT_ENVIRONMENT = false;

    function App() {
      return (
        <React.Suspense fallback={<FallbackPath />}>
          <MainPath />
        </React.Suspense>
      );
    }

    function MainPath() {
      console.log(getStackTrace(5));
      throw new Promise(() => {});
    }

    function FallbackPath() {
      return <p>Moose...</p>;
    }

    const root = ReactDOMClient.createRoot(containerForReactComponent);
    root.render(<App />);

    console.log(
      'processRootScheduleInMicrotask has been placed into miscrotask queue by now'
    );
    await new Promise(weAreHappy => {
      queueMicrotask(() => {
        console.log('hello from microtask queue');
        weAreHappy();
      });
    });
    console.log(document.body.innerHTML);
    Scheduler.unstable_flushNumberOfYields(1);
    console.log(document.body.innerHTML);
    console.log("end of test");
  });
});
