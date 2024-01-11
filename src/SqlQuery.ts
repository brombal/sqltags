import { defaultSerializeValue } from './util';
import { type SqlTemplateDriver } from './SqlTemplateDriver';

export type SqlExpression = SqlQuery<never, never>;

export type SqlQueryResult<TResult, TQueryInfo> = [TResult[], TQueryInfo];

export class SqlQuery<TResult, TQueryInfo> extends Promise<SqlQueryResult<TResult, TQueryInfo>> {
  constructor(
    private config: SqlTemplateDriver<any>,
    private templateStrings: string[],
    private values: any[],
  ) {
    super((resolve) => resolve(null!));
  }

  async then<TResult1 = SqlQueryResult<TResult, TQueryInfo>, TResult2 = never>(
    onfulfilled?:
      | ((value: SqlQueryResult<TResult, TQueryInfo>) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    const [text, params] = this.compile();
    return this.config.query(text, params).then(onfulfilled, onrejected);
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
        const serializedValue = this.config.serializeValue
          ? this.config.serializeValue(value)
          : defaultSerializeValue(value);
        sql += this.config.parameterizeValue(serializedValue, params.length);
        params.push(serializedValue);
      }
    }

    return [sql, params];
  }

  cursor(): AsyncIterable<TResult> {
    const [sql, params] = this.compile();
    return this.config.cursor(sql, params);
  }
}
