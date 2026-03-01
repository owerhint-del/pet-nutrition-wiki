import * as migration_20260301_051307_initial from './20260301_051307_initial';

export const migrations = [
  {
    up: migration_20260301_051307_initial.up,
    down: migration_20260301_051307_initial.down,
    name: '20260301_051307_initial'
  },
];
