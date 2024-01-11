import { SqlTag, defaultSerializeValue } from '../src/index';

type MockQueryInfo = [string, ...any[]];

type User = {
  id: number;
  name: string;
  email: string;
};

const testUsers: User[] = [
  { id: 1, name: 'Alex', email: 'alex@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
];

const mockSql = (serializeValue?: (value: unknown) => any) =>
  new SqlTag<MockQueryInfo>({
    parameterizeValue(_value: any, paramIndex: number) {
      return `$${paramIndex + 1}`;
    },
    serializeValue,
    escapeIdentifier(identifier: string) {
      return `\`${identifier.replace(/`/g, '``')}\``;
    },
    query: jest.fn(async (sql: string, params: any[]): Promise<[any[], MockQueryInfo]> => {
      if (sql === 'SELECT bad syntax') throw new Error('bad syntax');

      // mock returns dummy data and sql and params for testing
      return [testUsers, [sql.trim(), ...params]];
    }),
    cursor: jest.fn(async function* (_sql: string, _params: any[]): AsyncIterable<any> {
      for (const user of testUsers) {
        yield user;
      }
    }),
  });

describe('sql tag', () => {
  test('interpolate value', async () => {
    const sql = mockSql();
    const res = sql<User>`SELECT * FROM users WHERE id = ${1} AND name = ${'bob'}`;
    const [users, info] = await res;
    expect(users).toEqual(testUsers);
    expect(info).toEqual(['SELECT * FROM users WHERE id = $1 AND name = $2', 1, 'bob']);
    expect(sql.driver.query).toHaveBeenCalledTimes(1);
  });

  test('interpolate identifier', async () => {
    const sql = mockSql();
    const table = 'users';
    const [users, info] = await sql<User>`SELECT * FROM ${sql.id(table)}`;
    expect(users).toEqual(testUsers);
    expect(info).toEqual(['SELECT * FROM `users`']);
  });

  test('interpolate nested expression', async () => {
    const sql = mockSql();
    const [users, info] =
      await sql<User>`SELECT * FROM users ${sql`WHERE id = ${1}`} ${sql`AND name = ${'bob'}`}`;
    expect(users).toEqual(testUsers);
    expect(info).toEqual(['SELECT * FROM users WHERE id = $1 AND name = $2', 1, 'bob']);
    expect(sql.driver.query).toHaveBeenCalledTimes(1);
  });

  test('interpolate undefined', async () => {
    const sql = mockSql();
    const [_users, info] = await sql<User>`SELECT * FROM users ${undefined}`;
    expect(info).toEqual(['SELECT * FROM users']);
  });

  test('custom serialization', async () => {
    const sql = mockSql(function serializeValue(value: unknown): any {
      if (value === 'special-value') return 'serialized:special-value';
      return defaultSerializeValue(value);
    });
    const [, info] = await sql<User>`SELECT * FROM users WHERE value = ${'special-value'}`;
    expect(info).toEqual(['SELECT * FROM users WHERE value = $1', 'serialized:special-value']);
  });

  test('join', async () => {
    const sql = mockSql();
    const [, info] = await sql<number>`SELECT * FROM users WHERE id IN (${sql.join([1, 2, 3])})`;
    expect(info).toEqual(['SELECT * FROM users WHERE id IN ($1, $2, $3)', 1, 2, 3]);
  });

  test('join identifiers and expressions with custom joiner', async () => {
    const sql = mockSql();
    const [, info] = await sql<User>`
      SELECT ${sql.join([sql.id('name'), sql.id('email')])} 
      FROM users 
      WHERE ${sql.join([sql`id = ${1}`, sql`name = ${'Alex'}`], ' AND ')}`;
    expect(info).toEqual([
      `SELECT \`name\`, \`email\` 
      FROM users 
      WHERE id = $1 AND name = $2`,
      1,
      'Alex',
    ]);
  });

  test('join escaped values omits undefined', async () => {
    const sql = mockSql();
    const [, info] = await sql<User>`SELECT * FROM users WHERE id IN (${sql.join([
      1,
      undefined,
      3,
    ])})`;
    expect(info).toEqual(['SELECT * FROM users WHERE id IN ($1, $2)', 1, 3]);
  });

  test('cursor', async () => {
    const sql = mockSql();
    const res = sql<User>`SELECT * FROM users`.cursor();

    let count = 0;
    for await (const user of res) {
      expect(user).toEqual(testUsers[count]);
      count++;
    }
    expect(count).toEqual(2);
  });

  test('and/or', async () => {
    const sql = mockSql();
    const [, info] = await sql<User>`
      SELECT * FROM users
      WHERE ${sql.and(
        //
        sql`id = ${1}`,
        sql`name = ${'Alex'}`,
        sql.or(
          //
          sql`status = ${'active'}`,
          sql`status = ${'pending'}`,
        ),
      )}`;

    expect(info).toEqual([
      `SELECT * FROM users
      WHERE (id = $1 AND name = $2 AND (status = $3 OR status = $4))`,
      1,
      'Alex',
      'active',
      'pending',
    ]);
  });

  test('update with auto values', async () => {
    const sql = mockSql();
    const [, info] = await sql`
      UPDATE users
      SET ${sql.setValues(testUsers[0])}
      WHERE id = ${testUsers[0].id}
    `;

    expect(info).toEqual([
      `UPDATE users
      SET \`id\` = $1, \`name\` = $2, \`email\` = $3
      WHERE id = $4`,
      testUsers[0].id,
      testUsers[0].name,
      testUsers[0].email,
      testUsers[0].id,
    ]);
  });

  test('update with picked values', async () => {
    const sql = mockSql();
    const [, info] = await sql`
      UPDATE users
      SET ${sql.setValues(testUsers[0], 'name', 'email')}
      WHERE id = ${testUsers[0].id}
    `;

    expect(info).toEqual([
      `UPDATE users
      SET \`name\` = $1, \`email\` = $2
      WHERE id = $3`,
      testUsers[0].name,
      testUsers[0].email,
      testUsers[0].id,
    ]);
  });

  test('insert single row with auto values', async () => {
    const sql = mockSql();
    const [, info] = await sql`
      INSERT INTO users
      ${sql.insertValues(testUsers[0])}
    `;

    expect(info).toEqual([
      `INSERT INTO users
      (\`id\`, \`name\`, \`email\`) VALUES ($1, $2, $3)`,
      testUsers[0].id,
      testUsers[0].name,
      testUsers[0].email,
    ]);
  });

  test('insert single row with picked values', async () => {
    const sql = mockSql();
    const [, info] = await sql`
      INSERT INTO users
      ${sql.insertValues(testUsers[0], 'name', 'email')}
    `;

    expect(info).toEqual([
      `INSERT INTO users
      (\`name\`, \`email\`) VALUES ($1, $2)`,
      testUsers[0].name,
      testUsers[0].email,
    ]);
  });

  test('insert multiple rows with auto values', async () => {
    const sql = mockSql();
    const [, info] = await sql`
      INSERT INTO users
      ${sql.insertValues(testUsers)}
    `;

    expect(info).toEqual([
      `INSERT INTO users
      (\`id\`, \`name\`, \`email\`) VALUES ($1, $2, $3), ($4, $5, $6)`,
      testUsers[0].id,
      testUsers[0].name,
      testUsers[0].email,
      testUsers[1].id,
      testUsers[1].name,
      testUsers[1].email,
    ]);
  });

  test('value in array', async () => {
    const sql = mockSql();
    const [, info] = await sql`
      SELECT * FROM users
      WHERE ${sql.in('id', [1, 2, 3])}
    `;

    expect(info).toEqual([
      `SELECT * FROM users
      WHERE \`id\` IN ($1, $2, $3)`,
      1,
      2,
      3,
    ]);
  });

  test('value in empty array', async () => {
    const sql = mockSql();
    const [, info] = await sql`
      SELECT * FROM users
      WHERE ${sql.in('id', [])}
    `;

    expect(info).toEqual([
      `SELECT * FROM users
      WHERE $1`,
      0,
    ]);
  });

  test('value in array with custom ifEmpty', async () => {
    const sql = mockSql();
    const [, info] = await sql`
      SELECT * FROM users
      WHERE ${sql.in('id', [], 1)}
    `;

    expect(info).toEqual([
      `SELECT * FROM users
      WHERE $1`,
      1,
    ]);
  });

  test('calling .compile() returns sql and params', async () => {
    const sql = mockSql();
    const debug = sql`
      SELECT * FROM users
      WHERE ${sql.in('id', [], 1)}
    `.compile();

    expect(debug).toEqual([
      `
      SELECT * FROM users
      WHERE $1
    `,
      [1],
    ]);
  });

  test('sql error', async () => {
    const sql = mockSql();

    await expect(async () => {
      await sql`SELECT bad syntax`;
    }).rejects.toThrow('bad syntax');
  });

  test('sql expression does not execute if not awaited', async () => {
    const sql = mockSql();

    sql`SELECT * FROM users`;
    await new Promise((resolve) => setTimeout(() => resolve(null), 100));

    expect(sql.driver.query).toHaveBeenCalledTimes(0);

    await sql`SELECT * FROM users`;

    expect(sql.driver.query).toHaveBeenCalledTimes(1);
  });
});

describe('defaultSerializeValue', () => {
  test('serializes dates', () => {
    const date = new Date('2020-01-01');
    expect(defaultSerializeValue(date)).toEqual(date.toISOString());
  });

  test('serializes arrays', () => {
    expect(defaultSerializeValue([1, 2, 3])).toEqual('[1,2,3]');
  });

  test('serializes objects', () => {
    expect(defaultSerializeValue({ a: 1, b: 2 })).toEqual('{"a":1,"b":2}');
  });

  test('does not serialize other values', () => {
    expect(defaultSerializeValue(123)).toEqual(123);
    expect(defaultSerializeValue('123')).toEqual('123');
  });
});
