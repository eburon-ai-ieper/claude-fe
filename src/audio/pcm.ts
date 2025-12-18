export function float32ToPCM16(float32: Float32Array): Int16Array {
  const pcm16 = new Int16Array(float32.length)

  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]))
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }

  return pcm16
}

export function base64ToInt16Array(base64: string): Int16Array {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);

  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i);
  }

  return new Int16Array(buffer);
}

export function pcm16ToAudioBuffer(
  audioContext: AudioContext,
  pcm16: Int16Array,
  sampleRate = 16000
): AudioBuffer {
  const GAIN = 2.2; // try 1.5 – 2.5
  const buffer = audioContext.createBuffer(
    1, // mono
    pcm16.length,
    sampleRate
  );

  const channelData = buffer.getChannelData(0);

  for (let i = 0; i < pcm16.length; i++) {
    channelData[i] = Math.max(
      -1,
      Math.min(1, (pcm16[i] / 32768) * GAIN)
    );
  }

  return buffer;
}

let audioCtx: AudioContext | null = null;

export function playPCM(base64: string) {
  if (!audioCtx) {
    audioCtx = new AudioContext({ sampleRate: 16000 });
  }

  const pcm16 = base64ToInt16Array(base64);
  const audioBuffer = pcm16ToAudioBuffer(audioCtx, pcm16);

  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioCtx.destination);
  source.start();
}

export class PCMPlayer {
  private ctx: AudioContext;
  private nextTime: number;

  constructor(sampleRate = 16000) {
    this.ctx = new AudioContext({ sampleRate });
    this.nextTime = this.ctx.currentTime;
  }

  async resume() {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  playChunk(base64: string) {
    const pcm16 = base64ToInt16Array(base64);
    const buffer = pcm16ToAudioBuffer(this.ctx, pcm16);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 1.1;
    source.connect(this.ctx.destination);

    // 🔥 schedule, don't play immediately
    const startTime = Math.max(this.nextTime, this.ctx.currentTime);
    source.start(startTime);

    this.nextTime = startTime + buffer.duration;
  }

  reset() {
    this.nextTime = this.ctx.currentTime;
  }
}
