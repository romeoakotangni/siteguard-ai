import { sql } from '@vercel/postgres';
import type { QueryResult, QueryResultRow } from '@vercel/postgres';

export async function query<R extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<R>> {
  const result = await sql<R>`${text as any}`;
  return result as unknown as QueryResult<R>;
}

export async function queryWithParams<R extends QueryResultRow = any>(text: string, params: any[] = []): Promise<QueryResult<R>> {
  return await sql.query<R>(text, params);
}

export { sql };
