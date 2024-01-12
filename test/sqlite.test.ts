import { SqlTag, sqliteDriver } from '../src/index';
import { executeDriverTests } from './driver-tests';
import s from 'sqlite3';

describe('sqlite client', () => {
  const db = new s.Database(':memory:');

  let sql: SqlTag<undefined>;

  beforeAll(async () => {
    sql = new SqlTag(sqliteDriver(db));
  });

  afterAll(async () => {});

  beforeEach(async () => {
    await sql`DROP TABLE IF EXISTS users`;
    await sql`
      -- sqlite
      CREATE TABLE users (
        id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        PRIMARY KEY (id)
      )
    `;
  });

  afterEach(async () => {
    await sql`DROP TABLE users`;
  });

  test('insert/select values', async () => {
    const [_rows, info] = await sql`SELECT 1`;
    // expect(info.fields.length).toEqual(1);
  });

  executeDriverTests('sqlite', () => sql);
});
