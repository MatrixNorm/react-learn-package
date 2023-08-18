'use strict';

describe('root API', () => {
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

  function App() {
    console.log('=== App ===');
    const [count, setCount] = React.useState(0);

    return (
      <span>{count}</span>
    );
  }

  it('new_act', () => {
    ReactTestUtils.act(() => {
      const root = ReactDOMClient.createRoot(containerForReactComponent);
      root.render(<App/>);
    });
  });

  it('new_noact', () => {
      const root = ReactDOMClient.createRoot(containerForReactComponent);
      root.render(<App/>);
      console.log(document.body.innerHTML)
  });

  it('old_act', () => {
    ReactTestUtils.act(() => {
      ReactDOM.render(<App/>, containerForReactComponent);
    });
  });

  it('old_noact', () => {
    ReactDOM.render(<App/>, containerForReactComponent);
    console.log(document.body.innerHTML)
  });
});
