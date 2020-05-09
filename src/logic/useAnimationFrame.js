import { onMounted, onUnmounted } from 'vue'
import { differenceInMilliseconds } from 'date-fns'



export function useAnimationFrame() {
  let callbacks = []

  const tick = () => {
    const now = new Date()

    for (const callbackData of callbacks) {
      const { callback, info } = callbackData

      const deltaTime = differenceInMilliseconds(now, info.lastFrameDateTime) / 1000
      info.timeElapsed = differenceInMilliseconds(now, info.startDateTime) / 1000

      try {
        const shouldStop = callback({ startDateTime: info.startDateTime, timeElapsed: info.timeElapsed, deltaTime })
        if (shouldStop) {
          callbacks = callbacks.filter(c => c.callbacks !== callback)
        }
      } catch (e) {
        console.error(e)
      }

      info.lastFrameDateTime = now
    }

    requestAnimationFrame(tick)
  }

  onMounted(() => {
    const now = new Date()
    for (const { info } of callbacks) {
      info.lastFrameDateTime = now
    }
    requestAnimationFrame(tick)
  })
  onUnmounted(() => cancelAnimationFrame(tick))

  return {
    addAnimationFrame(callback) {
      const now = new Date()
      const info = {
        timeElapsed: 0,
        startDateTime: now,
        lastFrameDateTime: now,
      }
      callbacks.push({
        callback,
        info,
      })
      return {
        info,
        cancel() {
          callbacks = callbacks.filter(c => c.callbacks !== callback)
        }
      }
    },
  }
}