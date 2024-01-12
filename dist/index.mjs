import {ReadableStream as $dj7nc$ReadableStream} from "stream/web";

function $9e06329a14a809dd$export$87f0b961e2b25876(value) {
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value) || typeof value === "object") return JSON.stringify(value);
    return value;
}
function $9e06329a14a809dd$export$c2c029f59bc4b5e(obj) {
    return Object.assign(Object.setPrototypeOf(function callable(...args) {
        return obj[$9e06329a14a809dd$export$c2c029f59bc4b5e.call](...args);
    }, obj.constructor.prototype), obj);
}
$9e06329a14a809dd$export$c2c029f59bc4b5e.call = Symbol("_call");


class $1a3527de5c69e80f$export$e88555395213c2bf extends Promise {
    constructor(config, templateStrings, values){
        super((resolve)=>resolve(null));
        this.config = config;
        this.templateStrings = templateStrings;
        this.values = values;
    }
    then(onfulfilled, onrejected) {
        const [text, params] = this.compile();
        return this.config.query(text, params).then(([rows, queryInfo])=>{
            return onfulfilled([
                rows,
                queryInfo,
                text,
                params
            ]);
        }, onrejected);
    }
    compile(params) {
        if (!params) params = [];
        let sql = "";
        for(let i = 0; i < this.templateStrings.length; i++){
            sql += this.templateStrings[i];
            const value = this.values[i];
            if (value === undefined) continue;
            if (value instanceof $1a3527de5c69e80f$export$e88555395213c2bf) {
                const [subSql] = value.compile(params);
                sql += subSql;
            } else {
                const serializedValue = this.config.serializeValue ? this.config.serializeValue(value) : (0, $9e06329a14a809dd$export$87f0b961e2b25876)(value);
                sql += this.config.parameterizeValue(serializedValue, params.length);
                params.push(serializedValue);
            }
        }
        return [
            sql,
            params
        ];
    }
    cursor() {
        const [sql, params] = this.compile();
        return this.config.cursor(sql, params);
    }
}



class $e3065ec992ea4f9f$export$53d68be906783141 {
    constructor(driver){
        this.driver = driver;
        return (0, $9e06329a14a809dd$export$c2c029f59bc4b5e)(this);
    }
    [(0, $9e06329a14a809dd$export$c2c029f59bc4b5e).call](strings, ...values) {
        return new (0, $1a3527de5c69e80f$export$e88555395213c2bf)(this.driver, [
            ...strings
        ], values);
    }
    join(values, joinWith = ", ") {
        const filteredValues = values.filter((value)=>value !== undefined);
        return new (0, $1a3527de5c69e80f$export$e88555395213c2bf)(this.driver, [
            "",
            ...Array(filteredValues.length - 1).fill(joinWith),
            ""
        ], filteredValues);
    }
    id(identifier) {
        return new (0, $1a3527de5c69e80f$export$e88555395213c2bf)(this.driver, [
            this.driver.escapeIdentifier(identifier)
        ], []);
    }
    and(...values) {
        return this`(${this.join(values, " AND ")})`;
    }
    or(...values) {
        return this`(${this.join(values, " OR ")})`;
    }
    in(column, values, ifEmpty = 0) {
        const filteredValues = values.filter((value)=>value !== undefined);
        if (!filteredValues.length) return this`${ifEmpty}`;
        return this`${this.id(column)} IN (${this.join(filteredValues)})`;
    }
    setValues(values, ...pickKeys) {
        const keys = pickKeys.length ? pickKeys : Object.keys(values);
        const expressions = keys.map((key)=>{
            return this`${this.id(key)} = ${values[key]}`;
        });
        return this.join(expressions, ", ");
    }
    insertValues(values, ...pickKeys) {
        const keys = pickKeys.length ? pickKeys : Object.keys(Array.isArray(values) ? values[0] : values);
        const columns = this.join(keys.map((key)=>this.id(key)), ", ");
        let rows;
        if (Array.isArray(values)) rows = this.join(values.map((row)=>{
            const values = this.join(keys.map((key)=>row[key]));
            return this`(${values})`;
        }), ", ");
        else {
            const row = this.join(keys.map((key)=>values[key]));
            rows = this`(${row})`;
        }
        return this`(${columns}) VALUES ${rows}`;
    }
    compile(strings, ...values) {
        return new (0, $1a3527de5c69e80f$export$e88555395213c2bf)(this.driver, [
            ...strings
        ], values).compile();
    }
}




