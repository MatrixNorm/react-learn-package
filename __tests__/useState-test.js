'use strict';

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

  function renderIt_noact(reactElem) {
    const root = ReactDOMClient.createRoot(containerForReactComponent);
    root.render(reactElem);
  }

  function renderIt_noact_legacy(reactElem) {
      ReactDOM.render(reactElem, containerForReactComponent);
  }

  it('mount', () => {
    function App() {
      console.log('=== App ===');
      const [count, setCount] = React.useState(0);

      return (
        <span>{count}</span>
      );
    }
    renderIt(<App />);
  });

  it('mount_noact', () => {
    function App() {
      console.log('=== App ===');
      const [count, setCount] = React.useState(0);

      return (
        <span>{count}</span>
      );
    }
    renderIt_noact(<App />);
  });

  it('mount_noact_legacy', () => {
    function App() {
      console.log('=== App ===');
      const [count, setCount] = React.useState(0);

      return (
        <span>{count}</span>
      );
    }
    renderIt_noact_legacy(<App />);
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

    // let __log = console.log;
    // console.log = () => { };
    renderIt(<App />);
    // console.log = __log;
    console.log('=== UPDATE ===');

    ReactTestUtils.act(() => {
      containerForReactComponent
        .querySelector('button')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
  });


});
