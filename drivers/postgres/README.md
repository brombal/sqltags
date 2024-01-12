# <img src="https://raw.githubusercontent.com/brombal/sqltags/v1/sqltags-logo.svg" width="400" alt="sqltags project logo" title="sqltags" />

## SQLTags PostgreSQL driver 

This is the **PostgreSQL driver** for the `@sqltags/core` library.

Please refer to the [@sqltags/core project README](https://github.com/brombal/sqltags/#readme) for more information.

---

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

---

### Installation

```sh
npm install @sqltags/core @sqltags/pg
```

### Usage

1. Create & connect your PostgreSQL Client or Pool instance:

    ```ts
    import { Client, Pool } from 'pg';
    
    const client = new Client({ /* ... */ });
    await client.connect();
   
    // or:
   
    const pool = new Pool({ /* ... */ });
    ```

2. Create a `SqlTag` instance:

    ```ts
    import { SqlTag } from '@sqltags/pg';
    
    const sql = new SqlTag(client);
    ```

3. Query:

    ```ts
    const [user] = await sql`SELECT * FROM users WHERE id = ${userId}`;
    ```

Don't forget to disconnect your client when finished!

```ts
await client.end();
```
