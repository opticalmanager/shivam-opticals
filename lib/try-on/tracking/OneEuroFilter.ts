/**
 * OneEuroFilter
 * Speed-adaptive low-pass filter (Casiez et al., CHI 2012)
 * Eliminates high-frequency sensor noise / micro-jitter while providing zero-lag response during rapid motion.
 */

class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  public filter(value: number, alpha: number): number {
    if (this.y === null) {
      this.s = value;
      this.y = value;
      return value;
    }
    this.y = alpha * value + (1.0 - alpha) * this.s!;
    this.s = this.y;
    return this.y;
  }

  public hasLastRawValue(): boolean {
    return this.y !== null;
  }

  public lastValue(): number {
    return this.y ?? 0;
  }

  public reset(): void {
    this.y = null;
    this.s = null;
  }
}

export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xFilter = new LowPassFilter();
  private dxFilter = new LowPassFilter();
  private lastTime: number | null = null;

  /**
   * @param minCutoff Minimum cutoff frequency in Hz (lower = more smoothing when still, default 1.0)
   * @param beta Speed coefficient (higher = less lag when moving quickly, default 0.007)
   * @param dCutoff Cutoff frequency for derivative in Hz (default 1.0)
   */
  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  private alpha(rate: number, cutoff: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    const te = 1.0 / rate;
    return 1.0 / (1.0 + tau / te);
  }

  public filter(value: number, timestampMs: number): number {
    if (this.lastTime === null) {
      this.lastTime = timestampMs;
      return this.xFilter.filter(value, 1.0);
    }

    const dt = Math.max((timestampMs - this.lastTime) / 1000.0, 0.001);
    this.lastTime = timestampMs;
    const rate = 1.0 / dt;

    // Estimate the current variation
    const prevValue = this.xFilter.lastValue();
    const dx = (value - prevValue) * rate;
    const edx = this.dxFilter.filter(dx, this.alpha(rate, this.dCutoff));

    // Calculate the dynamic cutoff frequency
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    return this.xFilter.filter(value, this.alpha(rate, cutoff));
  }

  public reset(): void {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTime = null;
  }
}

/**
 * Multi-dimensional OneEuroFilter for 3D vectors (X, Y, Z)
 */
export class Vector3Filter {
  private fx: OneEuroFilter;
  private fy: OneEuroFilter;
  private fz: OneEuroFilter;

  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.fx = new OneEuroFilter(minCutoff, beta, dCutoff);
    this.fy = new OneEuroFilter(minCutoff, beta, dCutoff);
    this.fz = new OneEuroFilter(minCutoff, beta, dCutoff);
  }

  public filter(v: { x: number; y: number; z: number }, timestampMs: number): { x: number; y: number; z: number } {
    return {
      x: this.fx.filter(v.x, timestampMs),
      y: this.fy.filter(v.y, timestampMs),
      z: this.fz.filter(v.z, timestampMs),
    };
  }

  public reset(): void {
    this.fx.reset();
    this.fy.reset();
    this.fz.reset();
  }
}
