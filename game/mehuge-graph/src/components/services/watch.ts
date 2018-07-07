import { client, PlayerState } from '@csegames/camelot-unchained';

/* Watch Groups: These represent the top level keys of the WatchData object */
export enum WatchGroup {
  PLAYER_STATE,
  ENEMY_STATE,
  LOCATION,
  BLOCKS
}

/* Watch Data sub-types (these map to groups) */
export interface Location {
  x: number;
  y: number;
  z: number;
  facing: number;
};

/* Watch Data: The watch object maintains a state object that represents
 * the current state of all things being watched.  Whenever any new state
 * becomes available, only that state is updated but the entire WatchData
 * object is made available to the child function.
 */

export interface WatchData {
  player: PlayerState;
  enemy: PlayerState;
  location: Location;
  placedBlockCount: number;
}

/* A client events watcher is an entity that watches for client events
 * It is responsible for registering to receive those events, and passing
 * on those events to all interested parties.
 */

interface ClientEventsWatcher {
  type: WatchGroup;
  watching: boolean;
  watch: (handler: (state: WatchData) => void) => string;
}

/* A watchee is someone who wants to be informed about an event.  The watchee
 * will receive the full WatchData any time a WatchGroup it is interested in
 * is updated.  So for example if it wants to watch player and enemy state,
 * it will receive the latest WatchData object containing those and possibly
 * other data, but it won't get the WatchData in response to a location event.
 */
interface Watchee {
  type: WatchGroup;
  handler: (state: WatchData) => void;
}

/* watchees is a cache for currently interested watchees.  A watchee may be
 * watching more than one watch group.  This object keeps track of the watchee
 * and the groups they are interested in.
 */
const watchees = {
  elements: {},
  id: 0,
  push: function(obj: Watchee) {
    const id = this.id++;
    this.elements[id] = obj;
    return `${id}`;
  },
  forEach: function(callback: (el: any, key: string) => void) {
    const elements = this.elements;
    for (const key in elements) {
      if (typeof elements[key] !== undefined) {
        callback(elements[key], key);
      }
    }
  },
  remove: function(id: string) {
    delete this.elements[id];
  }
}

/* The watch data. This is the latest state of the client for the watched groups */
let state: WatchData = {
  player: null,
  enemy: null,
  location: null,
  placedBlockCount: 0,
};

/* Send watch data to every watchee for a particular watch group.
 * So for instance, if a player state event is received, the player
 * state in watch data is updated, and everyone interested in
 * player state events is notified.
 */
function send(type: WatchGroup, state: WatchData) {
  watchees.forEach(watchee => watchee.type === type && watchee.handler(state));
}

window['watch'] = { Group: WatchGroup, send: send };

/* Enemy State watcher */
const enemyState: ClientEventsWatcher = {
  type: WatchGroup.ENEMY_STATE,
  watching: false,
  watch: function(handler: (state: WatchData) => void) {
    const id = watchees.push({ type: this.type, handler });
    if (!this.watching) {
      client.OnEnemyTargetStateChanged((enemy: PlayerState) => {
        state = Object.assign({}, state, { enemy });
        send(this.type, state);
      });
      this.watching = true;
    }
    return id;
  }
};

/* Player State watcher */
const playerState: ClientEventsWatcher = {
  type: WatchGroup.PLAYER_STATE,
  watching: false,
  watch: function(handler: (state: WatchData) => void) {
    const id = watchees.push({ type: this.type, handler });
    if (!this.watching) {
      client.OnPlayerStateChanged((player: PlayerState) => {
        state = Object.assign({}, state, { player });
        send(this.type, state);
      });
      this.watching = true;
    }
    return id;
  }
};

/* Location watcher */
const location: ClientEventsWatcher = {
  type: WatchGroup.LOCATION,
  watching: null,
  watch: function(handler: (state: WatchData) => void) {
    const id = watchees.push({ type: this.type, handler });
    if (!this.watching) {
      this.watching = setInterval(() => {
        const location = {
          x: client.locationX,
          y: client.locationY,
          z: client.locationZ,
          facing: client.facing,
        };
        state = Object.assign({}, state, { location });
        send(this.type, state);
      }, 100);
    }
    return id;
  }
}

/* Blocks (building) watcher */
const blocks: ClientEventsWatcher = {
  type: WatchGroup.BLOCKS,
  watching: null,
  watch: function(handler: (state: WatchData) => void) {
    const id = watchees.push({ type: this.type, handler });
    if (!this.watching) {
      this.watching = setInterval(() => {
        const placedBlockCount = client.placedBlockCount;
        state = Object.assign({}, state, { placedBlockCount });
        send(this.type, state);
      }, 100);
    }
    return id;
  }
}

/* add a watchee to a watcher */
function addWatch(type: WatchGroup, handler: (state: WatchData) => void) {
  let id;
  switch(type) {
    case WatchGroup.ENEMY_STATE: id = enemyState.watch(handler); break;
    case WatchGroup.PLAYER_STATE: id = playerState.watch(handler); break;
    case WatchGroup.LOCATION: id = location.watch(handler); break;
    case WatchGroup.BLOCKS: id = blocks.watch(handler); break;
  }
  return id;
}

/* called by a watchee to register an interest in watch group events */
export function watch(what: WatchGroup[], handler: (state: WatchData) => void) {
  const watchers: string[] = [];
  what.forEach(type => {
    const id = addWatch(type, handler)
    watchers.push(id);
  });
  return watchers;
}

/* Cancel a previous call to watch */
export function cancel(watchers: string[]) {
  watchers.forEach(watchees.remove.bind(watchees));
}
