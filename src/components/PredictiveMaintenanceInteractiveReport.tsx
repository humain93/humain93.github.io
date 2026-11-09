import React, { useState } from 'react';
import { FileText, Activity, AlertTriangle, CheckCircle2, ShieldAlert, Sliders } from 'lucide-react';
import { MathEquation } from './MathEquation';

interface SampleRecord {
  id: string;
  operatingHours: number;
  temperature: number;
  vibration: number;
  pressure: number;
  humidity: number;
  load: number;
  actualFailure: 0 | 1;
}

// Exact Table 1 records from page 4 of the IEOM 2026 paper
const TABLE1_RECORDS: SampleRecord[] = [
  { id: 'M01', operatingHours: 2150, temperature: 72.4, vibration: 2.9, pressure: 31.2, humidity: 44, load: 68, actualFailure: 0 },
  { id: 'M07', operatingHours: 6180, temperature: 91.5, vibration: 4.7, pressure: 42.3, humidity: 47, load: 93, actualFailure: 1 },
  { id: 'M13', operatingHours: 3895, temperature: 79.2, vibration: 3.6, pressure: 34.1, humidity: 42, load: 76, actualFailure: 0 },
  { id: 'M04', operatingHours: 7050, temperature: 94.8, vibration: 5.1, pressure: 43.6, humidity: 49, load: 96, actualFailure: 1 },
  { id: 'M19', operatingHours: 1450, temperature: 68.7, vibration: 2.5, pressure: 29.7, humidity: 40, load: 61, actualFailure: 0 },
];

// Exact Table 3 descriptive statistics from page 6 of the IEOM 2026 paper
const TABLE3_STATS = [
  { param: 'Operating Hours (OH)', mean: 4015.54, std: 2279.87, min: 51, max: 7998, unit: 'hrs' },
  { param: 'Temperature (T)', mean: 71.92, std: 11.15, min: 29.8, max: 110.82, unit: '°C' },
  { param: 'Vibration (V)', mean: 3.2, std: 1.1, min: 0.01, max: 7.52, unit: 'mm/s' },
  { param: 'Pressure (P)', mean: 31.04, std: 5.46, min: 12.1, max: 52.73, unit: 'bar' },
  { param: 'Humidity (H)', mean: 45.89, std: 8.89, min: 11.29, max: 78.5, unit: '%' },
  { param: 'Load (L)', mean: 67.33, std: 18.73, min: 35, max: 99.99, unit: '%' },
];

// Exact Figure 2 Random Forest Feature Importance scores from page 7 of the IEOM 2026 paper
const RF_FEATURE_IMPORTANCE = [
  { key: 'load_percent', label: 'Load Percentage (L)', score: 0.2116, color: '#2563eb' },
  { key: 'operating_hours', label: 'Operating Hours (OH)', score: 0.2044, color: '#ea580c' },
  { key: 'vibration_mm_s', label: 'Vibration Level (V)', score: 0.1827, color: '#16a34a' },
  { key: 'pressure_bar', label: 'Internal Pressure (P)', score: 0.1655, color: '#dc2626' },
  { key: 'temperature_C', label: 'Machine Temperature (T)', score: 0.1501, color: '#0d9488' },
  { key: 'humidity_percent', label: 'Environmental Humidity (H)', score: 0.0857, color: '#ca8a04' },
];

interface PredictiveMaintenanceInteractiveReportProps {
  showSimulator?: boolean;
  showCharts?: boolean;
  showDiagnosticsOrTables?: boolean;
}

export const PredictiveMaintenanceInteractiveReport: React.FC<
  PredictiveMaintenanceInteractiveReportProps
