# <img src="https://raw.githubusercontent.com/brombal/sqltags/v1/sqltags-logo.svg" width="400" alt="sqltags project logo" title="sqltags" />

![Build status](https://github.com/brombal/sqltags/actions/workflows/build-test.yml/badge.svg?branch=main)
[![npm version](https://badge.fury.io/js/@sqltags%2Fcore.svg)](https://badge.fury.io/js/@sqltags/sqlite)

<br>

## SqlTags SQLite driver 

This is the **SQLite driver** for the `@sqltags/core` library.

Please refer to the [@sqltags/core project README](https://github.com/brombal/sqltags/#readme) for more information.

<br>

## What is SqlTags?

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

Create a SQLite database connection, then create a SQL tag using the connection:

```ts
import s from 'sqlite3';
import { createSqliteTag } from '@sqltags/sqlite';

const db = new s.Database(':memory:');
const sql = createSqliteTag(db);
```

Query:

```ts
const [user] = await sql`SELECT * FROM users WHERE id = ${userId}`;
```
