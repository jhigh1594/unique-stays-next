import * as migration_20260508_043020 from './20260508_043020';

export const migrations = [
  {
    up: migration_20260508_043020.up,
    down: migration_20260508_043020.down,
    name: '20260508_043020'
  },
];
