'use strict';
'use extensible';


const REPL = require('REPL').default;
REPL.registerEval('Floaty', (c) => eval(c));


const React = require('react-native');
const {
  Image,
} = React;

const Immutable = require('immutable');


const Styles = require('Styles').default;
const Protux = require('Protux').default;


const Media = require('./Media').default;


/*
 * Bird
 */

Protux.on('BirdPhysics', 'TICK', ({
  entities: {
    [action.id]: {
      x, y, vx, vy, ax, ay,
    },
  },
}, action, next, fire) => {
  if (y > Styles.screenH + 400) {
    fire({ type: 'START' });
  }

  return Protux.merge(next, {
    entities: {
      [action.id]: {
        y: y + vy * action.dt,
        vy: vy + ay * action.dt,
        vx: vx + Math.max(0, vx + ax * action.dt),
      },
    },
  });
});


const BIRD_FREQ = 1.2;
const BIRD_AMP = 140;

Protux.on('BirdSplashOscillation', 'TICK', ({
  time,
}, action, next, fire) => (
  Protux.merge(next, {
    entities: {
      [action.id]: {
        vy: BIRD_AMP * Math.sin(BIRD_FREQ * Math.PI * time),
        ay: 0,
      },
    },
  })
));

Protux.on('BirdSplashOscillation', 'TOUCH', ({
  entities: {
    [action.id]: { reducers },
  },
}, action, next, fire) => (
  Protux.merge(next, {
    entities: {
      [action.id]: {
        reducers: reducers.filter((next) => next !== 'BirdSplashOscillation')
                          .push('BirdControls'),
      },
    },
  })
));


Protux.on('BirdControls', 'TICK', ({
  entities: {
    [action.id]: {
      reducers,
      y, vy, h,
    },
  },
}, action, next, fire) => {
  // Died? Bounce and remove control
  if (y < 0 || y + h > Styles.screenH) {
    return Protux.merge(next, {
      entities: {
        [action.id]: {
          reducers: reducers.filter((next) => next !== 'BirdControls'),
          vy: -150,
        },
      },
    });
  }
  return next;
});

Protux.on('BirdControls', 'TOUCH', (_, action, next, fire) => (
  Protux.merge(next, {
    entities: {
      [action.id]: { ay: action.pressed ? -1600 : 700 },
    },
  })
));


Protux.on('BirdDraw', 'DRAW', ({
  entities: {
    [action.id]: { x, y, vy, w, h },
  },
}, action, elements) => {
  const rot = Math.max(-25, Math.min(vy / (vy > 0 ? 9 : 6), 50));
  elements.push(
    <Image
      key="bird-image"
      style={{ position: 'absolute',
               transform: [{ rotate: rot + 'deg' }],
               left: x - w / 2, top: y - h / 2,
               width: w, height: h,
               backgroundColor: 'transparent' }}
      source={{ uri: Media['floaty.png'] }}
    />
  );
  return elements;
});


/*
 * start
 */

Protux.states.start = Immutable.fromJS({
  entities: {
    bird: {
      reducers: ['BirdPhysics', 'BirdSplashOscillation', 'BirdDraw'],
      x: Styles.screenW - 280,
      y: Styles.screenH / 2,
      w: 41, h: 29,
      vx: 110, vy: 0,
      ay: 700, ax: 9,
    },
  },
});


