import { createPgTag } from '../drivers/postgres/postgres';
import { Client, Pool } from 'pg';
import { executeDriverTests } from './driver-tests';

describe('pg client', () => {
  const client = new Client({
    host: 'localhost',
    user: 'user',
    password: 'password',
    database: 'db',
    port: 5431,
  });

  let sql: ReturnType<typeof createPgTag>;

  beforeAll(async () => {
    await client.connect();
    sql = createPgTag(client);
  });

  afterAll(async () => {
    await client.end();
  });

  beforeEach(async () => {
    await sql`DROP TABLE IF EXISTS users`;
    await sql`
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
    const rows = await sql`SELECT 1`;
    expect(rows.info.fields.length).toEqual(1);
  });

  executeDriverTests('pg client', () => sql);
});

describe('pg pool', () => {
  const client = new Pool({
    host: 'localhost',
    user: 'user',
    password: 'password',
    database: 'db',
    port: 5431,
  });

  let sql: ReturnType<typeof createPgTag>;

  beforeAll(async () => {
    sql = createPgTag(client);
  });

  afterAll(async () => {
    await client.end();
  });

  beforeEach(async () => {
    await sql`DROP TABLE IF EXISTS users`;
    await sql`
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
    const rows = await sql`SELECT 1`;
    expect(rows.info.fields.length).toEqual(1);
  });

  executeDriverTests('pg pool', () => sql);
});
