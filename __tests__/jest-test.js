'use strict';

describe('jest', () => {

  describe('case1', () => {
    it('aaa', () => {
      queueMicrotask(() => console.log("bear"));
      console.log("racoon");
    });
  
    it('bbb', () => {
      queueMicrotask(() => console.log("avocado"));
      console.log("ransom");
    });  
  });

  describe('case2', () => {
    it('aaa', async () => {
      queueMicrotask(() => console.log("bear"));
      await new Promise(queueMicrotask);
      console.log("racoon");
    });
  
    it('bbb', async () => {
      queueMicrotask(() => console.log("avocado"));
      await new Promise(queueMicrotask);
      console.log("ransom");
    });  
  })

  
});
