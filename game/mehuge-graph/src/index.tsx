/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// Pollyfills for functionality missing in the client.
import 'core-js/es6/map';
import 'core-js/es6/weak-map';
import 'core-js/es6/set';

import * as React from 'react';
import * as ReactDom from 'react-dom';
import { client } from '@csegames/camelot-unchained';
import { ErrorBoundary } from '@csegames/camelot-unchained/lib/components/ErrorBoundary';

import { Watch, WatchData } from 'components/Watch';
import { CartoonHits } from 'components/CartoonHits';

const root = document.getElementById('ui');

client.OnInitialized(() => {
  ReactDom.render(
    <ErrorBoundary outputErrorToConsole>
      <Watch player={true}>{(data: WatchData) => {
        return data.player && <CartoonHits health={data.player.health}/>;
      }}</Watch>
    </ErrorBoundary>,
    root);
});
