'use strict';

let React;
let ReactDOM;
let ReactTestUtils;

describe('useState hook', () => {
  // ???
  let containerForReactComponent = null;

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

  it('mount', () => {
    function App() {
      console.log('=== App ===');
      const [count, setCount] = React.useState(0);

      return (
        <span>{count}</span>
      );
    }

    console.log('=== START INITIAL RENDER ===');

    ReactTestUtils.act(() => {
      ReactDOM.render(<App />, containerForReactComponent);
    });
    
    console.log('=== DONE INITIAL RENDER ===');
  });

  it('update', () => {
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

    let __log = console.log;
    console.log = () => { };

    ReactTestUtils.act(() => {
      ReactDOM.render(<App />, container);
    });

    console.log = __log;
    console.log('=== UPDATE ===');

    ReactTestUtils.act(() => {
      container
        .querySelector('button')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
  });


});
