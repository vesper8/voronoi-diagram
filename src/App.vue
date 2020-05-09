<template>
  <div :class="$style.app">
    <hero-banner />
    <a href="https://github.com/svsem/voronoi-diagram" target="_blank" :class="$style.githubButton" v-html="githubIcon" />
  </div>
</template>

<script>
import HeroBanner from './components/HeroBanner'
import githubIcon from '../assets/icons/github.svg'

export default {
  name: 'App',
  components: { HeroBanner },
  setup() {
    return {
      githubIcon,
    }
  },
}
</script>
<style lang="scss" module>
.app {
  position: relative;
}

.githubButton {
  position: absolute;
  top: 0;
  left: 0;
  padding: $spacer * 1.5;
  background-color: black;
  animation: gradient infinite $transitiokn-duration * 50;
  outline: none;

  svg {
    width: 48px;
    height: 48px;
    transition: transform $transitiokn-duration * 5;
  }

  &:hover svg {
    transform: rotate(1turn) scale(1.5);
  }
}

$oneStep: 1 / 6 * 100%;

@keyframes gradient {
  0% {
    color: #ff3232;
  }
  #{$oneStep} {
    color: #ffff32;
  }
  #{$oneStep * 2} {
    color: #32ff32;
  }
  #{$oneStep * 3} {
    color: #32ffff;
  }
  #{$oneStep * 4} {
    color: #3232ff;
  }
  #{$oneStep * 5} {
    color: #ff32ff;
  }
  #{$oneStep * 6} {
    color: #ff3232;
  }
}
</style>
