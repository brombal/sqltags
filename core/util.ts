export function Callable(obj: any) {
  const callable = Object.assign(
    Object.setPrototypeOf(function callableWrapper(...args: any[]) {
      return callable[Callable.call](...args);
    }, obj.constructor.prototype),
    obj,
  );
  return callable;
}

Callable.call = Symbol('_call');

