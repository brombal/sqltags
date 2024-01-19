# <img src="https://raw.githubusercontent.com/brombal/sqltags/v1/sqltags-logo.svg" width="400" alt="sqltags project logo" title="sqltags" />

<br>

## SQLTags SQLite driver 

This is the **SQLite driver** for the `@sqltags/core` library.

Please refer to the [@sqltags/core project README](https://github.com/brombal/sqltags/#readme) for more information.

<br>

## What is SQLTags?

🔧✨ Safely create & execute parameterized SQL queries using template strings.

```ts
const [user] = await sql`SELECT * FROM users WHERE id = ${userId}`;
```

Results in the following query:

```sql
SELECT * FROM users WHERE id = ?
-- with parameters: [123]
```

<br>

## Installation & Usage

Install: 

```sh
npm install sqlite3 @sqltags/sqlite
```

Create a SQLite database connection and a `SqlTag` instance with the connection:

```ts
import s from 'sqlite3';
import { SqlTag } from '@sqltags/sqlite';

const db = new s.Database(':memory:');
const sql = new SqlTag(db);
```

Query:

```ts
const [user] = await sql`SELECT * FROM users WHERE id = ${userId}`;
```
