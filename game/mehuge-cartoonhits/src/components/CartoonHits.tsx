/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as React from 'react';
import styled, { css, keyframes } from 'react-emotion';

const Frame = styled('div')`
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const SpinIn = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(359deg); }
`;

const spins: string[] = [
  css`animation: ${SpinIn} 1s linear 1.1 forwards`,
  css`animation: ${SpinIn} 0.5s linear 0.9 forwards`,
  css`animation: ${SpinIn} 0.75s linear 1.05 forwards`,
  css`animation: ${SpinIn} 0.65s linear 0.95 forwards`,
  css`animation: ${SpinIn} 0.7s linear 1.15 forwards`,
  css`animation: ${SpinIn} 0.8s linear 0.85 forwards`,
];

const Thing = styled('div')`
  position: absolute;
  font-size: 50pt;
  font-weight: bold;
  font-family: "Carter One";
  text-shadow: 10px 10px 30px black;
  &.kaboom { color: red; }
  &.bam { color: yellow; }
  &.pow { color: orange; }
  &.ka-pow { color: gold; }
  &.whap { color: crimson; }
  &.bang { color: lime; }
  &.wham { color: pink; }
  &.whak { color: aqua; }
`;

interface SoundFile {
  name: string;
  volume: number;
}

const sounds: { [key: string]: SoundFile } = {
  'kaboom': { name: 'cartoon-hit-kaboom.ogg', volume: 1 },
  'bam': { name: 'cartoon-hit-bam.ogg', volume: 1 },
  'pow': { name: 'cartoon-hit-pow.ogg', volume: 1 },
  'ka-pow': { name: 'cartoon-hit-ka-pow.ogg', volume: 1 },
  'whap': { name: 'cartoon-hit-whap.ogg', volume: 1 },
  'bang': { name: 'cartoon-hit-bang.ogg', volume: 1 },
  'wham': { name: 'cartoon-hit-wham.ogg', volume: 1 },
  'whak': { name: 'cartoon-hit-whak.ogg', volume: 1 },
};

interface Health {
  current: number;
  max: number;
  wounds: number;
}

interface Offset {
  x: number;
  y: number;
}

interface Sprite {
  id: number;
  name: string;
  text: string;
  rotate: number;
  spin: number;
  offset: Offset;
  expires: number;
  timer?: any;
}

interface Sound {
  id: number;
  name: string;
  volume: number;
}

interface CartoonHitsProps {
  health: Health[];
  animate?: boolean;
  duration?: number;
}

interface CartoonHitsState {
  sprites: Sprite[];
  sounds: Sound[];
}

export class CartoonHits extends React.PureComponent<CartoonHitsProps, CartoonHitsState> {
  private spriteId = 0;
  private lastQuadrant: number;
  private sequence: number[] = [];
  constructor(props: CartoonHitsProps) {
    super(props);
    this.state = { sprites: [], sounds: [] };
  }
  public componentDidMount() {
    this.calc(this.props, this.props);
  }
  public componentDidUpdate(prev: CartoonHitsProps) {
    this.calc(prev, this.props);
  }
  public render() {
    return (
      <Frame>
        { this.state.sprites.map(sprite => {
          const style: React.CSSProperties = {
            top: `${sprite.offset.y}%`,
            left: `${sprite.offset.x}%`,
          };
          if (!this.props.animate) {
            style.WebkitTransform = `rotate(${sprite.rotate}deg)`;
            style.transform = `rotate(${sprite.rotate}deg)`;
          }
          return (
            <Thing key={sprite.id} style={style}
              className={`${sprite.name} ${this.props.animate ? spins[sprite.spin] : ''}`}>
              {sprite.text}
            </Thing>
          );
        })}
        { this.state.sounds.map(sound =>
          <audio key={sound.id}
            autoPlay
            onPlay={(e: React.UIEvent<HTMLAudioElement>) => e.currentTarget.volume = sound.volume}
            onEnded={() => this.soundFinished(sound.id)}
            src={`media/${sound.name}`}
            />
        )}
      </Frame>
    );
  }

