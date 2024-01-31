import { SqlQuery, type SqlExpression } from './SqlQuery';
import { SqlTagDriver } from './SqlTagDriver';
import { Callable } from './util';
import EventEmitter from 'node:events';

/**
 * The event types that SqlTag emits.
 */
interface SqlTagEvents<TQueryInfo> {
  /**
   * Emitted immediately before a query is executed.
   */
  beforeQuery: (event: {
    /**
     * The compiled query text.
     */
    queryText: string;

    /**
     * The query parameters.
     */
    params: any[];
  }) => void;

  /**
   * Emitted immediately after a query is executed.
   */
  afterQuery: (event: {
    /**
     * The compiled query text.
     */
    queryText: string;

    /**
     * The query parameters.
     */
    params: any[];

    /**
     * The result rows.
     */
    rows: any[];

    /**
     * The query info.
     */
    queryInfo: TQueryInfo;

    /**
     * The time it took to execute the query in milliseconds.
     */
    ms: number;
  }) => void;
}

/**
 * Extends the SqlTag class definition to define the events that are emitted.
 */
export declare interface SqlTag<TQueryInfo, TCursorOptions> {
  on<U extends keyof SqlTagEvents<TQueryInfo>>(
    event: U,
    listener: SqlTagEvents<TQueryInfo>[U],
  ): this;

  emit<U extends keyof SqlTagEvents<TQueryInfo>>(
    event: U,
    ...args: Parameters<SqlTagEvents<TQueryInfo>[U]>
  ): boolean;
}

/**
 * Symbol used to reference the driver property on the SqlTag class within the library (the
 * property is not accessible publicly).
 */
export const _driver = Symbol('driver');

export class SqlTag<TQueryInfo, TCursorOptions> extends EventEmitter {
  [_driver]: SqlTagDriver<TQueryInfo, TCursorOptions>;

  constructor(driver: SqlTagDriver<TQueryInfo, TCursorOptions>) {
    super();
    this[_driver] = driver;
    return Callable(this);
  }

  [Callable.call]<T>(strings: TemplateStringsArray, ...values: any[]) {
    return new SqlQuery<T, TQueryInfo, TCursorOptions>(this, [...strings], values);
  }

  /**
   * Joins a list of values or expressions with a separator (default is `', '`).
   *
   * @param values The values or expressions to join.
   * @param joinWith The separator to join with.
   * @returns A SqlExpression representing the joined values.
   * @example sql.join([1, 2, 3]) // 1, 2, 3
   */
  join(values: any[], joinWith = ', '): SqlExpression {
    const filteredValues = values.filter((value) => value !== undefined);
    return new SqlQuery<never, never, never>(
      this,
      ['', ...Array(filteredValues.length - 1).fill(joinWith), ''],
      filteredValues,
    );
  }

  /**
   * Escapes an identifier (column, table, etc.).
   *
   * @param identifier The identifier to escape.
   * @returns A SqlExpression representing the escaped identifier.
   * @example sql.id('name') // `name`
   */
  id(identifier: string): SqlExpression {
    return new SqlQuery(this, [this[_driver].escapeIdentifier(identifier)], []);
  }

  /**
   * Embeds variables directly without parameterizing them.
   *
   * @param string The string to embed.
   * @returns A SqlExpression representing the raw string.
   * @example sql.raw('NOW()') // NOW()
   */
  raw(string: string): SqlExpression {
    return new SqlQuery(this, [string], []);
  }

  /**
   * Joins a series of values or expressions with 'AND', wrapped in parentheses.
   *
   * @param values The values or expressions to join.
   * @returns A SqlExpression representing the joined values.
   * @example sql.and(sql`id = ${1}`, sql`name = ${'bob'}`) // (id = 1 AND name = 'bob')
   */
  and(...values: any[]): SqlExpression {
    return this`(${this.join(values, ' AND ')})` as SqlExpression;
  }

  /**
   * Joins a series of values or expressions with 'OR', wrapped in parentheses.
   *
   * @param values The values or expressions to join.
   * @returns A SqlExpression representing the joined values.
   * @example sql.or(sql`id = ${1}`, sql`name = ${'bob'}`) // (id = 1 OR name = 'bob')
   */
  or(...values: any[]): SqlExpression {
    return this`(${this.join(values, ' OR ')})` as SqlExpression;
  }

