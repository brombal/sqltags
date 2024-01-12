import {ReadableStream as $hgG5k$ReadableStream} from "stream/web";


function $7c17dc2cf5c5fd2f$export$62e0194bbcbab96(connection) {
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
            const s = new (0, $hgG5k$ReadableStream)({
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


export {$7c17dc2cf5c5fd2f$export$62e0194bbcbab96 as mysqlDriver};
//# sourceMappingURL=index.mjs.map
