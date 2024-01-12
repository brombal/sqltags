import { SqlTemplateDriver } from "@sqltags/core";
import { Client, Pool, QueryResult } from "pg";
export function pgDriver(client: Client | Pool): SqlTemplateDriver<QueryResult>;

//# sourceMappingURL=index.d.ts.map
