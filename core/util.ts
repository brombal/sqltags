export function defaultSerializeValue(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value) || typeof value === 'object') return JSON.stringify(value);
  return value;
}

export function Callable(obj: any) {
  const c = Object.assign(
    Object.setPrototypeOf(function callable(...args: any[]) {
      return c[Callable.call](...args);
    }, obj.constructor.prototype),
    obj,
  );
  return c;
}

Callable.call = Symbol('_call');
