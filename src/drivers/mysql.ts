import { ReadableStream } from 'stream/web';
import { type Connection, type FieldPacket, type PoolConnection } from 'mysql2';
import { type SqlTemplateDriver } from '../SqlTemplateDriver';

export function mysqlDriver(
  connection: Connection | PoolConnection,
): SqlTemplateDriver<FieldPacket[]> {
  return {
    parameterizeValue(_value: any, _paramIndex: number) {
      return '?';
    },

    escapeIdentifier(identifier: string) {
      return `\`${identifier.replace(/`/g, '``')}\``;
    },

    query: async (sql: string, params: any[]): Promise<[any[], FieldPacket[]]> => {
      return new Promise((resolve, reject) => {
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
          let error = false;
          stream.on('result', (chunk) => {
            controller.enqueue(chunk);
          });
          stream.on('end', () => {
            if (!error) controller.close();
          });
          stream.on('error', (err) => {
            error = true;
            controller.error(err);
          });
        },
      });

      for await (const row of s) {
        yield row;
      }
    },
  };
}
