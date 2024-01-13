import mysql from 'mysql2';
import { faker } from '@faker-js/faker';

import { SqlTag } from '../drivers/mysql/mysql';
import { executeDriverTests } from './driver-tests';

type User = {
  id: number;
  name: string;
  email: string;
};

describe('mysql', () => {
  let connection: mysql.Connection;
  let sql: SqlTag

  beforeAll(() => {
    // Create the connection to database
    connection = mysql.createConnection({
      host: 'localhost',
      user: 'user',
      password: 'password',
      database: 'db',
    });

    sql = new SqlTag(connection);
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

  afterAll(async () => {
    connection.end();
  });

  test('insert/select values', async () => {
    const [, info] = await sql`SELECT 1`;
    expect(info.length).toBe(1);
  });

  executeDriverTests('mysql', () => sql);

  // The test is really slow (on purpose) so it's skipped by default.
  test.skip('large data set is not loaded into memory', async () => {
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
