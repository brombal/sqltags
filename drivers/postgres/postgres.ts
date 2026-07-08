import { SqlTag } from '@sqltags/core';
import { type Pool, type PoolClient, type QueryResult, type Submittable } from 'pg';
import Cursor, { type CursorQueryConfig } from 'pg-cursor';

/**
 * The minimal structural interface that `createPgTag` needs from a pg client.
 *
 * We intentionally avoid requiring pg's concrete `Client` class here: a
 * connection checked out via `pool.connect()` is a `PoolClient`, which is NOT
 * assignable to `Client` (it's missing `Client`-only members like `port`,
 * `host`, `end`, etc.) even though it is fully compatible for our purposes.
 * `Client`, `PoolClient`, and `Pool` all satisfy `Queryable`, so callers can
 * pass any of them - including a connection checked out via `pool.connect()`
 * (e.g. to run an explicit BEGIN/COMMIT transaction on a single connection) -
 * without an unsafe cast.
 *
 * The two overloads mirror the subset of pg's `query` that this driver uses:
 * the string form for ordinary parameterized queries, and the `Submittable`
 * form for submitting a cursor.
 */
export interface Queryable {
  query<T extends Submittable>(queryStream: T): T;
  query(queryText: string, values: any[]): Promise<QueryResult>;
}

// A Pool is also Queryable, but adds connect()/idleCount for checking out a
// dedicated connection - which the cursor path needs. Narrowing to Pool lets us
// reach those members without requiring every caller to be a Pool.
function isPool(client: Queryable): client is Queryable & Pool {
  return 'idleCount' in client;
}

export function createPgTag(client: Queryable) {
  return new SqlTag<QueryResult, CursorQueryConfig>({
    parameterizeValue(_value: any, _paramIndex: number) {
      return `$${_paramIndex + 1}`;
    },

    escapeIdentifier(identifier: string) {
      // Not using the one from 'pg' library because it requires a connection instance which doesn't work with the pool
      // Ported from PostgreSQL 9.2.4 source code in src/interfaces/libpq/fe-exec.c
      return '"' + identifier.replace(/"/g, '""') + '"';
    },

    // Note that values are not serialized using the default sqltags serialization.
    // Instead, they are passed as-is and serialized according to this:
    // https://node-postgres.com/features/queries#parameterized-query
    serializeValue(value: any) {
      return value;
    },

    async query(sql: string, params: any[]): Promise<[any[], QueryResult]> {
      const res = await client.query(sql, params);
      return [res.rows, res];
    },

    cursor(sql: string, params: any[], options?: CursorQueryConfig): AsyncIterable<any> {
      let _client: Queryable;
      let cursor: Cursor<any>;
      const queue: any[] = [];

      return {
        [Symbol.asyncIterator]: () => ({
          next: async () => {
            if (!_client) {
              _client = isPool(client) ? await client.connect() : client;
              cursor = _client.query(new Cursor(sql, params, options));
            }

            if (queue.length > 0) {
              return { done: false, value: queue.shift() };
            }

            try {
              const res = await cursor.read(100);
              if (res.length === 0) {
                await cursor.close();
                if (isPool(client)) (_client as PoolClient).release();
                return { done: true, value: undefined };
              }

              queue.push(...res);
              return { done: false, value: queue.shift() };
            } catch (err: any) {
              await cursor.close();
              if (isPool(client)) (_client as PoolClient).release();
              throw err;
            }
          },
        }),
      };
    },
  });
}
