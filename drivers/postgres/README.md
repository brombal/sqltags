# <img src="https://raw.githubusercontent.com/brombal/sqltags/v1/sqltags-logo.svg" width="400" alt="sqltags project logo" title="sqltags" />

<br>

## SQLTags PostgreSQL driver

This is the **PostgreSQL driver** for the `@sqltags/core` library.

Please refer to the [@sqltags/core project README](https://github.com/brombal/sqltags/#readme) for
more information.

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
npm install @sqltags/core @sqltags/pg
```

Create & connect a PostgreSQL Client or Pool instance, and a `SqlTag` instance with the connection:

```ts
import { Client } from 'pg';
import { SqlTag } from '@sqltags/pg';

const client = new Client({
  /* ... */
});
await client.connect();
const sql = new SqlTag(client);
```

```ts
import { Pool } from 'pg';
import { SqlTag } from '@sqltags/pg';

const pool = new Pool({
  /* ... */
});
const sql = new SqlTag(pool);
```

Query:

```ts
const [user] = await sql`SELECT * FROM users WHERE id = ${userId}`;
```

Don't forget to disconnect your client when finished!

```ts
await client.end();
```
