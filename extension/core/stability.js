// A changed page must be seen `need` times in a row before it replaces the baseline.
export function settle(entry, baselineHash, newHash, need = 2) {
  if (newHash === baselineHash) return { accept: false, entry: null }; // back to baseline: forget pending
  const count = entry && entry.hash === newHash ? entry.count + 1 : 1;
  if (count >= need) return { accept: true, entry: null };
  return { accept: false, entry: { hash: newHash, count } };
}
