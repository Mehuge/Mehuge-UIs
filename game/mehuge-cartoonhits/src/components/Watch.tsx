/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as React from 'react';
import { watch, WatchGroup, WatchData, cancel } from './services/watch';

export {
  WatchData
}

interface WatchProps {
  player?: boolean;
  enemy?: boolean;
  location?: boolean;
  children?: (data: WatchData) => JSX.Element;
}

interface WatchState {
  data: WatchData;
}

export class Watch extends React.PureComponent<WatchProps, WatchState> {
  watchers: any;
  constructor(props: WatchProps) {
    super(props);
    this.state = { data: null };
  }
  public componentDidMount() {
    const what: WatchGroup[] = [];
    const props = this.props;
    if (props.player) what.push(WatchGroup.PLAYER_STATE);
    if (props.enemy) what.push(WatchGroup.ENEMY_STATE);
    if (props.location) what.push(WatchGroup.LOCATION);
    this.watchers = watch(what, (data: WatchData) => this.setState({ data }));
  }
  componentWillUnmount() {
    if (this.watchers) cancel(this.watchers);
  }
  public render() {
    return this.state.data && this.props.children(this.state.data);
  }
}
