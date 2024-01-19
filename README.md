# <img src="./sqltags-logo.svg" width="400" alt="sqltags project logo" title="sqltags" />

![Build status](https://github.com/brombal/sqltags/actions/workflows/build-test.yml/badge.svg?branch=main)
[![npm version](https://badge.fury.io/js/@sqltags%2Fcore.svg)](https://badge.fury.io/js/@sqltags/core)

🔧✨ Safely create & execute parameterized SQL queries using template strings.

```ts
const [user] = await sql`SELECT * FROM users WHERE id = ${userId}`;
```

This runs the following query:

```sql
SELECT * FROM users WHERE id = ?
-- with parameters: [123]
```

**Features:**

- Automatically parameterizes values and escapes identifiers (e.g. table or column names)
- Supports nested & concatenated SQL expressions
- Provides a handful of utilities for creating common SQL expressions such as `AND`/`OR` lists,
  `field IN (...)`, and updates/inserts.
- Supports promises and cursors for efficient memory usage
- Includes full TypeScript support (including generic types for query results)
- Supports any database driver (includes built-in drivers for
  [MySQL](https://github.com/brombal/sqltags/blob/main/drivers/mysql/README.md),
  [PostgreSQL](https://github.com/brombal/sqltags/blob/main/drivers/postgres/README.md), and
  [SQLite](https://github.com/brombal/sqltags/blob/main/drivers/sqlite/README.md), but you can
  easily create your own)
- 100% test coverage
- Lightweight (no dependencies)
- MIT licensed

---

## Contents

- [Why?](#Why)
- [Installation](#Installation)
  - [MySQL](https://github.com/brombal/sqltags/blob/main/drivers/mysql/README.md)
  - [PostgreSQL](https://github.com/brombal/sqltags/blob/main/drivers/postgres/README.md)
  - [SQLite](https://github.com/brombal/sqltags/blob/main/drivers/sqlite/README.md)
- [Querying](#Querying)
- [Cursors](#Cursors)
- [TypeScript](#TypeScript)
- [Building SQL queries](#Building-SQL-queries)
  - [Parameterized values](#Parameterized-values)
  - [Identifiers](#Identifiers)
  - [Nested SQL expressions](#Nested-SQL-expressions)
  - [Concatenating SQL expressions](#Concatenating-SQL-expressions)
  - [SQL expression helpers](#SQL-expression-helpers)
    - [AND and OR expressions](#AND-and-OR-expressions)
    - [UPDATE expressions](#UPDATE-expressions)
    - [INSERT expressions](#INSERT-expressions)
    - [IN expressions](#IN-expressions)
    - [Joining/concatenating values](#Joiningconcatenating-values)
- [Creating SqlTags for other databases](#Creating-SqlTags-for-other-databases)

---

## Why?

I suppose the answer to this depends on the question you are asking:

### Why not just use regular strings?

Regular strings might be fine for simple queries, but they don't help you write safe queries. As
your queries grow in complexity, it can be difficult to keep track of all the values and identifiers
that need to be parameterized or escaped. Additionally, it can be difficult to build larger queries
out of smaller pieces using only string concatenation.

SqlTags makes it easy to write safe queries by automatically parameterizing values and escaping
identifiers. It also provides utilities for creating common SQL expressions, making it easier to
build larger queries out of smaller pieces.

### Why not use an ORM or query builder?

ORMs and query builders are great for simple CRUD operations, but they can be a burden for more
complex queries. They abstract away the underlying SQL, which can make it difficult to debug or
optimize queries. Often, you'll want to write SQL queries directly in a database console to debug
and optimize, and then copy them back into your application code. An ORM makes this difficult
because the resulting SQL has to be translated every time you do this.

SqlTags makes it easy to write SQL queries in a more transparent way, while still providing
utilities to easily build more complex queries. The SQL is visible in your application code, making
it less cumbersome to move it between your application and database console when needed.

## Why not use existing library <insert library name here>?

There are a number of existing libraries that provide similar functionality to SqlTags. I created
SqlTags because they all lacked some key feature, or had a less-than-ideal API. Here are
some comparisons with other popular libraries:

### [Postgres](https://www.npmjs.com/package/postgres)

- This excellent library was the main inspiration for SqlTags, but it only supports PostgreSQL.
  SqlTags supports any database client library, although this comes at the expense of losing some
  PostgreSQL-specific features being included directly in the API (e.g. `COPY` commands, save points, etc).

### [SQL Template Strings](https://npmjs.com/package/sql-template-strings)

- Doesn't provide any utilities for building SQL expressions, other than `.append()`.
- Doesn't escape identifiers (relies on you using the database driver to do this).
- You have to pass the result of the tag to a database driver function to execute the query, so the
  API is a bit more verbose.
- No support for custom database drivers (only supports MySQL, PostgreSQL, and sequelize).

### [SQL Tag](https://npmjs.com/package/sql-tag)

### [SQL Template Tag](https://npmjs.com/package/sql-template-tag)

- Only supports MySQL, PostgreSQL, and sequelize.

### [pg-template-tag](https://www.npmjs.com/package/pg-template-tag)

## Installation

Choose the driver for your database flavor:

- `npm install @sqltags/pg`
- `npm install @sqltags/mysql`
- `npm install @sqltags/sqlite`
- Or [create your own](#Creating-SqlTags-for-other-databases) with `npm install @sqltags/core`

Then, create a **template tag** using the factory function from your chosen driver library.

Here's an example using MySQL (there are other drivers for PostgreSQL and SQLite, or you can
[create your own](#Creating-SqlTags-for-other-databases)):

```ts
import { createMySqlTag } from '@sqltags/mysql';
import mysql from 'mysql2';

// Create your connection object, e.g.:
const client = mysql.createConnection({
  /* ... */
});

// Then create the sql tag using your connection:
const sql = createMySqlTag(client);
```

For documentation on the driver-specific setup, check out their readme pages:

- [MySQL](https://github.com/brombal/sqltags/blob/main/drivers/mysql/README.md)
- [PostgreSQL](https://github.com/brombal/sqltags/blob/main/drivers/postgres/README.md)
- [SQLite](https://github.com/brombal/sqltags/blob/main/drivers/sqlite/README.md)

## Querying

To execute a query, simply use the tag with a SQL query, and `await` the result:

```ts
const [rows, info] = await sql<User>`SELECT * FROM users`;
```

The result is a 2-tuple of `[rows, info]`, where `rows` is an array of the query results, and `info`
is any additional information about the query that the driver provides (e.g. the column information,
or number of affected rows, etc).

## Cursors

To reduce memory usage, it is possible to execute a query and fetch rows one at a time (instead of
all at once) using a cursor. To get a cursor, use the `.cursor()` method on a tagged query string.
This returns an `AsyncIterable` that can be iterated using a `for await ... of` loop.

```ts
// Note that this line is not awaited! The cursor is not executed until it is iterated.
const cursor = sql<User>`SELECT * FROM users`.cursor();

for await (const user of cursor) {
  // ...
}
```

`.cursor()` also accepts a configuration object, which is defined by and passed directly to the
driver.

## TypeScript

You can specify the return type of each row by passing a generic type argument to the SQL tag:

```ts
interface User {
  id: number;
  name: string;
  email: string;
  // etc.
}

const [users, info] = await sql<User>`SELECT * FROM users`;
```

`users` will be of type User[]. The type of `info` is defined by the driver.

## Building SQL queries

### Parameterized values

Values will automatically be parameterized when they are interpolated into the query template
string.

```js
const [rows] = await sql`SELECT * FROM users WHERE id = ${userId}`;
```

"Parameterized" means that they are replaced by a placeholder (e.g. `?` or `$1`) and passed to the
database driver separately from the query string. This is the safest way to execute queries, and
prevents SQL injection attacks.

> **Warning!** Be careful when interpolating "falsy" values. `undefined` values will be omitted from
> the query completely:
>
> ```ts
> const userId = undefined;
> const [rows] = await sql`SELECT * FROM users WHERE id = ${userId}`;
> // Executes an invalid statement:
> // SELECT * FROM users WHERE id =
> // with no query parameters!
> ```
>
> However, other falsy values (e.g. `null`, `false`, `0`) will be included and sent as query
> parameters.

### Identifiers

To safely embed an identifier (e.g. a table or column name) into a query string, use the tag's
`.id()` method:

```js
const table = 'users';
const [tableValues] = await sql`SELECT * FROM ${sql.id(table)}`;
```

Identifiers are escaped appropriately by the driver, but are not parameterized.

### Nested SQL expressions

To nest SQL expressions, just embed a `sql` tag expression:

```js
const [rows] = await sql`
  SELECT *
  FROM users
  ${userId ? sql`WHERE id = ${userId}` : undefined}
`;
```

**If you try to embed strings without the `sql` tag, they will be escaped as strings and not
parameterized.**

To embed strings directly without parameterizing them, use the tag's `.raw()` method:

```js
const whereClause = "status = 'active'";
const [rows] = await sql`
  SELECT *
  FROM users
  where ${sql.raw(whereClause)}
`;
```

### Concatenating SQL expressions

Because the return value of a SQL tag is **not a string**, you **cannot** concatenate them using the
`+` operator.

```js
const query = sql`SELECT * FROM users`;

if (userId) {
  // ❌ This will NOT work!
  query += sql` WHERE id = ${userId}`;
}
```

Instead, try building queries using embedded expressions:

```js
const query = sql`
  SELECT *
  FROM users
  ${userId ? sql`WHERE id = ${userId}` : undefined}
`;
```

Another approach is to push query parts onto an array, and join them using the tag's `.join()`
method:

```js
const queryParts = [sql`SELECT * FROM users`];

if (userId) {
  queryParts.push(sql`WHERE id = ${userId}`);
}

// Join the query parts, separating each with a newline:
const query = sql.join(queryParts, '\n');

const [rows] = await query;
```

## SQL expression helpers

The SQL tag object also provides a handful of helper methods to construct common SQL expressions.

All expression helper methods generally accept both raw values and other nested tagged SQL
expressions.

### AND and OR expressions

- `sql.and(values: any[])`
- `sql.or(values: any[])`

Joins an array of expressions using `AND` and `OR`, grouped inside parentheses. They can be nested,
and will be grouped in parentheses appropriately. `undefined` values are omitted, but be careful
with other falsy values (e.g. `null`, `false`, `0`).

```js
const [rows] = await sql`
  SELECT *
  FROM users
  WHERE ${sql.and(
    userId ? sql`id = ${userId}` : undefined,
    sql.or(
      sql`status = 'active'`,
      sql`status = 'pending'`,
      // ...
    ),
  )}
`;

// Results in:
//   SELECT *
//   FROM users
//   WHERE (id = ? AND (status = ? OR status = ?))
```

### UPDATE expressions

- `sql.setValues(value: Record<string, any>, pickFrom?: string[])`

Generates a list of `` `column` = 'value' `` pairs for use in an `UPDATE SET` statement. You can
optionally include a list of properties to pick from the object.

```js
const user = {
  id: 1,
  name: 'Alex',
  email: 'test@example.com',
  status: 'active',
};

// Updates only the `name` and `status` columns:
const [rows] = await sql`
  UPDATE users
  SET ${sql.setValues(user, 'name', 'status')}
  WHERE id = ${user.id}
`;

// Results in:
//   UPDATE users
//   SET name = ?, status = ?
//   WHERE id = ?
```

### INSERT expressions

- `sql.insertValues(values: any[], pickFrom?: string[])`

Generates a ``(`columnA`, `columnB`) VALUES (value1, value2), (value3, value4)`` type of expression
for use in an `INSERT` statement.

```js
const newUsers = [
  { name: 'Alex', email: 'alex@example.com' },
  { name: 'Bob', email: 'bob@example.com' },
];

// Inserts ALL properties from objects in `newUsers`:
await sql`INSERT INTO users ${sql.insertValues(newUsers)}`;

// Results in:
//   INSERT INTO users (`name`, `email`) VALUES (?, ?), (?, ?)
```

Just like `.setValues()`, You can optionally include a list of properties to pick from each object.

### IN expressions

- `sql.in(values: any[])`

To generate an expression like `` `column` IN (value1, value2, etc) ``, use the tag's `.in()`
method:

```js
const [rows] = await sql`SELECT * FROM users WHERE ${sql.in('id', [1, 2, 3])}`;

// Results in:
//   SELECT * FROM users WHERE `id` IN (?, ?, ?)
```

### Joining/concatenating values

- `sql.join(values: any[], joinWith: string = ', ')`

To join (concatenate) an array of values or expressions, use the tag's `.join()` method:

```js
const ids = [1, 2, 3];
const [rows] = await sql`SELECT * FROM users WHERE id IN (${sql.join(ids)})`;

// Results in:
//   SELECT * FROM users WHERE id IN (1, 2, 3)
```

Values will be joined with a comma by default, but you can pass a specific separator as the second
argument:

```js
const [rows] = await sql`
  SELECT * FROM users 
  WHERE ${sql.join(
    [
      // Better to use `sql.and()` for this, but just for example:
      sql`id = ${userId}`,
      sql`status = 'active'`,
    ],
    ' AND ',
  )}
`;
```

## Creating SqlTags for other databases

A `SqlTag` instance is just a thin wrapper around a database client driver. Any database client
library that supports parameterized queries (and optionally cursors) can be used with SqlTags.

To create a `SqlTag` instance for any database client, you need to implement the `SqlTagDriver`
interface. This interface defines the methods that a SqlTag instance needs to parameterize values,
run queries, etc. It is defined and documented
[here](https://github.com/brombal/sqltags/blob/main/core/SqlTagDriver.ts), and you can see example
implementations for [MySQL](https://github.com/brombal/sqltags/blob/main/drivers/mysql/mysql.ts),
[PostgreSQL](https://github.com/brombal/sqltags/blob/main/drivers/postgres/postgres.ts), and
[SQLite](https://github.com/brombal/sqltags/blob/main/drivers/sqlite/sqlite.ts).

As the existing driver implementations demonstrate, the convention is to create a function that
accepts a database connection object, and returns a new instance of the `SqlTag` class with the
custom driver. The `SqlTag` instance must also define the TypeScript types for the additional query
response information (such as rows updated/inserted, column definitions, etc), and the cursor
options parameter.

Here is an example implementation for a fake database driver called "CoolDb". The purpose of each
implemented method is further described in the `SqlTagDriver`
[interface definition](https://github.com/brombal/sqltags/blob/main/core/SqlTagDriver.ts).

```ts
import { SqlTag } from '@sqltags/core';
import {
  type CoolDbConnection,
  type CoolQueryInfo,
  type CoolCursorOptions,
} from 'cool-database-library';

export function createCoolDbTag(conn: CoolDbConnection) {
  return new SqlTag<
    // Type parameter specifies the additional query response information:
    CoolQueryInfo,
    // Type parameter specifies the options parameter passed to .cursor():
    CoolCursorOptions
  >({
    parameterizeValue(value: any, paramIndex: number): string {
      return `$${paramIndex}`; // $1, $2, $3, etc.
    },

    serializeValue(value: unknown): any {
      // This is an optional method; the default behavior is to return `value` unchanged.
      return value;
    },

    escapeIdentifier(identifier: string): string {
      return `"${identifier.replaceAll('"', '""')}"`; // e.g. "my_terrible""_table_name"
    },

    async query(sql: string, params: any[]): Promise<[any[], CoolQueryInfo]> {
      // Use the `conn` object passed to the function to execute the query:
      const res = await conn.query(sql, params);
      // For this example, res.rows contains the array of row objects, and
      // res.info is a "CoolQueryInfo" object.
      return [res.rows, res.info];
    },

    async *cursor(sql: string, params: any[], options: CoolCursorOptions): AsyncIterable<any> {
      // Use the `conn` object passed to the function to execute the query:
      const cursor = conn.cursor(sql, params, options);
      // In the easiest scenario, the database driver might offer simple iterable cursor support like this,
      // but it's often tricker to implement. Check out the PostgreSQL/MySQL/SQLite drivers for examples.
      for await (const row of cursor) {
        yield row;
      }
    },
  });
}
```

Then use the method to create an instance of your `SqlTag` class, and start querying:

```ts
// Connect to your database using your client library, e.g.:
const db = new CoolDbConnection({
  /* ... */
});

// Use the function you created to create a SqlTag instance:
const sql = createCoolDbTag(db);

// Query!
const [rows, info] = await sql`SELECT * FROM users WHERE id = ${userId}`;
```

## Contributing

Contributions are welcome! Please open an issue or pull request on the
[GitHub repository](https://github.com/brombal/sqltags).

## License

MIT License

Copyright (c) 2024 Alex Brombal

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
