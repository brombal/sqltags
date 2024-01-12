
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "SqlTag", () => $81ee80297fbe2c37$export$53d68be906783141);
$parcel$export(module.exports, "defaultSerializeValue", () => $229d5b584e7d4cb0$export$87f0b961e2b25876);
function $229d5b584e7d4cb0$export$87f0b961e2b25876(value) {
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value) || typeof value === "object") return JSON.stringify(value);
    return value;
}
function $229d5b584e7d4cb0$export$c2c029f59bc4b5e(obj) {
    return Object.assign(Object.setPrototypeOf(function callable(...args) {
        return obj[$229d5b584e7d4cb0$export$c2c029f59bc4b5e.call](...args);
    }, obj.constructor.prototype), obj);
}
$229d5b584e7d4cb0$export$c2c029f59bc4b5e.call = Symbol("_call");


class $c7ac0a3b646bc6eb$export$e88555395213c2bf extends Promise {
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
            if (value instanceof $c7ac0a3b646bc6eb$export$e88555395213c2bf) {
                const [subSql] = value.compile(params);
                sql += subSql;
            } else {
                const serializedValue = this.config.serializeValue ? this.config.serializeValue(value) : (0, $229d5b584e7d4cb0$export$87f0b961e2b25876)(value);
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



class $81ee80297fbe2c37$export$53d68be906783141 {
    constructor(driver){
        this.driver = driver;
        return (0, $229d5b584e7d4cb0$export$c2c029f59bc4b5e)(this);
    }
    [(0, $229d5b584e7d4cb0$export$c2c029f59bc4b5e).call](strings, ...values) {
        return new (0, $c7ac0a3b646bc6eb$export$e88555395213c2bf)(this.driver, [
            ...strings
        ], values);
    }
    join(values, joinWith = ", ") {
        const filteredValues = values.filter((value)=>value !== undefined);
        return new (0, $c7ac0a3b646bc6eb$export$e88555395213c2bf)(this.driver, [
            "",
            ...Array(filteredValues.length - 1).fill(joinWith),
            ""
        ], filteredValues);
    }
    id(identifier) {
        return new (0, $c7ac0a3b646bc6eb$export$e88555395213c2bf)(this.driver, [
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
        return new (0, $c7ac0a3b646bc6eb$export$e88555395213c2bf)(this.driver, [
            ...strings
        ], values).compile();
    }
}





//# sourceMappingURL=index.js.map
