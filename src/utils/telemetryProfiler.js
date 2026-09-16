/**
 * AutoFlow AI — Node Telemetry Profiler & Pipeline Stepper Engine
 * Analyzes per-node execution timings, token usages, and identifies bottlenecks.
 */

/**
 * Computes granular metrics across executed pipeline nodes
 * 
 * @param {Array} snapshots - Array of execution snapshots
 * @returns {Object} Profiler telemetry report
 */
export function analyzePipelineMetrics(snapshots = []) {
  if (!Array.isArray(snapshots) || snapshots.length === 0) {
    return {
      totalLatencyMs: 0,
      totalTokens: 0,
      averageNodeLatencyMs: 0,
      bottleneckNodeId: null,
      bottleneckDurationMs: 0,
      nodeMetrics: {}
    };
  }

  let totalLatencyMs = 0;
  let totalTokens = 0;
  let maxLatency = -1;
  let bottleneckNodeId = null;

  const nodeMetrics = {};

  snapshots.forEach((snap, idx) => {
    const prevElapsed = idx > 0 ? (snapshots[idx - 1].elapsedMs || 0) : 0;
    const stepLatency = snap.stepDurationMs !== undefined 
      ? snap.stepDurationMs 
      : Math.max(0, (snap.elapsedMs || 0) - prevElapsed);
    const stepTokens = snap.tokens || 0;

    totalLatencyMs += stepLatency;
    totalTokens += stepTokens;

    if (stepLatency > maxLatency) {
      maxLatency = stepLatency;
      bottleneckNodeId = snap.nodeId;
    }

    nodeMetrics[snap.nodeId] = {
      nodeId: snap.nodeId,
      nodeTitle: snap.nodeTitle,
      latencyMs: stepLatency,
      tokens: stepTokens,
      status: snap.status || 'success',
      stepIndex: idx,
      isBottleneck: false
    };
  });

  if (bottleneckNodeId && nodeMetrics[bottleneckNodeId] && maxLatency > 0) {
    nodeMetrics[bottleneckNodeId].isBottleneck = true;
  }

  return {
    totalLatencyMs,
    totalTokens,
    averageNodeLatencyMs: snapshots.length > 0 ? Math.round(totalLatencyMs / snapshots.length) : 0,
    bottleneckNodeId,
    bottleneckDurationMs: maxLatency > 0 ? maxLatency : 0,
    nodeMetrics
  };
}

/**
 * Helper state machine for step-through debugger tracking
 */
export class PipelineStepController {
  constructor(totalSteps = 0) {
    this.totalSteps = totalSteps;
    this.currentStep = 0;
    this.isPaused = false;
    this.isCompleted = false;
    this._resolveStep = null;
  }

  waitForStep() {
    this.isPaused = true;
    return new Promise((resolve) => {
      this._resolveStep = resolve;
    });
  }

  stepNext() {
    if (this._resolveStep) {
      const fn = this._resolveStep;
      this._resolveStep = null;
      this.isPaused = false;
      this.currentStep++;
      fn({ action: 'step' });
    }
  }

  resumeAll() {
    if (this._resolveStep) {
      const fn = this._resolveStep;
      this._resolveStep = null;
      this.isPaused = false;
      fn({ action: 'resume' });
    }
  }

  stop() {
    if (this._resolveStep) {
      const fn = this._resolveStep;
      this._resolveStep = null;
      this.isPaused = false;
      fn({ action: 'stop' });
    }
  }
}
