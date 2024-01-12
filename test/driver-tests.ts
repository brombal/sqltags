import { SqlTag } from '../core';

type User = {
  id: number;
  name: string;
  email: string;
};

export function executeDriverTests(testPrefix: string, getSql: () => SqlTag<any>) {
  let testUsers: User[];

  let sql: SqlTag<any>;

  beforeAll(() => {
    sql = getSql();
  });

  beforeEach(() => {
    testUsers = [
      { id: 1, name: 'Alex', email: 'alex@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ];
  });

  test(`${testPrefix}: insert/select values`, async () => {
    await sql`
      INSERT INTO users ${sql.insertValues(testUsers)}
    `;

    const [users, info] = await sql<User>`SELECT * FROM users`;
    expect(users).toEqual(testUsers);
  });

  test(`${testPrefix}: cursor`, async () => {
    await sql`
      INSERT INTO users ${sql.insertValues(testUsers)}
    `;

    const users = sql<User>`SELECT * FROM users`.cursor();
    for await (const user of users) {
      expect(user).toEqual(testUsers.shift());
    }
  });

  test(`${testPrefix}: sql error`, async () => {
    await expect(async () => {
      await sql`SELECT bad syntax`;
    }).rejects.toThrow();
  });

  test(`${testPrefix}: sql cursor error`, async () => {
    await expect(async () => {
      const res = sql`SELECT bad syntax`.cursor();
      for await (const _row of res) {
        // do nothing
      }
    }).rejects.toThrow();
  });
}
