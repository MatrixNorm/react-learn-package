'use strict';

import {getStackTrace} from '../index';

describe('useState hook', () => {
  // ???
  let containerForReactComponent = null;
  let React;
  let ReactDOM;
  let ReactDOMClient;
  let ReactTestUtils;

  beforeEach(() => {
    jest.resetModules(); // ???

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    ReactTestUtils = require('react-dom/test-utils');

    containerForReactComponent = document.createElement('div');
    document.body.appendChild(containerForReactComponent);

    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    document.body.removeChild(containerForReactComponent);
    containerForReactComponent = null;
  });

  function renderIt(reactElem) {
    ReactTestUtils.act(() => {
      const root = ReactDOMClient.createRoot(containerForReactComponent);
      root.render(reactElem);
    });
  }

  it('simply_throws_promise', () => {
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

    renderIt(<App />);
    console.log(document.body.innerHTML);
  });
});
