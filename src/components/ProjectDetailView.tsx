import React, { useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  GitBranch,
  Edit3,
  Maximize2,
  X,
  PlayCircle,
} from 'lucide-react';
import { ResearchProject, SimulationMode } from '../types/portfolio';
import { MathEquation } from './MathEquation';
import { ResilientImage } from './ResilientImage';
import { InteractiveSimulationsLab } from './InteractiveSimulationsLab';
import { SindyRlInteractiveReport } from './SindyRlInteractiveReport';
import { SiEngineInteractiveReport } from './SiEngineInteractiveReport';
import { PredictiveMaintenanceInteractiveReport } from './PredictiveMaintenanceInteractiveReport';

interface ProjectDetailViewProps {
  project: ResearchProject;
  onBack: () => void;
  onEditProjectInCms: (projectId: string) => void;
  allProjects: ResearchProject[];
  onSelectProject: (slug: string) => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  onBack,
  onEditProjectInCms,
  allProjects,
  onSelectProject,
}) => {
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption: string } | null>(
    null
  );

  const vis = project.moduleVisibility || {};
  const showKeyFindings = vis.showKeyFindings !== false;
  const showNarrativeBreakdown = vis.showNarrativeBreakdown !== false;
  const showEquations = vis.showEquations !== false;
  const showSystemDiagram = vis.showSystemDiagram !== false;
  const showPerformanceGraph = vis.showPerformanceGraph !== false;
  const showInteractiveModule = vis.showInteractiveModule !== false;
  const showReportSimulator = vis.showReportSimulator !== false;
  const showReportCharts = vis.showReportCharts !== false;
  const showReportDiagnosticsOrTables = vis.showReportDiagnosticsOrTables !== false;

  // Resolve which interactive module to render on this project page
  const resolvedInteractiveType = (() => {
    if (!showInteractiveModule) return 'none';
    if (vis.interactiveModuleType && vis.interactiveModuleType !== 'auto') {
      return vis.interactiveModuleType;
    }
    if (
      project.id === 'proj-sindy-rl' ||
      project.slug === 'sindy-rl-model-based-reinforcement-learning'
    ) {
      return 'sindy-rl-report';
    }
    if (
      project.id === 'proj-si-engine-thesis' ||
      project.slug === 'heat-transfer-models-si-engine-undergraduate-thesis'
    ) {
      return 'si-engine-report';
    }
    if (
      project.id === 'proj-predictive-maintenance-ieom' ||
      project.slug === 'hybrid-ml-predictive-maintenance-smart-manufacturing'
    ) {
      return 'predictive-maintenance-report';
    }
    if (project.liveDemoSimulationId && project.liveDemoSimulationId !== 'none') {
      return project.liveDemoSimulationId;
    }
    return 'none';
  })();

  const pts = project.simulationMetrics?.dataPoints || [];
  const activePoint =
    hoveredPointIndex !== null && pts[hoveredPointIndex]
      ? pts[hoveredPointIndex]
      : pts.length > 0
      ? pts[pts.length - 1]
      : null;

  // SVG scientific plot geometry
  const svgW = 680;
  const svgH = 270;
  const padL = 56;
  const padR = 28;
  const padT = 24;
  const padB = 42;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const xValues = pts.map((p) => p.x);
  const allYValues = pts.flatMap((p) =>
    [p.theoretical, p.empirical, p.baseline].filter((v): v is number => typeof v === 'number')
  );

  const minX = xValues.length ? Math.min(...xValues) : 0;
  const maxX = xValues.length ? Math.max(...xValues) : 1;
  const minY = allYValues.length ? Math.min(...allYValues) * 0.92 : 0;
  const maxY = allYValues.length ? Math.max(...allYValues) * 1.05 : 1;

  const toSvgX = (x: number) =>
    padL + ((x - minX) / (maxX - minX || 1)) * plotW;
  const toSvgY = (y: number) =>
    padT + plotH - ((y - minY) / (maxY - minY || 1)) * plotH;

  const buildPolyline = (getter: (p: typeof pts[0]) => number | undefined) => {
    return pts
      .map((p) => {
        const val = getter(p);
        if (typeof val !== 'number') return null;
        return `${toSvgX(p.x).toFixed(1)},${toSvgY(val).toFixed(1)}`;
      })
      .filter(Boolean)
      .join(' ');
  };

  const theoreticalLine = buildPolyline((p) => p.theoretical);
  const empiricalLine = buildPolyline((p) => p.empirical);
  const baselineLine = buildPolyline((p) => p.baseline);

  const otherProjects = allProjects.filter(
    (p) => p.id !== project.id && p.status === 'Published'
  );

  return (
    <article className="max-w-[1200px] mx-auto px-6 py-10">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to All Research Projects
        </button>

        <div className="flex flex-wrap items-center gap-3">
          {project.paperUrl && (
            <a
              href={project.paperUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5" />
              View Paper / Report
              <ExternalLink className="w-3 h-3 text-slate-300" />
            </a>
          )}

          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <GitBranch className="w-3.5 h-3.5" />
              Repository &amp; Code
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          )}

          <button
            type="button"
            onClick={() => onEditProjectInCms(project.id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Project in CMS
          </button>
        </div>
      </div>

      {/* Monograph Header */}
      <header className="mt-8 pb-8 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 mb-3">
          <span className="text-blue-700 font-semibold">{project.category}</span>
          <span aria-hidden="true">·</span>
          <span>{project.period}</span>
          <span aria-hidden="true">·</span>
          <span>{project.role}</span>
          <span aria-hidden="true">·</span>
          <span>{project.laboratoryOrInstitution}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 leading-tight max-w-4xl">
          {project.title}
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
          {project.executiveSummary}
        </p>
      </header>

      {/* Primary Hero Figure & Critical Findings Summary */}
      <section className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div
          className={`${
            showKeyFindings ? 'lg:col-span-8' : 'lg:col-span-12'
          } bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between`}
        >
          <div className="relative">
            <ResilientImage
              src={project.heroImage}
              alt={project.title}
              className="w-full h-[340px] sm:h-[400px] object-cover"
            />
            {project.heroImage && (
              <button
                type="button"
                onClick={() =>
                  setLightboxImage({
                    url: project.heroImage,
                    caption: project.galleryImages[0]?.caption || project.title,
                  })
                }
                className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900/80 text-white rounded-md hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Inspect Figure
              </button>
            )}
          </div>
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 font-mono">
            {project.galleryImages[0]?.caption || project.title}
          </div>
        </div>

        {/* Critical Findings & Technical Stack */}
        {showKeyFindings && (
          <div className="lg:col-span-4 flex flex-col justify-between bg-white border border-slate-200 rounded-xl p-6">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-slate-500">
                Critical Findings &amp; Key Metrics
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Core quantitative parameters and validation benchmarks.
              </p>

              <div className="mt-5 divide-y divide-slate-200">
                {project.simulationMetrics.keyFindings.map((kf, index) => (
                  <div key={index} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="text-xs text-slate-500">{kf.label}</div>
                    <div className="mt-1 flex items-baseline justify-between gap-2">
                      <div>
                        <span className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
                          {kf.value}
                        </span>
                        <span className="text-xs font-mono text-slate-500 ml-1.5">
                          {kf.unit}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-blue-700">
                        {kf.comparison}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-slate-200">
              <div className="text-xs font-mono text-slate-500 mb-2">
                Tools, Frameworks &amp; Engineering Stack
              </div>
              <div className="text-xs text-slate-700 leading-relaxed">
                {project.hardwareAndSoftwareStack.join(' · ')}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Problem Solved, Methodology & Critical Results */}
      {showNarrativeBreakdown && (
        <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-y border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-2.5">
              01. Problem Addressed &amp; Motivation
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {project.problemStatement}
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-2.5">
              02. Methodology, Architecture &amp; Tools
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {project.methodologyArchitecture}
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-2.5">
              03. Results, Evaluation &amp; Impact
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {project.experimentalValidation}
            </p>
          </div>
        </section>
      )}

      {/* Mathematical Formulation & Governing Equations */}
      {showEquations && project.equations.length > 0 && (
        <section className="mt-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Mathematical Formulation &amp; Governing Equations
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Analytical dynamics, sparse regression objectives, and physical governing laws.
            </p>
          </div>

          <div className="space-y-6">
            {project.equations.map((eq, idx) => (
              <div
                key={eq.id || idx}
                className="bg-white border border-slate-200 rounded-xl p-6"
              >
                <div className="flex items-center justify-between gap-4 pb-3 mb-4 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {eq.title}
                  </h3>
                  <span className="text-xs font-mono text-slate-400 shrink-0">
                    (Eq. {idx + 1})
                  </span>
                </div>

                <div className="py-3 px-4 bg-[#FAFAFA] border border-slate-200/80 rounded-lg overflow-x-auto">
                  <MathEquation latex={eq.latex} block />
                </div>

                <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                  {eq.explanation}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* System Block Diagram */}
      {showSystemDiagram && project.systemArchitecture.nodes.length > 0 && (
        <section className="mt-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              System Architecture &amp; Computational Pipeline
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {project.systemArchitecture.title}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 bg-engineering-grid">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
              {project.systemArchitecture.nodes.map((node, index) => (
                <div
                  key={node.id || index}
                  className="bg-white border border-slate-300 rounded-lg p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                      <span>STAGE 0{index + 1}</span>
                      {index < project.systemArchitecture.nodes.length - 1 && (
                        <span className="text-blue-600 font-bold">→</span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {node.label}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {node.sublabel}
                    </div>
                  </div>

                  {node.mathLatex && (
                    <div className="mt-4 pt-3 border-t border-slate-100 overflow-x-auto">
                      <MathEquation latex={node.mathLatex} className="text-xs" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {project.systemArchitecture.feedbackLoopDescription && (
              <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-600">
                <span>
                  ↺ Iterative Feedback Loop: {project.systemArchitecture.feedbackLoopDescription}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Interactive Scientific Graph */}
      {showPerformanceGraph && pts.length > 0 && (
        <section className="mt-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Quantitative Performance &amp; Comparative Graphs
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {project.simulationMetrics.chartTitle} — Hover over data points to inspect values.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-200">
              <div className="flex flex-wrap items-center gap-6 text-xs">
                <span className="inline-flex items-center gap-2 font-medium text-slate-900">
                  <span className="w-5 h-0.5 bg-blue-600 inline-block" />
                  {project.simulationMetrics.empiricalLabel}
                </span>
                <span className="inline-flex items-center gap-2 font-medium text-slate-700">
                  <span className="w-5 h-0.5 bg-slate-900 inline-block" />
                  {project.simulationMetrics.theoreticalLabel}
                </span>
                {project.simulationMetrics.baselineLabel && (
                  <span className="inline-flex items-center gap-2 font-medium text-slate-500">
                    <span className="w-5 h-0.5 border-b-2 border-dashed border-slate-400 inline-block" />
                    {project.simulationMetrics.baselineLabel}
                  </span>
                )}
              </div>

              {activePoint && (
                <div className="text-xs font-mono text-slate-700 bg-slate-100 px-3 py-1.5 rounded-md tabular-nums">
                  x = {activePoint.x} · Model = {activePoint.empirical} · Ref ={' '}
                  {activePoint.theoretical}
                  {typeof activePoint.baseline === 'number' &&
                    ` · Baseline = ${activePoint.baseline}`}
                </div>
              )}
            </div>

            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${svgW} ${svgH}`}
                className="w-full h-auto max-h-[320px] select-none"
              >
                {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
                  const yVal = minY + frac * (maxY - minY);
                  const py = toSvgY(yVal);
                  return (
                    <g key={idx}>
                      <line
                        x1={padL}
                        y1={py}
                        x2={svgW - padR}
                        y2={py}
                        stroke="#e2e8f0"
                        strokeWidth="1"
                      />
                      <text
                        x={padL - 8}
                        y={py + 4}
                        textAnchor="end"
                        className="fill-slate-400 text-[10px] font-mono"
                      >
                        {yVal.toFixed(2)}
                      </text>
                    </g>
                  );
                })}

                {pts.map((pt, idx) => {
                  const px = toSvgX(pt.x);
                  return (
                    <g key={idx}>
                      <line
                        x1={px}
                        y1={padT}
                        x2={px}
                        y2={svgH - padB}
                        stroke="#f1f5f9"
                        strokeWidth="1"
                      />
                      <text
                        x={px}
                        y={svgH - padB + 16}
                        textAnchor="middle"
                        className="fill-slate-500 text-[10px] font-mono"
                      >
                        {pt.x}
                      </text>
                    </g>
                  );
                })}

                <text
                  x={padL + plotW / 2}
                  y={svgH - 6}
                  textAnchor="middle"
                  className="fill-slate-600 text-[11px] font-mono"
                >
                  {project.simulationMetrics.xAxisLabel}
                </text>

                {baselineLine && (
                  <polyline
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="5,4"
                    points={baselineLine}
                  />
                )}

                {theoreticalLine && (
                  <polyline
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth="2"
                    points={theoreticalLine}
                  />
                )}

                {empiricalLine && (
                  <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    points={empiricalLine}
                  />
                )}

                {pts.map((pt, idx) => {
                  const px = toSvgX(pt.x);
                  const pyEmp = toSvgY(pt.empirical);
                  const isHovered = hoveredPointIndex === idx;
                  return (
                    <g
                      key={idx}
                      onMouseEnter={() => setHoveredPointIndex(idx)}
                      className="cursor-pointer"
                    >
                      {isHovered && (
                        <line
                          x1={px}
                          y1={padT}
                          x2={px}
                          y2={svgH - padB}
                          stroke="#2563eb"
                          strokeWidth="1"
                          strokeDasharray="3,3"
                        />
                      )}
                      <circle
                        cx={px}
                        cy={pyEmp}
                        r={isHovered ? 5.5 : 3.5}
                        fill="#2563eb"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </section>
      )}

      {/* Configurable Interactive Report / Simulation Module */}
      {resolvedInteractiveType === 'sindy-rl-report' && (
        <section className="mt-12 pt-10 border-t border-slate-200">
          <SindyRlInteractiveReport
            showSimulator={showReportSimulator}
            showCharts={showReportCharts}
            showDiagnosticsOrTables={showReportDiagnosticsOrTables}
          />
        </section>
      )}

      {resolvedInteractiveType === 'si-engine-report' && (
        <section className="mt-12 pt-10 border-t border-slate-200">
          <SiEngineInteractiveReport
            showSimulator={showReportSimulator}
            showCharts={showReportCharts}
            showDiagnosticsOrTables={showReportDiagnosticsOrTables}
          />
        </section>
      )}

      {resolvedInteractiveType === 'predictive-maintenance-report' && (
        <section className="mt-12 pt-10 border-t border-slate-200">
          <PredictiveMaintenanceInteractiveReport
            showSimulator={showReportSimulator}
            showCharts={showReportCharts}
            showDiagnosticsOrTables={showReportDiagnosticsOrTables}
          />
        </section>
      )}

      {(resolvedInteractiveType === 'sindy-rl-cartpole' ||
        resolvedInteractiveType === 'si-engine-heat-transfer' ||
        resolvedInteractiveType === 'grid-digital-twin') && (
        <section className="mt-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Interactive Simulation &amp; Dynamical Visualization
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Explore the mathematical model and adjust system parameters in real time.
            </p>
          </div>

          <InteractiveSimulationsLab
            initialMode={resolvedInteractiveType as SimulationMode}
            compactHeader
            singleModeOnly
          />
        </section>
      )}

      {/* Optional Video Embed */}
      {project.videoEmbedUrl && (
        <section className="mt-12">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-blue-600" />
              Video Demonstration
            </h2>
          </div>
          <div className="bg-slate-950 border border-slate-200 rounded-xl overflow-hidden aspect-video">
            <iframe
              src={project.videoEmbedUrl}
              title={project.title}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {/* Other Projects Navigation */}
      {otherProjects.length > 0 && (
        <section className="mt-16 pt-10 border-t border-slate-200">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Other Research &amp; Engineering Projects by Sk Humain Ahmed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {otherProjects.map((op) => (
              <div
                key={op.id}
                onClick={() => onSelectProject(op.slug)}
                className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-mono text-slate-500 mb-1.5">
                    {op.category} · {op.period}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {op.title}
                  </h3>
                </div>
                <div className="mt-4 text-xs font-medium text-blue-700">
                  Explore Technical Details →
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-6"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="max-w-4xl w-full bg-white rounded-xl overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
              <span className="text-xs font-mono text-slate-600 truncate">
                {lightboxImage.caption}
              </span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1 text-slate-500 hover:text-slate-900 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-900 flex items-center justify-center">
              <ResilientImage
                src={lightboxImage.url}
                alt={lightboxImage.caption}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
