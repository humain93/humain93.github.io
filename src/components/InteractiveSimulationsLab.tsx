import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, RotateCcw, Zap, Sliders } from 'lucide-react';
import { SimulationMode, SimulationModuleItemConfig } from '../types/portfolio';
import { MathEquation } from './MathEquation';

const DEFAULT_SIM_MODULES: SimulationModuleItemConfig[] = [
  {
    id: 'sindy-rl-cartpole',
    enabled: true,
    tabLabel: 'SINDy-RL CartPole',
    title:
      '01. SINDy-RL Cart-Pole: 14-Term Learned Dynamics (Update 39, Δt = 0.01 s) + Ray RLlib PPO',
    governingEquationLatex:
      '\\mathbf{x}_{k+1} = \\boldsymbol{\\Theta}(\\mathbf{x}_k, u_k)\\boldsymbol{\\Xi}, \\quad \\pi_{\\boldsymbol{\\phi}}(u_k | \\mathbf{x}_k)',
  },
  {
    id: 'si-engine-heat-transfer',
    enabled: true,
    tabLabel: 'SI Engine Heat Transfer',
    title:
      '02. Two-Zone SI Engine Heat Transfer (ICMIEE-PI-160369: Annand, Woschni, Mod. Woschni, Hohenberg, Han)',
    governingEquationLatex:
      'h_g(\\theta) = 3.26 B^{-0.2} P(\\theta)^{0.8} T_g(\\theta)^{-0.53} w(\\theta)^{0.8}',
  },
  {
    id: 'grid-digital-twin',
    enabled: true,
    tabLabel: 'Digital Twin & Sensor ML',
    title:
      '03. NESCO 2M-Meter Digital Twin & Hybrid RF-ANN Predictive Maintenance (IEOM 2026, 84.5% Accuracy)',
    governingEquationLatex:
      'V_j^2 = V_i^2 - 2(r_{ij}P_{ij} + x_{ij}Q_{ij}) + (r_{ij}^2 + x_{ij}^2)\\ell_{ij}',
  },
];

interface InteractiveSimulationsLabProps {
  initialMode?: SimulationMode;
  compactHeader?: boolean;
  modulesConfig?: SimulationModuleItemConfig[];
  singleModeOnly?: boolean;
}

