# <img src="./sqltags-logo.svg" width="400" alt="sqltags project logo" title="sqltags" />

🔧✨ Safely create & execute parameterized SQL queries using template strings.

```ts
const [user] = await sql`SELECT * FROM users WHERE id = ${userId}`;

// Results in:
// SELECT * FROM users WHERE id = ?
// with parameters: [123]
```

**Features:**

- Automatically parameterizes values and escapes identifiers (e.g. table or column names)
- Supports nested & concatenated SQL expressions
- Provides a handful of utilities for creating common SQL expressions such as `AND`/`OR` lists,
  `field IN (...)`, and updates/inserts.
- Supports promises and cursors for efficient memory usage
- Includes full TypeScript support (including generic types for query results)
- Supports any database driver (includes built-in drivers for MySQL, Postgres, and SQLite, but you
  can easily create your own)
- 100% test coverage
- Lightweight (no dependencies)
- MIT licensed

## Installation

```sh
npm install sqltags
```

Create a **template tag** by using one of the built-in database client drivers (this example is
MySQL, but there are also [other drivers](#database-drivers) for Postgres and SQLite, or you can
[create your own](#creating-database-drivers)):

```ts
import { SqlTag, mysqlDriver } from 'sqltags';
import mysql from 'mysql2';

// You can use your existing connection object, e.g.:
const connection = mysql.createConnection({
  /* ... */
});

// Create the sql tag, using the mysql driver and your connection:
export const sql = new SqlTag<FieldPacket[]>(mysqlDriver(connection));
```

## Querying

To execute a query, simply use the tag with a SQL query, and `await` the result:

```ts
const [rows, details] = await sql<User>`SELECT * FROM users`;
```

The result is a 2-tuple of `[rows, details]`, where `rows` is an array of the query results, and
`details` is any additional information about the query that the driver provides (e.g. the column
information, or number of affected rows, etc).

## Cursors

To reduce memory usage, it is possible to execute a query and fetch rows one at a time, instead of
all at once using a cursor. To get a cursor, use the `.cursor()` method on a tagged query string.
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

const [users, details] = await sql<User>`SELECT * FROM users`;
// users is of type User[]
```

The type of `details` is defined by the driver that is passed to the `new SqlTag()` constructor.

## Building SQL queries

### Escaping values

The SQL tag will automatically parameterize values that are interpolated into the query.

```js
const [rows] = await sql`SELECT * FROM users WHERE id = ${userId}`;
```

Values are escaped by parameterizing them according to the database driver.

### Identifiers

To interpolate an identifier (e.g. a table or column name), use the tag's `.id()` method:

```js
const table = 'users';
const [tableValues] = await sql`SELECT * FROM ${sql.id(table)}`;
```

Identifiers are escaped by the driver, but are not parameterized.

### Nested SQL expressions

To nest SQL expressions, just embed a `sql` tag expression:

```js
const [rows] = await sql`
  SELECT *
  FROM users
  ${userId ? sql`WHERE id = ${userId}` : undefined}
`;
```

To embed variables that should not be escaped, use the tag's `.raw()` method:

```js
const whereClause = "status = 'active'";
const [rows] = await sql`
  SELECT *
  FROM users
  where ${sql.raw(whereClause)}
`;
```

> **Warning!** Be careful when interpolating "falsy" values. `undefined` values will be omitted from
> the query. Other falsy values (e.g. `null`, `false`, `0`) will be included, and parameterized
> based on the implementation of the database driver.

### Concatenating SQL expressions

**Note** that the return value of a SQL tag is **not a string**, so you **cannot** concatenate them using the `+`
operator.

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

Or, push query parts onto an array and join them using the tag's `.join()` method (described more
below):

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
//   WHERE (id = 123 AND (status = 'active' OR status = 'pending'))
```

### UPDATE expressions

- `sql.setValues(value: Record<string, any>, pickFrom?: string[])`

Generates a list of `key = value` pairs for use in an `UPDATE SET` statement. You can optionally
include a list of properties to pick from the object.

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
//   SET name = 'Alex', status = 'active'
//   WHERE id = 1
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
//   INSERT INTO users (`name`, `email`) VALUES ('Alex', 'alex@example.com'), ('Bob', 'bob@example.com')
```

Just like `.setValues()`, You can optionally include a list of properties to pick from each object.

### IN expressions

- `sql.in(values: any[])`

To generate an expression like `` `column` IN (value1, value2, etc) ``, use the tag's `.in()`
method:

```js
const [rows] = await sql`SELECT * FROM users WHERE ${sql.in('id', [1, 2, 3])}`;

// Results in:
//   SELECT * FROM users WHERE `id` IN (1, 2, 3)
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

You can also pass other tagged expressions to `.join()`, which will be escaped (or not) as
appropriate:

```js
const [rows] = await sql`
  SELECT ${sql.join([
    sql.id('id'),
    sql.id('email'),
    sql`CASE WHEN status = ${'active'} THEN ${1} ELSE ${0} END as active`,
  ])}
  FROM users
`;
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

## Creating database drivers

SQL Builder is just a thin wrapper around a database driver client. As long as the driver supports
parameterized queries, it can be used with SQL Builder.

To create a driver, you need to implement the `SqlTemplateDriver` interface:

```ts
// From SqlTemplateDriver.ts:
interface SqlTemplateDriver<TQueryInfo> {
  /**
   * Returns the string to use for a parameterized value.
   * E.g. For mysql, you would return `?` for each parameter
   *      For postgres, you would return `$1`, `$2`, etc.
   */
  parameterizeValue(value: any, paramIndex: number): string;

  /**
   * Serializes values that cannot be passed as parameters to the driver (e.g. arrays, objects, etc.)
   * By default, objects and arrays are serialized as JSON strings. Dates are serialized using .toISOString().
   * All other values are unchanged.
   *
   * If you implement this method and wish to use the default behavior, you can use the
   * defaultSerializeValue() helper.
   */
  serializeValue?(value: unknown): any;

  /**
   * Escapes an identifier (e.g. a table or column name).
   */
  escapeIdentifier(identifier: string): string;

  /**
   * Executes a parameterized query and returns the results.
   */
  query(sql: string, params: any[]): Promise<[any[], TQueryInfo]>;

  /**
   * Executes a parameterized query and returns an async iterator that yields the results.
   */
  cursor(sql: string, params: any[]): AsyncIterable<any>;
}
```
