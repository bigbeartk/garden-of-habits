import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { needsBackupReminder } from '../db/backup';
import { oldestCreatedAt } from '../db/queries';
import { getSetting } from '../db/settings';

export function useBackupReminder(): boolean {
  const deps = useDeps();
  const info = useLiveQuery(
    async () => ({
      last: (await getSetting(deps.db, 'lastBackupAt')) ?? null,
      oldest: await oldestCreatedAt(deps.db),
    }),
    [deps.db],
  );
  return info ? needsBackupReminder(info.last, info.oldest, deps.now().getTime()) : false;
}
