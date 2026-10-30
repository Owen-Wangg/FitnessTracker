// Stand-in for a Supabase query builder: every method returns the same chainable object,
// and awaiting it (or .then) resolves to `result` ({ data, error }).
export const queryResult = (result) => {
  const chain = {};
  ['select', 'eq', 'order', 'insert', 'update', 'upsert', 'delete', 'single'].forEach((m) => {
    chain[m] = () => chain;
  });
  chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return chain;
};
