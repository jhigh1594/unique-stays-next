import * as migration_20260508_043020 from './20260508_043020';
import * as migration_20260508_043454 from './20260508_043454';
import * as migration_20260508_045955 from './20260508_045955';
import * as migration_20260509_031705 from './20260509_031705';
import * as migration_20260509_224747 from './20260509_224747';
import * as migration_20260510_032202 from './20260510_032202';
import * as migration_20260510_230841 from './20260510_230841';

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
    name: '20260508_045955',
  },
  {
    up: migration_20260509_031705.up,
    down: migration_20260509_031705.down,
    name: '20260509_031705',
  },
  {
    up: migration_20260509_224747.up,
    down: migration_20260509_224747.down,
    name: '20260509_224747',
  },
  {
    up: migration_20260510_032202.up,
    down: migration_20260510_032202.down,
    name: '20260510_032202',
  },
  {
    up: migration_20260510_230841.up,
    down: migration_20260510_230841.down,
    name: '20260510_230841'
  },
];
