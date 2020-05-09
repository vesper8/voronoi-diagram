<template>
  <div :class="$style.banner">
    <voronoi-diagram :class="$style.diagram" />
  </div>
</template>
<script>
import VoronoiDiagram from './VoronoiDiagram'
export default {
  name: 'HeroBanner',
  components: { VoronoiDiagram },
}
</script>
<style lang="scss" module>
.banner {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.diagram {
  width: 100%;
  height: 100%;
}
</style>

