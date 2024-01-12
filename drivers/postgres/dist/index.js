var $cYwxT$pgcursor = require("pg-cursor");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "pgDriver", () => $44d1314d1d04398a$export$64c8ea298851ba);

function $44d1314d1d04398a$var$isPool(client) {
    return "idleCount" in client;
}
function $44d1314d1d04398a$export$64c8ea298851ba(client) {
    return {
        parameterizeValue (_value, _paramIndex) {
            return `$${_paramIndex + 1}`;
        },
        escapeIdentifier (identifier) {
            // Not using the one from 'pg' library because it requires a connection instance which doens't work with the pool
            // Ported from PostgreSQL 9.2.4 source code in src/interfaces/libpq/fe-exec.c
            return '"' + identifier.replace(/"/g, '""') + '"';
        },
        // Note that values are not serialized using the default sqltags serialization.
        // Instead, they are passed as-is and serialized according to this:
        // https://node-postgres.com/features/queries#parameterized-query
        serializeValue: (value)=>value,
        query: async (sql, params)=>{
            // const _client = isPool(client) ? await client.connect() : client;
            const res = await client.query(sql, params);
            // if (isPool(client)) (_client as PoolClient).release();
            return [
                res.rows,
                res
            ];
        },
        cursor: function(sql, params) {
            let _client;
            let cursor;
            const queue = [];
            return {
                [Symbol.asyncIterator]: ()=>({
                        next: async ()=>{
                            if (!_client) {
                                _client = $44d1314d1d04398a$var$isPool(client) ? await client.connect() : client;
                                cursor = _client.query(new (0, ($parcel$interopDefault($cYwxT$pgcursor)))(sql, params));
                            }
                            if (queue.length > 0) return {
                                done: false,
                                value: queue.shift()
                            };
                            try {
                                const res = await cursor.read(100);
                                if (res.length === 0) {
                                    await cursor.close();
                                    if ($44d1314d1d04398a$var$isPool(client)) _client.release();
                                    return {
                                        done: true,
                                        value: undefined
                                    };
                                }
                                queue.push(...res);
                                return {
                                    done: false,
                                    value: queue.shift()
                                };
                            } catch (err) {
                                await cursor.close();
                                if ($44d1314d1d04398a$var$isPool(client)) _client.release();
                                throw err;
                            }
                        }
                    })
            };
        }
    };
}


//# sourceMappingURL=index.js.map
