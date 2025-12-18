// public/pcm-worklet.js

class PCMWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    // Buffer size: 4096 samples @ 16kHz = approx 256ms of audio
    // Smaller = lower latency but higher CPU/Network load
    // Larger = smoother audio but higher latency
    this.bufferSize = 2048; 
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const channelData = input[0]; // Mono channel

    for (let i = 0; i < channelData.length; i++) {
      this.buffer[this.bufferIndex++] = channelData[i];

      // When buffer is full, send it to the main thread
      if (this.bufferIndex >= this.bufferSize) {
        // Clone the buffer to send it (avoid race conditions)
        const bufferToSend = this.buffer.slice();
        this.port.postMessage(bufferToSend);
        
        // Reset
        this.bufferIndex = 0;
      }
    }

    return true; // Keep processor alive
  }
}

registerProcessor('pcm-worklet', PCMWorklet);