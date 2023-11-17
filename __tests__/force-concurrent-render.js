'use strict';

function __queue(label) {
  const msg = label ? `wait for microtasks ${label}` : 'wait for microtasks';
  const line = '-'.repeat(21 + label.toString().length);
  console.log(line + '\n', msg, '\n' + line);
  return new Promise(queueMicrotask);
}

describe('force concurrent render', () => {
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
    await __queue(1);
    Scheduler.unstable_flushUntilNextPaint();
    console.log(document.body.innerHTML);
    await __queue(2);
    global.__matrixnorm_force_concurrent_render = true;
    incrementCount();
    await __queue(3);
    Scheduler.unstable_flushUntilNextPaint();
    await __queue(4);
    Scheduler.unstable_flushUntilNextPaint();
    await __queue(5);
    console.log(document.body.innerHTML);
    console.log('end of test');
  });

  it('t2 interrupt render', async () => {
    let incrementCount;

    function App() {
      console.log('=== App ===');
      const [count, setCount] = React.useState(0);
      const [word, setWord] = React.useState('A');

      incrementCount = () => {
        console.log('=== increment Count ===');
        setCount(prev => prev + 1);
      };

      const incrementWord = () => {
        console.log('=== increment Word ===');
        setWord('B');
      };

      return (
        <div>
          <div>{count}</div>
          <div>{word}</div>
          <button onClick={incrementWord}></button>
        </div>
      );
    }

    CONSOLE_LOG = console.log;
    console.log = () => {};

    const root = ReactDOMClient.createRoot(containerForReactComponent);
    root.render(<App />);
    await __queue(1);
    Scheduler.unstable_flushUntilNextPaint();
    console.log(document.body.innerHTML);
    await __queue(2);

    console.log = CONSOLE_LOG;

    console.log(
      ' *******************************************************************************\n',
      '***************** UPDATE COUNT   UPDATE COUNT   UPDATE COUNT *******************\n',
      '********************************************************************************'
    );
    global.__matrixnorm_force_concurrent_render = true;
    global.__matrixnorm_enableFiberTreeTracing = true;
    incrementCount();
    await __queue(3);
    Scheduler.unstable_flushUntilNextPaint();
    await __queue(4);
    // >>> если закоментить две строки ниже, то построение рабочего фибер-дерева не дойдёт до
    // App фиберы и апдейт не будет перемещён в baseQueue хука и останется в queue.pending
    Scheduler.unstable_flushUntilNextPaint();
    await __queue('4.1');
    // <<<
    console.log(Scheduler.getTaskQueue());
    console.log(document.body.innerHTML);

    console.log(
      ' ******************************************************************************\n',
      '****************** UPDATE WORD   UPDATE WORD   UPDATE WORD ********************\n',
      '*******************************************************************************'
    );
    /* Прерываем построение нового фибер-дерева новым апдейтом в хуке Word с синхронным приоритетом.
     * Это выбросит на свалку уже сделанную работу. При этом предыдущий апдейт останется в
     * хуке Count активного фибер-дерева в baseQueue или queue.pending, так апдеёт будет применён позже.
     * ХХХ: не предусмотрена отмена апдейта в Count, ведь апдейт в Word может сделать его неактуальным.
     */
    containerForReactComponent
      .querySelector('button')
      .dispatchEvent(new MouseEvent('click', {bubbles: true}));
    await __queue(5);
    console.log(Scheduler.getTaskQueue());
    console.log(document.body.innerHTML);

    console.log(
      ' *******************************************************************************\n',
      '***************** UPDATE COUNT 2 UPDATE COUNT 2 UPDATE COUNT 2 ******************\n',
      '*********************************************************************************'
    );

    global.__matrixnorm_force_concurrent_render = false;
    Scheduler.unstable_flushUntilNextPaint();
    await __queue(6);
    console.log(document.body.innerHTML);
    console.log('end of test');
  });

  it('t3 interrupt render and issue another concurrent update', async () => {
    let incrementCount;

    function App() {
      console.log('=== App ===');
      const [count, setCount] = React.useState(0);
      const [word, setWord] = React.useState('A');

      incrementCount = () => {
        console.log('=== increment Count ===');
        setCount(prev => prev + 1);
      };

      const incrementWord = () => {
        console.log('=== increment Word ===');
        setWord('B');
      };

      return (
        <div>
          <div>{count}</div>
          <div>{word}</div>
          <button onClick={incrementWord}></button>
        </div>
      );
    }

    CONSOLE_LOG = console.log;
    console.log = () => {};

    const root = ReactDOMClient.createRoot(containerForReactComponent);
    root.render(<App />);
    await __queue(1);
    Scheduler.unstable_flushUntilNextPaint();
    console.log(document.body.innerHTML);
    await __queue(2);

    console.log = CONSOLE_LOG;

    console.log(
      ' *******************************************************************************\n',
      '***************** UPDATE COUNT   UPDATE COUNT   UPDATE COUNT *******************\n',
      '********************************************************************************'
    );
    global.__matrixnorm_force_concurrent_render = true;
    global.__matrixnorm_enableFiberTreeTracing = true;
    incrementCount();
    await __queue(3);
    Scheduler.unstable_flushUntilNextPaint();
    await __queue(4);
    // >>>
    Scheduler.unstable_flushUntilNextPaint();
    await __queue('4.1');
    // <<<
    console.log(Scheduler.getTaskQueue());
    console.log(document.body.innerHTML);

    console.log(
      ' ******************************************************************************\n',
      '****************** UPDATE WORD   UPDATE WORD   UPDATE WORD ********************\n',
      '*******************************************************************************'
    );

    containerForReactComponent
      .querySelector('button')
      .dispatchEvent(new MouseEvent('click', {bubbles: true}));
    await __queue(5);
    console.log(Scheduler.getTaskQueue());
    console.log(document.body.innerHTML);

    console.log(
      ' *******************************************************************************\n',
      '***************** UPDATE COUNT 2 UPDATE COUNT 2 UPDATE COUNT 2 ******************\n',
      '*********************************************************************************'
    );

    global.__matrixnorm_force_concurrent_render = false;
    incrementCount();
    await __queue(6);
    Scheduler.unstable_flushUntilNextPaint();
    await __queue(7);
    console.log(document.body.innerHTML);
    console.log('end of test');
  });
});