function $48e6d591512f58ca$export$62e0194bbcbab96(connection) {
    return {
        parameterizeValue (_value, _paramIndex) {
            return "?";
        },
        escapeIdentifier (identifier) {
            return `\`${identifier.replace(/`/g, "``")}\``;
        },
        query: async (sql, params)=>{
            return new Promise((resolve, reject)=>{
                connection.query(sql, params, (err, result, fields)=>{
                    if (err) reject(err);
                    else resolve([
                        result,
                        fields
                    ]);
                });
            });
        },
        cursor: async function*(_sql, _params) {
            const stream = connection.query(_sql, _params);
            const s = new (0, $dj7nc$ReadableStream)({
                start (controller) {
                    let error = false;
                    stream.on("result", (chunk)=>{
                        controller.enqueue(chunk);
                    });
                    stream.on("end", ()=>{
                        if (!error) controller.close();
                    });
                    stream.on("error", (err)=>{
                        error = true;
                        controller.error(err);
                    });
                }
            });
            for await (const row of s)yield row;
        }
    };
}


function $4052989903efcfda$var$isPool(client) {
    return "idleCount" in client;
}
function $4052989903efcfda$export$64c8ea298851ba(client) {
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
                                _client = $4052989903efcfda$var$isPool(client) ? await client.connect() : client;
                                cursor = _client.query(new Cursor(sql, params));
                            }
                            if (queue.length > 0) return {
                                done: false,
                                value: queue.shift()
                            };
                            try {
                                const res = await cursor.read(100);
                                if (res.length === 0) {
                                    await cursor.close();
                                    if ($4052989903efcfda$var$isPool(client)) _client.release();
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
                                if ($4052989903efcfda$var$isPool(client)) _client.release();
                                throw err;
                            }
                        }
                    })
            };
        }
    };
}


function $7d552354bb9c1164$export$26c2e5b318337599(client) {
    return {
        parameterizeValue (_value, _paramIndex) {
            return `?`;
        },
        escapeIdentifier (identifier) {
            return '"' + identifier.replace(/"/g, '""') + '"';
        },
        query: async (sql, params)=>{
            const res = await new Promise((resolve, reject)=>{
                client.all(sql, params, (err, rows)=>{
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            return [
                res,
                undefined
            ];
        },
        cursor: function(sql, params) {
            let started = false;
            let resolver;
            let rejecter;
            const queue = [];
            return {
                [Symbol.asyncIterator]: ()=>({
                        next: async ()=>{
                            if (!started) {
                                client.each(sql, params, (err, row)=>{
                                    // There is no case I could find where this would be called with an error, but the docs say it might
                                    // istanbul ignore if
                                    if (err) rejecter(err);
                                    else {
                                        queue.push(row);
                                        resolver(row);
                                    }
                                }, (err)=>{
                                    if (err) rejecter(err);
                                    else {
                                        queue.push(undefined);
                                        resolver(undefined);
                                    }
                                    rejecter = undefined;
                                    resolver = undefined;
                                });
                                started = true;
                            }
                            if (!queue.length) await new Promise((resolve, reject)=>{
                                resolver = resolve;
                                rejecter = reject;
                            });
                            if (queue.length > 0) {
                                const row = queue.shift();
                                if (row !== undefined) return {
                                    done: false,
                                    value: row
                                };
                            }
                            return {
                                done: true,
                                value: undefined
                            };
                        }
                    })
            };
        }
    };
}




export {$e3065ec992ea4f9f$export$53d68be906783141 as SqlTag, $9e06329a14a809dd$export$87f0b961e2b25876 as defaultSerializeValue, $48e6d591512f58ca$export$62e0194bbcbab96 as mysqlDriver, $4052989903efcfda$export$64c8ea298851ba as pgDriver, $7d552354bb9c1164$export$26c2e5b318337599 as sqliteDriver};
//# sourceMappingURL=index.mjs.map
