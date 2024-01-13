import { SqlTagBase } from '@sqltags/core';
import { type Database } from 'sqlite3';

export class SqlTag extends SqlTagBase<undefined> {
  constructor(private client: Database) {
    super();
  }

  parameterizeValue(value: any, paramIndex: number): string {
    return `?`;
  }
  escapeIdentifier(identifier: string): string {
    return '"' + identifier.replace(/"/g, '""') + '"';
  }
  async query(sql: string, params: any[]): Promise<[any[], undefined]> {
    const res: any[] = await new Promise((resolve, reject) => {
      this.client.all(sql, params, (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
    return [res, undefined];
  }
  cursor(sql: string, params: any[]): AsyncIterable<any> {
    let started = false;
    let resolver: ((value: any) => void) | undefined;
    let rejecter: ((value: any) => void) | undefined;
    const queue: any[] = [];
    return {
      [Symbol.asyncIterator]: () => ({
        next: async () => {
          if (!started) {
            this.client.each(
              sql,
              params,
              (err, row) => {
                // There is no case I could find where this would be called with an error, but the docs say it might
                // istanbul ignore if
                if (err) {
                  rejecter!(err);
                } else {
                  queue.push(row);
                  resolver!(row);
                }
              },
              (err) => {
                if (err) rejecter!(err);
                else {
                  queue.push(undefined);
                  resolver!(undefined);
                }
                rejecter = undefined;
                resolver = undefined;
              },
            );
            started = true;
          }

          if (!queue.length) {
            await new Promise((resolve, reject) => {
              resolver = resolve;
              rejecter = reject;
            });
          }

          if (queue.length > 0) {
            const row = queue.shift();
            if (row !== undefined) return { done: false, value: row };
          }

          return { done: true, value: undefined };
        },
      }),
    };
  }
}
