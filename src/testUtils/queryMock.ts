// Stand-in for a Supabase query builder: every method returns the same chainable object,
// and awaiting it (or .then) resolves to `result` ({ data, error }).
export interface QueryResult {
  data?: unknown;
  error?: unknown;
  count?: number | null;
}

const METHODS = ['select', 'eq', 'order', 'insert', 'update', 'upsert', 'delete', 'single'] as const;

export type QueryChain = { [M in (typeof METHODS)[number]]: () => QueryChain } & {
  then: PromiseLike<QueryResult>['then'];
};

export const queryResult = (result: QueryResult): QueryChain => {
  const chain = {} as QueryChain;
  METHODS.forEach((m) => {
    chain[m] = () => chain;
  });
  chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return chain;
};
