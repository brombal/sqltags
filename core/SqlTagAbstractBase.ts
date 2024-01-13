import { defaultSerializeValue } from './util';

/**
 * This is the base class that must be implemented to create a database driver for SQLTags.
 * It's only defined separately from the SqlTag class to make it easier to reference.
 */
export abstract class SqlTagAbstractBase<TQueryInfo> {
  /**
   * Returns the string to use for a parameterized value.
   * E.g. For MySQL, you would return `?` for each parameter
   *      For PostgreSQL, you would return `$1`, `$2`, etc.
   */
  abstract parameterizeValue(value: any, paramIndex: number): string;

  /**
   * Serializes values that cannot be passed as parameters to the driver (e.g. arrays, objects, etc.)
   * By default, objects and arrays are serialized as JSON strings. Dates are serialized using .toISOString().
   * All other values are unchanged.
   *
   * If you implement this method and wish to use the default behavior, you can use the
   * defaultSerializeValue() helper.
   */
  serializeValue(value: unknown): any {
    return defaultSerializeValue(value)
  }

  /**
   * Escapes an identifier (e.g. a table or column name).
   */
  abstract escapeIdentifier(identifier: string): string;

  /**
   * Executes a parameterized query and returns the results.
   */
  abstract query(sql: string, params: any[]): Promise<[any[], TQueryInfo]>;

  /**
   * Executes a parameterized query and returns an async iterator that yields the results.
   */
  abstract cursor(sql: string, params: any[]): AsyncIterable<any>;
}
