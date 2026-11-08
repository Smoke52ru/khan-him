import * as migration_20261108_153749_initial from './20261108_153749_initial';
import * as migration_20261108_154631_requests from './20261108_154631_requests';

export const migrations = [
  {
    up: migration_20261108_153749_initial.up,
    down: migration_20261108_153749_initial.down,
    name: '20261108_153749_initial',
  },
  {
    up: migration_20261108_154631_requests.up,
    down: migration_20261108_154631_requests.down,
    name: '20261108_154631_requests'
  },
];
