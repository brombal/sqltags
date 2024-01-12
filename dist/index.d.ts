import { Connection, FieldPacket, PoolConnection } from "mysql2";
import { Client, Pool, QueryResult } from "pg";
import { Database } from "sqlite3";
export function defaultSerializeValue(value: unknown): {} | undefined;
export declare namespace Callable {
    var call: symbol;
}
/**
 * This is the interface that must be implemented to create a database driver for sqlBuilder.
 */
export interface SqlTemplateDriver<TQueryInfo> {
    /**
     * Returns the string to use for a parameterized value.
     * E.g. For mysql, you would return `?` for each parameter
     *      For postgres, you would return `$1`, `$2`, etc.
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
export type SqlExpression = SqlQuery<never, never>;
type SqlQueryResult<TResult, TQueryInfo> = [TResult[], TQueryInfo, string, any[]];
export class SqlQuery<TResult, TQueryInfo> extends Promise<SqlQueryResult<TResult, TQueryInfo>> {
    constructor(config: SqlTemplateDriver<any>, templateStrings: string[], values: any[]);
    then<TResult1 = SqlQueryResult<TResult, TQueryInfo>, TResult2 = never>(onfulfilled?: ((value: SqlQueryResult<TResult, TQueryInfo>) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    compile(params?: any[]): [string, any[]];
    cursor(): AsyncIterable<TResult>;
}
export class SqlTag<TQueryInfo> {
    driver: SqlTemplateDriver<TQueryInfo>;
    constructor(driver: SqlTemplateDriver<TQueryInfo>);
    join(values: any[], joinWith?: string): SqlExpression;
    id(identifier: string): SqlExpression;
    and(...values: any[]): SqlExpression;
    or(...values: any[]): SqlExpression;
    in(column: string, values: any[], ifEmpty?: any): SqlExpression;
    setValues(values: any, ...pickKeys: string[]): SqlExpression;
    insertValues(values: any, ...pickKeys: string[]): SqlExpression;
    compile(strings: TemplateStringsArray, ...values: any[]): [string, any[]];
}
/**
 * Extended definition for the template tag function.
 */
export interface SqlTag<TQueryInfo> {
    <T>(strings: TemplateStringsArray, ...values: any[]): SqlQuery<T, TQueryInfo>;
}
export function mysqlDriver(connection: Connection | PoolConnection): SqlTemplateDriver<FieldPacket[]>;
export function pgDriver(client: Client | Pool): SqlTemplateDriver<QueryResult>;
export function sqliteDriver(client: Database): SqlTemplateDriver<undefined>;

//# sourceMappingURL=index.d.ts.map
