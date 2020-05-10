<template>
  <div>
    <div class="ripple" />
    <svg
      xmlns="http://www.w3.org/2000/svg"
      :viewBox="`0 0 ${state.boundsSizeX} ${state.boundsSizeY}`"
      preserveAspectRatio="xMinYMin slice"
      @touchstart.prevent
      @touchmove.prevent="onTouchMove"
    >
      <path
        v-for="({ path, color }, i) of cells"
        :ref="`path-${i}`"
        :d="path"
        :fill="color"
        :fill-opacity=".5"
        :data-cell-index="i"
        :stroke="color"
        :stroke-opacity=".3"
        @mousemove="onCellHover(i)"
      />
    </svg>
  </div>
</template>

<script>
import { reactive, computed, watchEffect, ref } from 'vue';
import PoissonDisk from 'poisson-disk-sampling';
import { Delaunay } from 'd3-delaunay';
import random from 'random';
import { useAnimationFrame } from '../logic/useAnimationFrame';
import { Color, Gradient } from '../utils';
const randomColor = require('randomcolor');

const uri = window.location.search.substring(1);
const params = new URLSearchParams(uri);
console.log(params.get('hue'));

// const luminosities = ['light', 'dark', 'bright'];
// const hues = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'monochrome'];
const luminosity = params.get('luminosity') || 'random';
const hue = params.get('hue') || 'random';
console.log(luminosity);
console.log(hue);

const genParticles = (boundsSizeX, boundsSizeY) => {
  const poissonDisk = new PoissonDisk({
    shape: [boundsSizeX, boundsSizeY],
    minDistance: 25,
    maxDistance: 150,
    tries: 30,
  });
  const positions = poissonDisk.fill();

  const genParticleVelocity = () => {
    const maxVelocity = 25;
    const x = random.float(-maxVelocity, maxVelocity);
    const y = random.float(-maxVelocity, maxVelocity);
    return [x, y];
  };

  const genParticleColor = (i) => {
    // const grayValue = Math.round(255 - (i / positions.length) * 64);
    // const hex = grayValue.toString(16);
    // return '#' + hex + hex + hex;
    return randColorHex();
    // return randColorRgba(1);
  };

  const randColorHex = () => {
    return randomColor({
      luminosity,
      hue,
      format: 'hex',
    });
  };

  const randColorRgba = (opacity) => {
    var r = function() {
      return Math.floor(Math.random() * 256);
    };
    return 'rgba(' + r() + ',' + r() + ',' + r() + ', ' + opacity + ')';
  };

  return positions.map((position, i) => {
    const color = genParticleColor(i);
    return {
      position,
      velocity: genParticleVelocity(),
      color,
      originalColor: color,
      animation: undefined,
    };
  });
};

const genCells = (particles, boundsSizeX, boundsSizeY) => {
  const voronoi = Delaunay.from(particles.map((p) => p.position)).voronoi([0, 0, boundsSizeX, boundsSizeY]);

  return particles.map(({ color }, i) => ({
    path: voronoi.renderCell(i),
    color,
  }));
};

export default {
  name: 'VoronoiDiagram',
  setup() {
    const state = reactive({
      boundsSizeX: window.innerWidth,
      boundsSizeY: window.innerHeight,
    });
    const particles = ref(genParticles(state.boundsSizeX, state.boundsSizeY));
    const cells = computed(() => genCells(particles.value, state.boundsSizeX, state.boundsSizeY));

    const { addAnimation } = useAnimationFrame();

    watchEffect(() => {
      particles.value = genParticles(state.boundsSizeX, state.boundsSizeY);
    });

    addAnimation(() => {
      if (Math.abs(window.innerWidth - state.boundsSizeX) > 100) {
        state.boundsSizeX = window.innerWidth;
      }
      if (Math.abs(window.innerHeight - state.boundsSizeY) > 100) {
        state.boundsSizeY = window.innerHeight;
      }
    });

    addAnimation(({ deltaTime }) => {
      for (let i = 0; i < particles.value.length; i++) {
        const { position: pos, velocity: vel } = particles.value[i];
        pos[0] += vel[0] * deltaTime;
        pos[1] += vel[1] * deltaTime;

        if (pos[0] < 0) {
          pos[0] = 0;
          vel[0] *= -1;
        } else if (pos[0] > state.boundsSizeX) {
          pos[0] = state.boundsSizeX;
          vel[0] *= -1;
        }

        if (pos[1] < 0) {
          pos[1] = 0;
          vel[1] *= -1;
        } else if (pos[1] > state.boundsSizeY) {
          pos[1] = state.boundsSizeY;
          vel[1] *= -1;
        }
      }
    });

    const onTouchMove = (e) => {
      try {
        const { clientX, clientY } = e.touches[0];
        const element = document.elementFromPoint(clientX, clientY);
        onCellHover(parseInt(element.getAttribute('data-cell-index')));
      } catch {}
    };

    const onCellHover = (i) => {
      const particle = particles.value[i];

      if (particle.animation) {
        if (particle.animation.info.timeElapsed > 0.25) {
          particle.animation.cancel();
        } else {
          return;
        }
      }

      const genColorStop = (i, hex) => ({
        factor: (1 / 7) * i,
        color: new Color({ model: 'hex', hex }),
      });

      const gradient = new Gradient([
        genColorStop(0, particle.originalColor), //
        genColorStop(1, 'ff3232'),
        genColorStop(2, 'ffff32'),
        genColorStop(3, '32ff32'),
        genColorStop(4, '32ffff'),
        genColorStop(5, '3232ff'),
        genColorStop(6, 'ff32ff'),
        genColorStop(7, particle.originalColor),
      ]);

      particle.animation = addAnimation(({ cancel, timeElapsed }) => {
        if (timeElapsed >= 1) {
          particle.color = particle.originalColor;
          return cancel();
        }
        particle.color = gradient.getColor(timeElapsed / 1).toString();
      });
    };

    return {
      state,
      cells,
      onCellHover,
      onTouchMove,
    };
  },
};
</script>

<style lang="scss">
$circles: ();
$move: ();

@for $i from 0 through 10 {
  $start-x: (random(101) - 51) * 1vw;
  $start-y: (random(101) - 51) * 1vh;

  $end-x: (random(200) - 50) * 1vw;
  $end-y: (random(200) - 50) * 1vh;

  $circles: append($circles, radial-gradient(random(100) * 1vw, #fff 0%, #333 50%, #fff, #000, #eee) $start-x $start-y, comma);

  $move: append($move, $end-x $end-y, comma);
}

.ripple {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: -1;

  opacity: .75;

  animation: move 20s infinite alternate;
  animation-timing-function: linear;
  background: $circles;
  background-color: #000;
  background-blend-mode: difference;

  &::before,
  &::after {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }

  &::before {
    background: #fff;
    mix-blend-mode: color-burn;
  }

  &::after {
  }
}

@keyframes move {
  100% {
    background-position: $move;
  }
}
</style>