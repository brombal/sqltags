import { ReadableStream } from 'stream/web';
import { Connection, FieldPacket, PoolConnection } from 'mysql2';
import { SqlTemplateDriver } from './SqlTemplateDriver';

export function mysqlDriver(connection: Connection | PoolConnection): SqlTemplateDriver<FieldPacket[]> {
  return {
    parameterizeValue(_value: any, _paramIndex: number) {
      return '?';
    },
    escapeIdentifier(identifier: string) {
      return `\`${identifier.replace(/`/g, '``')}\``;
    },
    query: async (sql: string, params: any[]): Promise<[any[], FieldPacket[]]> => {
      return new Promise((resolve, reject) => {
        console.log(connection.query);

        function foo(cb: (x: number) => void) {
          cb(1);
        }

        foo((x) => {
          console.log(x);
        });

        connection.query(sql, params, (err, result, fields) => {
          if (err) {
            reject(err);
          } else {
            resolve([result as any[], fields]);
          }
        });
      });
    },
    cursor: async function* (_sql: string, _params: any[]): AsyncIterable<any> {
      const stream = connection.query(_sql, _params);

      const s = new ReadableStream({
        start(controller) {
          stream.on('result', (chunk) => {
            controller.enqueue(chunk);
          });
          stream.on('end', () => {
            controller.close();
          });
          stream.on('error', (err) => {
            controller.error(err);
          });
        },
      });

      for await (const row of s) {
        yield row;
      }
    },
  }
}