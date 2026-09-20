const SOUND_URLS = {
  correct: '/sounds/correct.wav',
  wrong: '/sounds/wrong.wav',
} as const

type SoundKind = keyof typeof SOUND_URLS

const cache = new Map<SoundKind, HTMLAudioElement>()
let unlocked = false

function getAudio(kind: SoundKind): HTMLAudioElement {
  let audio = cache.get(kind)
  if (!audio) {
    audio = new Audio(SOUND_URLS[kind])
    audio.preload = 'auto'
    audio.volume = kind === 'correct' ? 0.6 : 0.55
    cache.set(kind, audio)
  }
  return audio
}

/** Call after a user tap so mobile browsers allow later playback. */
export function unlockSounds(): void {
  if (unlocked) return
  unlocked = true
  ;(Object.keys(SOUND_URLS) as SoundKind[]).forEach((kind) => {
    const audio = getAudio(kind)
    audio.muted = true
    void audio
      .play()
      .then(() => {
        audio.pause()
        audio.currentTime = 0
        audio.muted = false
      })
      .catch(() => {
        audio.muted = false
      })
  })
}

export function playSound(kind: SoundKind): void {
  const audio = getAudio(kind)
  audio.currentTime = 0
  void audio.play().catch(() => {
    // Ignore until unlocked by a user gesture.
  })
}
