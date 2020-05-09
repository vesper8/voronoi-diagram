<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="`0 0 ${state.boundsSizeX} ${state.boundsSizeY}`"
    preserveAspectRatio="xMinYMin slice"
    @touchstart.prevent
    @touchmove.prevent="onTouchMove"
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
import { useAnimationFrame } from '../logic/useAnimationFrame'
import { Color, Gradient } from '../utils'

function createParticleView(data, i) {
  const result = {}

  const genGetterAndSetter = (propertyName, arrayName) =>
    Object.defineProperty(result, propertyName, {
      get: () => data[arrayName][i],
      set: value => data[arrayName][i] = value,
    })

  genGetterAndSetter('animation', 'animations')
  genGetterAndSetter('color', 'colors')
  genGetterAndSetter('originalColor', 'originalColors')
  genGetterAndSetter('position', 'positions')
  genGetterAndSetter('velocity', 'velocities')

  return result
}

const genParticles = (boundsSizeX, boundsSizeY) => {
  const poissonDisk = new PoissonDisk({
        shape: [boundsSizeX, boundsSizeY],
        minDistance: 100,
        maxDistance: 300,
        tries: 30,
      })
  const positions = poissonDisk.fill()

  const genParticleVelocity = () => {
    const maxVelocity = 25
    const x = random.float(-maxVelocity, maxVelocity)
    const y = random.float(-maxVelocity, maxVelocity)
    return [x, y]
  }

  const genParticleColor = i => {
    const grayValue = Math.round(255 - i / positions.length * 64)
    const hex = grayValue.toString(16)
    return '#' + hex + hex + hex
  }

  const colors = positions.map((_, i) => genParticleColor(i))

  const data = reactive({
    positions,
    velocities: positions.map(() => genParticleVelocity()),
    originalColors: colors,
    colors: cloneDeep(colors),
    animations: [],
  })

  return {
    data,
    particles: positions.map((_, i) => createParticleView(data, i)),
  }
}

const genCells = (positions, colors, boundsSizeX, boundsSizeY) => {
  const voronoi =
    Delaunay
    .from(positions)
    .voronoi([0, 0, boundsSizeX, boundsSizeY])

  return positions.map((_, i) => ({
    path: voronoi.renderCell(i),
    color: colors[i],
  }))
}

export default {
  name: 'VoronoiDiagram',
  setup() {
    const boundsSizeX = window.innerWidth
    const boundsSizeY = window.innerHeight

    const { particles, data: particlesData } = genParticles(boundsSizeX, boundsSizeY)

    const state = reactive({
      particles,
      cells: [],
      boundsSizeX,
      boundsSizeY,
    })

    const cells = computed(() =>
      genCells(
        particlesData.positions,
        particlesData.colors,
        state.boundsSizeX,
        state.boundsSizeY
      )
    )

    const { addAnimation } = useAnimationFrame()

    addAnimation(({ deltaTime }) => {
      for (let i = 0; i < state.particles.length; i++) {
        const pos = state.particles[i].position
        const vel = state.particles[i].velocity
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

    const onTouchMove = e => {
      try {
        const { clientX, clientY } = e.touches[0]
        const element = document.elementFromPoint(clientX, clientY)
        onCellHover(parseInt(element.getAttribute('data-cell-index')))
      } catch {}
    }

    const onCellHover = i => {
      const particle = particles[i]

      if (particle.animation) {
        if (particle.animation.info.timeElapsed > 0.25) {
          particle.animation.cancel()
        } else {
          return
        }
      }

      const genColorStop = (i, hex) => ({
        factor: (1 / 7) * i,
        color: new Color({ model: 'hex', hex }),
      })

      const gradient = new Gradient([
        genColorStop(0, particle.originalColor),
        genColorStop(1, 'ff3232'),
        genColorStop(2, 'ffff32'),
        genColorStop(3, '32ff32'),
        genColorStop(4, '32ffff'),
        genColorStop(5, '3232ff'),
        genColorStop(6, 'ff32ff'),
        genColorStop(7, particle.originalColor),
      ])

      particle.animation = addAnimation(({ cancel, timeElapsed }) => {
        if (timeElapsed >= 1) {
          particle.color = particle.originalColor
          return cancel()
        }
        particle.color = gradient.getColor(timeElapsed / 1).toString()
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
