import * as migration_20260508_043020 from './20260508_043020';
import * as migration_20260508_043454 from './20260508_043454';
import * as migration_20260508_045955 from './20260508_045955';
import * as migration_20260509_031705 from './20260509_031705';
import * as migration_20260509_224747 from './20260509_224747';
import * as migration_20260510_032202 from './20260510_032202';
import * as migration_20260510_230841 from './20260510_230841';
import * as migration_20260515_030141 from './20260515_030141';
import * as migration_20260515_050237 from './20260515_050237';
import * as migration_20260515_140415 from './20260515_140415';
import * as migration_20260521_155515 from './20260521_155515';
import * as migration_20260528_location_fields from './20260528_location_fields';
import * as migration_20260529_045859 from './20260529_045859';
import * as migration_20260601_043022 from './20260601_043022';
import * as migration_20260601_unique_score_collections from './20260601_unique_score_collections';
import * as migration_20260617_022630 from './20260617_022630';

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
    name: '20260510_230841',
  },
  {
    up: migration_20260515_030141.up,
    down: migration_20260515_030141.down,
    name: '20260515_030141',
  },
  {
    up: migration_20260515_050237.up,
    down: migration_20260515_050237.down,
    name: '20260515_050237',
  },
  {
    up: migration_20260515_140415.up,
    down: migration_20260515_140415.down,
    name: '20260515_140415',
  },
  {
    up: migration_20260521_155515.up,
    down: migration_20260521_155515.down,
    name: '20260521_155515',
  },
  {
    up: migration_20260528_location_fields.up,
    down: migration_20260528_location_fields.down,
    name: '20260528_location_fields',
  },
  {
    up: migration_20260529_045859.up,
    down: migration_20260529_045859.down,
    name: '20260529_045859',
  },
  {
    up: migration_20260601_043022.up,
    down: migration_20260601_043022.down,
    name: '20260601_043022',
  },
  {
    up: migration_20260601_unique_score_collections.up,
    down: migration_20260601_unique_score_collections.down,
    name: '20260601_unique_score_collections'
  },
  {
    up: migration_20260617_022630.up,
    down: migration_20260617_022630.down,
    name: '20260617_022630',
  },
];
