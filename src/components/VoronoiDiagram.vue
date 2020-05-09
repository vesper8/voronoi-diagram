<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="`0 0 ${state.boundsSizeX} ${state.boundsSizeY}`"
    preserveAspectRatio="xMinYMin slice"
    @touchmove="onTouchMove"
  >
    <path
      v-for="({ path, color }, i) of cells"
      :d="path"
      :fill="color"
      :data-cell-index="i"
      :stroke="color"
      @mousemove="onCellHover(i)"
    />
  </svg>
</template>
<script>
import { reactive, computed } from 'vue'
import PoissonDisk from 'poisson-disk-sampling'
import { Delaunay } from 'd3-delaunay'
import random from 'random'
import cloneDeep from 'lodash/cloneDeep'
import findIndex from 'lodash/findIndex'
import { useAnimationFrame } from '../logic/useAnimationFrame'
import { Color, Gradient } from '../utils'

const generateParticles = (boundsSizeX, boundsSizeY) => {
  const poissonDisk = new PoissonDisk({
        shape: [boundsSizeX, boundsSizeY],
        minDistance: 50,
        maxDistance: 100,
        tries: 30,
      })
  const positions = poissonDisk.fill()

  const generateParticleVelocity = () => {
    const maxVelocity = 25
    const x = random.float(-maxVelocity, maxVelocity)
    const y = random.float(-maxVelocity, maxVelocity)
    return [x, y]
  }

  const generateParticleColor = i => {
    const grayValue = Math.round(255 - i / positions.length * 64)
    const hex = grayValue.toString(16)
    return '#' + hex + hex + hex
  }

  const colors = positions.map((_, i) => generateParticleColor(i))

  return {
    positions,
    velocities: positions.map(() => generateParticleVelocity()),
    originalColors: colors,
    colors: cloneDeep(colors),
  }
}

const generateCells = (particles, boundsSizeX, boundsSizeY) => {
  const voronoi =
    Delaunay
    .from(particles.positions)
    .voronoi([0, 0, boundsSizeX, boundsSizeY])

  return particles.positions.map((_, i) => ({
    path: voronoi.renderCell(i),
    color: particles.colors[i],
  }))
}

export default {
  name: 'VoronoiDiagram',
  setup() {
    const boundsSizeX = 1280
    const boundsSizeY = 720

    const state = reactive({
      particles: generateParticles(boundsSizeX, boundsSizeY),
      cells: [],
      boundsSizeX,
      boundsSizeY,
    })

    const cells = computed(() => generateCells(state.particles, state.boundsSizeX, state.boundsSizeY))

    const { addAnimationFrame } = useAnimationFrame()

    addAnimationFrame(({ deltaTime }) => {
      for (let i = 0; i < state.particles.positions.length; i++) {
        const pos = state.particles.positions[i]
        const vel = state.particles.velocities[i]
        pos[0] += vel[0] * deltaTime
        pos[1] += vel[1] * deltaTime

        if (pos[0] < 0) {
          pos[0] = 0
          vel[0] *= -1
        } else if (pos[0] > boundsSizeX) {
          pos[0] = boundsSizeX
          vel[0] *= -1
        }

        if (pos[1] < 0) {
          pos[1] = 0
          vel[1] *= -1
        } else if (pos[1] > boundsSizeY) {
          pos[1] = boundsSizeY
          vel[1] *= -1
        }
      }
    })

    const onTouchMove = (e) => {
      try {
        const { clientX, clientY } = e.touches[0]
        const element = document.elementFromPoint(clientX, clientY)
        onCellHover(parseInt(element.getAttribute('data-cell-index')))
      } catch {}
    }

    const onCellHover = i => {
      if (state.particles.colors[i] !== state.particles.originalColors[i]) {
        return
      }

      const oneStep = 1 / 7
      const gradient = new Gradient(
        [
          {
            factor: 0,
            color: new Color({ model: 'hex', hex: state.particles.originalColors[i] }),
          },
          {
            factor: oneStep,
            color: new Color({ model: 'hex', hex: 'ff3232' }),
          },
          {
            factor: oneStep * 2,
            color: new Color({ model: 'hex', hex: 'ffff32' }),
          },
          {
            factor: oneStep * 3,
            color: new Color({ model: 'hex', hex: '32ff32' }),
          },
          {
            factor: oneStep * 4,
            color: new Color({ model: 'hex', hex: '32ffff' }),
          },
          {
            factor: oneStep * 5,
            color: new Color({ model: 'hex', hex: '3232ff' }),
          },
          {
            factor: oneStep * 6,
            color: new Color({ model: 'hex', hex: 'ff32ff' }),
          },
          {
            factor: oneStep * 7,
            color: new Color({ model: 'hex', hex: state.particles.originalColors[i] }),
          },
        ],
      )
      state.particles.colors[i] = gradient.getColor(0).toString()
      addAnimationFrame(({ timeElapsed }) => {
        if (timeElapsed >= 1) {
          state.particles.colors[i] = state.particles.originalColors[i]
          return true
        }
        state.particles.colors[i] = gradient.getColor(timeElapsed / 1).toString()
      })
    }

    return {
      state,
      cells,
      onCellHover,
      onTouchMove,
    }
  },
}
</script>
