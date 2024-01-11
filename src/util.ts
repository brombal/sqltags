export function defaultSerializeValue(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value) || typeof value === 'object') return JSON.stringify(value);
  return value;
}

export function Callable(obj: any) {
  return Object.assign(
    Object.setPrototypeOf(function callable(...args: any[]) {
      return obj[Callable.call](...args);
    }, obj.constructor.prototype),
    obj,
  );
}

Callable.call = Symbol('_call');
