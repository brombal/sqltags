import { SqlQuery, type SqlExpression } from './SqlQuery';
import { SqlTagAbstractBase } from './SqlTagAbstractBase';
import { Callable } from './util';

export abstract class SqlTagBase<TQueryInfo> extends SqlTagAbstractBase<TQueryInfo> {
  constructor() {
    super();
    return Callable(this);
  }

  [Callable.call]<T>(strings: TemplateStringsArray, ...values: any[]) {
    return new SqlQuery<T, TQueryInfo>(this, [...strings], values);
  }

  join(values: any[], joinWith = ', '): SqlExpression {
    const filteredValues = values.filter((value) => value !== undefined);
    return new SqlQuery(
      this,
      ['', ...Array(filteredValues.length - 1).fill(joinWith), ''],
      filteredValues,
    );
  }

  id(identifier: string): SqlExpression {
    return new SqlQuery(this, [this.escapeIdentifier(identifier)], []);
  }

  and(...values: any[]): SqlExpression {
    return this`(${this.join(values, ' AND ')})` as SqlExpression;
  }

  or(...values: any[]): SqlExpression {
    return this`(${this.join(values, ' OR ')})` as SqlExpression;
  }

  in(column: string, values: any[], ifEmpty: any = 0): SqlExpression {
    const filteredValues = values.filter((value) => value !== undefined);
    if (!filteredValues.length) return this`${ifEmpty}` as SqlExpression;
    return this`${this.id(column)} IN (${this.join(filteredValues)})` as SqlExpression;
  }

  setValues(values: any, ...pickKeys: string[]): SqlExpression {
    const keys = pickKeys.length ? pickKeys : Object.keys(values);
    const expressions = keys.map((key) => {
      return this`${this.id(key)} = ${values[key]}`;
    });
    return this.join(expressions, ', ');
  }

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

  compile(strings: TemplateStringsArray, ...values: any[]) {
    return new SqlQuery(this, [...strings], values).compile();
  }
}

/**
 * Extended definition for the template tag function.
 */
export interface SqlTagBase<TQueryInfo> {
  <T>(strings: TemplateStringsArray, ...values: any[]): SqlQuery<T, TQueryInfo>;
}
