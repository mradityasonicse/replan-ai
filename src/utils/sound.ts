// Web Audio API micro-haptics & synthetic chimes + Ambient Sound Generator (Zero external dependencies)
class SoundEngine {
  private ctx: AudioContext | null = null
  private ambientSource: AudioNode | null = null
  private ambientGain: GainNode | null = null
  private isAmbientPlaying: boolean = false

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  public playClick(): void {
    const ctx = this.getContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04)

    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.04)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.04)
  }

  public playSuccessChime(): void {
    const ctx = this.getContext()
    if (!ctx) return

    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08)

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08)
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + idx * 0.08 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.45)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(ctx.currentTime + idx * 0.08)
      osc.stop(ctx.currentTime + idx * 0.08 + 0.45)
    })
  }

  public playAlert(): void {
    const ctx = this.getContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(320, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(240, ctx.currentTime + 0.15)

    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.15)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.15)
  }

  public playComplete(): void {
    const ctx = this.getContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(659.25, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.12)

    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.25)
  }

  // Generates real-time procedural Brown Noise / Rainfall for deep work focus
  public startAmbientFocusSound(type: 'brown' | 'binaural' | 'rain' = 'brown'): void {
    const ctx = this.getContext()
    if (!ctx) return

    this.stopAmbientFocusSound()

    const bufferSize = 2 * ctx.sampleRate
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)

    let lastOut = 0.0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      if (type === 'brown' || type === 'rain') {
        // Brown noise filter (integrated white noise)
        output[i] = (lastOut + 0.02 * white) / 1.02
        lastOut = output[i]
        output[i] *= 3.5 // scale volume
      } else {
        // Soft white
        output[i] = white * 0.15
      }
    }

    const whiteNoise = ctx.createBufferSource()
    whiteNoise.buffer = noiseBuffer
    whiteNoise.loop = true

    // Low-pass filter for cozy ambient sound
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(type === 'rain' ? 800 : 400, ctx.currentTime)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 1.0)

    whiteNoise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    whiteNoise.start()
    this.ambientSource = whiteNoise
    this.ambientGain = gain
    this.isAmbientPlaying = true
  }

  public stopAmbientFocusSound(): void {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5)
      setTimeout(() => {
        try {
          if (this.ambientSource) {
            (this.ambientSource as AudioBufferSourceNode).stop()
            this.ambientSource.disconnect()
            this.ambientSource = null
          }
        } catch {
          // ignore
        }
        this.isAmbientPlaying = false
      }, 600)
    }
  }

  public getIsAmbientPlaying(): boolean {
    return this.isAmbientPlaying
  }
}

export const sound = new SoundEngine()
