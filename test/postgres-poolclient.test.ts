import { createPgTag, type Queryable } from '../drivers/postgres/postgres';
import type { PoolClient, QueryResult } from 'pg';

// Regression tests for the type of `createPgTag`'s argument.
//
// `createPgTag` used to require pg's concrete `Client` (or `Pool`) class. But
// `pool.connect()` returns a `PoolClient`, which is NOT assignable to `Client`,
// so passing a checked-out connection (a common pattern for explicit
// BEGIN/COMMIT transactions on a single connection) forced an unsafe cast even
// though a `PoolClient` is fully runtime-compatible. `createPgTag` now accepts
// a minimal structural `Queryable`, which `Client`, `PoolClient`, and `Pool`
// all satisfy.
//
// This test runs against a mock so it needs no live database, unlike the
// Docker-backed tests in postgres.test.ts.
describe('pg PoolClient', () => {
  test('accepts a PoolClient-shaped client through the non-cursor query path', async () => {
    const calls: Array<{ sql: string; params: any[] }> = [];

    // Minimal stand-in for what createPgTag uses from a client. Typed as
    // Queryable (which PoolClient satisfies) so the object stays type-checked.
    const client: Queryable = {
      query(sql: any, params?: any): any {
        calls.push({ sql, params });
        return Promise.resolve({
          rows: [{ id: 1, name: 'Alex' }],
          fields: [],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
        } as unknown as QueryResult);
      },
    };

    const sql = createPgTag(client);
    const rows = await sql`SELECT * FROM users WHERE id = ${1}`;

    // The query path delegates straight to client.query(sql, params) - no
    // connect()/release() involved, which is exactly right for a live
    // connection like a PoolClient.
    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toBe('SELECT * FROM users WHERE id = $1');
    expect(calls[0].params).toEqual([1]);
    expect([...rows]).toEqual([{ id: 1, name: 'Alex' }]);
  });
});

// Type-level regression guard (never executed): a real `PoolClient`, as
// returned by `pool.connect()`, must be assignable to createPgTag's parameter
// without a cast. If the parameter regresses to requiring `Client`, this fails
// to compile.
() => {
  const _acceptsPoolClient = (client: PoolClient) => createPgTag(client);
  void _acceptsPoolClient;
};