  private soundFinished = (id: number) => {
    const sounds = this.state.sounds.filter(sound => sound.id != id);
    this.setState({ sounds });
  }

  // This logic randomly picks an xy position but not in the same
  // quadrant as the last poition.
  //
  //  The area is defined as a box, 50% width 50% height in
  //  the center of the screen, so (x:25,y:25,w:50,h:50)
  //  The quadrants are therefore
  //  [ 25,25 25,50 50,25 50,50 ]
  //  and each quadrant is 25,25

  private quadrants = [
    { x: 10, y: 10 },
    { x: 10, y: 50 },
    { x: 50, y: 10 },
    { x: 50, y: 50 },
    { x: 30, y: 30 },       // the 5th quadrant!
  ];

  private getOffset = (): Offset => {
    // Pick a new quadrant
    let q = (Math.random() * 5) | 0;
    if (q === this.lastQuadrant) {
      q = (q + 1) % 5;
    }
    this.lastQuadrant = q;

    // Get quadrant offset
    const quadrant = this.quadrants[q];

    // Calculate a random offset within the quadrant
    const offset: Offset = {
      x: (quadrant.x + (Math.random() * 25)) | 0,
      y: (quadrant.y + (Math.random() * 25)) | 0,
    };
    return offset;
  }

  private calc = (prevProps: CartoonHitsProps, props: CartoonHitsProps) => {
    const prev = prevProps.health;
    const curr = props.health;
    if (prev.length != curr.length) {
      return;   // can happens when testing, a mix of test data and live data
    }
    const duration = props.duration || 2000;
    const wounded = curr.filter((health, i) => health.wounds > prev[i].wounds);
    const ouch = curr.filter((health, i) => health.current < prev[i].current - 100);
    const now = Date.now();
    const expires = now + duration;
    let sprite: Sprite;
    const id = this.spriteId++;
    let rotate;
    let spin;
    let offset;
    let name;
    let text;
    let sound: Sound;
    if (ouch.length) {
      offset = this.getOffset();
      rotate = ((Math.random() * 120) - 60) | 0;
      spin = (Math.random() * spins.length) | 0;

      // Decide which word to show, we will sequence through them randomly
      if (!this.sequence.length) this.sequence = [ 0, 1, 2, 3, 4, 5, 6, 7 ];
      const i = (Math.random() * this.sequence.length)| 0;
      const word = this.sequence[i];
      this.sequence = this.sequence.filter(n => n != word);

      // Word picked
      switch (word) {
        case 0: name = 'kaboom'; text = 'Kaboom!'; break;
        case 1: name = 'bam'; text = 'BAM!'; break;
        case 2: name = 'pow'; text = 'POW!'; break;
        case 3: name = 'ka-pow'; text = 'KA-POW!'; break;
        case 4: name = 'whap'; text = 'WHAP!'; break;
        case 5: name = 'bang'; text = 'BANG!'; break;
        case 6: name = 'wham'; text = 'WHAM!'; break;
        case 7: name = 'whak'; text = 'WHAK!'; break;
      }

      // Pick a sound
      if (curr.length > 2 && curr[2].current < prev[2].current) {
        // head hit (todo)
        sound = { id, ...sounds[name] };
      } else {
        sound = { id, ...sounds[name] };
      }
    }
    if (name) {
      sprite = { id, expires, rotate, spin, offset, name, text };
      sprite.timer = setTimeout(this.expires, 2000);
      const sprites = [...this.state.sprites, sprite];
      this.setState({ sprites });
    }

    if (wounded.length) {
      sound = { id, name: 'WilhelmScream.ogg', volume: 0.5 };
    }

    // If we have a sound, add it to the sound q
    if (sound) {
      this.setState({ sounds: [...this.state.sounds, sound ] });
    }
  }

  private expires = () => {
    const now = Date.now();
    const sprites = this.state.sprites.filter(sprite => sprite.expires > now);
    if (sprites.length != this.state.sprites.length) {
      this.setState({ sprites });
    }
  }
}
