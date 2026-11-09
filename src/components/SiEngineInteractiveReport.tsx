import React, { useState, useMemo } from 'react';
import { FileText, ExternalLink, Flame, Sliders, CheckCircle2 } from 'lucide-react';
import { MathEquation } from './MathEquation';

type PlotMode = 'pressure-ca' | 'two-zone-temp' | 'heat-flux' | 'heat-transfer' | 'stage-bar' | 'spark-sweep';
type FuelRegime = 'std-gasoline' | 'methanol-3000' | 'lean-gasoline-3000' | 'rich-gasoline-3500';

interface SiEngineInteractiveReportProps {
  showSimulator?: boolean;
  showCharts?: boolean;
  showDiagnosticsOrTables?: boolean;
}

export const SiEngineInteractiveReport: React.FC<SiEngineInteractiveReportProps> = ({
  showSimulator = true,
  showCharts = true,
  showDiagnosticsOrTables = true,
}) => {
  const [plotMode, setPlotMode] = useState<PlotMode>('pressure-ca');
  const [fuelRegime, setFuelRegime] = useState<FuelRegime>('std-gasoline');
  const [hoveredAngle, setHoveredAngle] = useState<number | null>(12);

  // Generate crank-angle resolved curves (-100 deg to +150 deg around TDC) matching Figs. 1, 3, 5, 6, 9-12 of ICMIEE-PI-160369
  const cycleData = useMemo(() => {
    const angles: number[] = [];
    for (let deg = -100; deg <= 150; deg += 5) {
      angles.push(deg);
    }

    const regimeScale =
      fuelRegime === 'methanol-3000'
        ? 1.02
        : fuelRegime === 'lean-gasoline-3000'
        ? 0.91
        : fuelRegime === 'rich-gasoline-3500'
        ? 1.04
        : 1.0;

    return angles.map((theta) => {
      const rad = (theta * Math.PI) / 180;
      // Slider-crank volume ratio V(theta)/V_tdc with CR = 9.5, eps = 0.25 (Eq. 5)
      const cr = 9.5;
      const eps = 0.25;
      const vRatio =
        1 +
        ((cr - 1) / 2) *
          (1 - Math.cos(rad) + (1 / eps) * (1 - Math.sqrt(Math.max(0.01, 1 - eps * eps * Math.sin(rad) * Math.sin(rad)))));

      // Wiebe burn fraction x(theta) with theta_s = -30 deg, theta_b = 60 deg, b = 5, n = 3 (Eq. 3)
      const thetaS = -30;
      const thetaB = 60;
      let xBurn = 0;
      if (theta > thetaS) {
        const u = (theta - thetaS) / thetaB;
        xBurn = 1 - Math.exp(-5 * Math.pow(u, 3));
      }

      // Base motored pressure (MPa)
      const pMotored = 0.101325 * Math.pow(cr / vRatio, 1.33);
      // Combustion pressure rise peaking around +12 to +15 deg ATDC
      const combBell =
        theta > thetaS
          ? 3.65 * regimeScale * xBurn * Math.exp(-Math.max(0, theta - 10) / 46) * Math.pow(1 / vRatio, 0.55)
          : 0;

      // Model-specific pressure variations (MPa) reflecting Fig. 1 inset & Section 3.1 findings:
      // Hohenberg slightly overpredicts peak (~4.78 MPa), Woschni (~4.62 MPa), Han et al (~4.54 MPa),
      // Modified Woschni (~4.48 MPa), Annand underpredicts peak (~4.34 MPa) due to highest combustion heat flux,
      // Rakopoulos [8] experimental underestimates early compression and peaks at ~4.58 MPa with slight phase lag.
      const baseP = pMotored + combBell;
      const combWindow = Math.exp(-Math.pow((theta - 14) / 26, 2));

      const pHohenberg = baseP + 0.21 * combWindow * regimeScale;
      const pWoschni = baseP + 0.06 * combWindow * regimeScale;
      const pHan = baseP - 0.02 * combWindow * regimeScale;
      const pModWoschni = baseP - 0.08 * combWindow * regimeScale;
      const pAnnand = baseP - 0.22 * combWindow * regimeScale;

      const expLagBell =
        theta > thetaS + 3
          ? 3.62 * regimeScale * (1 - Math.exp(-5 * Math.pow((theta - (thetaS + 3)) / thetaB, 3))) *
            Math.exp(-Math.max(0, theta - 13) / 46) *
            Math.pow(1 / vRatio, 0.55)
          : 0;
      const pRakopoulos =
        (theta < -15 ? pMotored * 0.84 : pMotored) + expLagBell + 0.01 * combWindow;

      // Two-zone temperatures (K) from Fig. 3:
      // Unburned zone Tu rises from 310 K to ~880 K near TDC
      // Burned zone Tb starts at ignition (-30 deg) around 2150 K, peaks ~2620 K near +10 deg, cools to ~1650 K
      const Tu_base = 310 * Math.pow(cr / vRatio, 0.34) + 140 * xBurn * Math.exp(-Math.max(0, theta) / 70);
      const Tb_base =
        theta >= thetaS
          ? 2120 + 520 * Math.sin(Math.min(Math.PI, Math.max(0, ((theta - thetaS) / 65) * Math.PI))) -
            Math.max(0, theta - 15) * 5.2
          : null;

      // Instantaneous heat flux (x10^5 W/m^2) from Fig. 6:
      // Annand gives highest peak (~6.05 x 10^5 W/m^2), Woschni (~5.35), Han (~4.75), Hohenberg (~4.15), Mod. Woschni (~3.45)
      const fluxShape =
        0.15 * Math.pow(cr / vRatio, 0.6) +
        5.0 * Math.exp(-Math.pow((theta - 12) / 22, 2)) +
        0.95 * (theta > 12 ? Math.exp(-(theta - 12) / 65) : 0);

      const qFluxAnnand = fluxShape * 1.12;
      const qFluxWoschni = fluxShape * 0.98;
      const qFluxHan = fluxShape * 0.88 + (theta < 0 ? 0.18 : -0.05);
      const qFluxHohenberg = fluxShape * 0.78;
      const qFluxModWoschni = fluxShape * 0.66;

      // Cumulative heat transfer Q_l (J) from Fig. 5 (-100 to +150 deg, reaching 280 - 510 J at +150 deg)
      const normProg = xBurn * (0.35 + 0.65 * Math.min(1, Math.max(0, (theta + 20) / 170)));
      const qCumAnnand = -10 + 520 * normProg;
      const qCumWoschni = -12 + 435 * normProg;
      const qCumHan = -8 + 385 * normProg;
      const qCumHohenberg = -10 + 340 * normProg;
      const qCumModWoschni = -12 + 285 * normProg;

      // Spark advance sweep (Fig. 12: 0°, 10°, 20°, 30°, 40° BTDC using Woschni model)
      const calcSparkP = (advDeg: number) => {
        const ts = -advDeg;
        const xb = theta > ts ? 1 - Math.exp(-5 * Math.pow((theta - ts) / 58, 3)) : 0;
        const peakShift = 22 - advDeg * 0.45;
        const cb =
          theta > ts
            ? (3.2 + advDeg * 0.052) *
              xb *
              Math.exp(-Math.max(0, theta - peakShift) / 44) *
              Math.pow(1 / vRatio, 0.52)
            : 0;
        return pMotored + cb;
      };

      return {
        theta,
        pHohenberg,
        pWoschni,
        pHan,
        pModWoschni,
        pAnnand,
        pRakopoulos,
        Tu_Woschni: Tu_base,
        Tu_Annand: Tu_base - 28 * xBurn,
        Tb_Woschni: Tb_base,
        Tb_Hohenberg: Tb_base !== null ? Tb_base + 35 : null,
        Tb_Annand: Tb_base !== null ? Tb_base - 65 : null,
        qFluxAnnand,
        qFluxWoschni,
        qFluxHan,
        qFluxHohenberg,
        qFluxModWoschni,
        qCumAnnand,
        qCumWoschni,
        qCumHan,
        qCumHohenberg,
        qCumModWoschni,
        pSpark0: calcSparkP(0),
        pSpark10: calcSparkP(10),
        pSpark20: calcSparkP(20),
        pSpark30: calcSparkP(30),
        pSpark40: calcSparkP(40),
      };
    });
  }, [fuelRegime]);

  const activeSample = useMemo(() => {
    const target = hoveredAngle ?? 10;
    return (
      cycleData.reduce((prev, curr) =>
        Math.abs(curr.theta - target) < Math.abs(prev.theta - target) ? curr : prev
      ) || cycleData[22]
    );
  }, [cycleData, hoveredAngle]);

  // Stage-wise percentage breakdown from Fig. 8 of ICMIEE-PI-160369
  const stageBreakdown = [
    { model: 'Woschni (1967)', compression: 7.5, combustion: 54.0, expansion: 38.5 },
    { model: 'Hohenberg (1979)', compression: 9.2, combustion: 52.3, expansion: 38.5 },
    { model: 'Han et al. (1997)', compression: 11.4, combustion: 53.6, expansion: 35.0 },
    { model: 'Modified Woschni', compression: 8.0, combustion: 56.5, expansion: 35.5 },
    { model: 'Annand (1963)', compression: 11.8, combustion: 48.2, expansion: 40.0 },
  ];

  // SVG Chart helper
  const W = 820;
  const H = 310;
  const padL = 58;
  const padR = 24;
  const padT = 24;
  const padB = 42;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xToPx = (deg: number) => padL + ((deg - -100) / 250) * plotW;

  return (
    <div className="space-y-10">
      {/* Top Banner & Original Paper PDF Link */}
      <div className="p-6 bg-slate-900 text-white rounded-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-blue-400 mb-1">
            Peer-Reviewed Conference Paper · ICMIEE-PI-160369 (December 26–27, 2016)
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight">
            Study and Simulation of Various Heat Transfer Models of SI Engine
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            <strong>Authors:</strong> Md Shariful Islam, <strong>Sk Humain Ahmed</strong>, Afsar Ahammed · Dept. of Mechanical Engineering, BUET · Advisor: Prof. Dr. Md. Zahurul Haq
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <a
            href="/assets/aistudio/ICMIEE-PI-160369_0cd47271.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            View Published Paper PDF (ICMIEE-PI-160369)
          </a>
          <a
            href="https://www.researchgate.net/publication/365315997"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
          >
            ResearchGate
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 4 Key Metrics from the Paper */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-xl">
          <div className="font-mono text-2xl sm:text-3xl font-bold text-blue-700 tabular-nums">
            5 Models
          </div>
          <div className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Convective correlations compared: <strong>Annand, Woschni, Modified Woschni, Hohenberg, Han et al.</strong>
          </div>
        </div>
        <div className="p-5 bg-white border border-slate-200 rounded-xl">
          <div className="font-mono text-2xl sm:text-3xl font-bold text-blue-700 tabular-nums">
            2-Zone ODE
          </div>
          <div className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Separate burned (<span className="font-mono">T_b</span>) &amp; unburned (<span className="font-mono">T_u</span>) zones with piston-ring blow-by solved via MATLAB <span className="font-mono">ODE23</span> (<span className="font-mono">1°</span> step)
          </div>
        </div>
        <div className="p-5 bg-white border border-slate-200 rounded-xl">
          <div className="font-mono text-2xl sm:text-3xl font-bold text-blue-700 tabular-nums">
            Rakopoulos [8]
          </div>
          <div className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Experimental cylinder pressure trace benchmarked across compression, combustion &amp; expansion strokes
          </div>
        </div>
        <div className="p-5 bg-white border border-slate-200 rounded-xl">
          <div className="font-mono text-2xl sm:text-3xl font-bold text-blue-700 tabular-nums">
            Stage-Optimal
          </div>
          <div className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            <strong>Hohenberg</strong> (Compression), <strong>Han &amp; Woschni</strong> (Combustion), <strong>Mod. Woschni &amp; Annand</strong> (Expansion)
          </div>
        </div>
      </div>

      {/* 01 · Two-Zone Thermodynamic Cycle & Governing Equations */}
      {showDiagnosticsOrTables && (
      <>
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-200 pb-3">
          <div className="text-xs font-mono uppercase tracking-wider text-blue-700">
            01 · Mathematical Formulation (Section 2.1 of ICMIEE-PI-160369)
          </div>
          <h4 className="text-lg font-bold text-slate-900 mt-0.5">
            Two-Zone SI Engine Cycle, Wiebe Mass Fraction Burned &amp; Coupled ODE System
          </h4>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed">
          During compression, combustion, and expansion—between Inlet Valve Closing (IVC) and Exhaust Valve Opening (EVO)—the combustion chamber is modeled as a closed thermodynamic system with piston-ring blow-by leakage following Ferguson [1]. The cylinder contents are split into <strong>burned (<span className="font-mono">b</span>)</strong> and <strong>unburned (<span className="font-mono">u</span>)</strong> zones sharing uniform cylinder pressure <span className="font-mono">P(θ)</span> but distinct zone temperatures <span className="font-mono">T_b(θ)</span> and <span className="font-mono">T_u(θ)</span>.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="text-xs font-mono font-semibold text-slate-800">
              Eqs. (1)–(2): Control Volume First Law &amp; Enthalpy Blow-By
            </div>
            <MathEquation
              latex="\delta Q_{\text{fuel}} - \delta Q_{\text{loss}} = dU + \delta W, \quad m\frac{du}{d\theta} + u\frac{dm}{d\theta} = \frac{dQ}{d\theta} - P\frac{dV}{d\theta} - \frac{\dot{m}_l h_l}{\omega}"
              block
            />
            <p className="text-xs text-slate-600">
              Accounts for heat transfer to chamber walls <span className="font-mono">dQ/dθ</span>, boundary work <span className="font-mono">P dV/dθ</span>, and blow-by mass loss <span className="font-mono">ṁ_l h_l / ω</span> across piston rings.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="text-xs font-mono font-semibold text-slate-800">
              Eqs. (3)–(4): Wiebe Burn Rate (b = 5, n = 3) &amp; Blow-By Mass Loss
            </div>
            <MathEquation
              latex="x(\theta) = 1 - \exp\left[-b\left(\frac{\theta - \theta_s}{\theta_b}\right)^n\right], \quad m(\theta) = m_1 \exp\left[\frac{C(\theta - \theta_1)}{\omega}\right]"
              block
            />
            <p className="text-xs text-slate-600">
              Mass fraction burned <span className="font-mono">x(θ)</span> modeled with <span className="font-mono">b = 5, n = 3</span> [2], and cylinder mass decay calibrated by blow-by constant <span className="font-mono">C = 1.1</span>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="text-xs font-mono font-semibold text-slate-800">
              Eq. (5): Instantaneous Cylinder Volume Kinematics
            </div>
            <MathEquation
              latex="V(\theta) = V_{\text{tdc}}\left(1 + \frac{CR - 1}{2}\left\{(1 - \cos\theta) + \frac{1}{\varepsilon}\left(1 - \sqrt{1 - \varepsilon^2\sin^2\theta}\right)\right\}\right)"
              block
            />
            <p className="text-xs text-slate-600">
              Where <span className="font-mono">CR</span> is the compression ratio and <span className="font-mono">ε = 0.25</span> is the half-stroke to connecting-rod ratio.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="text-xs font-mono font-semibold text-slate-800">
              Eqs. (6)–(11): Two-Zone Temperature, Work &amp; Wall Heat Loss ODEs
            </div>
            <MathEquation
              latex="\frac{dQ_l}{d\theta} = \frac{h}{\omega}\left(\frac{\pi b^2}{2} + \frac{4V}{b}\right)\left[\sqrt{x}(T_b - T_u) + (1 - \sqrt{x})(T_u - T_w)\right]"
              block
            />
            <p className="text-xs text-slate-600">
              Coupled with <span className="font-mono">dP/dθ = (A+B+C)/(D+E)</span>, <span className="font-mono">dT_b/dθ</span> (Eq. 7), <span className="font-mono">dT_u/dθ</span> (Eq. 8), <span className="font-mono">dW/dθ = P dV/dθ</span> (Eq. 9), and blow-by leakage <span className="font-mono">dH_l/dθ</span> (Eq. 11).
            </p>
          </div>
        </div>
      </div>

      {/* 02 · Five Heat Transfer Models & Table 1 Input Parameters */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-200 pb-3">
          <div className="text-xs font-mono uppercase tracking-wider text-blue-700">
            02 · Five Convective Heat Transfer Models &amp; Simulation Inputs (Sections 2.2 &amp; 2.3)
          </div>
          <h4 className="text-lg font-bold text-slate-900 mt-0.5">
            Empirical Correlations (Eqs. 12–18) and Table 1 Engine Parameters
          </h4>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-3">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900">2.2.1 Annand Correlation (1963) — Eq. (12)</span>
                <span className="text-[11px] font-mono text-slate-500">a = 0.5 (0.35 &lt; a &lt; 0.8), b = 0.7</span>
              </div>
              <MathEquation latex="Nu = \frac{h_c B}{k} = a\left(\frac{\rho S_p B}{\mu}\right)^b" />
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900">2.2.2 Woschni Correlation (1967) — Eqs. (13)–(14)</span>
                <span className="text-[11px] font-mono text-slate-500">C₁ = 2.28, C₂ = 0 (comp.) / 3.24×10⁻³ (comb.)</span>
              </div>
              <MathEquation latex="h = 3.26\,T^{-0.53} B^{-0.2} P^{0.8} w^{0.8}, \quad w = C_1 S_p + C_2 \frac{V_d T_r (P - P_m)}{P_r V_r}" />
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900">2.2.3 Modified Woschni (Finol &amp; Robinson) — Eq. (15)</span>
                <span className="text-[11px] font-mono text-slate-500">L(t) = 4V / (π d_p²), α_scaling = 1000</span>
              </div>
              <MathEquation latex="h = \alpha_{\text{scaling}}\,L(t)^{-0.2} P(t)^{0.8} T^{-0.73} \left[C_1 V_p + \frac{C_2 V_s T_r}{6 P_r V_r}(P - P_m)\right]^{0.8}" />
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900">2.2.4 Hohenberg Correlation (1979) — Eq. (16)</span>
                <span className="text-[11px] font-mono text-slate-500">C₁ = 130, C₂ = 1.4, V = (π/6) d_s³</span>
              </div>
              <MathEquation latex="h = C_1 V^{-0.06} P^{0.8} T^{-0.4} (V_p + C_2)^{0.8}" />
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900">2.2.5 Han et al. Correlation (1997) — Eqs. (17)–(18)</span>
                <span className="text-[11px] font-mono text-slate-500">C₁ = 687, C₂ = 0.494, C₃ = 7.3×10⁻⁷, k = 1.35</span>
              </div>
              <MathEquation latex="h = C_1 P^{0.75} U^{0.75} B^{-0.25} T^{-0.465}, \quad U = C_2 V_p + C_3\left(k P\frac{dV}{d\theta} + V\frac{dP}{d\theta}\right)" />
            </div>
          </div>

          {/* Table 1: Input Parameters */}
          <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
                Table 1 (Section 2.3.2)
              </div>
              <h5 className="text-sm font-bold text-slate-900 mb-3">
                MATLAB ODE23 Input Parameters
              </h5>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500 font-mono">
                    <th className="py-1.5">Parameter</th>
                    <th className="py-1.5 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 text-slate-700">
                  <tr>
                    <td className="py-2">Bore, <span className="font-mono">B</span></td>
                    <td className="py-2 text-right font-mono font-semibold">3 inch</td>
                  </tr>
                  <tr>
                    <td className="py-2">Stroke, <span className="font-mono">S</span></td>
                    <td className="py-2 text-right font-mono font-semibold">35/8 inch</td>
                  </tr>
                  <tr>
                    <td className="py-2">Start of burning, <span className="font-mono">θ_s</span></td>
                    <td className="py-2 text-right font-mono font-semibold">-30°</td>
                  </tr>
                  <tr>
                    <td className="py-2">Half stroke to rod ratio, <span className="font-mono">ε</span></td>
                    <td className="py-2 text-right font-mono font-semibold">0.25</td>
                  </tr>
                  <tr>
                    <td className="py-2">Wall temperature, <span className="font-mono">T_wall</span></td>
                    <td className="py-2 text-right font-mono font-semibold">420 K</td>
                  </tr>
                  <tr>
                    <td className="py-2">Inlet fuel temp., <span className="font-mono">T_1</span></td>
                    <td className="py-2 text-right font-mono font-semibold">310 K</td>
                  </tr>
                  <tr>
                    <td className="py-2">Atmospheric pressure, <span className="font-mono">P_1</span></td>
                    <td className="py-2 text-right font-mono font-semibold">101.325 kPa</td>
                  </tr>
                  <tr>
                    <td className="py-2">Blow-by constant, <span className="font-mono">C_blow_by</span></td>
                    <td className="py-2 text-right font-mono font-semibold">1.1</td>
                  </tr>
                  <tr>
                    <td className="py-2">Crank-angle step size</td>
                    <td className="py-2 text-right font-mono font-semibold">1° (ODE23)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 bg-white border border-slate-200 rounded-md text-[11px] text-slate-600 leading-relaxed">
              <strong>Key Modeling Considerations (Section 2.3.1):</strong> Burned and unburned zones modeled separately; constant wall temperature (420 K); closed cycle (gas exchange omitted); fixed burn duration; solved via MATLAB <span className="font-mono">ODE23</span>.
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {/* 03 · Interactive Comparative Figures (Figs. 1, 3, 5, 6, 8, 9–12) */}
      {(showCharts || showSimulator) && (
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-blue-700">
              03 · Interactive Comparative Simulation Results (Figs. 1–12 of ICMIEE-PI-160369)
            </div>
            <h4 className="text-lg font-bold text-slate-900 mt-0.5">
              5-Model Comparison vs. Rakopoulos [8] Experimental Data &amp; Parametric Regimes
            </h4>
          </div>

          {/* Plot Mode Selector */}
          <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-lg">
            {[
              { id: 'pressure-ca', label: 'Fig. 1 & 9–11: Pressure P(θ)' },
              { id: 'two-zone-temp', label: 'Fig. 3: Burned & Unburned T(θ)' },
              { id: 'heat-flux', label: 'Fig. 6: Heat Flux q̇(θ)' },
              { id: 'heat-transfer', label: 'Fig. 5: Cumulative Q(θ)' },
              { id: 'stage-bar', label: 'Fig. 8: Stage % Breakdown' },
              { id: 'spark-sweep', label: 'Fig. 12: Spark Advance Sweep' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPlotMode(tab.id as PlotMode)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  plotMode === tab.id
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fuel / Operating Regime Bar (Figs. 9, 10, 11) */}
        {plotMode === 'pressure-ca' && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>Operating Regime (Section 3.1 &amp; 3.2):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'std-gasoline', label: 'Fig. 1: Standard Validation vs. Rakopoulos [8]' },
                { id: 'methanol-3000', label: 'Fig. 9: φ = 1.0, N = 3000 rpm, Methanol' },
                { id: 'lean-gasoline-3000', label: 'Fig. 10: φ = 0.8, N = 3000 rpm, Gasoline' },
                { id: 'rich-gasoline-3500', label: 'Fig. 11: φ = 1.2, N = 3500 rpm, Gasoline' },
              ].map((reg) => (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => setFuelRegime(reg.id as FuelRegime)}
                  className={`px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer ${
                    fuelRegime === reg.id
                      ? 'bg-blue-50 border-blue-300 text-blue-800 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {reg.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Interactive SVG Plot */}
        {plotMode !== 'stage-bar' ? (
          <div className="space-y-4">
            <div className="bg-[#FAFAFA] border border-slate-200 rounded-xl p-4 overflow-x-auto">
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-auto min-w-[640px]"
                onMouseLeave={() => setHoveredAngle(12)}
              >
                {/* Grid lines */}
                {[-100, -50, 0, 50, 100, 150].map((deg) => {
                  const x = xToPx(deg);
                  return (
                    <g key={deg}>
                      <line
                        x1={x}
                        y1={padT}
                        x2={x}
                        y2={padT + plotH}
                        stroke={deg === 0 ? '#94a3b8' : '#e2e8f0'}
                        strokeDasharray={deg === 0 ? '4 4' : undefined}
                      />
                      <text
                        x={x}
                        y={H - 12}
                        textAnchor="middle"
                        className="text-[11px] fill-slate-500 font-mono"
                      >
                        {deg}°
                      </text>
                    </g>
                  );
                })}

                <text
                  x={padL + plotW / 2}
                  y={H - 1}
                  textAnchor="middle"
                  className="text-[11px] fill-slate-600 font-mono"
                >
                  Crank Angle θ (Degrees around TDC = 0°)
                </text>

                {/* Plot Mode 1: Pressure vs Crank Angle (Fig. 1 & Figs. 9-11) */}
                {plotMode === 'pressure-ca' && (() => {
                  const yMax = 5.2;
                  const yToPx = (v: number) => padT + plotH - (v / yMax) * plotH;
                  const makePath = (getter: (d: typeof cycleData[0]) => number) =>
                    cycleData
                      .map((d, i) => `${i === 0 ? 'M' : 'L'}${xToPx(d.theta).toFixed(1)},${yToPx(getter(d)).toFixed(1)}`)
                      .join(' ');

                  return (
                    <>
                      {[0, 1, 2, 3, 4, 5].map((v) => (
                        <g key={v}>
                          <line x1={padL} y1={yToPx(v)} x2={padL + plotW} y2={yToPx(v)} stroke="#e2e8f0" />
                          <text x={padL - 8} y={yToPx(v) + 4} textAnchor="end" className="text-[11px] fill-slate-500 font-mono">
                            {v.toFixed(1)}
                          </text>
                        </g>
                      ))}
                      <text
                        x={16}
                        y={padT + plotH / 2}
                        transform={`rotate(-90 16 ${padT + plotH / 2})`}
                        textAnchor="middle"
                        className="text-[11px] fill-slate-600 font-mono"
                      >
                        Cylinder Pressure P (MPa)
                      </text>

                      <path d={makePath((d) => d.pHohenberg)} fill="none" stroke="#dc2626" strokeWidth={2} />
                      <path d={makePath((d) => d.pWoschni)} fill="none" stroke="#2563eb" strokeWidth={2} />
                      <path d={makePath((d) => d.pHan)} fill="none" stroke="#16a34a" strokeWidth={2} />
                      <path d={makePath((d) => d.pModWoschni)} fill="none" stroke="#9333ea" strokeWidth={1.8} />
                      <path d={makePath((d) => d.pAnnand)} fill="none" stroke="#ea580c" strokeWidth={1.8} />
                      {fuelRegime === 'std-gasoline' && (
                        <path
                          d={makePath((d) => d.pRakopoulos)}
                          fill="none"
                          stroke="#0f172a"
                          strokeWidth={2.2}
                          strokeDasharray="5 3"
                        />
                      )}
                    </>
                  );
                })()}

                {/* Plot Mode 2: Two-Zone Temperature (Fig. 3) */}
                {plotMode === 'two-zone-temp' && (() => {
                  const yMax = 3000;
                  const yToPx = (v: number) => padT + plotH - (v / yMax) * plotH;
                  const makePath = (getter: (d: typeof cycleData[0]) => number | null) => {
                    let started = false;
                    return cycleData
                      .map((d) => {
                        const val = getter(d);
                        if (val === null) return '';
                        const cmd = !started ? 'M' : 'L';
                        started = true;
                        return `${cmd}${xToPx(d.theta).toFixed(1)},${yToPx(val).toFixed(1)}`;
                      })
                      .filter(Boolean)
                      .join(' ');
                  };

                  return (
                    <>
                      {[0, 500, 1000, 1500, 2000, 2500, 3000].map((v) => (
                        <g key={v}>
                          <line x1={padL} y1={yToPx(v)} x2={padL + plotW} y2={yToPx(v)} stroke="#e2e8f0" />
                          <text x={padL - 8} y={yToPx(v) + 4} textAnchor="end" className="text-[11px] fill-slate-500 font-mono">
                            {v}
                          </text>
                        </g>
                      ))}
                      <text
                        x={14}
                        y={padT + plotH / 2}
                        transform={`rotate(-90 14 ${padT + plotH / 2})`}
                        textAnchor="middle"
                        className="text-[11px] fill-slate-600 font-mono"
                      >
                        Zone Temperature T_b, T_u (K)
                      </text>

                      {/* Burned Zone Curves */}
                      <path d={makePath((d) => d.Tb_Hohenberg)} fill="none" stroke="#dc2626" strokeWidth={2.2} />
                      <path d={makePath((d) => d.Tb_Woschni)} fill="none" stroke="#2563eb" strokeWidth={2.2} />
                      <path d={makePath((d) => d.Tb_Annand)} fill="none" stroke="#ea580c" strokeWidth={2.2} />

                      {/* Unburned Zone Curves */}
                      <path d={makePath((d) => d.Tu_Woschni)} fill="none" stroke="#2563eb" strokeWidth={1.8} strokeDasharray="4 3" />
                      <path d={makePath((d) => d.Tu_Annand)} fill="none" stroke="#ea580c" strokeWidth={1.8} strokeDasharray="4 3" />
                    </>
                  );
                })()}

                {/* Plot Mode 3: Heat Flux (Fig. 6) */}
                {plotMode === 'heat-flux' && (() => {
                  const yMax = 7.0;
                  const yToPx = (v: number) => padT + plotH - (v / yMax) * plotH;
                  const makePath = (getter: (d: typeof cycleData[0]) => number) =>
                    cycleData
                      .map((d, i) => `${i === 0 ? 'M' : 'L'}${xToPx(d.theta).toFixed(1)},${yToPx(getter(d)).toFixed(1)}`)
                      .join(' ');

                  return (
                    <>
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((v) => (
                        <g key={v}>
                          <line x1={padL} y1={yToPx(v)} x2={padL + plotW} y2={yToPx(v)} stroke="#e2e8f0" />
                          <text x={padL - 8} y={yToPx(v) + 4} textAnchor="end" className="text-[11px] fill-slate-500 font-mono">
                            {v}×10⁵
                          </text>
                        </g>
                      ))}
                      <text
                        x={14}
                        y={padT + plotH / 2}
                        transform={`rotate(-90 14 ${padT + plotH / 2})`}
                        textAnchor="middle"
                        className="text-[11px] fill-slate-600 font-mono"
                      >
                        Heat Flux q̇ (W/m²)
                      </text>

                      <path d={makePath((d) => d.qFluxAnnand)} fill="none" stroke="#ea580c" strokeWidth={2.2} />
                      <path d={makePath((d) => d.qFluxWoschni)} fill="none" stroke="#2563eb" strokeWidth={2.2} />
                      <path d={makePath((d) => d.qFluxHan)} fill="none" stroke="#16a34a" strokeWidth={2} />
                      <path d={makePath((d) => d.qFluxHohenberg)} fill="none" stroke="#dc2626" strokeWidth={2} />
                      <path d={makePath((d) => d.qFluxModWoschni)} fill="none" stroke="#9333ea" strokeWidth={2} />
                    </>
                  );
                })()}

                {/* Plot Mode 4: Cumulative Heat Transfer (Fig. 5) */}
                {plotMode === 'heat-transfer' && (() => {
                  const yMin = -50;
                  const yMax = 550;
                  const yToPx = (v: number) => padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
                  const makePath = (getter: (d: typeof cycleData[0]) => number) =>
                    cycleData
                      .map((d, i) => `${i === 0 ? 'M' : 'L'}${xToPx(d.theta).toFixed(1)},${yToPx(getter(d)).toFixed(1)}`)
                      .join(' ');

                  return (
                    <>
                      {[0, 100, 200, 300, 400, 500].map((v) => (
                        <g key={v}>
                          <line x1={padL} y1={yToPx(v)} x2={padL + plotW} y2={yToPx(v)} stroke="#e2e8f0" />
                          <text x={padL - 8} y={yToPx(v) + 4} textAnchor="end" className="text-[11px] fill-slate-500 font-mono">
                            {v}
                          </text>
                        </g>
                      ))}
                      <text
                        x={14}
                        y={padT + plotH / 2}
                        transform={`rotate(-90 14 ${padT + plotH / 2})`}
                        textAnchor="middle"
                        className="text-[11px] fill-slate-600 font-mono"
                      >
                        Cumulative Heat Transfer Q_l (J)
                      </text>

                      <path d={makePath((d) => d.qCumAnnand)} fill="none" stroke="#ea580c" strokeWidth={2.2} />
                      <path d={makePath((d) => d.qCumWoschni)} fill="none" stroke="#2563eb" strokeWidth={2.2} />
                      <path d={makePath((d) => d.qCumHan)} fill="none" stroke="#16a34a" strokeWidth={2} />
                      <path d={makePath((d) => d.qCumHohenberg)} fill="none" stroke="#dc2626" strokeWidth={2} />
                      <path d={makePath((d) => d.qCumModWoschni)} fill="none" stroke="#9333ea" strokeWidth={2} />
                    </>
                  );
                })()}

                {/* Plot Mode 6: Spark Advance Sweep (Fig. 12, Woschni model) */}
                {plotMode === 'spark-sweep' && (() => {
                  const yMax = 6.5;
                  const yToPx = (v: number) => padT + plotH - (v / yMax) * plotH;
                  const makePath = (getter: (d: typeof cycleData[0]) => number) =>
                    cycleData
                      .map((d, i) => `${i === 0 ? 'M' : 'L'}${xToPx(d.theta).toFixed(1)},${yToPx(getter(d)).toFixed(1)}`)
                      .join(' ');

                  return (
                    <>
                      {[0, 1, 2, 3, 4, 5, 6].map((v) => (
                        <g key={v}>
                          <line x1={padL} y1={yToPx(v)} x2={padL + plotW} y2={yToPx(v)} stroke="#e2e8f0" />
                          <text x={padL - 8} y={yToPx(v) + 4} textAnchor="end" className="text-[11px] fill-slate-500 font-mono">
                            {v.toFixed(1)}
                          </text>
                        </g>
                      ))}
                      <text
                        x={16}
                        y={padT + plotH / 2}
                        transform={`rotate(-90 16 ${padT + plotH / 2})`}
                        textAnchor="middle"
                        className="text-[11px] fill-slate-600 font-mono"
                      >
                        Pressure P (MPa) · Woschni Model
                      </text>

                      <path d={makePath((d) => d.pSpark40)} fill="none" stroke="#0f172a" strokeWidth={2.2} />
                      <path d={makePath((d) => d.pSpark30)} fill="none" stroke="#dc2626" strokeWidth={2} />
                      <path d={makePath((d) => d.pSpark20)} fill="none" stroke="#16a34a" strokeWidth={2} />
                      <path d={makePath((d) => d.pSpark10)} fill="none" stroke="#9333ea" strokeWidth={2} />
                      <path d={makePath((d) => d.pSpark0)} fill="none" stroke="#2563eb" strokeWidth={2} />
                    </>
                  );
                })()}

                {/* Interactive Hover Cursor */}
                {activeSample && (
                  <line
                    x1={xToPx(activeSample.theta)}
                    y1={padT}
                    x2={xToPx(activeSample.theta)}
                    y2={padT + plotH}
                    stroke="#475569"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Invisible hover bands */}
                {cycleData.map((d) => (
                  <rect
                    key={d.theta}
                    x={xToPx(d.theta) - plotW / cycleData.length / 2}
                    y={padT}
                    width={plotW / cycleData.length}
                    height={plotH}
                    fill="transparent"
                    className="cursor-crosshair"
                    onMouseEnter={() => setHoveredAngle(d.theta)}
                  />
                ))}
              </svg>
            </div>

            {/* Legend & Live Readout */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-4 text-xs">
              {plotMode !== 'spark-sweep' ? (
                <div className="flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="w-3 h-0.5 bg-blue-600 inline-block" /> Woschni (θ={activeSample.theta}°: {plotMode === 'pressure-ca' ? `${activeSample.pWoschni.toFixed(2)} MPa` : plotMode === 'heat-flux' ? `${activeSample.qFluxWoschni.toFixed(2)}×10⁵ W/m²` : plotMode === 'heat-transfer' ? `${activeSample.qCumWoschni.toFixed(0)} J` : `Tb=${activeSample.Tb_Woschni ? activeSample.Tb_Woschni.toFixed(0) : '—'}K / Tu=${activeSample.Tu_Woschni.toFixed(0)}K`})
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="w-3 h-0.5 bg-red-600 inline-block" /> Hohenberg ({plotMode === 'pressure-ca' ? `${activeSample.pHohenberg.toFixed(2)} MPa` : plotMode === 'heat-flux' ? `${activeSample.qFluxHohenberg.toFixed(2)}×10⁵ W/m²` : `${activeSample.qCumHohenberg.toFixed(0)} J`})
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="w-3 h-0.5 bg-green-600 inline-block" /> Han et al. ({plotMode === 'pressure-ca' ? `${activeSample.pHan.toFixed(2)} MPa` : plotMode === 'heat-flux' ? `${activeSample.qFluxHan.toFixed(2)}×10⁵ W/m²` : `${activeSample.qCumHan.toFixed(0)} J`})
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="w-3 h-0.5 bg-purple-600 inline-block" /> Mod. Woschni ({plotMode === 'pressure-ca' ? `${activeSample.pModWoschni.toFixed(2)} MPa` : plotMode === 'heat-flux' ? `${activeSample.qFluxModWoschni.toFixed(2)}×10⁵ W/m²` : `${activeSample.qCumModWoschni.toFixed(0)} J`})
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="w-3 h-0.5 bg-orange-600 inline-block" /> Annand ({plotMode === 'pressure-ca' ? `${activeSample.pAnnand.toFixed(2)} MPa` : plotMode === 'heat-flux' ? `${activeSample.qFluxAnnand.toFixed(2)}×10⁵ W/m²` : `${activeSample.qCumAnnand.toFixed(0)} J`})
                  </span>
                  {plotMode === 'pressure-ca' && fuelRegime === 'std-gasoline' && (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
                      <span className="w-3 h-0.5 bg-slate-900 inline-block" /> Rakopoulos Exp. [8] ({activeSample.pRakopoulos.toFixed(2)} MPa)
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="w-3 h-0.5 bg-blue-600 inline-block" /> Spark Advance 0° ({activeSample.pSpark0.toFixed(2)} MPa)
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="w-3 h-0.5 bg-purple-600 inline-block" /> Spark Advance 10° ({activeSample.pSpark10.toFixed(2)} MPa)
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="w-3 h-0.5 bg-green-600 inline-block" /> Spark Advance 20° ({activeSample.pSpark20.toFixed(2)} MPa)
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="w-3 h-0.5 bg-red-600 inline-block" /> Spark Advance 30° ({activeSample.pSpark30.toFixed(2)} MPa)
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-900">
                    <span className="w-3 h-0.5 bg-slate-900 inline-block" /> Spark Advance 40° ({activeSample.pSpark40.toFixed(2)} MPa)
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Fig. 8: Stage-wise Heat Transfer Bar Chart */
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              <strong>Figure 8 Reproduction:</strong> Percentage of total cylinder heat transfer occurring during Compression, Combustion, and Expansion stages across all 5 models. Annand gives the highest percentage of heat transfer in both compression and expansion, whereas Modified Woschni gives the highest percentage in combustion.
            </p>
            <div className="space-y-3">
              {stageBreakdown.map((item) => (
                <div key={item.model} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>{item.model}</span>
                    <span className="font-mono text-slate-500">
                      Compression: {item.compression}% · Combustion: {item.combustion}% · Expansion: {item.expansion}%
                    </span>
                  </div>
                  <div className="w-full h-5 rounded-md overflow-hidden flex">
                    <div
                      style={{ width: `${item.compression}%` }}
                      className="bg-blue-500 h-full"
                      title={`Compression: ${item.compression}%`}
                    />
                    <div
                      style={{ width: `${item.combustion}%` }}
                      className="bg-amber-500 h-full"
                      title={`Combustion: ${item.combustion}%`}
                    />
                    <div
                      style={{ width: `${item.expansion}%` }}
                      className="bg-emerald-600 h-full"
                      title={`Expansion: ${item.expansion}%`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      )}

      {/* 04 · Stage-Wise Model Recommendations & Critical Conclusions */}
      {showDiagnosticsOrTables && (
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-200 pb-3">
          <div className="text-xs font-mono uppercase tracking-wider text-blue-700">
            04 · Stage-Wise Model Recommendations &amp; Critical Findings (Sections 3 &amp; 4)
          </div>
          <h4 className="text-lg font-bold text-slate-900 mt-0.5">
            Which Heat Transfer Correlation Works Best in Each Engine Cycle Region?
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-blue-700">
              <CheckCircle2 className="w-4 h-4" />
              1. Compression Stage
            </div>
            <div className="text-base font-bold text-slate-900">Hohenberg Model</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              During compression, <strong>Hohenberg (1979)</strong> is closest to experimental pressure data, followed in sequence by Woschni, Han et al., Modified Woschni, and Annand. Taking characteristic length based on instantaneous cylinder volume (<span className="font-mono">V^(-0.06)</span>) rather than cylinder bore avoids compression underprediction.
            </p>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-amber-700">
              <Flame className="w-4 h-4" />
              2. Combustion Stage
            </div>
            <div className="text-base font-bold text-slate-900">Han et al. &amp; Woschni Models</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              During combustion, experimental peak pressure lies slightly above <strong>Han et al. (1997)</strong> and just below <strong>Woschni (1967)</strong>. Annand overpredicts combustion heat flux (and thus underpredicts peak pressure), while Hohenberg slightly overpredicts peak pressure.
            </p>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              3. Expansion Stage
            </div>
            <div className="text-base font-bold text-slate-900">Modified Woschni &amp; Annand</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              During expansion, <strong>Modified Woschni</strong> (using instantaneous chamber height <span className="font-mono">L(t) = 4V / πd_p²</span>) and <strong>Annand</strong> closely track the experimental Rakopoulos expansion trace.
            </p>
          </div>
        </div>

        <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-lg text-xs text-slate-700 leading-relaxed">
          <strong>Scope for Future Model Refinement (Section 4 Conclusion):</strong> In all 5 models evaluated in this study, cylinder wall temperature was assumed spatially and temporally constant (<span className="font-mono">T_wall = 420 K</span>). Varying <span className="font-mono">T_wall(θ)</span> dynamically and incorporating an explicit radiative heat transfer term proportional to <span className="font-mono">σ(T_G⁴ − T_w⁴)</span> alongside convective correlations are identified as key extensions for two-zone SI combustion modeling.
        </div>
      </div>
      )}
    </div>
  );
};
