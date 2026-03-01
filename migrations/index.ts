import * as migration_20260301_051307_initial from './20260301_051307_initial';
import * as migration_20260301_061951_add_section_order from './20260301_061951_add_section_order';

export const migrations = [
  {
    up: migration_20260301_051307_initial.up,
    down: migration_20260301_051307_initial.down,
    name: '20260301_051307_initial',
  },
  {
    up: migration_20260301_061951_add_section_order.up,
    down: migration_20260301_061951_add_section_order.down,
    name: '20260301_061951_add_section_order'
  },
];
