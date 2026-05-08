import * as migration_20260508_043020 from './20260508_043020';
import * as migration_20260508_043454 from './20260508_043454';
import * as migration_20260508_045955 from './20260508_045955';

export const migrations = [
  {
    up: migration_20260508_043020.up,
    down: migration_20260508_043020.down,
    name: '20260508_043020',
  },
  {
    up: migration_20260508_043454.up,
    down: migration_20260508_043454.down,
    name: '20260508_043454',
  },
  {
    up: migration_20260508_045955.up,
    down: migration_20260508_045955.down,
    name: '20260508_045955'
  },
];
