
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "sqliteDriver", () => $94725c43431ebd1c$export$26c2e5b318337599);
function $94725c43431ebd1c$export$26c2e5b318337599(client) {
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


//# sourceMappingURL=index.js.map
