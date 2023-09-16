'use strict';

describe('hook general', () => {
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

  it('pure_func', () => {
    // calls renderWithHooks for component without hooks
    function App({name}) {
      return (
        <span>{name}</span>
      );
    }
    
    const root = ReactDOMClient.createRoot(containerForReactComponent);
    ReactTestUtils.act(() => {
      root.render(<App name="John"/>);
    });
    console.log("=== /// === UPDATE === /// ===");
    ReactTestUtils.act(() => {
      root.render(<App name="John"/>);
    });
  });
});
