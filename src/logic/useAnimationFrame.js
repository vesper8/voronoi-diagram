import { onMounted, onUnmounted } from 'vue'
import { differenceInMilliseconds } from 'date-fns'

export function useAnimationFrame() {
  let callbacks = []

  const tick = () => {
    const now = new Date()

    for (const { callback, cancel, info } of callbacks) {
      const deltaTime = differenceInMilliseconds(now, info.lastFrameDateTime) / 1000
      info.timeElapsed = differenceInMilliseconds(now, info.startDateTime) / 1000

      try {
        callback({ cancel, ...info, deltaTime })
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
      info.startDateTime = now
      info.lastFrameDateTime = now
    }
    requestAnimationFrame(tick)
  })
  onUnmounted(() => cancelAnimationFrame(tick))

  return {
    addAnimation(callback) {
      const now = new Date()
      const data = {
        callback,
        info: {
          timeElapsed: 0,
          startDateTime: now,
          lastFrameDateTime: now,
        },
        cancel() {
          callbacks = callbacks.filter(c => c.callback !== callback)
        },
      }

      callbacks.push(data)
      return data
    },
  }
}