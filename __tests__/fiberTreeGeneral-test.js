'use strict';

let React;
let ReactDOM;
let ReactTestUtils;

describe('fiber tree general', () => {
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

  function renderIt(reactElem) {
    ReactTestUtils.act(() => {
      ReactDOM.render(reactElem, containerForReactComponent);
    });
  }

  describe('case1', () => {
    function App() {
      console.log('=== App ===');
      const [count, setCount] = React.useState(0);

      const incrementCount = () => {
        console.log('=== incrementCount ===');
        setCount(prev => prev + 1);
      };

      return (
        <main>
          <button onClick={incrementCount}></button>
          <span>{count}</span>
        </main>
      );
    }

    it('mount', () => {
      renderIt(<App />);
    });

    it('update', () => {
      let __log = console.log;
      console.log = () => { };

      renderIt(<App />);

      console.log = __log;
      console.log('=== START UPDATE ===');

      ReactTestUtils.act(() => {
        containerForReactComponent
          .querySelector('button')
          .dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    });
  });

  describe('case2', () => {
    function App() {
      console.log('=== App ===');
      const [count, setCount] = React.useState(0);

      const incrementCount = () => {
        console.log('=== incrementCount ===');
        setCount(prev => prev + 1);
      };

      return (
        <main>
          <section>
            <button onClick={incrementCount}></button>
            <span>{count}</span>
          </section>
          <footer><p>bear</p></footer>
        </main>
      );
    }

    it('mount', () => {
      renderIt(<App />);
    });

    it('update', () => {
      let __log = console.log;
      console.log = () => { };

      renderIt(<App />);

      console.log = __log;
      console.log('=== START UPDATE ===');

      ReactTestUtils.act(() => {
        containerForReactComponent
          .querySelector('button')
          .dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    });
  });

  describe('delete1', () => {
    function App() {
      console.log('=== App ===');
      const [count, setCount] = React.useState(0);

      const incrementCount = () => {
        console.log('=== incrementCount ===');
        setCount(prev => prev + 1);
      };

      return (
        <main>
          <button onClick={incrementCount}></button>
          {count === 0 ? <span>hi</span> : null}
        </main>
      );
    }

    it('update', () => {
      let __log = console.log;
      console.log = () => { };

      renderIt(<App />);

      console.log = __log;
      console.log('=== START UPDATE ===');

      ReactTestUtils.act(() => {
        containerForReactComponent
          .querySelector('button')
          .dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    });
  });

  it('reuse_nonchanged_subtree', () => {
    function NonChanged() {
      const [count, setCount] = React.useState(0);
      return (
        <main id="left">
          <button></button>
          <span>{count}</span>
        </main>
      );
    }

    function Mutable() {
      const [count, setCount] = React.useState(0);

      const incrementCount = () => {
        setCount(prev => prev + 1);
      };

      return (
        <main id="right">
          <button onClick={incrementCount}></button>
          <span>{count}</span>
        </main>
      );
    }

    function App() {
      return (
        <div>
          <NonChanged />
          <Mutable />
        </div>
      );
    }

    let __log = console.log;
    console.log = () => { };

    renderIt(<App />);

    console.log = __log;
    console.log('=== START UPDATE ===');

    /*
      with NoLog():
        renderIt(<App />);
    */

    ReactTestUtils.act(() => {
      containerForReactComponent
        .querySelector('#right button')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
  });

  describe('memo', () => {
    function Son({ e }) {
      const [pi, setPi] = React.useState(3.14);
      return (
        <ul>
          <li id="pi" onClick={() => setPi(3.1415)}>{pi}</li>
          <li>{e}</li>
        </ul>
      );
    }

    function Father({ son }) {
      const [msg, setMsg] = React.useState("moose");

      const incrementCount = () => {
        setMsg("bear");
      };

      return (
        <main id="father">
          {son}
          <button onClick={incrementCount}></button>
          <span>{msg}</span>
        </main>
      );
    }

    it('without', () => {
      let __log = console.log;
      console.log = () => { };

      renderIt(<Father son={<Son e={2.72} />} />);

      console.log = __log;
      console.log('=== START UPDATE ===');

      ReactTestUtils.act(() => {
        containerForReactComponent
          .querySelector('#father button')
          .dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    });

    it('with', () => {
      const MemoizedSon = React.memo(Son);

      let __log = console.log;
      console.log = () => { };

      renderIt(<Father son={<MemoizedSon e={2.72} />} />);

      console.log = __log;
      console.log('=== START UPDATE ===');

      ReactTestUtils.act(() => {
        containerForReactComponent
          .querySelector('#father button')
          .dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    });

    it('with_son_update', () => {
      const MemoizedSon = React.memo(Son);

      let __log = console.log;
      console.log = () => { };

      renderIt(<Father son={<MemoizedSon e={2.72} />} />);

      console.log = __log;
      console.log('=== START UPDATE ===');

      ReactTestUtils.act(() => {
        containerForReactComponent
          .querySelector('#pi')
          .dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    });
  });
});
