import { Callable } from '@sqltags/core/util';

describe('callable', () => {
  class MyCallable {
    constructor(public value: any) {
      return Callable(this);
    }

    [Callable.call](...args: any[]) {
      return this.value;
    }
  }

  interface MyCallable {
    (): any;
  }

  class MyCallableSub extends MyCallable {
    constructor(public value: any, public value2: any) {
      super(value);
    }

    [Callable.call](...args: any[]) {
      return this.value + this.value2;
    }
  }

  interface MyCallable {
    (): any;
  }

  test('calling class works', () => {
    const c = new MyCallable(5);

    expect(c()).toBe(5);
  });

  test('calling subclass works', () => {
    const c = new MyCallableSub(5, 10);

    expect(c()).toBe(15);
  })
})