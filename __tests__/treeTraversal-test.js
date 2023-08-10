'use strict';

let React;
let ReactDOM;
let ReactTestUtils;

describe('useState hook', () => {
  // ???
  let containerForReactComponent= null;

  beforeEach(() => {
    jest.resetModules(); // ???
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');

    containerForReactComponent = document.createElement('div');
    document.body.appendChild(containerForReactComponent);
  });

  afterEach(() => {
    document.body.removeChild(containerForReactComponent);
    containerForReactComponent = null;
  });

  it('numero1', () => {
    function App() {
      console.log('=== App ===');
      return (
        <div>
          <Child />
          <span>master kkk</span>
        </div>
      );
    }

    function Child() {
      console.log('=== Child ===');
      return (
        <p>
          <i>bear</i>
        </p>
      );
    }

    ReactTestUtils.act(() => {
      ReactDOM.render(<App />, containerForReactComponent);
    });
  });
});
