import { SqlTag as _SqlTag1 } from "@sqltags/core";
import { Client, Pool, QueryResult } from "pg";
export class SqlTag extends _SqlTag1<QueryResult> {
    constructor(client: Client | Pool);
}

//# sourceMappingURL=index.d.ts.map
