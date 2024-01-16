/**
 * This is the interface that must be implemented to create a custom database driver for SqlTags.
 * @see See the [@sqltags/core README file](https://github.com/brombal/sqltags) for more information and examples.
 */
export interface SqlTagDriver<TQueryInfo, TCursorOptions> {
  /**
   * Returns the placeholder string to use in a parameterized query.
   * E.g. For MySQL, you would return `?` for each parameter.
   *      For PostgreSQL, you would return `$1`, `$2`, etc.
   *
   * @param value The value to parameterize.
   * @param paramIndex The index of the parameter.
   * @returns The placeholder string.
   */
  parameterizeValue(value: any, paramIndex: number): string;

  /**
   * Can optionally be overridden to serialize or preprocess values before they are passed as parameters to the
   * database. By default, values are passed as-is.
   *
   * @param value The value to serialize.
   * @returns The serialized value.
   */
  serializeValue?(value: unknown): any;

  /**
   * Escapes an identifier (e.g. a table or column name).
   *
   * @param identifier The identifier to escape.
   * @returns The escaped identifier.
   */
  escapeIdentifier(identifier: string): string;

  /**
   * Executes a parameterized query and returns the results.
   *
   * @param sql The parameterized SQL query to execute.
   * @param params The parameter values passed to the query.
   * @returns A promise that resolves with the results of the query, and any additional query information such as
   * column definitions, rows modified, etc.
   */
  query(sql: string, params: any[]): Promise<[any[], TQueryInfo]>;

  /**
   * Executes a parameterized query and returns an async iterator that yields each result row by row.
   * This could be implemented as an async generator function, or by returning an AsyncIterable object.
   *
   * e.g.:
   *
   * ```ts
   *   async *cursor(...) {
   *     // yield
   *   }
   *   // or...
   *   cursor(...) {
   *     return {
   *       [Symbol.asyncIterator]: () => ({
   *         next: async () => {
   *         }
   *       })
   *     }
   *   }
   * ```
   *
   * @param sql The parameterized SQL query to execute.
   * @param params The parameter values passed to the query.
   * @param options Additional options for the cursor.
   * @returns An async iterator that yields the results of the query.
   */
  cursor(sql: string, params: any[], options?: TCursorOptions): AsyncIterable<any>;
}
