import { ReadableStream } from 'stream/web';
import { type Connection, type FieldPacket, type PoolConnection } from 'mysql2';
import { SqlTagBase } from '@sqltags/core';

export class SqlTag extends SqlTagBase<FieldPacket[]> {
  constructor(private connection: Connection | PoolConnection) {
    super();
  }

  parameterizeValue(value: any, paramIndex: number): string {
    return '?';
  }
  escapeIdentifier(identifier: string): string {
    return `\`${identifier.replace(/`/g, '``')}\``;
  }
  query(sql: string, params: any[]): Promise<[any[], FieldPacket[]]> {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, params, (err, result, fields) => {
        if (err) {
          reject(err);
        } else {
          resolve([result as any[], fields]);
        }
      });
    });
  }
  async *cursor(sql: string, params: any[]): AsyncIterable<any> {
    const stream = this.connection.query(sql, params);

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
  }
}