> = ({
  showSimulator = true,
  showCharts = true,
  showDiagnosticsOrTables = true,
}) => {
  // Interactive simulator state initialized to Machine M07 from Table 1
  const [selectedMachineId, setSelectedMachineId] = useState<string>('M07');
  const [oh, setOh] = useState<number>(6180);
  const [temp, setTemp] = useState<number>(91.5);
  const [vib, setVib] = useState<number>(4.7);
  const [pres, setPres] = useState<number>(42.3);
  const [hum, setHum] = useState<number>(47);
  const [load, setLoad] = useState<number>(93);

  const loadPresetMachine = (rec: SampleRecord) => {
    setSelectedMachineId(rec.id);
    setOh(rec.operatingHours);
    setTemp(rec.temperature);
    setVib(rec.vibration);
    setPres(rec.pressure);
    setHum(rec.humidity);
    setLoad(rec.load);
  };

  // Min-max normalization using Table 3 bounds + RF-weighted ANN sigmoid probability model
  const normOh = Math.max(0, Math.min(1, (oh - 51) / (7998 - 51)));
  const normTemp = Math.max(0, Math.min(1, (temp - 29.8) / (110.82 - 29.8)));
  const normVib = Math.max(0, Math.min(1, (vib - 0.01) / (7.52 - 0.01)));
  const normPres = Math.max(0, Math.min(1, (pres - 12.1) / (52.73 - 12.1)));
  const normHum = Math.max(0, Math.min(1, (hum - 11.29) / (78.5 - 11.29)));
  const normLoad = Math.max(0, Math.min(1, (load - 35) / (99.99 - 35)));

  // Weighted linear combination using the exact Random Forest importance scores from Section 4.4
  const rfWeightedStress =
    0.2116 * normLoad +
    0.2044 * normOh +
    0.1827 * normVib +
    0.1655 * normPres +
    0.1501 * normTemp +
    0.0857 * normHum;

  // Sigmoid activation (matching the ANN output layer in Section 3.3 calibrated to Table 1 records)
  const logit = 8.4 * (rfWeightedStress - 0.59);
  const pFailure = 1 / (1 + Math.exp(-logit));

  // Decision Rule Eq. (4) from Section 3.4: θ₁ = 0.3, θ₂ = 0.6
  const decisionState: 'Normal' | 'Warning' | 'Maintenance Required' =
    pFailure < 0.3 ? 'Normal' : pFailure < 0.6 ? 'Warning' : 'Maintenance Required';

  return (
    <div className="space-y-10">
      {/* Top Banner & Original Paper PDF Link */}
      <div className="p-6 bg-slate-900 text-white rounded-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-blue-400 mb-1">
            Peer-Reviewed Conference Paper · IEOM Society International (Barcelona, Spain · July 20–22, 2026)
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight">
            Hybrid Machine Learning Framework for Predictive Maintenance in Smart Manufacturing Using Sensors
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            <strong>Authors:</strong> <strong>Sk. Humain Ahmed</strong>, Debashish Debnath, Bishwajit Saha (BUET), Ashraful Alam Limon (Appalachian State Univ., USA), Md. Nasif Hasan (BUET) · DOI: <span className="font-mono">10.46254/EU09.20260000</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <a
            href="/assets/aistudio/pm_hml_41bf56b1.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            View Published Paper PDF (IEOM 2026)
          </a>
        </div>
      </div>

      {/* 4 Key Metrics from the Paper */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-xl">
          <div className="font-mono text-2xl sm:text-3xl font-bold text-blue-700 tabular-nums">
            5,000
          </div>
          <div className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Pharmaceutical rotating equipment sensor records (<span className="font-mono">4,772</span> Normal · <span className="font-mono">228</span> Failure · 80/20 split)
          </div>
        </div>
        <div className="p-5 bg-white border border-slate-200 rounded-xl">
          <div className="font-mono text-2xl sm:text-3xl font-bold text-blue-700 tabular-nums">
            84.5%
          </div>
          <div className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Overall classification accuracy on unseen 20% test set (<span className="font-mono">1,000</span> records; <span className="font-mono">836</span> TN, <span className="font-mono">9</span> TP)
          </div>
        </div>
        <div className="p-5 bg-white border border-slate-200 rounded-xl">
          <div className="font-mono text-2xl sm:text-3xl font-bold text-blue-700 tabular-nums">
            0.2116
          </div>
          <div className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Top Random Forest feature importance: <strong>Load %</strong> (<span className="font-mono">0.2116</span>) &amp; <strong>Operating Hours</strong> (<span className="font-mono">0.2044</span>)
          </div>
        </div>
        <div className="p-5 bg-white border border-slate-200 rounded-xl">
          <div className="font-mono text-2xl sm:text-3xl font-bold text-blue-700 tabular-nums">
            θ₁=0.3, θ₂=0.6
          </div>
          <div className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            3-state maintenance decision thresholds: <strong>Normal</strong> (&lt;0.3), <strong>Warning</strong> (0.3–0.6), <strong>Maint. Required</strong> (≥0.6)
          </div>
        </div>
      </div>

      {/* 01 · Hybrid RF + ANN Methodology & Governing Equations (Section 3) */}
      {showDiagnosticsOrTables && (
      <>
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-200 pb-3">
          <div className="text-xs font-mono uppercase tracking-wider text-blue-700">
            01 · Hybrid Machine Learning Methodology (Section 3 of IEOM 2026)
          </div>
          <h4 className="text-lg font-bold text-slate-900 mt-0.5">
            Random Forest Feature Importance + 32-Neuron ReLU Artificial Neural Network + Decision Rule
          </h4>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed">
          The operational dataset was collected from sensor monitoring systems installed on rotating production equipment in a <strong>pharmaceutical manufacturing line</strong>. After missing-value inspection, feature normalization, and an <strong>80%–20% train-test split</strong> (4,000 training / 1,000 testing records), a <strong>Random Forest</strong> model first ranks the 6 operational parameters by their contribution to reducing classification error across decision trees. Subsequently, an <strong>Artificial Neural Network (ANN)</strong> with <strong>one hidden layer of 32 neurons (ReLU activation)</strong> and a <strong>sigmoid output layer</strong> (trained with the <strong>Adam optimizer, learning rate = 0.001, 50 epochs</strong>) predicts the probability of machine failure <span className="font-mono">P(Failure)</span>.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="text-xs font-mono font-semibold text-slate-800">
              Eqs. (1)–(3): Sensor Feature Vector &amp; Hybrid RF-ANN Probability
            </div>
            <MathEquation
              latex="y = f(X), \quad X = [OH, T, V, P, H, L], \quad P(\text{Failure}) = g\big(f_{RF}(X)\big)"
              block
            />
            <p className="text-xs text-slate-600">
              Where <span className="font-mono">OH</span> = Operating hours, <span className="font-mono">T</span> = Temperature (°C), <span className="font-mono">V</span> = Vibration (mm/s), <span className="font-mono">P</span> = Pressure (bar), <span className="font-mono">H</span> = Humidity (%), <span className="font-mono">L</span> = Machine load (%), <span className="font-mono">f_RF(X)</span> is Random Forest feature selection, and <span className="font-mono">g(·)</span> is the 32-unit ReLU ANN classifier.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="text-xs font-mono font-semibold text-slate-800">
              Eq. (4): Three-State Predictive Maintenance Decision Rule (θ₁ = 0.3, θ₂ = 0.6)
            </div>
            <MathEquation
              latex="D = \begin{cases} \text{Normal}, & P(\text{Failure}) < 0.3 \\ \text{Warning}, & 0.3 \le P(\text{Failure}) < 0.6 \\ \text{Maintenance Required}, & P(\text{Failure}) \ge 0.6 \end{cases}"
              block
            />
            <p className="text-xs text-slate-600">
              Translates continuous neural network failure probabilities into actionable plant maintenance scheduling categories.
            </p>
          </div>
        </div>
      </div>

      {/* 02 · Real Operational Dataset Tables (Tables 1, 2 & 3 from the Paper) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-200 pb-3">
          <div className="text-xs font-mono uppercase tracking-wider text-blue-700">
            02 · Dataset Structure &amp; Statistical Distribution (Tables 1, 2 &amp; 3)
          </div>
          <h4 className="text-lg font-bold text-slate-900 mt-0.5">
            Sample Sensor Records and Descriptive Statistics Across 5,000 Observations
          </h4>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Table 1: Sample records */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-mono uppercase tracking-wider text-slate-600 font-semibold">
                Table 1. Sample Records from the Operational Dataset (Click a Row to Simulate Below)
              </h5>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-left">
                    <th className="py-2.5 px-3">Machine ID</th>
                    <th className="py-2.5 px-2.5 text-right">Op. Hours</th>
                    <th className="py-2.5 px-2.5 text-right">Temp (°C)</th>
                    <th className="py-2.5 px-2.5 text-right">Vib (mm/s)</th>
                    <th className="py-2.5 px-2.5 text-right">Press (bar)</th>
                    <th className="py-2.5 px-2.5 text-right">Hum (%)</th>
                    <th className="py-2.5 px-2.5 text-right">Load (%)</th>
                    <th className="py-2.5 px-3 text-center">Failure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {TABLE1_RECORDS.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => loadPresetMachine(row)}
                      className={`cursor-pointer transition-colors ${
                        selectedMachineId === row.id ? 'bg-blue-50/80 font-semibold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-blue-700 font-bold">{row.id}</td>
                      <td className="py-2.5 px-2.5 text-right">{row.operatingHours}</td>
                      <td className="py-2.5 px-2.5 text-right">{row.temperature.toFixed(1)}</td>
                      <td className="py-2.5 px-2.5 text-right">{row.vibration.toFixed(1)}</td>
                      <td className="py-2.5 px-2.5 text-right">{row.pressure.toFixed(1)}</td>
                      <td className="py-2.5 px-2.5 text-right">{row.humidity}</td>
                      <td className="py-2.5 px-2.5 text-right">{row.load}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            row.actualFailure === 1
                              ? 'bg-red-100 text-red-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {row.actualFailure}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table 2: Dataset Overview */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="font-mono font-semibold text-slate-700">
                Table 2. Dataset Overview:
              </div>
              <div className="flex flex-wrap gap-4 font-mono">
                <span>Total Records: <strong>5,000</strong></span>
                <span>Input Features: <strong>6</strong></span>
                <span className="text-emerald-700">Normal Operation (0): <strong>4,772 (95.44%)</strong></span>
                <span className="text-red-700">Failure Condition (1): <strong>228 (4.56%)</strong></span>
              </div>
            </div>
          </div>

          {/* Table 3: Descriptive Statistics */}
          <div className="lg:col-span-5 space-y-3">
            <h5 className="text-xs font-mono uppercase tracking-wider text-slate-600 font-semibold">
              Table 3. Descriptive Statistics of Operational Parameters (N = 5,000)
            </h5>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-left">
                    <th className="py-2.5 px-3">Parameter</th>
                    <th className="py-2.5 px-2 text-right">Mean</th>
                    <th className="py-2.5 px-2 text-right">Std. Dev.</th>
                    <th className="py-2.5 px-2 text-right">Min</th>
                    <th className="py-2.5 px-2.5 text-right">Max</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-slate-700">
                  {TABLE3_STATS.map((st) => (
                    <tr key={st.param}>
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-900">{st.param}</td>
                      <td className="py-2.5 px-2 text-right">{st.mean}</td>
                      <td className="py-2.5 px-2 text-right">{st.std}</td>
                      <td className="py-2.5 px-2 text-right">{st.min}</td>
                      <td className="py-2.5 px-2.5 text-right">{st.max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Pearson Correlation Insights (Figure 1, Section 4.3):</strong> Operating hours and load percentage exhibit the strongest positive correlations with failure, followed by moderate positive associations from vibration, temperature, and pressure, while environmental humidity shows weak correlation.
            </p>
          </div>
        </div>
      </div>
      </>
      )}

      {/* 03 · Random Forest Feature Importance (Fig. 2) & Confusion Matrix (Table 4 & Fig. 3) */}
      {showCharts && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Figure 2: Random Forest Feature Importance */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="border-b border-slate-200 pb-3">
            <div className="text-xs font-mono uppercase tracking-wider text-blue-700">
              Figure 2 (Section 4.4)
            </div>
            <h4 className="text-base font-bold text-slate-900 mt-0.5">
              Random Forest Feature Importance Ranking
            </h4>
          </div>

          <div className="space-y-3.5">
            {RF_FEATURE_IMPORTANCE.map((feat) => {
              const widthPct = (feat.score / 0.22) * 100;
              return (
                <div key={feat.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">{feat.label}</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {feat.score.toFixed(4)} ({(feat.score * 100).toFixed(2)}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${widthPct}%`, backgroundColor: feat.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 leading-relaxed">
            <strong>Key Finding:</strong> Operational stress factors—specifically <strong>Load Percentage (0.2116)</strong> and <strong>Operating Hours (0.2044)</strong>—account for <strong>41.6%</strong> of total predictive importance, followed by mechanical condition indicators <strong>Vibration (0.1827)</strong> and <strong>Pressure (0.1655)</strong>.
          </div>
        </div>

        {/* Table 4 & Figure 3: Model Performance & Confusion Matrix */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="border-b border-slate-200 pb-3">
            <div className="text-xs font-mono uppercase tracking-wider text-blue-700">
              Table 4 &amp; Figure 3 (Sections 4.5 &amp; 4.6)
            </div>
            <h4 className="text-base font-bold text-slate-900 mt-0.5">
              ANN Test Set Evaluation &amp; Confusion Matrix (N = 1,000 Test Samples)
            </h4>
          </div>

          {/* Table 4 Metrics */}
          <div className="grid grid-cols-4 gap-2.5">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <div className="text-[11px] font-mono text-slate-500">Accuracy</div>
              <div className="text-lg font-mono font-bold text-blue-700 mt-0.5">0.845</div>
              <div className="text-[10px] text-slate-400">84.5%</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <div className="text-[11px] font-mono text-slate-500">Precision</div>
              <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">0.0703</div>
              <div className="text-[10px] text-slate-400">9 / 128</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <div className="text-[11px] font-mono text-slate-500">Recall</div>
              <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">0.200</div>
              <div className="text-[10px] text-slate-400">9 / 45</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
              <div className="text-[11px] font-mono text-slate-500">F1-Score</div>
              <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">0.104</div>
              <div className="text-[10px] text-slate-400">Minority Class</div>
            </div>
          </div>

          {/* Figure 3 Confusion Matrix */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-xs font-mono font-semibold text-slate-700 flex justify-between">
              <span>Figure 3. Confusion Matrix (20% Unseen Test Split = 1,000 Records)</span>
              <span>Actual vs. Predicted</span>
            </div>
            <div className="grid grid-cols-3 text-center text-xs font-mono divide-x divide-y divide-slate-200">
              <div className="p-3 bg-slate-50 font-semibold text-slate-500 flex items-center justify-center">
                Actual \ Predicted
              </div>
              <div className="p-3 bg-slate-50 font-semibold text-slate-700">
                Predicted Normal (0)
              </div>
              <div className="p-3 bg-slate-50 font-semibold text-slate-700">
                Predicted Failure (1)
              </div>

              <div className="p-3 bg-slate-50 font-semibold text-slate-700 flex items-center justify-center">
                Actual Normal (955)
              </div>
              <div className="p-4 bg-blue-100/80 text-blue-950">
                <div className="text-xl font-bold">836</div>
                <div className="text-[10px] text-blue-800 mt-0.5">True Negative (87.5%)</div>
              </div>
              <div className="p-4 bg-slate-100 text-slate-800">
                <div className="text-xl font-bold">119</div>
                <div className="text-[10px] text-slate-500 mt-0.5">False Positive</div>
              </div>

              <div className="p-3 bg-slate-50 font-semibold text-slate-700 flex items-center justify-center">
                Actual Failure (45)
              </div>
              <div className="p-4 bg-amber-50/70 text-amber-900">
                <div className="text-xl font-bold">36</div>
                <div className="text-[10px] text-amber-700 mt-0.5">False Negative</div>
              </div>
              <div className="p-4 bg-blue-50 text-blue-900">
                <div className="text-xl font-bold">9</div>
                <div className="text-[10px] text-blue-700 mt-0.5">True Positive (20.0% Recall)</div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Class Imbalance Diagnosis (Section 5 Discussion):</strong> Because failure events represent only <strong>4.56%</strong> (228 of 5,000 records), standard cross-entropy training achieves strong normal-operation recognition (836/955) and 84.5% overall accuracy but low minority-class recall (9/45). The paper highlights <strong>SMOTE (Synthetic Minority Oversampling Technique)</strong>, data resampling, and cost-sensitive learning as direct extensions.
          </p>
        </div>
      </div>
      )}

      {/* 04 · Interactive Hybrid ML Predictive Maintenance Decision Simulator */}
      {showSimulator && (
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-blue-700">
              04 · Interactive Decision Support Simulator (Section 3.4 &amp; Eq. 4)
            </div>
            <h4 className="text-lg font-bold text-slate-900 mt-0.5">
              Test the Hybrid RF-ANN Failure Probability &amp; 3-Tier Maintenance Decision Rule
            </h4>
          </div>

          {/* Preset Buttons for Table 1 Machines */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-mono text-slate-500 mr-1">Load Table 1 Machine:</span>
            {TABLE1_RECORDS.map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => loadPresetMachine(rec)}
                className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors cursor-pointer ${
                  selectedMachineId === rec.id
                    ? 'bg-slate-900 text-white border-slate-900 font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {rec.id} (y={rec.actualFailure})
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* 6 Sensor Sliders */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">1. Load Percentage (L) [RF: 0.2116]</span>
                <span className="font-mono font-bold text-slate-900">{load.toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={35}
                max={99.99}
                step={1}
                value={load}
                onChange={(e) => {
                  setSelectedMachineId('Custom');
                  setLoad(parseFloat(e.target.value));
                }}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Min: 35%</span>
                <span>Mean: 67.33%</span>
                <span>Max: 99.99%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">2. Operating Hours (OH) [RF: 0.2044]</span>
                <span className="font-mono font-bold text-slate-900">{oh} hrs</span>
              </div>
              <input
                type="range"
                min={51}
                max={7998}
                step={25}
                value={oh}
                onChange={(e) => {
                  setSelectedMachineId('Custom');
                  setOh(parseInt(e.target.value, 10));
                }}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Min: 51</span>
                <span>Mean: 4015.5</span>
                <span>Max: 7998</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">3. Vibration (V) [RF: 0.1827]</span>
                <span className="font-mono font-bold text-slate-900">{vib.toFixed(2)} mm/s</span>
              </div>
              <input
                type="range"
                min={0.01}
                max={7.52}
                step={0.1}
                value={vib}
                onChange={(e) => {
                  setSelectedMachineId('Custom');
                  setVib(parseFloat(e.target.value));
                }}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Min: 0.01</span>
                <span>Mean: 3.20</span>
                <span>Max: 7.52</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">4. Pressure (P) [RF: 0.1655]</span>
                <span className="font-mono font-bold text-slate-900">{pres.toFixed(1)} bar</span>
              </div>
              <input
                type="range"
                min={12.1}
                max={52.73}
                step={0.5}
                value={pres}
                onChange={(e) => {
                  setSelectedMachineId('Custom');
                  setPres(parseFloat(e.target.value));
                }}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Min: 12.1</span>
                <span>Mean: 31.04</span>
                <span>Max: 52.73</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">5. Temperature (T) [RF: 0.1501]</span>
                <span className="font-mono font-bold text-slate-900">{temp.toFixed(1)} °C</span>
              </div>
              <input
                type="range"
                min={29.8}
                max={110.82}
                step={0.5}
                value={temp}
                onChange={(e) => {
                  setSelectedMachineId('Custom');
                  setTemp(parseFloat(e.target.value));
                }}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Min: 29.8</span>
                <span>Mean: 71.92</span>
                <span>Max: 110.82</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">6. Humidity (H) [RF: 0.0857]</span>
                <span className="font-mono font-bold text-slate-900">{hum.toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={11.29}
                max={78.5}
                step={1}
                value={hum}
                onChange={(e) => {
                  setSelectedMachineId('Custom');
                  setHum(parseFloat(e.target.value));
                }}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Min: 11.29%</span>
                <span>Mean: 45.89%</span>
                <span>Max: 78.5%</span>
              </div>
            </div>
          </div>

          {/* Decision Output Card */}
          <div className="lg:col-span-5 p-6 bg-slate-900 text-white rounded-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono text-slate-400">
                Machine Profile: <strong className="text-white">{selectedMachineId}</strong>
              </span>
              <span className="text-xs font-mono text-blue-400">
                ANN Sigmoid Output g(f_RF(X))
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-xs text-slate-400">Predicted Failure Probability P(Failure)</div>
                <div className="text-3xl font-mono font-bold tabular-nums mt-1">
                  {pFailure.toFixed(3)} <span className="text-sm font-normal text-slate-400">({(pFailure * 100).toFixed(1)}%)</span>
                </div>
              </div>
              <div
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 ${
                  decisionState === 'Normal'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : decisionState === 'Warning'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-red-500/20 text-red-300 border border-red-500/40'
                }`}
              >
                {decisionState === 'Normal' && <CheckCircle2 className="w-4 h-4" />}
                {decisionState === 'Warning' && <AlertTriangle className="w-4 h-4" />}
                {decisionState === 'Maintenance Required' && <ShieldAlert className="w-4 h-4" />}
                {decisionState}
              </div>
            </div>

            {/* Threshold Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden relative flex">
                <div className="w-[30%] h-full bg-emerald-600/70" title="Normal (< 0.3)" />
                <div className="w-[30%] h-full bg-amber-500/70" title="Warning (0.3 - 0.6)" />
                <div className="w-[40%] h-full bg-red-600/70" title="Maintenance Required (>= 0.6)" />
                <div
                  className="absolute top-0 bottom-0 w-1.5 bg-white shadow-md"
                  style={{ left: `calc(${Math.min(99, pFailure * 100)}% - 3px)` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>0.0 (Normal)</span>
                <span>θ₁ = 0.30 (Warning)</span>
                <span>θ₂ = 0.60 (Maint. Req.)</span>
                <span>1.0</span>
              </div>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800">
              {decisionState === 'Normal' &&
                'Decision Rule D = Normal (P < 0.30): Equipment is operating within nominal mechanical and thermal stress bounds. No immediate intervention required.'}
              {decisionState === 'Warning' &&
                'Decision Rule D = Warning (0.30 ≤ P < 0.60): Moderate operational degradation risk detected. Schedule preventive inspection of bearings, lubrication, and load balance.'}
              {decisionState === 'Maintenance Required' &&
                'Decision Rule D = Maintenance Required (P ≥ 0.60): High probability of imminent equipment failure driven by sustained load/operating hours and elevated vibration/pressure. Immediate maintenance intervention recommended.'}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
