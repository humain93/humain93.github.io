/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  FileText,
  GitBranch,
  Mail,
  MapPin,
  Phone,
  Sliders,
  Terminal,
} from 'lucide-react';
import { PortfolioProvider, usePortfolio } from './context/PortfolioContext';
import { ResearchCategory, SimulationMode } from './types/portfolio';
import { MathEquation } from './components/MathEquation';
import { ResilientImage } from './components/ResilientImage';
import { InteractiveSimulationsLab } from './components/InteractiveSimulationsLab';
import { ProjectDetailView } from './components/ProjectDetailView';
import { AdminCmsDashboard } from './components/AdminCmsDashboard';

function PortfolioMainContent() {
  const { data } = usePortfolio();

  const [viewMode, setViewMode] = useState<'home' | 'project-detail' | 'cms'>('home');
  const [activeProjectSlug, setActiveProjectSlug] = useState<string | null>(null);
  const [cmsEditProjectId, setCmsEditProjectId] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<'All' | ResearchCategory>('All');
  const [expandedBibtexId, setExpandedBibtexId] = useState<string | null>(null);
  const [copiedBibtexId, setCopiedBibtexId] = useState<string | null>(null);
  const [activeLabSim, setActiveLabSim] = useState<SimulationMode>('sindy-rl-cartpole');
  const [showInlineCvPdf, setShowInlineCvPdf] = useState<boolean>(false);

  const sec = data.sectionControls || {
    showHeroPillarsStrip: true,
    showAboutSection: true,
    aboutSectionTitle: 'About Sk Humain Ahmed',
    showResearchInterestsSection: true,
    researchInterestsTitle: 'Research Interests',
    researchInterestsSubtitle:
      'Combining sparse system identification, physics-informed machine learning, and reinforcement learning for dynamical and cyber-physical systems.',
    showProjectsSection: true,
    projectsSectionTitle: 'Research & Engineering Projects Showcase',
    projectsSectionSubtitle:
      'Click any project below to view its dedicated technical page featuring problem formulation, methodology, governing equations, system block diagrams, performance graphs, and interactive simulations.',
    showCategoryFilterBar: true,
    showSimulationsSection: true,
    showPublicationsSection: true,
    publicationsSectionTitle: 'Publications & Presentations',
    showEducationSection: true,
    showCertificationsSection: true,
    showExperienceSection: true,
    showSkillsSection: true,
    showCvDownloadSection: true,
  };

  const simCfg = data.simulationsConfig || {
    enabled: true,
    sectionKicker: '04. Live Mathematical & Physical Simulations of My Research Works',
    sectionTitle: 'Interactive Scientific Demonstrations & Visualizations',
    sectionDescription:
      'Interact directly with the numerical models behind my SINDy-RL CartPole Swing-Up, SI Engine Heat Transfer Thesis, and Utility Grid Digital Twin projects.',
    modules: [
      {
        id: 'sindy-rl-cartpole' as const,
        enabled: true,
        tabLabel: 'SINDy-RL CartPole',
        title:
          '01. SINDy-RL Cart-Pole: 14-Term Learned Dynamics (Update 39, Δt = 0.01 s) + Ray RLlib PPO',
        governingEquationLatex:
          '\\mathbf{x}_{k+1} = \\boldsymbol{\\Theta}(\\mathbf{x}_k, u_k)\\boldsymbol{\\Xi}, \\quad \\pi_{\\boldsymbol{\\phi}}(u_k | \\mathbf{x}_k)',
      },
      {
        id: 'si-engine-heat-transfer' as const,
        enabled: true,
        tabLabel: 'SI Engine Heat Transfer',
        title:
          '02. Two-Zone SI Engine Heat Transfer (ICMIEE-PI-160369: Annand, Woschni, Mod. Woschni, Hohenberg, Han)',
        governingEquationLatex:
          'h_g(\\theta) = 3.26 B^{-0.2} P(\\theta)^{0.8} T_g(\\theta)^{-0.53} w(\\theta)^{0.8}',
      },
      {
        id: 'grid-digital-twin' as const,
        enabled: true,
        tabLabel: 'Digital Twin & Sensor ML',
        title:
          '03. NESCO 2M-Meter Digital Twin & Hybrid RF-ANN Predictive Maintenance (IEOM 2026, 84.5% Accuracy)',
        governingEquationLatex:
          'V_j^2 = V_i^2 - 2(r_{ij}P_{ij} + x_{ij}Q_{ij}) + (r_{ij}^2 + x_{ij}^2)\\ell_{ij}',
      },
    ],
  };

  const enabledSimModules = useMemo(
    () => simCfg.modules.filter((m) => m.enabled),
    [simCfg.modules]
  );

  const isSimulationsSectionVisible =
    sec.showSimulationsSection !== false &&
    simCfg.enabled !== false &&
    enabledSimModules.length > 0;

  const publishedProjects = useMemo(
    () => data.projects.filter((p) => p.status === 'Published'),
    [data.projects]
  );

  // Dynamic project categories: combines user-configured categories + any category used by published projects
  const availableCategories = useMemo(() => {
    const base =
      data.projectCategories && data.projectCategories.length > 0
        ? data.projectCategories
        : [
            'Nonlinear Dynamics & RL',
            'Thermo-Fluid & Combustion Modeling',
            'Cyber-Physical & Smart Grid Systems',
            'Physics-Informed ML & Sensing',
          ];
    const set = new Set<string>(base.filter(Boolean));
    publishedProjects.forEach((p) => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set);
  }, [data.projectCategories, publishedProjects]);

  const effectiveSelectedCategory =
    selectedCategory === 'All' || availableCategories.includes(selectedCategory)
      ? selectedCategory
      : 'All';

  const filteredProjects = useMemo(() => {
    if (effectiveSelectedCategory === 'All') return publishedProjects;
    return publishedProjects.filter((p) => p.category === effectiveSelectedCategory);
  }, [publishedProjects, effectiveSelectedCategory]);

  const currentDetailProject = useMemo(() => {
    if (!activeProjectSlug) return null;
    return data.projects.find((p) => p.slug === activeProjectSlug) || null;
  }, [data.projects, activeProjectSlug]);

  const openProjectDetail = (slug: string) => {
    setActiveProjectSlug(slug);
    setViewMode('project-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openCmsForProject = (projectId: string | null = null) => {
    setCmsEditProjectId(projectId);
    setViewMode('cms');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyBibtex = (id: string, bibtex: string) => {
    navigator.clipboard.writeText(bibtex);
    setCopiedBibtexId(id);
    setTimeout(() => setCopiedBibtexId(null), 2500);
  };

  const activeCvUrl =
    data.cv.uploadedPdfDataUrl ||
    data.cv.externalPdfUrl ||
    '/assets/aistudio/CV_Gemini_870e22d1.pdf';

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900">
      {/* Top Bar Contract: Strictly 1 row, 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-8 px-6 py-4">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setViewMode('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            {data.profile.fullName}
          </a>

          {/* Zone 2: Dynamic navigation links based on enabled sections */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {sec.showResearchInterestsSection !== false && (
              <a
                href="#research"
                onClick={() => setViewMode('home')}
                className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Research
              </a>
            )}
            {sec.showProjectsSection !== false && (
              <a
                href="#projects"
                onClick={() => setViewMode('home')}
                className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Projects
              </a>
            )}
            {isSimulationsSectionVisible && (
              <a
                href="#simulations"
                onClick={() => setViewMode('home')}
                className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Simulations
              </a>
            )}
            {sec.showPublicationsSection !== false && (
              <a
                href="#publications"
                onClick={() => setViewMode('home')}
                className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Publications
              </a>
            )}
            {(sec.showEducationSection !== false ||
              sec.showExperienceSection !== false ||
              sec.showSkillsSection !== false ||
              sec.showCvDownloadSection !== false) && (
              <a
                href="#cv"
                onClick={() => setViewMode('home')}
                className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                CV &amp; Background
              </a>
            )}
          </nav>

          {/* Zone 3: 1 primary action button */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => {
                if (viewMode === 'cms') {
                  setViewMode('home');
                } else {
                  openCmsForProject(null);
                }
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {viewMode === 'cms' ? 'Exit Admin CMS' : 'Admin CMS'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {viewMode === 'cms' && (
          <AdminCmsDashboard
            initialEditProjectId={cmsEditProjectId}
            onExitCms={() => setViewMode('home')}
            onPreviewProject={(slug) => openProjectDetail(slug)}
          />
        )}

        {viewMode === 'project-detail' && currentDetailProject && (
          <ProjectDetailView
            project={currentDetailProject}
            onBack={() => setViewMode('home')}
            onEditProjectInCms={(id) => openCmsForProject(id)}
            allProjects={data.projects}
            onSelectProject={(slug) => openProjectDetail(slug)}
          />
        )}

        {viewMode === 'home' && (
          <div>
            {/* SECTION 1: SPLIT-SCREEN HERO & QUANTITATIVE RESEARCH PILLARS */}
            <section className="max-w-[1280px] mx-auto px-6 pt-10 pb-14">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
                {/* Left Column: Researcher Identity & Mission */}
                <div className="lg:col-span-7 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-mono text-blue-700 mb-3">
                      {data.profile.applicationCycleNotice}
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-bold tracking-tight text-slate-900 leading-[1.15]">
                      {data.profile.heroHeadline}
                    </h1>

                    <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                      {data.profile.heroLeadParagraph}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-slate-600">
                      <span className="font-semibold text-slate-900">
                        {data.profile.fullName}
                      </span>
                      <span>·</span>
                      <span>B.Sc. in Mechanical Engineering (BUET)</span>
                      <span>·</span>
                      <span>Executive Engineer, Northern Electricity Supply PLC</span>
                    </div>
                  </div>

                  {/* Primary Action Group */}
                  <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-3">
                    {sec.showProjectsSection !== false && (
                      <a
                        href="#projects"
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Explore Project Monographs
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {isSimulationsSectionVisible && (
                      <a
                        href="#simulations"
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Sliders className="w-3.5 h-3.5 text-blue-600" />
                        Interactive Simulations
                      </a>
                    )}

                    <a
                      href={activeCvUrl}
                      download={data.cv.fileName || 'Sk_Humain_Ahmed_CV.pdf'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-700 hover:text-slate-900 whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      Download CV (PDF)
                    </a>
                  </div>
                </div>

                {/* Right Column: Featured SINDy-RL Visual & Equation */}
                <div className="lg:col-span-5 flex flex-col">
                  <div
                    onClick={() =>
                      openProjectDetail('sindy-rl-model-based-reinforcement-learning')
                    }
                    className="relative flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between min-h-[320px] cursor-pointer group"
                  >
                    <ResilientImage
                      src={data.profile.heroImage}
                      alt="SINDy-RL CartPole Swing-Up Nonlinear Dynamical System Analysis"
                      className="w-full h-full object-cover flex-1 group-hover:scale-[1.01] transition-transform duration-200"
                    />
                    <div className="p-4 bg-slate-900 text-slate-200 border-t border-slate-800">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>Featured Work · SINDy-RL CartPole Swing-Up</span>
                        <span className="text-blue-300 group-hover:underline">
                          Inspect Monograph →
                        </span>
                      </div>
                      <div className="mt-1 text-xs font-mono text-white overflow-x-auto">
                        <MathEquation
                          latex="\mathbf{x}_{k+1} = \boldsymbol{\Theta}(\mathbf{x}_k, u_k)\boldsymbol{\Xi}, \quad u_k \sim \pi_{\boldsymbol{\phi}}(\cdot \mid \mathbf{x}_k)"
                          className="text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full-Width Research Pillars Strip Below Hero Split */}
              {sec.showHeroPillarsStrip !== false && data.researchInterests.length > 0 && (
                <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                  {data.researchInterests.map((ri) => (
                    <a
                      key={ri.id}
                      href="#research"
                      className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col justify-between group"
                    >
                      <div>
                        <div className="text-xs font-mono text-blue-700 font-semibold">
                          Domain {ri.index}
                        </div>
                        <div className="mt-1 text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {ri.title}
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-slate-500 line-clamp-2">
                        {ri.subtitle}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </section>

            {/* SECTION 2: ABOUT ME & BIOGRAPHY */}
            {sec.showAboutSection !== false && (
            <section id="about" className="py-16 bg-white border-y border-slate-200">
              <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 space-y-6">
                  <div>
                    <div className="text-xs font-mono text-slate-500">
                      01. Researcher Profile &amp; Credentials
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mt-1">
                      {sec.aboutSectionTitle || `About ${data.profile.fullName}`}
                    </h2>
                  </div>

                  <div className="p-5 bg-[#FAFAFA] border border-slate-200 rounded-xl space-y-3">
                    <div className="text-xs font-mono uppercase tracking-wider text-slate-500">
                      Doctoral Research Vision
                    </div>
                    <p className="text-sm font-serif-editorial italic text-slate-800 leading-relaxed">
                      “{data.profile.researchVisionStatement}”
                    </p>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-700 font-mono">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <a
                        href={`mailto:${data.profile.email}`}
                        className="text-blue-700 hover:underline"
                      >
                        {data.profile.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>+880-1756734776</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Rajshahi, Bangladesh</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs font-mono">
                    <div className="text-slate-500">Academic &amp; Test Metrics</div>
                    <div className="text-slate-900 font-semibold">
                      BUET B.Sc. ME · CGPA: 3.47/4.00
                    </div>
                    <div className="text-slate-700">
                      Senior Year Trend: L4/T1: 3.71 · L4/T2: 3.96
                    </div>
                    <div className="text-blue-700">
                      GRE: 311 (Q: 160, V: 151, AWA: 3.5) · TOEFL: 97
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8 space-y-5">
                  {data.profile.aboutBiography.map((paragraph, index) => (
                    <p
                      key={index}
                      className="text-base text-slate-700 leading-relaxed"
                    >
                      {paragraph}
                    </p>
                  ))}

                  <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-mono text-slate-500">
                        Target Doctoral Programs
                      </div>
                      <div className="text-sm font-semibold text-slate-900 mt-0.5">
                        {data.profile.targetDepartments}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openCmsForProject(null)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Biography in CMS
                    </button>
                  </div>
                </div>
              </div>
            </section>
            )}

            {/* SECTION 3: RESEARCH INTERESTS & MATHEMATICAL FORMULATIONS */}
            {sec.showResearchInterestsSection !== false && data.researchInterests.length > 0 && (
            <section id="research" className="py-16 max-w-[1280px] mx-auto px-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                <div>
                  <div className="text-xs font-mono text-slate-500">
                    02. Theoretical Foundations &amp; Research Directions
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                    {sec.researchInterestsTitle || 'Research Interests'}
                  </h2>
                </div>
                <p className="text-sm text-slate-600 max-w-md">
                  {sec.researchInterestsSubtitle ||
                    'Combining sparse system identification, physics-informed machine learning, and reinforcement learning for dynamical and cyber-physical systems.'}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.researchInterests.map((pillar) => (
                  <div
                    key={pillar.id}
                    className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-xs font-mono text-blue-700 font-semibold">
                        {pillar.index}. {pillar.subtitle}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mt-1.5">
                        {pillar.title}
                      </h3>
                      <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                        {pillar.description}
                      </p>

                      {pillar.coreEquationLatex && (
                        <div className="mt-5 p-4 bg-[#FAFAFA] border border-slate-200 rounded-lg overflow-x-auto">
                          <div className="text-[11px] font-mono text-slate-400 mb-1">
                            {pillar.coreEquationCaption}
                          </div>
                          <MathEquation latex={pillar.coreEquationLatex} block />
                        </div>
                      )}
                    </div>

                    {pillar.keyTopics.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-slate-100 text-xs font-mono text-slate-600 leading-relaxed">
                        <span className="text-slate-400 mr-1.5">Key Focus:</span>
                        {pillar.keyTopics.join(' · ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
            )}

            {/* SECTION 4: DETAILED ENGINEERING & RESEARCH PROJECTS SHOWCASE */}
            {sec.showProjectsSection !== false && (
            <section
              id="projects"
              className="py-16 bg-white border-y border-slate-200"
            >
              <div className="max-w-[1280px] mx-auto px-6">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
                  <div>
                    <div className="text-xs font-mono text-slate-500">
                      03. Technical Monographs · Problems Solved, Methodology, Equations &amp; Results
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                      {sec.projectsSectionTitle ||
                        'Research & Engineering Projects Showcase'}
                    </h2>
                    <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
                      {sec.projectsSectionSubtitle ||
                        'Click any project below to view its dedicated technical page featuring problem formulation, methodology, governing equations, system block diagrams, performance graphs, and interactive simulations.'}
                    </p>
                  </div>

                  {/* Dynamic Category Filter Segmented Control */}
                  {sec.showCategoryFilterBar !== false &&
                    availableCategories.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg self-start lg:self-auto">
                        {(['All', ...availableCategories] as const).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                              effectiveSelectedCategory === cat
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {cat === 'All' ? 'All Projects' : cat}
                          </button>
                        ))}
                      </div>
                    )}
                </div>

                {/* Detailed Project Cards */}
                <div className="space-y-10">
                  {filteredProjects.map((project, index) => (
                    <div
                      key={project.id}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch shadow-2xs"
                    >
                      {/* Left Visual & Quick Action Column */}
                      <div
                        onClick={() => openProjectDetail(project.slug)}
                        className="lg:col-span-5 relative cursor-pointer group overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-900 flex flex-col justify-between"
                      >
                        <ResilientImage
                          src={project.heroImage}
                          alt={project.title}
                          className="w-full h-64 lg:h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                        />
                        <div className="p-4 bg-slate-900/95 text-slate-200 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                          <span>
                            Project 0{index + 1} · {project.period}
                          </span>
                          <span className="text-blue-300 group-hover:underline">
                            Open Full Monograph, Graphs &amp; Math →
                          </span>
                        </div>
                      </div>

                      {/* Right Structured Breakdown: Problem, Methodology, Equation & Critical Findings */}
                      <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
                        <div>
                          {/* Unboxed Metadata */}
                          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500">
                            <span className="text-blue-700 font-semibold">
                              {project.category}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{project.role}</span>
                            <span aria-hidden="true">·</span>
                            <span>{project.laboratoryOrInstitution}</span>
                          </div>

                          <h3
                            onClick={() => openProjectDetail(project.slug)}
                            className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 hover:text-blue-700 transition-colors cursor-pointer leading-snug"
                          >
                            {project.title}
                          </h3>

                          <p className="mt-3 text-sm text-slate-700 leading-relaxed">
                            {project.executiveSummary}
                          </p>

                          {/* Structured Problem & Methodology Mini-Grid */}
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                            <div>
                              <div className="text-xs font-semibold text-slate-900 mb-1">
                                Problem Addressed
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                                {project.problemStatement}
                              </p>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-900 mb-1">
                                Methodology &amp; Results
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                                {project.experimentalValidation ||
                                  project.methodologyArchitecture}
                              </p>
                            </div>
                          </div>

                          {/* Primary Governing Equation Preview */}
                          {project.equations[0] && (
                            <div className="mt-4 p-3.5 bg-[#FAFAFA] border border-slate-200 rounded-lg overflow-x-auto">
                              <div className="text-[11px] font-mono text-slate-400 mb-1">
                                Mathematical Formulation ({project.equations[0].title}):
                              </div>
                              <MathEquation
                                latex={project.equations[0].latex}
                                className="text-xs"
                              />
                            </div>
                          )}

                          {/* 4 Quantitative Critical Findings */}
                          {project.simulationMetrics.keyFindings.length > 0 && (
                            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
                              {project.simulationMetrics.keyFindings.map((kf, i) => (
                                <div key={i}>
                                  <div className="text-[11px] text-slate-500 truncate">
                                    {kf.label}
                                  </div>
                                  <div className="mt-0.5 flex items-baseline">
                                    <span className="text-base font-mono font-bold text-slate-900 tabular-nums">
                                      {kf.value}
                                    </span>
                                    <span className="text-[11px] font-mono text-slate-500 ml-1">
                                      {kf.unit}
                                    </span>
                                  </div>
                                  <div className="text-[10px] font-mono text-blue-700 truncate">
                                    {kf.comparison}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Footer Tools & Actions */}
                        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                          <div className="text-xs font-mono text-slate-500">
                            <span className="text-slate-800 font-semibold">Stack: </span>
                            {project.hardwareAndSoftwareStack.join(' · ')}
                          </div>

                          <div className="flex items-center gap-2.5">
                            {isSimulationsSectionVisible &&
                              project.liveDemoSimulationId &&
                              project.liveDemoSimulationId !== 'none' &&
                              enabledSimModules.some(
                                (m) => m.id === project.liveDemoSimulationId
                              ) && (
                                <a
                                  href="#simulations"
                                  onClick={() =>
                                    setActiveLabSim(
                                      project.liveDemoSimulationId as SimulationMode
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap"
                                >
                                  <Sliders className="w-3.5 h-3.5" />
                                  Interactive Sim
                                </a>
                              )}

                            <button
                              type="button"
                              onClick={() => openProjectDetail(project.slug)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                            >
                              Full Technical Page &amp; Graphs
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            )}

            {/* SECTION 5: INTERACTIVE SCIENTIFIC DEMONSTRATIONS & SIMULATIONS */}
            {isSimulationsSectionVisible && (
              <section id="simulations" className="py-16 max-w-[1280px] mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                  <div>
                    <div className="text-xs font-mono text-slate-500">
                      {simCfg.sectionKicker}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                      {simCfg.sectionTitle}
                    </h2>
                  </div>
                  <p className="text-sm text-slate-600 max-w-md">
                    {simCfg.sectionDescription}
                  </p>
                </div>

                <InteractiveSimulationsLab
                  initialMode={activeLabSim}
                  modulesConfig={simCfg.modules}
                />
              </section>
            )}

            {/* SECTION 6: PUBLICATIONS & CONFERENCE PRESENTATIONS */}
            {sec.showPublicationsSection !== false && data.publications.length > 0 && (
            <section
              id="publications"
              className="py-16 bg-white border-y border-slate-200"
            >
              <div className="max-w-[1280px] mx-auto px-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
                  <div>
                    <div className="text-xs font-mono text-slate-500">
                      05. Peer-Reviewed Conference Proceedings &amp; Presentations
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                      {sec.publicationsSectionTitle || 'Publications & Presentations'}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => openCmsForProject(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 cursor-pointer whitespace-nowrap"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Manage Publications in CMS
                  </button>
                </div>

                <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
                  {data.publications.map((pub, index) => (
                    <div key={pub.id} className="py-6 flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500">
                        <span className="font-semibold text-slate-900">
                          [{index + 1}]
                        </span>
                        <span>{pub.year}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-blue-700 font-medium">
                          {pub.researchDomain}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        {pub.title}
                      </h3>

                      <div className="text-sm font-medium text-slate-800">
                        {pub.authors}
                      </div>

                      <div className="text-xs font-serif-editorial italic text-slate-600">
                        {pub.venue}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
                        {pub.abstract}
                      </p>

                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedBibtexId(
                              expandedBibtexId === pub.id ? null : pub.id
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                        >
                          <Terminal className="w-3.5 h-3.5" />
                          {expandedBibtexId === pub.id ? 'Hide BibTeX' : 'BibTeX Citation'}
                        </button>

                        {pub.year === '2026' && (
                          <button
                            type="button"
                            onClick={() =>
                              openProjectDetail(
                                'hybrid-ml-predictive-maintenance-smart-manufacturing'
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                          >
                            View Technical Project Page →
                          </button>
                        )}

                        {pub.year === '2016' && (
                          <button
                            type="button"
                            onClick={() =>
                              openProjectDetail(
                                'heat-transfer-models-si-engine-undergraduate-thesis'
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                          >
                            View Thesis Monograph &amp; Simulation →
                          </button>
                        )}
                      </div>

                      {expandedBibtexId === pub.id && (
                        <div className="mt-2 p-4 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs relative">
                          <button
                            type="button"
                            onClick={() => handleCopyBibtex(pub.id, pub.bibtex)}
                            className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer"
                          >
                            {copiedBibtexId === pub.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy BibTeX
                              </>
                            )}
                          </button>
                          <pre className="overflow-x-auto">{pub.bibtex}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
            )}

            {/* SECTION 7: EDUCATION, PROFESSIONAL EXPERIENCE, SKILLS, CERTIFICATIONS & CV */}
            <section id="cv" className="py-16 max-w-[1280px] mx-auto px-6">
              {(sec.showEducationSection !== false ||
                sec.showCertificationsSection !== false ||
                sec.showExperienceSection !== false) && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  {/* Education & Certifications Column */}
                  {(sec.showEducationSection !== false ||
                    sec.showCertificationsSection !== false) && (
                    <div className="lg:col-span-5 space-y-8">
                      {sec.showEducationSection !== false && (
                        <div>
                          <div className="text-xs font-mono text-slate-500">
                            06. Academic Background
                          </div>
                          <h2 className="text-2xl font-bold text-slate-900 mt-1">
                            Education
                          </h2>

                          <div className="mt-5 space-y-5">
                            {data.education.map((edu) => (
                              <div
                                key={edu.id}
                                className="bg-white border border-slate-200 rounded-xl p-6 space-y-3"
                              >
                                <div className="text-xs font-mono text-slate-500">
                                  {edu.location}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">
                                  {edu.institution}
                                </h3>
                                <div className="text-sm font-semibold text-slate-800">
                                  {edu.degree}
                                </div>
                                <div className="text-xs font-mono text-blue-700 font-semibold">
                                  {edu.gpaOrHonors}
                                </div>
                                {edu.thesisTitle && (
                                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
                                    <span className="font-semibold text-slate-800">
                                      Undergraduate Thesis:
                                    </span>{' '}
                                    {edu.thesisTitle}
                                  </div>
                                )}
                                {edu.coursework && edu.coursework.length > 0 && (
                                  <div className="pt-2 border-t border-slate-100 space-y-1 text-xs font-mono text-slate-600">
                                    <div className="text-slate-400">Standardized Tests:</div>
                                    {edu.coursework.map((test, idx) => (
                                      <div key={idx}>{test}</div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Certifications & International Training */}
                      {sec.showCertificationsSection !== false &&
                        data.cv.awardsAndHonors &&
                        data.cv.awardsAndHonors.length > 0 && (
                          <div>
                            <div className="text-xs font-mono text-slate-500">
                              07. International Specialized Training
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mt-1">
                              Certifications &amp; Training
                            </h2>

                            <div className="mt-4 space-y-4">
                              {data.cv.awardsAndHonors.map((cert, idx) => (
                                <div
                                  key={idx}
                                  className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5"
                                >
                                  <div className="text-xs font-mono text-blue-700 font-semibold">
                                    {cert.organization} · {cert.year}
                                  </div>
                                  <h3 className="text-sm font-bold text-slate-900">
                                    {cert.title}
                                  </h3>
                                  {cert.note && (
                                    <p className="text-xs text-slate-600">{cert.note}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Professional Experience Column */}
                  {sec.showExperienceSection !== false && (
                    <div
                      className={`${
                        sec.showEducationSection !== false ||
                        sec.showCertificationsSection !== false
                          ? 'lg:col-span-7'
                          : 'lg:col-span-12'
                      } space-y-6`}
                    >
                      <div>
                        <div className="text-xs font-mono text-slate-500">
                          08. Engineering, Computational &amp; Academic Appointments
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mt-1">
                          Professional Experience
                        </h2>
                      </div>

                      <div className="space-y-6">
                        {data.experience.map((exp) => (
                          <div
                            key={exp.id}
                            className="bg-white border border-slate-200 rounded-xl p-6 space-y-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-500">
                              <span className="font-semibold text-blue-700">
                                {exp.period}
                              </span>
                              <span>{exp.location}</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">
                              {exp.role}
                            </h3>
                            <div className="text-sm font-medium text-slate-700">
                              {exp.laboratoryOrOrganization}
                            </div>
                            <ul className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600 leading-relaxed list-disc pl-4">
                              {exp.highlights.map((h, i) => (
                                <li key={i}>{h}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Technical Skills Matrix */}
              {sec.showSkillsSection !== false && data.skillGroups.length > 0 && (
                <div className="mt-16 pt-12 border-t border-slate-200">
                  <div className="mb-8">
                    <div className="text-xs font-mono text-slate-500">
                      09. Computational, Modeling &amp; Software Competencies
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mt-1">
                      Technical Skills
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {data.skillGroups.map((group) => (
                      <div
                        key={group.id}
                        className="bg-white border border-slate-200 rounded-xl p-6"
                      >
                        <h3 className="text-base font-bold text-slate-900">
                          {group.category}
                        </h3>
                        {group.description && (
                          <p className="text-xs text-slate-500 mt-1">
                            {group.description}
                          </p>
                        )}
                        <div className="mt-5 divide-y divide-slate-100">
                          {group.skills.map((sk, idx) => (
                            <div key={idx} className="py-3 first:pt-0 last:pb-0">
                              <div className="text-xs font-semibold text-slate-900">
                                {sk.name}
                              </div>
                              {sk.specification && (
                                <div className="text-xs font-mono text-slate-500 mt-0.5">
                                  {sk.specification}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Curriculum Vitae (CV) PDF Banner & Inline Viewer */}
              {sec.showCvDownloadSection !== false && (
                <div className="mt-16 space-y-6">
                  <div className="bg-slate-900 text-white rounded-xl p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="max-w-2xl">
                      <div className="text-xs font-mono text-blue-300">
                        10. Official Curriculum Vitae (PDF) · {data.profile.fullName}
                      </div>
                      <h2 className="text-2xl font-bold mt-1">
                        Curriculum Vitae
                      </h2>
                      <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                        Inspect my complete Curriculum Vitae inline below or download the PDF directly for PhD admission evaluation.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowInlineCvPdf((prev) => !prev)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <BookOpen className="w-4 h-4" />
                        {showInlineCvPdf ? 'Hide Inline CV PDF' : 'View CV PDF Inline'}
                      </button>

                      <a
                        href={activeCvUrl}
                        download={data.cv.fileName || 'Sk_Humain_Ahmed_CV.pdf'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Download className="w-4 h-4" />
                        Download CV PDF
                      </a>

                      <button
                        type="button"
                        onClick={() => openCmsForProject(null)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Update in CMS
                      </button>
                    </div>
                  </div>

                  {showInlineCvPdf && (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden h-[820px]">
                      <iframe
                        src={activeCvUrl}
                        title="Sk Humain Ahmed Curriculum Vitae PDF"
                        className="w-full h-full"
                      />
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 px-6">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} {data.profile.fullName} · {data.profile.email} · +880-1756734776 · Rajshahi, Bangladesh
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => openCmsForProject(null)}
              className="hover:text-slate-900 underline underline-offset-4 cursor-pointer"
            >
              Admin CMS &amp; $0 Hosting Guide
            </button>
            <span>·</span>
            <a href="#top" className="hover:text-slate-900">
              Back to Top ↑
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <PortfolioProvider>
      <PortfolioMainContent />
    </PortfolioProvider>
  );
}
