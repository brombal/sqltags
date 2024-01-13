import { SqlTagBase } from '@sqltags/core';
import { type Client, type Pool, type PoolClient, type QueryResult } from 'pg';
import Cursor from 'pg-cursor';

function isPool(client: Client | Pool): client is Pool {
  return 'idleCount' in client;
}

export class SqlTag extends SqlTagBase<QueryResult> {
  constructor(private client: Client | Pool) {
    super();
  }

  parameterizeValue(_value: any, _paramIndex: number) {
    return `$${_paramIndex + 1}`;
  }

  escapeIdentifier(identifier: string) {
    // Not using the one from 'pg' library because it requires a connection instance which doesn't work with the pool
    // Ported from PostgreSQL 9.2.4 source code in src/interfaces/libpq/fe-exec.c
    return '"' + identifier.replace(/"/g, '""') + '"';
  }

  // Note that values are not serialized using the default sqltags serialization.
  // Instead, they are passed as-is and serialized according to this:
  // https://node-postgres.com/features/queries#parameterized-query
  serializeValue(value: any) {
    return value;
  }

  async query(sql: string, params: any[]): Promise<[any[], QueryResult]> {
    const res = await this.client.query(sql, params);
    return [res.rows, res];
  }

  cursor(sql: string, params: any[]): AsyncIterable<any> {
    let _client: Client | PoolClient;
    let cursor: Cursor<any>;
    const queue: any[] = [];

    return {
      [Symbol.asyncIterator]: () => ({
        next: async () => {
          if (!_client) {
            _client = isPool(this.client) ? await this.client.connect() : this.client;
            cursor = _client.query(new Cursor(sql, params));
          }

          if (queue.length > 0) {
            return { done: false, value: queue.shift() };
          }

          try {
            const res = await cursor.read(100);
            if (res.length === 0) {
              await cursor.close();
              if (isPool(this.client)) (_client as PoolClient).release();
              return { done: true, value: undefined };
            }

            queue.push(...res);
            return { done: false, value: queue.shift() };
          } catch (err: any) {
            await cursor.close();
            if (isPool(this.client)) (_client as PoolClient).release();
            throw err;
          }
        },
      }),
    };
  }
}
