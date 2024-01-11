import mysql, { FieldPacket } from 'mysql2';
import { faker } from '@faker-js/faker';

import { SqlTag, mysqlDriver } from '../src/index';

type User = {
  id: number;
  name: string;
  email: string;
};

const testUsers: User[] = [
  { id: 1, name: 'Alex', email: 'alex@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
];

describe('mysql', () => {
  let connection: mysql.Connection;
  let sql: SqlTag<FieldPacket[]>;

  beforeAll(async () => {
    // Create the connection to database
    connection = mysql.createConnection({
      host: 'localhost',
      user: 'user',
      password: 'password',
      database: 'db',
    });

    sql = new SqlTag(mysqlDriver(connection));
  });

  beforeEach(async () => {
    await sql`DROP TABLE IF EXISTS users`;
    await sql`
      CREATE TABLE users (
        id INT NOT NULL AUTO_INCREMENT,
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
    await sql`
      INSERT INTO users ${sql.insertValues(testUsers)}
    `;

    const [users, info] = await sql<User>`SELECT * FROM users`;
    expect(users).toEqual(testUsers);
    expect(info.length).toBe(3);
    expect(info[0].name).toBe('id');
    expect(info[0].schema).toBe('db');
    expect(info[0].table).toBe('users');
    expect(info[1].name).toBe('name');
    expect(info[2].name).toBe('email');
  });

  test('cursor', async () => {
    await sql`
      INSERT INTO users ${sql.insertValues(testUsers)}
    `;

    const users = sql<User>`SELECT * FROM users`.cursor();
    for await (const user of users) {
      expect(user).toEqual(testUsers.shift());
    }
  });

  test('large data set is not loaded into memory', async () => {
    for (let i = 0; i < 1000; i++) {
      await sql`
        INSERT INTO users ${sql.insertValues(
          Array.from({ length: 1000 }, () => {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            return {
              name: `${firstName} ${lastName}`,
              email: faker.internet.email({ firstName, lastName }),
            };
          }),
        )}
      `;
    }

    // collect garbage
    global.gc!();

    let maxPromiseMemory = 0;

    // load data using regular query several times
    for (let i = 0; i < 5; i++) {
      const [userRows] = await sql<User>`SELECT * FROM users`;

      const bytesUsed: number[] = [];

      let i = 0;
      for (const _user of userRows) {
        i++;
        if (i % 100 === 0) bytesUsed.push(process.memoryUsage().heapUsed);
      }

      if (Math.max(...bytesUsed) > maxPromiseMemory) {
        maxPromiseMemory = Math.max(...bytesUsed);
      }

      // log memory usage after loop
      const avgBytes = bytesUsed.reduce((a, b) => a + b, 0) / bytesUsed.length;
      console.log(
        `${i} users, ` +
          `avg=${(avgBytes / 1024 / 1024).toFixed(3)} MB, ` +
          `min=${(Math.min(...bytesUsed) / 1024 / 1024).toFixed(3)} MB, ` +
          `max=${(Math.max(...bytesUsed) / 1024 / 1024).toFixed(3)} MB ` +
          `for in-memory`,
      );
    }

    // collect garbage
    global.gc!();

    let maxCursorMemory = 0;

    // load data using cursor several times
    for (let i = 0; i < 5; i++) {
      const userCursor = sql<User>`SELECT * FROM users`.cursor();

      const bytesUsed: number[] = [];
      let i = 0;
      for await (const _user of userCursor) {
        i++;
        if (i % 100 === 0) bytesUsed.push(process.memoryUsage().heapUsed);
      }

      if (Math.max(...bytesUsed) > maxCursorMemory) {
        maxCursorMemory = Math.max(...bytesUsed);
      }

      // log memory usage after loop
      const avgBytes = bytesUsed.reduce((a, b) => a + b, 0) / bytesUsed.length;
      console.log(
        `${i} users, ` +
          `avg=${(avgBytes / 1024 / 1024).toFixed(3)} MB, ` +
          `min=${(Math.min(...bytesUsed) / 1024 / 1024).toFixed(3)} MB, ` +
          `max=${(Math.max(...bytesUsed) / 1024 / 1024).toFixed(3)} MB ` +
          `for cursor`,
      );
    }

    expect(maxCursorMemory).toBeLessThan(maxPromiseMemory);
  });
});
