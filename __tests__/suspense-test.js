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
  let Matrixnorm;

  beforeEach(() => {
    jest.resetModules(); // ???

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    ReactTestUtils = require('react-dom/test-utils');
    Scheduler = require('scheduler');
    Matrixnorm = require('matrixnorm');

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

    let curHostRoot = root._internalRoot.current;
    console.log(
      'current tree: ',
      Matrixnorm.fiberTreeToXML({
        hostRoot: curHostRoot,
      }),
      'curHostRoot.alternate: ',
      curHostRoot.alternate
    );

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
    console.log(
      document.body.innerHTML,
      curHostRoot === root._internalRoot.current
    );
    Scheduler.unstable_flushNumberOfYields(1);

    console.log(
      curHostRoot === root._internalRoot.current,
      curHostRoot === root._internalRoot.current.alternate
    );

    console.log(
      'current tree:\n',
      Matrixnorm.fiberTreeToXML({
        hostRoot: root._internalRoot.current,
      }),
      '\nalternate tree:\n',
      Matrixnorm.fiberTreeToXML({
        hostRoot: root._internalRoot.current.alternate,
      })
    );

    console.log(document.body.innerHTML);
    console.log('end of test');
  });
});
