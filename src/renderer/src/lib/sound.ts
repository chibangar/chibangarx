let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  return audioContext
}

function isSoundEnabled(): boolean {
  return localStorage.getItem("chibangarx:soundEnabled") !== "false"
}

export function speakWelcome(name: string): void {
  if (!isSoundEnabled() || !("speechSynthesis" in window)) return

  const speak = () => {
    try {
      const utterance = new SpeechSynthesisUtterance(`Bem-vindo de novo, ${name}`)
      utterance.lang = "pt-PT"
      utterance.rate = 0.96
      utterance.pitch = 1.08
      utterance.volume = 0.82

      const portugueseVoices = window.speechSynthesis
        .getVoices()
        .filter((voice) => voice.lang.toLowerCase().startsWith("pt"))
      const preferredNames = /helia|maria|francisca|fernanda|feminina|female/i
      utterance.voice =
        portugueseVoices.find((voice) => preferredNames.test(voice.name)) ??
        portugueseVoices.find((voice) => voice.lang.toLowerCase() === "pt-pt") ??
        portugueseVoices[0] ??
        null

      window.speechSynthesis.speak(utterance)
    } catch {
      // Speech is an optional welcome enhancement and must never affect startup.
    }
  }

  if (window.speechSynthesis.getVoices().length > 0) {
    speak()
    return
  }

  const timeout = window.setTimeout(() => {
    window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged)
    speak()
  }, 1200)
  const handleVoicesChanged = () => {
    window.clearTimeout(timeout)
    window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged)
    speak()
  }
  window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged)
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume: number = 0.15,
): void {
  if (!isSoundEnabled()) return

  const ctx = getAudioContext()
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

  gainNode.gain.setValueAtTime(volume, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + duration)
}

function playFrequencySweep(
  startFreq: number,
  endFreq: number,
  duration: number,
  volume: number = 0.15,
): void {
  if (!isSoundEnabled()) return

  const ctx = getAudioContext()
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.type = "sine"
  oscillator.frequency.setValueAtTime(startFreq, ctx.currentTime)
  oscillator.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + duration)

  gainNode.gain.setValueAtTime(volume, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + duration)
}

export function playClick(): void {
  playTone(800, 0.05, "sine", 0.1)
}

export function playToggle(on: boolean): void {
  if (on) {
    playFrequencySweep(600, 800, 0.1, 0.12)
  } else {
    playFrequencySweep(800, 600, 0.1, 0.12)
  }
}

export function playModalOpen(): void {
  playTone(400, 0.12, "sine", 0.08)
}

export function playModalClose(): void {
  playTone(350, 0.08, "sine", 0.06)
}

export function playSuccess(): void {
  if (!isSoundEnabled()) return

  const ctx = getAudioContext()
  const now = ctx.currentTime

  const notes = [523.25, 659.25, 783.99]
  notes.forEach((freq, i) => {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(freq, now + i * 0.08)

    gainNode.gain.setValueAtTime(0.1, now + i * 0.08)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.15)

    oscillator.start(now + i * 0.08)
    oscillator.stop(now + i * 0.08 + 0.15)
  })
}

export function playError(): void {
  playFrequencySweep(500, 300, 0.15, 0.1)
}

export function playDropdown(): void {
  playTone(600, 0.03, "sine", 0.08)
}

export function playCheckbox(): void {
  playTone(700, 0.04, "sine", 0.1)
}

export function playBoot(): void {
  if (!isSoundEnabled()) return

  const ctx = getAudioContext()
  const now = ctx.currentTime

  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((freq, i) => {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(freq, now + i * 0.12)

    gainNode.gain.setValueAtTime(0.08, now + i * 0.12)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25)

    oscillator.start(now + i * 0.12)
    oscillator.stop(now + i * 0.12 + 0.25)
  })
}

export function playNavigate(): void {
  playTone(660, 0.06, "sine", 0.08)
}

export function playHover(): void {
  playTone(1200, 0.02, "sine", 0.04)
}

export function playMinimize(): void {
  playFrequencySweep(800, 400, 0.08, 0.06)
}

export function playMaximize(): void {
  playFrequencySweep(400, 800, 0.08, 0.06)
}

export function playClose(): void {
  playFrequencySweep(600, 200, 0.1, 0.07)
}

export function playCardClick(): void {
  playTone(900, 0.03, "sine", 0.06)
}