  /**
   * Creates an IN expressions such as `id IN (1, 2, 3)`.
   *
   * If the array is empty (or all undefined values),
   * the `ifEmpty` value is used instead. This is useful when the value array is dynamic and may be empty:
   *
   * ```ts
   * sql`SELECT * FROM users WHERE ${sql.in('id', [ ... ])}`;
   * ```
   *
   * In some cases the appropriate result would be to return all rows (`WHERE 1`), or in other cases no rows (`WHERE 0`).
   *
   * @param column The column to check.
   * @param values The values to check against.
   * @param ifEmpty The value to embed in the query if the values array is empty.
   * @returns A SqlExpression representing the IN expression.
   * @example sql.in('id', [1, 2, 3]) // id IN (1, 2, 3)
   */
  in(column: string, values: any[] | undefined | null, ifEmpty: any = 0): SqlExpression {
    const filteredValues = values?.filter((value) => value !== undefined);
    if (!filteredValues?.length) return this`${ifEmpty}` as SqlExpression;
    return this`${this.id(column)} IN (${this.join(filteredValues)})` as SqlExpression;
  }

  /**
   * Generates a list of `` `column` = 'value' `` pairs for use in an `UPDATE SET` statement. You can
   * optionally include a list of properties to pick from the object.
   *
   * @param values The values to set.
   * @param pickKeys The keys to pick from the object. If omitted, all keys are used.
   * @returns A SqlExpression representing the joined values.
   * @example
   * const user = { id: 1, name: 'bob', email: '...' };
   * sql`UPDATE table SET ${sql.setValues(user, 'name', 'email')}`;
   * // UPDATE table SET `name` = ?, `email` = ?
   */
  setValues(values: any, ...pickKeys: string[]): SqlExpression {
    const keys = pickKeys.length ? pickKeys : Object.keys(values);
    const expressions = keys.map((key) => {
      return this`${this.id(key)} = ${values[key]}`;
    });
    return this.join(expressions, ', ');
  }

  /**
   * Generates a ``(`columnA`, `columnB`) VALUES (value1, value2), (value3, value4)`` type of expression
   * for use in an `INSERT` statement.
   *
   * @param values The values to insert.
   * @param pickKeys The keys to pick from the object. If omitted, all keys are used.
   * @returns A SqlExpression representing the list of values to insert.
   * @example
   * const users = [
   *   { id: 1, name: 'bob', email: '...' },
   *   { id: 2, name: 'alice', email: '...' },
   * ];
   * sql`INSERT INTO table ${sql.insertValues(users, 'name', 'email')}`;
   * // INSERT INTO table (`name`, `email`) VALUES (?, ?), (?, ?)
   */
  insertValues(values: any, ...pickKeys: string[]): SqlExpression {
    const keys = pickKeys.length
      ? pickKeys
      : Object.keys(Array.isArray(values) ? values[0] : values);
    const columns = this.join(
      keys.map((key) => this.id(key)),
      ', ',
    );
    let rows: SqlExpression;
    if (Array.isArray(values)) {
      rows = this.join(
        values.map((row) => {
          const values = this.join(keys.map((key) => row[key]));
          return this`(${values})`;
        }),
        ', ',
      );
    } else {
      const row = this.join(keys.map((key) => values[key]));
      rows = this`(${row})` as SqlExpression;
    }
    return this`(${columns}) VALUES ${rows}` as SqlExpression;
  }

  /**
   * A template tag that returns the parameterized query string, and parameters as an array.
   *
   * @example
   * sql.compile`SELECT * FROM users WHERE id = ${1}`;
   * // ['SELECT * FROM users WHERE id = ?', [1]]
   * @returns A 2-tuple containing the parameterized query string, and parameters as an array.
   */
  compile(strings: TemplateStringsArray, ...values: any[]) {
    return new SqlQuery(this, [...strings], values).compile();
  }
}

export interface SqlTag<TQueryInfo, TCursorOptions> {
  <T>(strings: TemplateStringsArray, ...values: any[]): SqlQuery<T, TQueryInfo, TCursorOptions>;
}