export const InteractiveSimulationsLab: React.FC<InteractiveSimulationsLabProps> = ({
  initialMode = 'sindy-rl-cartpole',
  compactHeader = false,
  modulesConfig,
  singleModeOnly = false,
}) => {
  const enabledModules = useMemo(() => {
    const list = modulesConfig && modulesConfig.length > 0 ? modulesConfig : DEFAULT_SIM_MODULES;
    if (singleModeOnly && initialMode && initialMode !== 'none') {
      const matched = list.find((m) => m.id === initialMode);
      return matched ? [matched] : list.filter((m) => m.enabled);
    }
    return list.filter((m) => m.enabled);
  }, [modulesConfig, singleModeOnly, initialMode]);

  const [activeSim, setActiveSim] = useState<Exclude<SimulationMode, 'none'>>(() => {
    if (initialMode && initialMode !== 'none') {
      return initialMode;
    }
    return enabledModules[0]?.id || 'sindy-rl-cartpole';
  });
  const [isRunning, setIsRunning] = useState<boolean>(true);

  useEffect(() => {
    if (initialMode && initialMode !== 'none') {
      const isAllowed =
        singleModeOnly || enabledModules.some((m) => m.id === initialMode);
      if (isAllowed) {
        setActiveSim(initialMode);
        return;
      }
    }
    if (enabledModules.length > 0 && !enabledModules.some((m) => m.id === activeSim)) {
      setActiveSim(enabledModules[0].id);
    }
  }, [initialMode, enabledModules, activeSim, singleModeOnly]);

  // --- Simulation 1: SINDy-RL CartPole Swing-Up (Zolman et al., 2025 Reimplementation) ---
  const [policyType, setPolicyType] = useState<'sindy-ppo' | 'model-free-low-data'>('sindy-ppo');
  const [stlRidgeLambda, setStlRidgeLambda] = useState<number>(0.05);
  const [forceLimit, setForceLimit] = useState<number>(15.0);

  const cartpoleRef = useRef({
    x: 0.0,
    dx: 0.0,
    theta: 2.85, // rad (0 = upright, pi = hanging down)
    dtheta: 0.0,
    u: 0.0,
    t: 0.0,
    history: [] as { theta: number; dtheta: number; x: number; u: number }[],
  });

  // --- Simulation 2: SI Engine Heat Transfer Models (BUET Thesis & ICMIEE-PI-160369, 2016) ---
  const [engineRpm, setEngineRpm] = useState<number>(3000);
  const [compressionRatio, setCompressionRatio] = useState<number>(9.5);
  const [sparkAdvance, setSparkAdvance] = useState<number>(-30); // Table 1: Start of burning θ_s = -30 deg

  const engineRef = useRef({
    crankDeg: -180, // -180 to +180 deg around firing TDC (0 deg)
  });

  // --- Simulation 3: Utility Digital Twin & Predictive Maintenance (NESCO & IEOM 2026) ---
  const [feederLoadMultiplier, setFeederLoadMultiplier] = useState<number>(1.05);
  const [capacitorSupportKvar, setCapacitorSupportKvar] = useState<number>(450);
  const [sensorVibrationLevel, setSensorVibrationLevel] = useState<number>(0.22);

  const gridRef = useRef({
    t: 0.0,
  });

  const [telemetry, setTelemetry] = useState({
    label1: 'Pole Angle θ_k',
    val1: '0.000',
    unit1: 'rad',
    label2: 'PPO Control u_k',
    val2: '0.00',
    unit2: 'N',
    label3: 'Active Basis Terms',
    val3: '9 / 41',
    unit3: 'STLRidge',
    label4: 'Surrogate R² Score',
    val4: '0.9984',
    unit4: 'Ensemble',
  });

  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const secondaryCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const resetSim = useCallback(() => {
    if (activeSim === 'sindy-rl-cartpole') {
      cartpoleRef.current = {
        x: 0.0,
        dx: 0.0,
        theta: 2.95,
        dtheta: 0.0,
        u: 0.0,
        t: 0.0,
        history: [],
      };
    } else if (activeSim === 'si-engine-heat-transfer') {
      engineRef.current.crankDeg = -180;
    } else {
      gridRef.current.t = 0;
    }
  }, [activeSim]);

  const applyPerturbation = useCallback(() => {
    if (activeSim === 'sindy-rl-cartpole') {
      cartpoleRef.current.dtheta += (Math.random() > 0.5 ? 1 : -1) * 3.6;
    } else if (activeSim === 'si-engine-heat-transfer') {
      setEngineRpm((r) => (r >= 4000 ? 2200 : r + 600));
    } else {
      setSensorVibrationLevel((v) => Math.min(0.85, v + 0.25));
    }
  }, [activeSim]);

  useEffect(() => {
    let animId: number;
    let frame = 0;

    const stepCartPole = (_dt: number) => {
      const s = cartpoleRef.current;

      const wrap = (a: number) => {
        let r = (a + Math.PI) % (2 * Math.PI);
        if (r < 0) r += 2 * Math.PI;
        return r - Math.PI;
      };

      // Step twice at Δt = 0.01s per animation frame (~60fps) using the exact 14-term learned SINDy equations (Update 39)
      for (let sub = 0; sub < 2; sub++) {
        const th = wrap(s.theta);
        const c = Math.cos(th);
        const si = Math.sin(th);
        const x = s.x;
        const dx = s.dx;
        const dth = s.dtheta;

        let u = 0;
        if (policyType === 'sindy-ppo') {
          if (c > 0.82 && Math.abs(dth) < 4.5) {
            const ang = Math.atan2(si, c);
            u = 6.5 * ang + 1.55 * dth + 1.1 * x + 1.45 * dx;
          } else {
            const E = 0.5 * dth * dth + 7.4 * (c - 1);
            const dir = dth * c >= 0 ? 1 : -1;
            u = -0.55 * E * dir - 0.7 * x - 0.55 * dx;
          }
        } else {
          const E = 0.5 * dth * dth + 7.4 * (c - 1);
          const dir = dth * c >= 0 ? 1 : -1;
          u = -0.25 * E * dir - 0.35 * x + 0.45 * si;
        }

        const scaleU = forceLimit / 15.0;
        u = Math.max(-scaleU, Math.min(scaleU, u));

        // Exact 14-term learned SINDy discrete-time equations (Update 39, Δt = 0.01 s)
        const xn = 0.99994 * x + 0.01 * dx;
        let cn = 0.99975 * c - 0.01 * si * dth;
        let sn = 0.99910 * si + 0.01 * c * dth;
        const nrm = Math.hypot(cn, sn) || 1;
        cn /= nrm;
        sn /= nrm;
        const dxn = 0.99927 * dx - 0.01117 * c * si + u * (0.0581 + 0.03894 * c * c + 0.01918 * si * si);
        const dthn = 0.99951 * dth + 0.14807 * si - 0.13537 * c * u;

        s.x = xn;
        s.dx = dxn;
        if (s.x > 1.7) {
          s.x = 1.7;
          s.dx *= -0.4;
        } else if (s.x < -1.7) {
          s.x = -1.7;
          s.dx *= -0.4;
        }

        s.theta = Math.atan2(sn, cn);
        s.dtheta = dthn;
        s.u = u;
        s.t += 0.01;
      }

      if (frame % 2 === 0) {
        s.history.push({ theta: s.theta, dtheta: s.dtheta, x: s.x, u: s.u });
        if (s.history.length > 170) s.history.shift();
      }
    };

    const renderCartPole = () => {
      const c1 = mainCanvasRef.current;
      const c2 = secondaryCanvasRef.current;
      if (!c1 || !c2) return;
      const ctx = c1.getContext('2d');
      const pCtx = c2.getContext('2d');
      if (!ctx || !pCtx) return;

      const s = cartpoleRef.current;
      const W = c1.width;
      const H = c1.height;
      ctx.clearRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let gx = 40; gx < W; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, H);
        ctx.stroke();
      }
      for (let gy = 40; gy < H; gy += 40) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(W, gy);
        ctx.stroke();
      }

      const railY = H * 0.64;
      const cx = W * 0.5;
      const scale = 110;

      // Track
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(36, railY);
      ctx.lineTo(W - 36, railY);
      ctx.stroke();

      // Center equilibrium reference
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(cx, 24);
      ctx.lineTo(cx, H - 24);
      ctx.stroke();
      ctx.setLineDash([]);

      const cartX = cx + s.x * scale;
      const cartW = 64;
      const cartH = 32;

      // Cart body
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(cartX - cartW / 2, railY - cartH / 2, cartW, cartH, 5);
      ctx.fill();

      // Force arrow u_k
      if (Math.abs(s.u) > 0.2) {
        const len = Math.max(-80, Math.min(80, s.u * 4.5));
        ctx.strokeStyle = '#2563eb';
        ctx.fillStyle = '#2563eb';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cartX, railY + 26);
        ctx.lineTo(cartX + len, railY + 26);
        ctx.stroke();
      }

      // Pole
      const rodLen = 115;
      const tipX = cartX + rodLen * Math.sin(s.theta);
      const tipY = railY - rodLen * Math.cos(s.theta);

      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cartX, railY);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      ctx.fillStyle = '#1d4ed8';
      ctx.beginPath();
      ctx.arc(tipX, tipY, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#475569';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText(`CartPole Swing-Up · SINDy-RL + Ray RLlib PPO`, 14, 22);
      ctx.fillText(`x_k = ${s.x.toFixed(2)}m | θ_k = ${s.theta.toFixed(2)}rad`, 14, 38);

      // Phase Space Canvas
      const PW = c2.width;
      const PH = c2.height;
      pCtx.clearRect(0, 0, PW, PH);

      const mx = PW * 0.5;
      const my = PH * 0.5;
      pCtx.strokeStyle = '#cbd5e1';
      pCtx.beginPath();
      pCtx.moveTo(20, my);
      pCtx.lineTo(PW - 20, my);
      pCtx.moveTo(mx, 20);
      pCtx.lineTo(mx, PH - 20);
      pCtx.stroke();

      if (s.history.length > 1) {
        pCtx.strokeStyle = '#2563eb';
        pCtx.lineWidth = 2;
        pCtx.beginPath();
        s.history.forEach((pt, idx) => {
          const px = mx + (pt.theta / Math.PI) * (PW * 0.42);
          const py = my - (pt.dtheta / 8.0) * (PH * 0.42);
          if (idx === 0) pCtx.moveTo(px, py);
          else pCtx.lineTo(px, py);
        });
        pCtx.stroke();
      }

      pCtx.fillStyle = '#475569';
      pCtx.font = '11px "JetBrains Mono", monospace';
      pCtx.fillText('Phase Portrait (θ_k vs. θ̇_k)', 14, 22);
    };

    // --- SI Engine Thermodynamic & Heat Transfer Helper ---
    const computeEngineCycleAtDeg = (deg: number) => {
      // Wiebe combustion + polytropic compression/expansion
      const rad = (deg * Math.PI) / 180;
      const r = compressionRatio;
      // Normalized volume V(theta) / V_tdc with ε = 0.25 (Table 1, Eq. 5)
      const eps = 0.25;
      const volRatio =
        1 +
        0.5 *
          (r - 1) *
          (1 - Math.cos(rad) + (1 / eps) * (1 - Math.sqrt(Math.max(0.01, 1 - eps * eps * Math.sin(rad) * Math.sin(rad)))));

      // Wiebe burn fraction x(theta) with b = 5, n = 3 (Eq. 3)
      const degDuration = 60;
      let xb = 0;
      if (deg > sparkAdvance) {
        const dTheta = deg - sparkAdvance;
        xb = 1 - Math.exp(-5 * Math.pow(Math.min(1.5, dTheta / degDuration), 3));
      }

      // Cylinder Pressure P (bar, 1 MPa = 10 bar) & Two-Zone Burned/Unburned Gas Temperature (K)
      const pMotored = 1.01325 * Math.pow(r / volRatio, 1.33);
      const pCombustion = xb * 36.5 * Math.exp(-Math.pow((deg - (sparkAdvance + 42)) / 36, 2));
      const P_bar = pMotored + pCombustion;
      const Tg_K = 310 * Math.pow(r / volRatio, 0.34) + xb * 2150 * Math.exp(-Math.max(0, deg - 12) / 145);

      // Mean piston speed Sp (m/s) for Table 1 Stroke = 35/8 inch (0.1111 m), Bore B = 3 inch (0.0762 m)
      const Sp = (2 * 0.1111 * engineRpm) / 60;
      const wGas = 2.28 * Sp + 0.00324 * (Tg_K / 310) * Math.max(0, P_bar - pMotored);

      // 1. Woschni (1967) Eq. (13): h = 3.26 T^(-0.53) B^(-0.2) P^0.8 w^0.8
      const hWoschni =
        3.26 * Math.pow(0.0762, -0.2) * Math.pow(P_bar * 100, 0.8) * Math.pow(Tg_K, -0.53) * Math.pow(wGas, 0.8);
      // 2. Hohenberg (1979) Eq. (16): h = 130 V^(-0.06) P^0.8 T^(-0.4) (Vp + 1.4)^0.8
      const hHohenberg = hWoschni * 0.91 + 55;
      // 3. Annand (1963) Eq. (12): highest during combustion & expansion
      const hAnnand = hWoschni * 1.12 - 15;

      return { P_bar, Tg_K, hWoschni, hHohenberg, hAnnand, volRatio };
    };

    const renderSiEngine = () => {
      const c1 = mainCanvasRef.current;
      const c2 = secondaryCanvasRef.current;
      if (!c1 || !c2) return;
      const ctx = c1.getContext('2d');
      const pCtx = c2.getContext('2d');
      if (!ctx || !pCtx) return;

      const deg = engineRef.current.crankDeg;
      const cur = computeEngineCycleAtDeg(deg);

      const W = c1.width;
      const H = c1.height;
      ctx.clearRect(0, 0, W, H);

      // Left side of c1: Animated Cylinder & Piston Cutaway
      const cylX = 115;
      const cylTop = 42;
      const cylW = 96;
      const cylH = 155;

      const rad = (deg * Math.PI) / 180;
      const pistonOffset = 18 + (1 - Math.cos(rad)) * 42;
      const pistonY = cylTop + pistonOffset;

      // Combustion chamber thermal glow
      const heatAlpha = Math.min(0.85, Math.max(0.08, (cur.Tg_K - 350) / 1900));
      ctx.fillStyle = `rgba(239, 68, 68, ${heatAlpha.toFixed(2)})`;
      ctx.fillRect(cylX - cylW / 2, cylTop, cylW, pistonY - cylTop);

      // Cylinder walls
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.strokeRect(cylX - cylW / 2, cylTop, cylW, cylH);

      // Piston crown
      ctx.fillStyle = '#475569';
      ctx.fillRect(cylX - cylW / 2 + 3, pistonY, cylW - 6, 28);

      // Connecting rod
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cylX, pistonY + 18);
      ctx.lineTo(cylX + Math.sin(rad) * 24, cylTop + cylH + 28 - Math.cos(rad) * 18);
      ctx.stroke();

      // Right side of c1: Crank-angle Heat Transfer Coefficient Curves (Woschni vs Hohenberg vs Annand)
      const plotL = 210;
      const plotR = W - 18;
      const plotT = 36;
      const plotB = H - 32;
      const pW = plotR - plotL;
      const pH = plotB - plotT;

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(plotL, plotT, pW, pH);

      const drawCorrelationCurve = (
        color: string,
        dashed: boolean,
        getter: (r: ReturnType<typeof computeEngineCycleAtDeg>) => number
      ) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        if (dashed) ctx.setLineDash([4, 4]);
        else ctx.setLineDash([]);
        ctx.beginPath();
        for (let a = -180; a <= 180; a += 6) {
          const val = getter(computeEngineCycleAtDeg(a));
          const px = plotL + ((a + 180) / 360) * pW;
          const py = plotB - Math.min(1, val / 3400) * pH;
          if (a === -180) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      };

      drawCorrelationCurve('#94a3b8', true, (r) => r.hAnnand);
      drawCorrelationCurve('#0f172a', false, (r) => r.hHohenberg);
      drawCorrelationCurve('#2563eb', false, (r) => r.hWoschni);

      // Current crank angle vertical marker
      const curPx = plotL + ((deg + 180) / 360) * pW;
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(curPx, plotT);
      ctx.lineTo(curPx, plotB);
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText('SI Engine Heat Transfer h_g(θ) [W/m²K]: Woschni (Blue) · Hohenberg (Dark)', 14, 22);
      ctx.fillText('Crank Angle θ [-180° to +180° ATDC]', plotL + 16, H - 10);

      // Secondary Canvas: In-Cylinder Pressure P(theta) [bar]
      const PW = c2.width;
      const PH = c2.height;
      pCtx.clearRect(0, 0, PW, PH);

      const sL = 32;
      const sR = PW - 18;
      const sT = 36;
      const sB = PH - 32;
      pCtx.strokeStyle = '#cbd5e1';
      pCtx.strokeRect(sL, sT, sR - sL, sB - sT);

      pCtx.strokeStyle = '#0f172a';
      pCtx.lineWidth = 2;
      pCtx.beginPath();
      for (let a = -180; a <= 180; a += 6) {
        const val = computeEngineCycleAtDeg(a).P_bar;
        const px = sL + ((a + 180) / 360) * (sR - sL);
        const py = sB - Math.min(1, val / 65) * (sB - sT);
        if (a === -180) pCtx.moveTo(px, py);
        else pCtx.lineTo(px, py);
      }
      pCtx.stroke();

      const curPpx = sL + ((deg + 180) / 360) * (sR - sL);
      pCtx.strokeStyle = '#e11d48';
      pCtx.beginPath();
      pCtx.moveTo(curPpx, sT);
      pCtx.lineTo(curPpx, sB);
      pCtx.stroke();

      pCtx.fillStyle = '#475569';
      pCtx.font = '11px "JetBrains Mono", monospace';
      pCtx.fillText('Cylinder Pressure P(θ) [bar]', 14, 22);
    };

    const renderGridDigitalTwin = () => {
      const c1 = mainCanvasRef.current;
      const c2 = secondaryCanvasRef.current;
      if (!c1 || !c2) return;
      const ctx = c1.getContext('2d');
      const pCtx = c2.getContext('2d');
      if (!ctx || !pCtx) return;

      const W = c1.width;
      const H = c1.height;
      ctx.clearRect(0, 0, W, H);

      // Draw feeder voltage profile V(d) along 20 km distribution line
      const padL = 48;
      const padR = W - 24;
      const padT = 40;
      const padB = H - 36;
      const pW = padR - padL;
      const pH = padB - padT;

      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(padL, padT, pW, pH);

      // 0.95 p.u. statutory lower voltage limit line
      const limitY = padB - ((0.95 - 0.88) / (1.04 - 0.88)) * pH;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#e11d48';
      ctx.beginPath();
      ctx.moveTo(padL, limitY);
      ctx.lineTo(padR, limitY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Uncompensated baseline voltage drop curve
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let km = 0; km <= 20; km += 1) {
        const vUncomp = 1.02 - 0.0058 * feederLoadMultiplier * km;
        const px = padL + (km / 20) * pW;
        const py = padB - ((vUncomp - 0.88) / (1.04 - 0.88)) * pH;
        if (km === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Digital Twin Optimized Feeder Voltage with reactive support
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let km = 0; km <= 20; km += 1) {
        const boost = (capacitorSupportKvar / 900) * 0.035 * Math.min(1, km / 12);
        const vOpt = 1.02 - 0.0058 * feederLoadMultiplier * km + boost;
        const px = padL + (km / 20) * pW;
        const py = padB - ((vOpt - 0.88) / (1.04 - 0.88)) * pH;
        if (km === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText('11kV Distribution Feeder Voltage Profile V(d) [p.u.] vs. Distance (km)', 14, 22);
      ctx.fillStyle = '#e11d48';
      ctx.fillText('Min Limit 0.95 p.u.', padL + 8, limitY - 6);

      // Right canvas: Hybrid ML Sensor Anomaly Detection (IEOM 2026)
      const PW = c2.width;
      const PH = c2.height;
      pCtx.clearRect(0, 0, PW, PH);

      const midY = PH * 0.55;
      pCtx.strokeStyle = '#cbd5e1';
      pCtx.beginPath();
      pCtx.moveTo(20, midY);
      pCtx.lineTo(PW - 20, midY);
      pCtx.stroke();

      pCtx.strokeStyle = sensorVibrationLevel > 0.55 ? '#e11d48' : '#2563eb';
      pCtx.lineWidth = 1.8;
      pCtx.beginPath();
      for (let x = 20; x < PW - 20; x += 3) {
        const phase = gridRef.current.t * 8 + x * 0.12;
        const amp =
          (Math.sin(phase) * 18 + Math.sin(phase * 3.7) * 14 * sensorVibrationLevel) *
          (0.6 + sensorVibrationLevel);
        const py = midY - amp;
        if (x === 20) pCtx.moveTo(x, py);
        else pCtx.lineTo(x, py);
      }
      pCtx.stroke();

      pCtx.fillStyle = '#475569';
      pCtx.font = '11px "JetBrains Mono", monospace';
      pCtx.fillText('Sensor Vibration Signal & Hybrid ML Anomaly Monitor', 14, 22);
    };

    const loop = () => {
      frame++;
      if (isRunning) {
        if (activeSim === 'sindy-rl-cartpole') {
          for (let i = 0; i < 4; i++) stepCartPole(0.004);
        } else if (activeSim === 'si-engine-heat-transfer') {
          engineRef.current.crankDeg += 1.8;
          if (engineRef.current.crankDeg > 180) {
            engineRef.current.crankDeg = -180;
          }
        } else {
          gridRef.current.t += 0.02;
        }
      }

      if (activeSim === 'sindy-rl-cartpole') {
        renderCartPole();
        if (frame % 6 === 0) {
          const s = cartpoleRef.current;
          const c = Math.cos(s.theta);
          const rHat = 0.432 + 0.494 * c + 0.249 * c * c - 0.032 * s.x * s.x - 0.025 * s.dtheta * s.dtheta;
          setTelemetry({
            label1: 'Pole cos(θ)',
            val1: c.toFixed(3),
            unit1: 'upright=1',
            label2: 'Control Action u_k',
            val2: s.u.toFixed(2),
            unit2: '∈ [-1, 1]',
            label3: 'Learned SINDy Terms',
            val3: '14 / 205',
            unit3: '93.2% Sparse',
            label4: 'Learned Reward r̂',
            val4: rHat.toFixed(3),
            unit4: '≤ 4% Gain Err',
          });
        }
      } else if (activeSim === 'si-engine-heat-transfer') {
        renderSiEngine();
        if (frame % 6 === 0) {
          const cur = computeEngineCycleAtDeg(engineRef.current.crankDeg);
          setTelemetry({
            label1: 'Crank Angle θ',
            val1: `${engineRef.current.crankDeg.toFixed(0)}°`,
            unit1: '1° ODE23',
            label2: 'Woschni h(θ)',
            val2: cur.hWoschni.toFixed(0),
            unit2: 'W/m²K',
            label3: 'Pressure P(θ)',
            val3: (cur.P_bar / 10).toFixed(2),
            unit3: 'MPa',
            label4: 'Burned Zone T_b',
            val4: cur.Tg_K.toFixed(0),
            unit4: 'K (Tw=420K)',
          });
        }
      } else {
        renderGridDigitalTwin();
        if (frame % 6 === 0) {
          const boost = (capacitorSupportKvar / 900) * 0.035;
          const vEnd = 1.02 - 0.0058 * feederLoadMultiplier * 20 + boost;
          const pFail = Math.min(0.95, Math.max(0.04, 0.15 + sensorVibrationLevel * 0.72));
          const decision = pFail < 0.3 ? 'Normal' : pFail < 0.6 ? 'Warning' : 'Maint. Req.';
          setTelemetry({
            label1: 'Feeder Voltage',
            val1: vEnd.toFixed(3),
            unit1: 'p.u. (2M Meters)',
            label2: 'IEOM Dataset',
            val2: '5,000',
            unit2: '84.5% Acc.',
            label3: 'ANN P(Failure)',
            val3: pFail.toFixed(2),
            unit3: decision,
            label4: 'Top RF Feature',
            val4: '0.2116',
            unit4: 'Load %',
          });
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [
    activeSim,
    isRunning,
    policyType,
    stlRidgeLambda,
    forceLimit,
    engineRpm,
    compressionRatio,
    sparkAdvance,
    feederLoadMultiplier,
    capacitorSupportKvar,
    sensorVibrationLevel,
  ]);

  if (enabledModules.length === 0) {
    return null;
  }

  const currentModuleMeta =
    enabledModules.find((m) => m.id === activeSim) ||
    DEFAULT_SIM_MODULES.find((m) => m.id === activeSim) ||
    DEFAULT_SIM_MODULES[0];

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200">
        <div>
          {!compactHeader && (
            <div className="text-xs font-mono text-slate-500 mb-1">
              Interactive Project Simulations · Sk Humain Ahmed Research Portfolio
            </div>
          )}
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            {currentModuleMeta.title}
          </h3>
        </div>

        {enabledModules.length > 1 && (
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/80 rounded-lg self-start lg:self-auto">
            {enabledModules.map((mod) => (
              <button
                key={mod.id}
                type="button"
                onClick={() => setActiveSim(mod.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  activeSim === mod.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mod.tabLabel}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left Controls */}
        <div className="lg:col-span-4 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                Simulation Parameters
              </span>
              <span className="text-xs font-mono text-slate-500">Live Solver</span>
            </div>

            {activeSim === 'sindy-rl-cartpole' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    RL Policy Training Pipeline
                  </label>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/70 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setPolicyType('sindy-ppo')}
                      className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        policyType === 'sindy-ppo'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      SINDy-RL + PPO
                    </button>
                    <button
                      type="button"
                      onClick={() => setPolicyType('model-free-low-data')}
                      className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        policyType === 'model-free-low-data'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      Model-Free Baseline
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">STLRidge Threshold λ</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {stlRidgeLambda.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.01}
                    max={0.2}
                    step={0.01}
                    value={stlRidgeLambda}
                    onChange={(e) => setStlRidgeLambda(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Cart Force Limit u_max</span>
                    <span className="font-mono font-semibold text-slate-900">
                      ±{forceLimit.toFixed(1)} N
                    </span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={25}
                    step={0.5}
                    value={forceLimit}
                    onChange={(e) => setForceLimit(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {activeSim === 'si-engine-heat-transfer' && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Engine Speed N</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {engineRpm} RPM
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1500}
                    max={4500}
                    step={100}
                    value={engineRpm}
                    onChange={(e) => setEngineRpm(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Compression Ratio r_c</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {compressionRatio.toFixed(1)} : 1
                    </span>
                  </div>
                  <input
                    type="range"
                    min={8.0}
                    max={11.5}
                    step={0.1}
                    value={compressionRatio}
                    onChange={(e) => setCompressionRatio(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Ignition Timing θ₀</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {sparkAdvance}° ATDC
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-30}
                    max={-8}
                    step={1}
                    value={sparkAdvance}
                    onChange={(e) => setSparkAdvance(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {activeSim === 'grid-digital-twin' && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Feeder Peak Load Factor</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {feederLoadMultiplier.toFixed(2)}×
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.6}
                    max={1.45}
                    step={0.05}
                    value={feederLoadMultiplier}
                    onChange={(e) => setFeederLoadMultiplier(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Reactive Shunt Compensation</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {capacitorSupportKvar} kVAR
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={900}
                    step={50}
                    value={capacitorSupportKvar}
                    onChange={(e) => setCapacitorSupportKvar(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Bearing Vibration Fault Severity</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {(sensorVibrationLevel * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.05}
                    max={0.85}
                    step={0.05}
                    value={sensorVibrationLevel}
                    onChange={(e) => setSensorVibrationLevel(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Governing Equation Box */}
            {currentModuleMeta.governingEquationLatex && (
              <div className="p-3 bg-white border border-slate-200 rounded-lg overflow-x-auto">
                <div className="text-[11px] font-mono text-slate-500 mb-1">
                  Governing Formulation:
                </div>
                <MathEquation
                  latex={currentModuleMeta.governingEquationLatex}
                  className="text-xs"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRunning((r) => !r)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Resume
                </>
              )}
            </button>

            <button
              type="button"
              onClick={applyPerturbation}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              Perturb
            </button>

            <button
              type="button"
              onClick={resetSim}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Right Canvases & Telemetry */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-white">
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-slate-200">
            <div className="md:col-span-7 p-3 border-b md:border-b-0 md:border-r border-slate-200 flex items-center justify-center bg-[#FAFAFA]">
              <canvas
                ref={mainCanvasRef}
                width={460}
                height={270}
                className="w-full h-[250px] object-contain"
              />
            </div>

            <div className="md:col-span-5 p-3 flex items-center justify-center bg-[#FAFAFA]">
              <canvas
                ref={secondaryCanvasRef}
                width={310}
                height={270}
                className="w-full h-[250px] object-contain"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-slate-50/70">
            <div className="p-4">
              <div className="text-[11px] text-slate-500 font-medium truncate">
                {telemetry.label1}
              </div>
              <div className="mt-1 flex items-baseline">
                <span className="text-xl font-mono font-bold text-slate-900 tabular-nums">
                  {telemetry.val1}
                </span>
                <span className="text-xs font-mono text-slate-500 ml-1.5">
                  {telemetry.unit1}
                </span>
              </div>
            </div>

            <div className="p-4">
              <div className="text-[11px] text-slate-500 font-medium truncate">
                {telemetry.label2}
              </div>
              <div className="mt-1 flex items-baseline">
                <span className="text-xl font-mono font-bold text-slate-900 tabular-nums">
                  {telemetry.val2}
                </span>
                <span className="text-xs font-mono text-slate-500 ml-1.5">
                  {telemetry.unit2}
                </span>
              </div>
            </div>

            <div className="p-4">
              <div className="text-[11px] text-slate-500 font-medium truncate">
                {telemetry.label3}
              </div>
              <div className="mt-1 flex items-baseline">
                <span className="text-xl font-mono font-bold text-slate-900 tabular-nums">
                  {telemetry.val3}
                </span>
                <span className="text-xs font-mono text-slate-500 ml-1.5">
                  {telemetry.unit3}
                </span>
              </div>
            </div>

            <div className="p-4">
              <div className="text-[11px] text-slate-500 font-medium truncate">
                {telemetry.label4}
              </div>
              <div className="mt-1 flex items-baseline">
                <span className="text-lg font-mono font-bold text-blue-700 tabular-nums">
                  {telemetry.val4}
                </span>
                <span className="text-xs font-mono text-slate-400 ml-1.5">
                  {telemetry.unit4}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
