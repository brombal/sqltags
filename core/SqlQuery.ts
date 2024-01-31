import { _driver, SqlTag } from './SqlTag';

export type SqlExpression = SqlQuery<never, never, never>;

export type SqlQueryResult<TResult, TQueryInfo> = [TResult[], TQueryInfo, string, any[]];

export class SqlQuery<TResult, TQueryInfo, TCursorOptions> extends Promise<
  SqlQueryResult<TResult, TQueryInfo>
> {
  constructor(
    private sqlTag: SqlTag<any, any>,
    private templateStrings: string[],
    private values: any[],
  ) {
    super((resolve) => resolve(null!));
  }

  then<TResult1 = SqlQueryResult<TResult, TQueryInfo>, TResult2 = never>(
    onfulfilled?:
      | ((value: SqlQueryResult<TResult, TQueryInfo>) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    const now = performance.now();
    const [queryText, params] = this.compile();
    this.sqlTag.emit('beforeQuery', { queryText, params });
    return this.sqlTag[_driver].query(queryText, params).then(([rows, queryInfo]) => {
      this.sqlTag.emit('afterQuery', { queryText, params, rows, queryInfo, ms: performance.now() - now });
      return onfulfilled!([rows, queryInfo, queryText, params]);
    }, onrejected);
  }

  compile(params?: any[]): [string, any[]] {
    if (!params) params = [];
    let sql = '';

    for (let i = 0; i < this.templateStrings.length; i++) {
      sql += this.templateStrings[i];
      const value = this.values[i];

      if (value === undefined) continue;

      if (value instanceof SqlQuery) {
        const [subSql] = value.compile(params);
        sql += subSql;
      } else {
        const serializedValue = this.sqlTag[_driver].serializeValue
          ? this.sqlTag[_driver].serializeValue(value)
          : value;
        sql += this.sqlTag[_driver].parameterizeValue(serializedValue, params.length);
        params.push(serializedValue);
      }
    }

    return [sql, params];
  }

  cursor(options?: TCursorOptions): AsyncIterable<TResult> {
    const [queryText, params] = this.compile();
    this.sqlTag.emit('beforeQuery', { queryText, params });
    return this.sqlTag[_driver].cursor(queryText, params, options);
  }
}
