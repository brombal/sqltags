/**
 * This is the interface that must be implemented to create a database driver for sqlBuilder.
 */
export interface SqlTemplateDriver<TQueryInfo> {
  /**
   * Returns the string to use for a parameterized value.
   * E.g. For MySQL, you would return `?` for each parameter
   *      For PostgreSQL, you would return `$1`, `$2`, etc.
   */
  parameterizeValue(value: any, paramIndex: number): string;

  /**
   * Serializes values that cannot be passed as parameters to the driver (e.g. arrays, objects, etc.)
   * By default, objects and arrays are serialized as JSON strings. Dates are serialized using .toISOString().
   * All other values are unchanged.
   *
   * If you implement this method and wish to use the default behavior, you can use the
   * defaultSerializeValue() helper.
   */
  serializeValue?(value: unknown): any;

  /**
   * Escapes an identifier (e.g. a table or column name).
   */
  escapeIdentifier(identifier: string): string;

  /**
   * Executes a parameterized query and returns the results.
   */
  query(sql: string, params: any[]): Promise<[any[], TQueryInfo]>;

  /**
   * Executes a parameterized query and returns an async iterator that yields the results.
   */
  cursor(sql: string, params: any[]): AsyncIterable<any>;
}