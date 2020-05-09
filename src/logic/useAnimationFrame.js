import { onMounted, onUnmounted } from 'vue'
import { differenceInMilliseconds } from 'date-fns'



export function useAnimationFrame() {
  let callbacks = []

  const tick = () => {
    const now = new Date()

    for (const callbackData of callbacks) {
      const { callback, startDateTime } = callbackData

      const deltaTime = differenceInMilliseconds(now, callbackData.lastFrameDateTime) / 1000
      const timeElapsed = differenceInMilliseconds(now, startDateTime) / 1000

      try {
        const shouldStop = callback({ startDateTime, timeElapsed, deltaTime })
        if (shouldStop) {
          callbacks = callbacks.filter(c => c.callbacks !== callback)
        }
      } catch (e) {
        console.error(e)
      }

      callbackData.lastFrameDateTime = now
    }

    requestAnimationFrame(tick)
  }

  onMounted(() => {
    const now = new Date()
    for (const callbackData of callbacks) {
      callbackData.lastFrameDateTime = now
    }
    requestAnimationFrame(tick)
  })
  onUnmounted(() => cancelAnimationFrame(tick))

  return {
    addAnimationFrame(callback) {
      const now = new Date()
      callbacks.push({
        callback,
        startDateTime: now,
        lastFrameDateTime: now,
      })
      return {
        cancel() {
          callbacks = callbacks.filter(c => c.callbacks !== callback)
        }
      }
    },
  }
}