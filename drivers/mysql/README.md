# <img src="https://raw.githubusercontent.com/brombal/sqltags/v1/sqltags-logo.svg" width="400" alt="sqltags project logo" title="sqltags" />

<br>

## SQLTags MySQL driver 

This is the **MySQL driver** for the `@sqltags/core` library.

Please refer to the [@sqltags/core project README](https://github.com/brombal/sqltags/#readme) for more information.

<br>

## What is SQLTags?

🔧✨ Safely create & execute parameterized SQL queries using template strings.

```ts
const [user] = await sql`SELECT * FROM users WHERE id = ${userId}`;
```

Results in the following query:

```sql
SELECT * FROM users WHERE id = $1
-- with parameters: [123]
```

<br>

## Installation & Usage

Install:

```sh
npm install mysql2 @sqltags/mysql
```

Create a MySQL connection and a `SqlTag` instance with the connection:

```ts
import mysql from 'mysql2';
import { SqlTag } from '@sqltags/mysql';

const connection = mysql.createConnection({ /* ... */ });
const sql = new SqlTag(connection);
```

Query:

```ts
const [user] = await sql`SELECT * FROM users WHERE id = ${userId}`;
```

Don't forget to disconnect your client when finished!

```ts
await connection.end();
```