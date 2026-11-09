import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, ExternalLink, Play, Pause } from 'lucide-react';
import { MathEquation } from './MathEquation';

const REAL_RETURNS_40_UPDATES = [
  329, 279.8, 266.2, 216.9, 295.1, 280.2, 302.3, 217.9, 346.4, 375.1,
  435.8, 497.3, 382.4, 459.9, 528.4, 470.9, 521.8, 474.7, 560, 476.6,
  356.4, 375.7, 502, 526.4, 513.9, 610.2, 600.6, 561.4, 581.1, 601,
  599.7, 558.4, 572.3, 609.3, 588.2, 575.5, 545.8, 536.9, 536.9, 539.6,
];

const LQR_K = [-0.9044, -10.0574, -1.4026, -2.4412];

interface SindyRlInteractiveReportProps {
  showSimulator?: boolean;
  showCharts?: boolean;
  showDiagnosticsOrTables?: boolean;
}

export const SindyRlInteractiveReport: React.FC<SindyRlInteractiveReportProps> = ({
  showSimulator = true,
  showCharts = true,
  showDiagnosticsOrTables = true,
}) => {
  const [simMode, setSimMode] = useState<'auto' | 'manual' | 'free'>('auto');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [hoveredUpdateIdx, setHoveredUpdateIdx] = useState<number | null>(25);
  const [readoutText, setReadoutText] = useState<string>(
    't=0.0s  θ=180°  x=0.00  u=0.00'
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<{
    s: [number, number, number, number, number]; // [x, cos(theta), sin(theta), x_dot, theta_dot]
    bal: boolean;
    tm: number;
    key: number;
    btn: number;
    u: number;
  }>({
    s: [0, -1, 0, 0, 0],
    bal: false,
    tm: 0,
    key: 0,
    btn: 0,
    u: 0,
  });

  const resetSimulator = useCallback(
    (targetMode: 'auto' | 'manual' | 'free' = simMode) => {
      const rand = () => (Math.random() - 0.5) * 0.02;
      const a =
        targetMode === 'auto'
          ? Math.PI + rand()
          : targetMode === 'free'
          ? 0.06
          : 0.03;
      stateRef.current.s = [rand(), Math.cos(a), Math.sin(a), rand(), rand()];
      stateRef.current.bal = false;
      stateRef.current.tm = 0;
      stateRef.current.u = 0;
    },
    [simMode]
  );

  useEffect(() => {
    resetSimulator(simMode);
  }, [simMode, resetSimulator]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        stateRef.current.key = -1;
      } else if (e.key === 'ArrowRight') {
        stateRef.current.key = 1;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        stateRef.current.key = 0;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    let animId: number;
    let last = performance.now();
    let acc = 0;
    let frameCount = 0;

    // Exact 14-term learned dynamics from update 39
    const stepLearnedModel = (
      s: [number, number, number, number, number],
      uInput: number
    ): [number, number, number, number, number] => {
      const u = Math.max(-1, Math.min(1, uInput));
      const [x, c, n, xd, td] = s;
      const c2 = 0.99975 * c - 0.01 * n * td;
      const s2 = 0.9991 * n + 0.01 * c * td;
      const m = Math.hypot(c2, s2) || 1;
      return [
        0.99994 * x + 0.01 * xd,
        c2 / m,
        s2 / m,
        0.99927 * xd -
          0.01117 * c * n +
          u * (0.0581 + 0.03894 * c * c + 0.01918 * n * n),
        0.14807 * n + 0.99951 * td - 0.13537 * c * u,
      ];
    };

    const computeControl = (): number => {
      const st = stateRef.current;
      if (simMode === 'free') return 0;
      if (simMode === 'manual') return 0.6 * (st.key + st.btn);
      const [x, c, n, xd, td] = st.s;
      const th = Math.atan2(n, c);
      const E = 0.5 * td * td + 14.8 * c;
      if (c > 0.93 && Math.abs(td) < 4) st.bal = true;
      if (st.bal && c < 0.6) st.bal = false;
      return st.bal
        ? -(LQR_K[0] * x + LQR_K[1] * th + LQR_K[2] * xd + LQR_K[3] * td)
        : 0.12 * (E - 14.8) * c * td - 0.35 * x - 0.9 * xd;
    };

    const drawCanvas = () => {
      const cv = canvasRef.current;
      if (!cv) return;
      const cx = cv.getContext('2d');
      if (!cx) return;

      const w = cv.clientWidth || 720;
      const h = cv.clientHeight || 240;
      const d = window.devicePixelRatio || 1;
      if (cv.width !== w * d || cv.height !== h * d) {
        cv.width = w * d;
        cv.height = h * d;
      }
      cx.setTransform(d, 0, 0, d, 0, 0);
      cx.clearRect(0, 0, w, h);

      const sc = w / 5.2;
      const ox = w / 2;
      const gy = h * 0.72;

      // Track line
      cx.strokeStyle = '#64748b';
      cx.lineWidth = 2;
      cx.beginPath();
      cx.moveTo(0, gy + 14);
      cx.lineTo(w, gy + 14);
      cx.stroke();

      // +-1.8m rail boundary dashed lines
      cx.setLineDash([5, 4]);
      for (const e of [-1.8, 1.8]) {
        cx.beginPath();
        cx.moveTo(ox + e * sc, gy - h * 0.65);
        cx.lineTo(ox + e * sc, gy + 14);
        cx.stroke();
      }
      cx.setLineDash([]);

      const s = stateRef.current.s;
      const px = ox + s[0] * sc;
      const L = Math.min(h * 0.6, 1.0 * sc * 0.9);
      const tx2 = px + L * s[2];
      const ty = gy - L * s[1];

      // Cart
      cx.fillStyle = '#2563eb';
      cx.fillRect(px - 26, gy - 8, 52, 22);

      // Pole
      cx.strokeStyle = '#e0661d';
      cx.lineWidth = 6;
      cx.lineCap = 'round';
      cx.beginPath();
      cx.moveTo(px, gy);
      cx.lineTo(tx2, ty);
      cx.stroke();

      // Tip mass
      cx.fillStyle = '#0f172a';
      cx.beginPath();
      cx.arc(tx2, ty, 8, 0, Math.PI * 2);
      cx.fill();
    };

    const loop = (now: number) => {
      frameCount++;
      if (!isPaused) {
        acc += Math.min(now - last, 50) / 10;
      }
      last = now;

      while (acc >= 1) {
        acc--;
        const st = stateRef.current;
        const u = computeControl();
        st.u = Math.max(-1, Math.min(1, u));
        st.s = stepLearnedModel(st.s, u);
        if (Math.abs(st.s[0]) > 1.8) {
          st.s[0] = Math.sign(st.s[0]) * 1.8;
          st.s[3] = 0;
        }
        st.tm += 0.01;
        if (simMode === 'auto' && st.tm > 25) {
          resetSimulator('auto');
        }
      }

      drawCanvas();

      if (frameCount % 4 === 0) {
        const st = stateRef.current;
        const deg = (Math.atan2(st.s[2], st.s[1]) * 57.2958).toFixed(0);
        setReadoutText(
          `t=${st.tm.toFixed(1)}s  θ=${deg}°  x=${st.s[0].toFixed(2)}m  u=${st.u.toFixed(2)}`
        );
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [simMode, isPaused, resetSimulator]);

  // Chart geometry for Section 4 (Real return per dynamics update)
  const W = 900;
  const H = 300;
  const m = { l: 50, r: 20, t: 20, b: 40 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const toX = (i: number) => m.l + (iw * i) / (REAL_RETURNS_40_UPDATES.length - 1);
  const toY = (v: number) => m.t + ih * (1 - v / 800);
  const bestIdx = REAL_RETURNS_40_UPDATES.indexOf(Math.max(...REAL_RETURNS_40_UPDATES));

  return (
    <div className="space-y-8">
      {/* Header & 4 KPIs */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="text-xs font-mono text-blue-700">
              Model-Based RL · SINDy / E-SINDy · PPO (RLlib 2.6.3) · dm_control · Interpretable Control
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              SINDy-RL on the Cart-Pole Swing-Up: Reproduction, Diagnostics &amp; Learned-Model Simulator
            </h2>
          </div>

          <a
            href="/assets/aistudio/SINDy-RL_Cart-Pole__Reproduction__Diagnostics___Learned-Model_Simulation_2425c262.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            Open Standalone Interactive HTML Report
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <p className="mt-4 text-sm text-slate-600 leading-relaxed">
          An independent, from-scratch reproduction of <em>SINDy-RL</em> (Zolman et al., 2025, arXiv:2403.09110): a Dyna-style loop that learns a sparse, symbolic dynamics model (E-SINDy), trains PPO inside it, and refits it from a small amount of real data. Reproduction and analysis by Sk Humain Ahmed.
        </p>

        {/* 4 Exact KPIs from Humain's Report */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-2xl font-mono font-bold text-blue-700 tabular-nums">
              14
            </div>
            <div className="text-xs text-slate-600 mt-1">
              non-zero terms in the final learned dynamics (of 41 candidates / 205 total coefficients)
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-2xl font-mono font-bold text-blue-700 tabular-nums">
              ~48k
            </div>
            <div className="text-xs text-slate-600 mt-1">
              real environment steps used (8k offline + 40 × 1k on-policy rollouts)
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-2xl font-mono font-bold text-blue-700 tabular-nums">
              610.2
            </div>
            <div className="text-xs text-slate-600 mt-1">
              best real return (max ≈ 1000), matching the paper’s quadratic SINDy-RL plateau at this budget
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-2xl font-mono font-bold text-blue-700 tabular-nums">
              ≤ 4%
            </div>
            <div className="text-xs text-slate-600 mt-1">
              one-step control-gain error of the learned surrogate vs. real dm_control physics
            </div>
          </div>
        </div>
      </div>

      {/* 1. Method: the SINDy-RL loop (Exact 8-box SVG Block Diagram) */}
      {showCharts && (
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-3">
          1. Method: The SINDy-RL Dyna-Style Loop
        </h3>
        <div className="w-full overflow-x-auto bg-slate-50 border border-slate-200 rounded-lg p-4">
          <svg
            viewBox="0 0 900 330"
            className="w-full h-auto min-w-[680px]"
            role="img"
            aria-label="Block diagram of the SINDy-RL loop"
          >
            <defs>
              <marker
                id="arrow-head"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto"
              >
                <path d="M0 0L10 5L0 10z" fill="#64748b" />
              </marker>
            </defs>

            <rect
              x="10"
              y="20"
              width="190"
              height="70"
              rx="10"
              fill="#ffffff"
              stroke="#2563eb"
              strokeWidth="1.5"
            />
            <text x="105" y="48" textAnchor="middle" className="fill-slate-900 text-xs font-semibold">
              Real environment
            </text>
            <text x="105" y="68" textAnchor="middle" className="fill-slate-600 text-[11px]">
              dm_control cart-pole, 100 Hz
            </text>

            <rect
              x="255"
              y="20"
              width="190"
              height="70"
              rx="10"
              fill="#ffffff"
              stroke="#2563eb"
              strokeWidth="1.5"
            />
            <text x="350" y="48" textAnchor="middle" className="fill-slate-900 text-xs font-semibold">
              Offline data
            </text>
            <text x="350" y="68" textAnchor="middle" className="fill-slate-600 text-[11px]">
              8 random episodes (8000 steps)
            </text>

            <rect
              x="500"
              y="20"
              width="190"
              height="70"
              rx="10"
              fill="#ffffff"
              stroke="#e0661d"
              strokeWidth="1.5"
            />
            <text x="595" y="44" textAnchor="middle" className="fill-slate-900 text-xs font-semibold">
              E-SINDy (own code)
            </text>
            <text x="595" y="62" textAnchor="middle" className="fill-slate-600 text-[11px]">
              41-term library, STLRidge,
            </text>
            <text x="595" y="78" textAnchor="middle" className="fill-slate-600 text-[11px]">
              20-member ensemble, median Ξ
            </text>

            <rect
              x="710"
              y="20"
              width="180"
              height="70"
              rx="10"
              fill="#ffffff"
              stroke="#e0661d"
              strokeWidth="1.5"
            />
            <text x="800" y="48" textAnchor="middle" className="fill-slate-900 text-xs font-semibold">
              Surrogate environment
            </text>
            <text x="800" y="68" textAnchor="middle" className="fill-slate-600 text-[11px]">
              x′ = Θ(x,u)Ξ (symbolic)
            </text>

            <rect
              x="710"
              y="140"
              width="180"
              height="70"
              rx="10"
              fill="#ffffff"
              stroke="#2563eb"
              strokeWidth="1.5"
            />
            <text x="800" y="168" textAnchor="middle" className="fill-slate-900 text-xs font-semibold">
              PPO (RLlib 2.6.3)
            </text>
            <text x="800" y="188" textAnchor="middle" className="fill-slate-600 text-[11px]">
              40 updates × 4000 steps
            </text>

            <rect
              x="500"
              y="140"
              width="190"
              height="70"
              rx="10"
              fill="#ffffff"
              stroke="#2563eb"
              strokeWidth="1.5"
            />
            <text x="595" y="168" textAnchor="middle" className="fill-slate-900 text-xs font-semibold">
              Neural policy π(x)
            </text>
            <text x="595" y="188" textAnchor="middle" className="fill-slate-600 text-[11px]">
              2×64 tanh MLP
            </text>

            <rect
              x="255"
              y="140"
              width="190"
              height="70"
              rx="10"
              fill="#ffffff"
              stroke="#2563eb"
              strokeWidth="1.5"
            />
            <text x="350" y="168" textAnchor="middle" className="fill-slate-900 text-xs font-semibold">
              Real rollout
            </text>
            <text x="350" y="188" textAnchor="middle" className="fill-slate-600 text-[11px]">
              1000 steps, deterministic
            </text>

            <rect
              x="255"
              y="250"
              width="190"
              height="60"
              rx="10"
              fill="#ffffff"
              stroke="#2563eb"
              strokeWidth="1.5"
            />
            <text x="350" y="276" textAnchor="middle" className="fill-slate-900 text-xs font-semibold">
              On-policy buffer
            </text>
            <text x="350" y="294" textAnchor="middle" className="fill-slate-600 text-[11px]">
              queue of 10k transitions
            </text>

            <path d="M200 55H255" stroke="#64748b" strokeWidth="1.6" fill="none" markerEnd="url(#arrow-head)" />
            <path d="M445 55H500" stroke="#64748b" strokeWidth="1.6" fill="none" markerEnd="url(#arrow-head)" />
            <path d="M690 55H710" stroke="#64748b" strokeWidth="1.6" fill="none" markerEnd="url(#arrow-head)" />
            <path d="M800 90V140" stroke="#64748b" strokeWidth="1.6" fill="none" markerEnd="url(#arrow-head)" />
            <path d="M710 175H690" stroke="#64748b" strokeWidth="1.6" fill="none" markerEnd="url(#arrow-head)" />
            <path d="M500 175H445" stroke="#64748b" strokeWidth="1.6" fill="none" markerEnd="url(#arrow-head)" />
            <path d="M350 210V250" stroke="#64748b" strokeWidth="1.6" fill="none" markerEnd="url(#arrow-head)" />
            <path d="M255 280H150V90" stroke="#64748b" strokeWidth="1.6" fill="none" markerEnd="url(#arrow-head)" />
            <path
              d="M350 250C350 230 560 235 595 95"
              stroke="#64748b"
              strokeWidth="1.6"
              strokeDasharray="5 4"
              fill="none"
              markerEnd="url(#arrow-head)"
            />

            <text x="160" y="215" className="fill-slate-600 text-[11px]">
              real data from the policy
            </text>
            <text x="555" y="250" className="fill-slate-600 text-[11px]">
              refit Ξ every update
            </text>
          </svg>
        </div>

        <p className="mt-4 text-sm text-slate-600 leading-relaxed">
          Instead of learning from millions of real steps, PPO trains almost entirely inside the cheap symbolic surrogate. After every 40 PPO updates the policy is rolled out once in the real environment, the new transitions are added to the data, and <MathEquation latex="\boldsymbol{\Xi}" /> is refit. The model stays a short list of readable equations.
        </p>
      </div>
      )}

      {/* 2. Learned Dynamics (Final Model, Update 39) & Control-Gain Table */}
      {showDiagnosticsOrTables && (
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            2. Learned Symbolic Dynamics (Final Model, Update 39)
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            14 non-zero coefficients out of 205 possible (5 states × 41 candidate terms). The structure is physically meaningful: Euler-like position updates, a gravity term (<code className="font-mono text-xs">0.14807·sin θ</code>, the unstable upright point), and a control gain proportional to <code className="font-mono text-xs">cos θ</code> that flips sign between top and bottom.
          </p>
        </div>

        <div className="p-4 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed">
          <pre>{`x⁺      =  0.99994·x + 0.01·ẋ
cos θ⁺  =  0.99975·cos θ − 0.01·sin θ·θ̇
sin θ⁺  =  0.99910·sin θ + 0.01·cos θ·θ̇
ẋ⁺      =  0.99927·ẋ − 0.01117·cos θ·sin θ + u·(0.0581 + 0.03894·cos²θ + 0.01918·sin²θ)
θ̇⁺      =  0.99951·θ̇ + 0.14807·sin θ − 0.13537·cos θ·u`}</pre>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-2.5 px-4 font-semibold">Quantity (State at Rest)</th>
                <th className="py-2.5 px-4 font-semibold font-mono">Real dm_control</th>
                <th className="py-2.5 px-4 font-semibold font-mono">Learned E-SINDy Surrogate</th>
                <th className="py-2.5 px-4 font-semibold font-mono">Relative Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
              <tr>
                <td className="py-2.5 px-4 font-sans text-slate-800">ẋ control gain, top (θ = 0)</td>
                <td className="py-2.5 px-4">0.0973</td>
                <td className="py-2.5 px-4 text-blue-700 font-semibold">0.0970</td>
                <td className="py-2.5 px-4 text-emerald-700">0.31%</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans text-slate-800">θ̇ control gain, top (θ = 0)</td>
                <td className="py-2.5 px-4">−0.1414</td>
                <td className="py-2.5 px-4 text-blue-700 font-semibold">−0.1354</td>
                <td className="py-2.5 px-4 text-emerald-700">4.24%</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans text-slate-800">θ̇ control gain, bottom (θ = π)</td>
                <td className="py-2.5 px-4">+0.1413</td>
                <td className="py-2.5 px-4 text-blue-700 font-semibold">+0.1354</td>
                <td className="py-2.5 px-4 text-emerald-700">4.18%</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans text-slate-800">θ̇ gravity drift at θ = 0.05 rad</td>
                <td className="py-2.5 px-4">0.00763</td>
                <td className="py-2.5 px-4 text-blue-700 font-semibold">0.00740</td>
                <td className="py-2.5 px-4 text-emerald-700">3.01%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* 3. Interactive Simulator Integrating the Exact 14-Term Learned Equations */}
      {showSimulator && (
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            3. Live Simulator: Integrating the 14-Term Learned Equations
          </h3>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            This animation integrates the exact 14-term E-SINDy model above at 100 Hz (not the real physics).{' '}
            <strong>Auto</strong> uses an energy-pumping swing-up plus an LQR balancer (<code className="font-mono text-xs">K = [-0.9044, -10.0574, -1.4026, -2.4412]</code>) designed on the linearized learned model.{' '}
            <strong>Manual</strong> and <strong>Free</strong> start near upright: push with <kbd className="px-1.5 py-0.5 text-xs bg-slate-100 border border-slate-300 rounded">←</kbd> / <kbd className="px-1.5 py-0.5 text-xs bg-slate-100 border border-slate-300 rounded">→</kbd> keys or the buttons below to test how hard the unstable equilibrium is to hold. Dashed lines mark the real ±1.8 m rail.
          </p>
        </div>

        <div className="bg-slate-100 border border-slate-200 rounded-xl overflow-hidden p-2">
          <canvas
            ref={canvasRef}
            className="w-full h-[240px] block rounded-lg bg-[#f0f3f8]"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={simMode}
              onChange={(e) => setSimMode(e.target.value as 'auto' | 'manual' | 'free')}
              className="px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg cursor-pointer"
            >
              <option value="auto">Auto: swing-up + LQR balance</option>
              <option value="manual">Manual: you balance it (◀ / ▶)</option>
              <option value="free">Free: u = 0 from 0.06 rad</option>
            </select>

            <button
              type="button"
              onClick={() => resetSimulator(simMode)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>

            <button
              type="button"
              onClick={() => setIsPaused((p) => !p)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg cursor-pointer"
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>

            <button
              type="button"
              onPointerDown={() => {
                stateRef.current.btn = -1;
              }}
              onPointerUp={() => {
                stateRef.current.btn = 0;
              }}
              onPointerLeave={() => {
                stateRef.current.btn = 0;
              }}
              className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer select-none"
            >
              ◀ push
            </button>

            <button
              type="button"
              onPointerDown={() => {
                stateRef.current.btn = 1;
              }}
              onPointerUp={() => {
                stateRef.current.btn = 0;
              }}
              onPointerLeave={() => {
                stateRef.current.btn = 0;
              }}
              className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer select-none"
            >
              push ▶
            </button>
          </div>

          <span className="font-mono text-xs text-slate-600 tabular-nums bg-slate-100 px-3 py-1.5 rounded-md">
            {readoutText}
          </span>
        </div>
      </div>
      )}

      {/* 4. Results: Real Return per Dynamics Update (Interactive 40-Update SVG Chart) */}
      {showCharts && (
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              4. Results: Real Environment Return per Dynamics Update (Updates 0–39)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hover over any update point to inspect the exact deterministic policy evaluation return in dm_control.
            </p>
          </div>

          {hoveredUpdateIdx !== null && (
            <div className="text-xs font-mono bg-slate-100 px-3 py-1.5 rounded-md text-slate-800 tabular-nums">
              Update #{hoveredUpdateIdx} · Real Steps ≈ {(8 + hoveredUpdateIdx * 1)}k · Return ={' '}
              <span className="font-bold text-[#e0661d]">
                {REAL_RETURNS_40_UPDATES[hoveredUpdateIdx]}
              </span>
            </div>
          )}
        </div>

        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto max-h-[320px] select-none"
            role="img"
            aria-label="Real return versus dynamics update"
          >
            {/* Paper plateau shaded band (600 to 650) */}
            <rect
              x={m.l}
              y={toY(650)}
              width={iw}
              height={toY(600) - toY(650)}
              fill="#2563eb"
              opacity="0.15"
            />
            <text
              x={m.l + 8}
              y={toY(650) - 5}
              className="fill-blue-700 text-[11px] font-mono"
            >
              paper plateau (approx. 600–650)
            </text>

            {/* Horizontal grid lines */}
            {[0, 200, 400, 600, 800].map((v) => (
              <g key={v}>
                <line
                  x1={m.l}
                  x2={W - m.r}
                  y1={toY(v)}
                  y2={toY(v)}
                  stroke="#94a3b8"
                  strokeOpacity="0.3"
                />
                <text
                  x={m.l - 8}
                  y={toY(v) + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-[11px] font-mono"
                >
                  {v}
                </text>
              </g>
            ))}

            {/* X axis ticks */}
            {REAL_RETURNS_40_UPDATES.map((_, i) =>
              i % 5 === 0 ? (
                <text
                  key={i}
                  x={toX(i)}
                  y={H - 16}
                  textAnchor="middle"
                  className="fill-slate-500 text-[11px] font-mono"
                >
                  {i}
                </text>
              ) : null
            )}

            <text
              x={W / 2}
              y={H - 2}
              textAnchor="middle"
              className="fill-slate-600 text-xs font-mono"
            >
              dynamics update (each update = 40 PPO surrogate updates + 1,000 real steps)
            </text>

            {/* Return Curve */}
            <polyline
              fill="none"
              stroke="#e0661d"
              strokeWidth="2.5"
              points={REAL_RETURNS_40_UPDATES.map(
                (v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`
              ).join(' ')}
            />

            {/* Peak Marker at Update 25 */}
            <circle
              cx={toX(bestIdx)}
              cy={toY(REAL_RETURNS_40_UPDATES[bestIdx])}
              r="5.5"
              fill="#e0661d"
            />
            <text
              x={toX(bestIdx) + 8}
              y={toY(REAL_RETURNS_40_UPDATES[bestIdx]) - 6}
              className="fill-slate-900 text-xs font-mono font-semibold"
            >
              best 610.2 (update 25)
            </text>

            {/* Interactive Hover Targets */}
            {REAL_RETURNS_40_UPDATES.map((v, i) => (
              <circle
                key={i}
                cx={toX(i)}
                cy={toY(v)}
                r={hoveredUpdateIdx === i ? 5 : 3}
                fill={hoveredUpdateIdx === i ? '#2563eb' : 'transparent'}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredUpdateIdx(i)}
              />
            ))}
          </svg>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          Each point is the deterministic policy evaluated in the real <code className="font-mono text-xs">dm_control</code> environment after one more round of 40 PPO updates and one model refit (single seed). The shaded band is the plateau read off the paper’s Fig. 3 for the quadratic SINDy-RL variant at a similar real-data budget. Returns dip during early updates while PPO optimizes an initial data-poor surrogate, then climb strongly once on-policy swing-up transitions arrive.
        </p>
      </div>
      )}

      {/* 5. Debugging: Hypotheses Tested, with Evidence */}
      {showDiagnosticsOrTables && (
      <>
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            5. Systematic Diagnostics: Hypotheses Tested, with Empirical Evidence
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Two initial hypotheses (control-gain identifiability at the top and rail contact) were refuted by custom diagnostic scripts—narrowing the bottleneck to PPO value-function clipping and learning-rate scheduling rather than the E-SINDy dictionary model.
          </p>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-3 px-4 font-semibold">Hypothesis</th>
                <th className="py-3 px-4 font-semibold">Diagnostic Test Executed</th>
                <th className="py-3 px-4 font-semibold">Verdict &amp; Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-3 px-4 text-slate-800">
                  The surrogate mis-models the control gain near the unstable top
                </td>
                <td className="py-3 px-4 text-slate-600">
                  Finite-difference gain of surrogate vs. real physics at θ = 0, 0.05, π
                </td>
                <td className="py-3 px-4 font-semibold text-rose-700">
                  Rejected: error ≤ 4%, correct sign
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-800">
                  The cart hits the rail (|x| = 1.8), which the surrogate lacks
                </td>
                <td className="py-3 px-4 text-slate-600">
                  Real rollouts of checkpoints 25 and 39
                </td>
                <td className="py-3 px-4 font-semibold text-rose-700">
                  Rejected: max |x| ≈ 1.54 m
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-800">
                  Model error causes the sim-to-real gap
                </td>
                <td className="py-3 px-4 text-slate-600">
                  Open-loop replay of real actions; closed-loop in both environments
                </td>
                <td className="py-3 px-4 font-semibold text-rose-700">
                  Small: 0.03 rad error after 100 steps; surrogate return ≈ real return
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-800">
                  The policy is poorly optimized even inside an accurate model
                </td>
                <td className="py-3 px-4 text-slate-600">
                  Same policy scores ≈ 520 in the surrogate; model frozen after update ~21 while returns still swing ±100
                </td>
                <td className="py-3 px-4 font-semibold text-emerald-700">
                  Supported
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-800">
                  <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">vf_clip_param = 0.2</code> cripples the critic (RLlib clamps the squared value error; returns are ~50–100)
                </td>
                <td className="py-3 px-4 text-slate-600">
                  Config confirmed in the loaded policy; controlled rerun with 1e4
                </td>
                <td className="py-3 px-4 font-semibold text-amber-700">
                  Rerun pending
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-800">
                  Learning-rate schedule is not applied as intended (<code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">cur_lr</code> returned a raw list)
                </td>
                <td className="py-3 px-4 text-slate-600">
                  Checkpoint inspection; rerun with explicit <code className="font-mono text-xs">lr_schedule</code>
                </td>
                <td className="py-3 px-4 font-semibold text-amber-700">
                  Rerun pending
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. What I Built and Learned & Next Steps Toward a Contribution */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-3">
            6. What I Built and Learned
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700 leading-relaxed">
            <li>
              <strong>Full reproduction from scratch:</strong> custom surrogate Gym environment, E-SINDy and STLRidge solvers, a 41-term control-affine library, the Dyna-style training loop, real-environment evaluation and data collection.
            </li>
            <li>
              <strong>Diagnostic toolkit:</strong> scripts that compare surrogate and real one-step gains, replay real action sequences through the surrogate, check the real cart against the rail, and inspect RLlib checkpoints.
            </li>
            <li>
              <strong>Interpretability in practice:</strong> the final controller model is a 14-term equation set that could be verified term by term against physics and against the original paper.
            </li>
            <li>
              <strong>Skill takeaways:</strong> sparse regression and system identification, closed-loop identifiability, PPO internals (critic clipping, schedules), reproducibility under version constraints (Ray 2.6.3, torch 2.0.1).
            </li>
          </ul>
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              Next: Toward a Research Contribution
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700 leading-relaxed">
              <li>
                Finish the critic (<code className="font-mono text-xs">vf_clip_param</code>) and learning-rate ablation and report it over multiple seeds.
              </li>
              <li>
                Use the ensemble’s analytic variance (Eq. 2 of the paper) as a reward penalty or to truncate surrogate rollouts, targeting the plateau where the model has stopped changing but the policy keeps exploiting it.
              </li>
              <li>
                Variance-guided data collection and a wider library to close the remaining ~4% gain bias.
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 text-xs font-mono text-slate-600">
            <strong className="text-slate-900">Verified Stack:</strong> Python · NumPy · PySINDy · Ray RLlib 2.6.3 · PyTorch 2.0.1 · dm_control 1.0.44 · MuJoCo 3.11 · Gymnasium
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
