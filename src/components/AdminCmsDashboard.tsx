import React, { useState, useEffect } from 'react';
import {
  Lock,
  Save,
  Plus,
  Trash2,
  Edit3,
  Upload,
  Download,
  RotateCcw,
  CheckCircle2,
  ArrowLeft,
  Eye,
  Server,
  FileText,
  BookOpen,
  GraduationCap,
  Cpu,
  User,
  Layers,
  GitBranch,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Copy,
  Sliders,
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import {
  PortfolioDatabase,
  ResearchProject,
  ResearchCategory,
  PublicationItem,
  ProjectInteractiveModuleType,
  SimulationsSectionConfig,
  WebsiteSectionControls,
} from '../types/portfolio';
import { MathEquation } from './MathEquation';
import { ResilientImage } from './ResilientImage';
import {
  GitHubSyncConfig,
  GitHubWorkflowStatus,
  loadGitHubSyncConfig,
  saveGitHubSyncConfig,
  clearGitHubSyncCredentials,
  verifyGitHubRepoConnection,
  publishPortfolioToGitHub,
  uploadAssetFileToGitHub,
  fetchLatestWorkflowRun,
  computeGitHubPagesUrl,
  GITHUB_ACTIONS_WORKFLOW_YAML,
} from '../utils/githubPublisher';

interface AdminCmsDashboardProps {
  initialEditProjectId?: string | null;
  onExitCms: () => void;
  onPreviewProject: (slug: string) => void;
}

type CmsTab =
  | 'projects'
  | 'sections-sims'
  | 'profile'
  | 'interests'
  | 'publications'
  | 'cv-edu'
  | 'deployment';

const DEFAULT_CATEGORIES = [
  'Nonlinear Dynamics & RL',
  'Thermo-Fluid & Combustion Modeling',
  'Cyber-Physical & Smart Grid Systems',
  'Physics-Informed ML & Sensing',
];

const DEFAULT_SIMULATIONS_CONFIG: SimulationsSectionConfig = {
  enabled: true,
  sectionKicker: '04. Live Mathematical & Physical Simulations of My Research Works',
  sectionTitle: 'Interactive Scientific Demonstrations & Visualizations',
  sectionDescription:
    'Interact directly with the numerical models behind my SINDy-RL CartPole Swing-Up, SI Engine Heat Transfer Thesis, and Utility Grid Digital Twin projects.',
  modules: [
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
  ],
};

const DEFAULT_SECTION_CONTROLS: WebsiteSectionControls = {
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

export const AdminCmsDashboard: React.FC<AdminCmsDashboardProps> = ({
  initialEditProjectId = null,
  onExitCms,
  onPreviewProject,
}) => {
  const {
    data,
    isSaving,
    lastSavedAt,
    isAdminAuthenticated,
    verifyAdminPasscode,
    logoutAdmin,
    savePortfolioData,
    resetToDefaults,
    exportDatabaseJson,
    importDatabaseJson,
  } = usePortfolio();

  const [passcodeInput, setPasscodeInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<CmsTab>('projects');
  const [draft, setDraft] = useState<PortfolioDatabase>(() =>
    JSON.parse(JSON.stringify(data))
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    initialEditProjectId
  );
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [newCategoryInput, setNewCategoryInput] = useState<string>('');

  // Helpers to safely read/update categories, simulationsConfig, and sectionControls on draft
  const draftCategories: string[] = (() => {
    const base =
      draft.projectCategories && draft.projectCategories.length > 0
        ? draft.projectCategories
        : DEFAULT_CATEGORIES;
    const set = new Set<string>(base.filter(Boolean));
    draft.projects.forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    return Array.from(set);
  })();

  const draftSimConfig: SimulationsSectionConfig =
    draft.simulationsConfig || DEFAULT_SIMULATIONS_CONFIG;

  const draftSectionControls: WebsiteSectionControls = {
    ...DEFAULT_SECTION_CONTROLS,
    ...(draft.sectionControls || {}),
  };

  const handleAddCategory = (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;
    if (draftCategories.includes(trimmed)) {
      setNewCategoryInput('');
      return;
    }
    setDraft((prev) => ({
      ...prev,
      projectCategories: [...draftCategories, trimmed],
    }));
    setNewCategoryInput('');
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
    setDraft((prev) => ({
      ...prev,
      projectCategories: draftCategories.map((c) => (c === oldName ? newName : c)),
      projects: prev.projects.map((p) =>
        p.category === oldName ? { ...p, category: newName } : p
      ),
    }));
  };

  const handleDeleteCategory = (catToDelete: string) => {
    const remaining = draftCategories.filter((c) => c !== catToDelete);
    const fallbackCat = remaining[0] || 'General Research';
    setDraft((prev) => ({
      ...prev,
      projectCategories: remaining.length > 0 ? remaining : [fallbackCat],
      projects: prev.projects.map((p) =>
        p.category === catToDelete ? { ...p, category: fallbackCat } : p
      ),
    }));
  };

  // GitHub Auto-Commit & GitHub Actions Pages Integration State
  const [ghConfig, setGhConfig] = useState<GitHubSyncConfig>(() => loadGitHubSyncConfig());
  const [ghStatusMsg, setGhStatusMsg] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    commitUrl?: string;
    actionsUrl?: string;
    pagesUrl?: string;
  } | null>(null);
  const [isPublishingGitHub, setIsPublishingGitHub] = useState<boolean>(false);
  const [isTestingGitHub, setIsTestingGitHub] = useState<boolean>(false);
  const [commitMessageInput, setCommitMessageInput] = useState<string>(
    'CMS Publish: Updated research portfolio content'
  );
  const [latestWorkflow, setLatestWorkflow] = useState<GitHubWorkflowStatus | null>(null);
  const [copiedWorkflowYaml, setCopiedWorkflowYaml] = useState<boolean>(false);

  const isGitHubConfigured = Boolean(
    ghConfig.owner.trim() && ghConfig.repo.trim() && ghConfig.token.trim()
  );

  const refreshWorkflowStatus = async (cfg = ghConfig) => {
    if (!cfg.owner.trim() || !cfg.repo.trim() || !cfg.token.trim()) return;
    const status = await fetchLatestWorkflowRun(cfg);
    if (status) {
      setLatestWorkflow(status);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated && isGitHubConfigured) {
      refreshWorkflowStatus(ghConfig);
    }
  }, [isAdminAuthenticated]);

  const updateGhConfig = (updater: (prev: GitHubSyncConfig) => GitHubSyncConfig) => {
    setGhConfig((prev) => {
      const next = updater(prev);
      saveGitHubSyncConfig(next);
      return next;
    });
  };

  const handleTestGitHubConnection = async () => {
    setIsTestingGitHub(true);
    setGhStatusMsg({ type: 'info', text: 'Verifying GitHub repository access and write permissions...' });
    const res = await verifyGitHubRepoConnection(ghConfig);
    setIsTestingGitHub(false);
    if (res.ok) {
      setGhStatusMsg({
        type: 'success',
        text: res.message,
        pagesUrl: res.pagesUrl,
      });
      refreshWorkflowStatus(ghConfig);
    } else {
      setGhStatusMsg({
        type: 'error',
        text: res.message,
      });
    }
  };

  const handlePublishToGitHubNow = async (dataToPublish = draft) => {
    if (!isGitHubConfigured) {
      setActiveTab('deployment');
      setGhStatusMsg({
        type: 'info',
        text: 'Enter your GitHub repository & Fine-Grained Personal Access Token below to enable 1-click auto-commit & GitHub Pages deployment.',
      });
      return;
    }

    setIsPublishingGitHub(true);
    setGhStatusMsg({
      type: 'info',
      text: `Committing updated portfolio to ${ghConfig.owner}/${ghConfig.repo}@${ghConfig.branch || 'main'} via GitHub API...`,
    });

    const pubRes = await publishPortfolioToGitHub(
      ghConfig,
      dataToPublish,
      commitMessageInput
    );
    setIsPublishingGitHub(false);

    if (pubRes.ok) {
      setGhStatusMsg({
        type: 'success',
        text: pubRes.message,
        commitUrl: pubRes.commitUrl,
        actionsUrl: pubRes.actionsUrl,
        pagesUrl: pubRes.pagesUrl,
      });
      setSaveBanner(
        `Saved & automatically committed to GitHub (${ghConfig.owner}/${ghConfig.repo})! GitHub Actions is now deploying to GitHub Pages.`
      );
      setTimeout(() => refreshWorkflowStatus(ghConfig), 2500);
    } else {
      setGhStatusMsg({
        type: 'error',
        text: pubRes.message,
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const ok = await verifyAdminPasscode(passcodeInput.trim());
    if (!ok) {
      setAuthError('Invalid passcode. Default initial passcode is: phd2027');
    } else {
      setDraft(JSON.parse(JSON.stringify(data)));
    }
  };

  const handleSaveAll = async () => {
    const ok = await savePortfolioData(draft);
    if (ok) {
      if (isGitHubConfigured && ghConfig.autoPublishOnSave) {
        await handlePublishToGitHubNow(draft);
      } else {
        setSaveBanner(
          'All changes saved locally and synced to defaultPortfolioData.ts! Connect GitHub in the "GitHub Pages Auto-Deploy" tab for automatic cloud commits.'
        );
        setTimeout(() => setSaveBanner(null), 5000);
      }
    }
  };

  const handleImageFileUpload = async (
    file: File,
    onResult: (dataUrl: string) => void
  ) => {
    // If GitHub Sync is configured, upload the binary asset directly to public/assets/uploads/ in the repo
    if (isGitHubConfigured) {
      setSaveBanner(`Uploading ${file.name} directly to GitHub repository (public/assets/uploads/)...`);
      const uploadRes = await uploadAssetFileToGitHub(ghConfig, file);
      if (uploadRes.ok && uploadRes.assetPath) {
        onResult(uploadRes.assetPath);
        setSaveBanner(uploadRes.message);
        setTimeout(() => setSaveBanner(null), 4500);
        return;
      }
    }

    // Fallback to immediate browser DataURL
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onResult(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExportTypeScriptModule = () => {
    const tsContent = `import { PortfolioDatabase } from '../types/portfolio';\n\nexport const DEFAULT_PORTFOLIO_DATA: PortfolioDatabase = ${JSON.stringify(
      draft,
      null,
      2
    )};\n`;
    const blob = new Blob([tsContent], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'defaultPortfolioData.ts';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const createNewProject = () => {
    const newId = `proj-${Date.now()}`;
    const newProj: ResearchProject = {
      id: newId,
      slug: `research-project-${draft.projects.length + 1}`,
      title: 'New Engineering & Research Monograph Title',
      subtitle: 'Technical Monograph · System Modeling, Identification & Control',
      category: 'Nonlinear Dynamics & RL',
      status: 'Published',
      isTemplatePlaceholder: false,
      period: '2026 – Present',
      role: 'Lead Researcher',
      laboratoryOrInstitution: draft.profile.currentAffiliation,
      heroImage: '/src/assets/images/sindy_rl_cartpole_architecture_1794056013583.jpg',
      galleryImages: [
        {
          url: '/src/assets/images/sindy_rl_cartpole_architecture_1794056013583.jpg',
          caption: 'Figure 1: System experimental setup and physical architecture.',
        },
      ],
      videoEmbedUrl: '',
      githubUrl: 'https://github.com',
      paperUrl: '',
      liveDemoSimulationId: 'sindy-rl-cartpole',
      executiveSummary:
        'Provide a concise 2–3 sentence technical executive summary of the engineering problem, mathematical formulation, and key quantitative outcomes.',
      problemStatement:
        'Describe the fundamental dynamical, control, or perception challenges addressed in this work.',
      methodologyArchitecture:
        'Detail the analytical equations, numerical solvers, neural architectures, or hardware design.',
      experimentalValidation:
        'Summarize empirical results, error bounds, and hardware/simulation benchmarks.',
      equations: [
        {
          id: `eq-${Date.now()}`,
          title: 'State-Space Dynamical Formulation',
          latex: '\\dot{\\mathbf{x}}(t) = \\mathbf{f}(\\mathbf{x}(t), \\mathbf{u}(t)) + \\mathbf{w}(t)',
          explanation: 'Nonlinear state evolution with control input vector u(t) and process disturbance w(t).',
        },
      ],
      systemArchitecture: {
        title: 'Closed-Loop System Block Diagram',
        nodes: [
          {
            id: 'n1',
            label: 'Reference Planner',
            sublabel: 'Target Trajectory',
            mathLatex: '\\mathbf{x}_{\\text{ref}}(t)',
          },
          {
            id: 'n2',
            label: 'Feedback Controller',
            sublabel: 'Optimal Control Law',
            mathLatex: '\\mathbf{u}^{*}(\\mathbf{x})',
          },
          {
            id: 'n3',
            label: 'Physical Plant',
            sublabel: 'Nonlinear Dynamics',
            mathLatex: '\\dot{\\mathbf{x}} = \\mathbf{f}(\\mathbf{x}, \\mathbf{u})',
          },
          {
            id: 'n4',
            label: 'State Estimator',
            sublabel: 'Sensor Fusion',
            mathLatex: '\\hat{\\mathbf{x}}_{k|k}',
          },
        ],
        feedbackLoopDescription: 'Real-time state feedback loop operating at deterministic sampling rate.',
      },
      simulationMetrics: {
        chartTitle: 'Closed-Loop Trajectory Convergence vs. Time',
        xAxisLabel: 'Time t (s)',
        yAxisLabel: 'Tracking Error',
        theoreticalLabel: 'Theoretical Bound',
        empiricalLabel: 'Proposed Controller',
        baselineLabel: 'Baseline Method',
        dataPoints: [
          { x: 0.0, theoretical: 1.0, empirical: 1.0, baseline: 1.0 },
          { x: 0.5, theoretical: 0.4, empirical: 0.44, baseline: 0.72 },
          { x: 1.0, theoretical: 0.1, empirical: 0.12, baseline: 0.45 },
          { x: 1.5, theoretical: 0.02, empirical: 0.03, baseline: 0.25 },
          { x: 2.0, theoretical: 0.0, empirical: 0.01, baseline: 0.12 },
        ],
        keyFindings: [
          {
            label: 'Settling Time',
            value: '1.25',
            unit: 's',
            comparison: '-38% vs. Baseline',
          },
          {
            label: 'RMS Tracking Error',
            value: '0.012',
            unit: 'rad',
            comparison: 'High Precision',
          },
        ],
      },
      hardwareAndSoftwareStack: ['C++', 'Python', 'ROS 2', 'PyTorch'],
      documents: [],
    };

    const next = {
      ...draft,
      projects: [newProj, ...draft.projects],
    };
    setDraft(next);
    setSelectedProjectId(newId);
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-4">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Academic Portfolio Admin CMS
          </h1>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Authenticate to manage research projects, LaTeX equations, scientific plots, publications, biography, and Curriculum Vitae without editing code.
          </p>

          <div className="mt-4 p-3 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-700">
            Default Setup Passcode: <span className="font-bold text-blue-700">phd2027</span>
          </div>

          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Admin Passcode
              </label>
              <input
                type="password"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder="Enter passcode (phd2027)"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                autoFocus
              />
              {authError && (
                <p className="text-xs text-rose-600 mt-1.5">{authError}</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onExitCms}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                ← Back to Public Portfolio
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
              >
                Unlock Admin CMS
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const activeProject = draft.projects.find((p) => p.id === selectedProjectId) || null;

  const updateActiveProject = (updater: (proj: ResearchProject) => ResearchProject) => {
    if (!activeProject) return;
    setDraft((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === activeProject.id ? updater(p) : p
      ),
    }));
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      {/* CMS Top Control Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase tracking-wider text-blue-700 font-semibold">
              Research Content Management System
            </span>
            {lastSavedAt && (
              <span className="text-xs font-mono text-slate-500">
                · Last Saved {lastSavedAt}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            Portfolio &amp; Technical Monograph Studio
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onExitCms}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Eye className="w-3.5 h-3.5" />
            View Live Public Site
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deployment')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
              isGitHubConfigured
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            {isGitHubConfigured
              ? `GitHub Connected: ${ghConfig.owner}/${ghConfig.repo}`
              : 'Setup GitHub Auto-Deploy'}
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving || isPublishingGitHub}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving || isPublishingGitHub
              ? 'Saving & Publishing...'
              : isGitHubConfigured && ghConfig.autoPublishOnSave
              ? 'Save & Auto-Publish to GitHub'
              : 'Save & Publish All Changes'}
          </button>

          <button
            type="button"
            onClick={logoutAdmin}
            className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer whitespace-nowrap"
          >
            Lock CMS
          </button>
        </div>
      </div>

      {saveBanner && (
        <div className="mb-6 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveBanner}</span>
          </div>
          {ghStatusMsg?.commitUrl && (
            <div className="flex items-center gap-3">
              <a
                href={ghStatusMsg.commitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline font-semibold text-emerald-900"
              >
                View Commit <ExternalLink className="w-3 h-3" />
              </a>
              {ghStatusMsg.actionsUrl && (
                <a
                  href={ghStatusMsg.actionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline font-semibold text-emerald-900"
                >
                  GitHub Actions Build <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* CMS Section Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-200/70 rounded-xl mb-8">
        <button
          type="button"
          onClick={() => {
            setActiveTab('projects');
            setSelectedProjectId(null);
          }}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'projects'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Projects &amp; Categories ({draft.projects.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sections-sims')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'sections-sims'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-blue-600" />
          Sections &amp; Simulations Control
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Identity &amp; Biography
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('interests')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'interests'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Research Interests ({draft.researchInterests.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('publications')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'publications'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Publications ({draft.publications.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cv-edu')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'cv-edu'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          Education, Experience, Skills &amp; CV
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deployment')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'deployment'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          GitHub Auto-Deploy ($0)
        </button>
      </div>

      {/* TAB 1: PROJECTS & MONOGRAPHS + EDITABLE CATEGORIES MANAGER */}
      {activeTab === 'projects' && !activeProject && (
        <div className="space-y-6">
          {/* Editable Project Categories Manager Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Project Categories Manager (Editable · Add, Rename, or Remove Any Category)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Project categories are not fixed to 4—rename any category below (projects using it update automatically), delete categories you don&apos;t need, or add new ones.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={draftSectionControls.showCategoryFilterBar !== false}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      sectionControls: {
                        ...draftSectionControls,
                        showCategoryFilterBar: e.target.checked,
                      },
                    }))
                  }
                  className="accent-blue-600"
                />
                Show Category Filter Tabs on Public Site
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {draftCategories.map((cat, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <span className="text-[11px] font-mono text-slate-400 px-1">
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={cat}
                    onChange={(e) => handleRenameCategory(cat, e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs font-medium bg-white border border-slate-300 rounded"
                    aria-label={`Category ${idx + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat)}
                    disabled={draftCategories.length <= 1}
                    title="Delete category"
                    className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory(newCategoryInput);
                  }
                }}
                placeholder="Type a new category name (e.g. Robotics & Autonomous Systems)..."
                className="flex-1 min-w-[240px] px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleAddCategory(newCategoryInput)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Category
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Engineering &amp; Research Project Monographs
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Each project generates a dedicated technical page with LaTeX equations, block diagrams, simulation graphs, and interactive demos. You can also toggle individual modules or set a project to Draft to hide it.
              </p>
            </div>
            <button
              type="button"
              onClick={createNewProject}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add New Project Monograph
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {draft.projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="flex items-start gap-4">
                  <ResilientImage
                    src={proj.heroImage}
                    alt={proj.title}
                    className="w-28 h-20 object-cover rounded-lg border border-slate-200 shrink-0 hidden sm:block"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded ${
                          proj.status === 'Published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {proj.status}
                      </span>
                      <span>·</span>
                      <span className="text-blue-700 font-semibold">{proj.category}</span>
                      <span>·</span>
                      <span>{proj.period}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {proj.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 max-w-2xl">
                      {proj.executiveSummary}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        projects: prev.projects.map((p) =>
                          p.id === proj.id
                            ? {
                                ...p,
                                status: p.status === 'Published' ? 'Draft' : 'Published',
                              }
                            : p
                        ),
                      }))
                    }
                    className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    {proj.status === 'Published' ? 'Set Draft (Hide)' : 'Publish'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedProjectId(proj.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Project &amp; Modules
                  </button>

                  <button
                    type="button"
                    onClick={() => onPreviewProject(proj.slug)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview Page
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDraft((prev) => ({
                        ...prev,
                        projects: prev.projects.filter((p) => p.id !== proj.id),
                      }));
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DETAILED SINGLE PROJECT EDITOR */}
      {activeTab === 'projects' && activeProject && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setSelectedProjectId(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to All Projects List
            </button>

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeProject.isTemplatePlaceholder}
                  onChange={(e) =>
                    updateActiveProject((p) => ({
                      ...p,
                      isTemplatePlaceholder: e.target.checked,
                    }))
                  }
                  className="accent-blue-600"
                />
                Show "Template Placeholder" Banner on Project Page
              </label>

              <button
                type="button"
                onClick={handleSaveAll}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Save Project
              </button>
            </div>
          </div>

          {/* Core Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Monograph Title
              </label>
              <input
                type="text"
                value={activeProject.title}
                onChange={(e) =>
                  updateActiveProject((p) => ({ ...p, title: e.target.value }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                URL Slug
              </label>
              <input
                type="text"
                value={activeProject.slug}
                onChange={(e) =>
                  updateActiveProject((p) => ({ ...p, slug: e.target.value }))
                }
                className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Research Domain Category (Pick or Type Any Custom Category)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={
                    draftCategories.includes(activeProject.category)
                      ? activeProject.category
                      : '__custom__'
                  }
                  onChange={(e) => {
                    if (e.target.value !== '__custom__') {
                      updateActiveProject((p) => ({
                        ...p,
                        category: e.target.value as ResearchCategory,
                      }));
                    }
                  }}
                  className="sm:w-1/2 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {draftCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__custom__">+ Custom Category...</option>
                </select>
                <input
                  type="text"
                  value={activeProject.category}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateActiveProject((p) => ({
                      ...p,
                      category: val,
                    }));
                  }}
                  onBlur={() => {
                    if (
                      activeProject.category.trim() &&
                      !draftCategories.includes(activeProject.category.trim())
                    ) {
                      handleAddCategory(activeProject.category.trim());
                    }
                  }}
                  placeholder="Or type custom category name..."
                  className="sm:w-1/2 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Publication Visibility Status
              </label>
              <select
                value={activeProject.status}
                onChange={(e) =>
                  updateActiveProject((p) => ({
                    ...p,
                    status: e.target.value as 'Published' | 'Draft',
                  }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="Published">Published (Visible on Public Website)</option>
                <option value="Draft">Draft (Hidden from Public Website)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Period / Dates
              </label>
              <input
                type="text"
                value={activeProject.period}
                onChange={(e) =>
                  updateActiveProject((p) => ({ ...p, period: e.target.value }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Role
              </label>
              <input
                type="text"
                value={activeProject.role}
                onChange={(e) =>
                  updateActiveProject((p) => ({ ...p, role: e.target.value }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Laboratory / University / Institution
              </label>
              <input
                type="text"
                value={activeProject.laboratoryOrInstitution}
                onChange={(e) =>
                  updateActiveProject((p) => ({
                    ...p,
                    laboratoryOrInstitution: e.target.value,
                  }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Homepage Card &ldquo;Interactive Sim&rdquo; Quick-Jump Link
              </label>
              <select
                value={activeProject.liveDemoSimulationId || 'none'}
                onChange={(e) =>
                  updateActiveProject((p) => ({
                    ...p,
                    liveDemoSimulationId: e.target.value as any,
                  }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="sindy-rl-cartpole">
                  01. SINDy-RL Cart-Pole Swing-Up Simulator
                </option>
                <option value="si-engine-heat-transfer">
                  02. Two-Zone SI Engine Heat Transfer Simulator
                </option>
                <option value="grid-digital-twin">
                  03. Utility Grid Digital Twin &amp; Sensor ML Simulator
                </option>
                <option value="none">None (Hide Quick-Jump Sim Button on Card)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GitHub Repository URL
              </label>
              <input
                type="text"
                value={activeProject.githubUrl || ''}
                onChange={(e) =>
                  updateActiveProject((p) => ({ ...p, githubUrl: e.target.value }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paper / Report PDF URL
              </label>
              <input
                type="text"
                value={activeProject.paperUrl || ''}
                onChange={(e) =>
                  updateActiveProject((p) => ({ ...p, paperUrl: e.target.value }))
                }
                placeholder="/assets/... or https://..."
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Video Embed URL (YouTube / Vimeo Embed URL — Leave blank to hide video section)
              </label>
              <input
                type="text"
                value={activeProject.videoEmbedUrl || ''}
                onChange={(e) =>
                  updateActiveProject((p) => ({
                    ...p,
                    videoEmbedUrl: e.target.value,
                  }))
                }
                placeholder="https://www.youtube.com/embed/..."
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            {/* Per-Project Module & Interactive Simulation Visibility Control Box */}
            <div className="md:col-span-2 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Project Page Modules &amp; Interactive Simulation Control (Keep, Customize, or Hide Any Module)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Control which sections and interactive simulation modules appear on this project&apos;s dedicated page. Uncheck any module you want to remove/hide, or keep only specific parts of an interactive report.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Interactive Simulation / Deep-Dive Report on Project Page
                  </label>
                  <select
                    value={
                      activeProject.moduleVisibility?.showInteractiveModule === false
                        ? 'none'
                        : activeProject.moduleVisibility?.interactiveModuleType || 'auto'
                    }
                    onChange={(e) => {
                      const val = e.target.value as ProjectInteractiveModuleType;
                      updateActiveProject((p) => ({
                        ...p,
                        moduleVisibility: {
                          ...(p.moduleVisibility || {}),
                          showInteractiveModule: val !== 'none',
                          interactiveModuleType: val,
                        },
                      }));
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    <option value="auto">
                      Auto (Default Interactive Report / Simulator for this Project)
                    </option>
                    <option value="sindy-rl-report">
                      Full SINDy-RL Cart-Pole Report + 100Hz 14-Term Learned Simulator
                    </option>
                    <option value="si-engine-report">
                      Full Two-Zone SI Engine Heat Transfer Study + Figs. 1–12 Interactive Plots
                    </option>
                    <option value="predictive-maintenance-report">
                      Full Hybrid RF-ANN Predictive Maintenance Study + 3-State Decision Simulator
                    </option>
                    <option value="sindy-rl-cartpole">
                      Compact Live Simulator Only: SINDy-RL Cart-Pole Swing-Up
                    </option>
                    <option value="si-engine-heat-transfer">
                      Compact Live Simulator Only: SI Engine Heat Transfer
                    </option>
                    <option value="grid-digital-twin">
                      Compact Live Simulator Only: Utility Digital Twin &amp; Sensor ML
                    </option>
                    <option value="none">
                      None / Deleted (Hide Interactive Simulation &amp; Report on this Project Page)
                    </option>
                  </select>
                </div>

                {/* Sub-module toggles when an interactive report is active */}
                {activeProject.moduleVisibility?.showInteractiveModule !== false &&
                  activeProject.moduleVisibility?.interactiveModuleType !== 'none' && (
                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5 text-xs">
                      <div className="font-semibold text-slate-800 mb-1">
                        Keep / Hide Parts Inside Interactive Report:
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={
                            activeProject.moduleVisibility?.showReportSimulator !== false
                          }
                          onChange={(e) =>
                            updateActiveProject((p) => ({
                              ...p,
                              moduleVisibility: {
                                ...(p.moduleVisibility || {}),
                                showReportSimulator: e.target.checked,
                              },
                            }))
                          }
                          className="accent-blue-600"
                        />
                        Keep Interactive Simulator / Decision Console
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={
                            activeProject.moduleVisibility?.showReportCharts !== false
                          }
                          onChange={(e) =>
                            updateActiveProject((p) => ({
                              ...p,
                              moduleVisibility: {
                                ...(p.moduleVisibility || {}),
                                showReportCharts: e.target.checked,
                              },
                            }))
                          }
                          className="accent-blue-600"
                        />
                        Keep Interactive Scientific Figures &amp; Charts
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={
                            activeProject.moduleVisibility
                              ?.showReportDiagnosticsOrTables !== false
                          }
                          onChange={(e) =>
                            updateActiveProject((p) => ({
                              ...p,
                              moduleVisibility: {
                                ...(p.moduleVisibility || {}),
                                showReportDiagnosticsOrTables: e.target.checked,
                              },
                            }))
                          }
                          className="accent-blue-600"
                        />
                        Keep Diagnostic Tables, Equations &amp; Conclusions
                      </label>
                    </div>
                  )}
              </div>

              <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={activeProject.moduleVisibility?.showKeyFindings !== false}
                    onChange={(e) =>
                      updateActiveProject((p) => ({
                        ...p,
                        moduleVisibility: {
                          ...(p.moduleVisibility || {}),
                          showKeyFindings: e.target.checked,
                        },
                      }))
                    }
                    className="accent-blue-600"
                  />
                  Show Key Findings &amp; Metrics Sidebar
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={
                      activeProject.moduleVisibility?.showNarrativeBreakdown !== false
                    }
                    onChange={(e) =>
                      updateActiveProject((p) => ({
                        ...p,
                        moduleVisibility: {
                          ...(p.moduleVisibility || {}),
                          showNarrativeBreakdown: e.target.checked,
                        },
                      }))
                    }
                    className="accent-blue-600"
                  />
                  Show Problem, Methodology &amp; Results
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={activeProject.moduleVisibility?.showEquations !== false}
                    onChange={(e) =>
                      updateActiveProject((p) => ({
                        ...p,
                        moduleVisibility: {
                          ...(p.moduleVisibility || {}),
                          showEquations: e.target.checked,
                        },
                      }))
                    }
                    className="accent-blue-600"
                  />
                  Show Governing Equations Section
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={
                      activeProject.moduleVisibility?.showSystemDiagram !== false
                    }
                    onChange={(e) =>
                      updateActiveProject((p) => ({
                        ...p,
                        moduleVisibility: {
                          ...(p.moduleVisibility || {}),
                          showSystemDiagram: e.target.checked,
                        },
                      }))
                    }
                    className="accent-blue-600"
                  />
                  Show System Block Diagram Section
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={
                      activeProject.moduleVisibility?.showPerformanceGraph !== false
                    }
                    onChange={(e) =>
                      updateActiveProject((p) => ({
                        ...p,
                        moduleVisibility: {
                          ...(p.moduleVisibility || {}),
                          showPerformanceGraph: e.target.checked,
                        },
                      }))
                    }
                    className="accent-blue-600"
                  />
                  Show Quantitative Comparative Graph
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Hero Figure (Upload Image or Enter Path/URL)
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <input
                  type="text"
                  value={activeProject.heroImage}
                  onChange={(e) =>
                    updateActiveProject((p) => ({ ...p, heroImage: e.target.value }))
                  }
                  className="flex-1 w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                />
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  Upload Image File
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageFileUpload(file, (dataUrl) => {
                          updateActiveProject((p) => ({
                            ...p,
                            heroImage: dataUrl,
                          }));
                        });
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Technical Narrative Fields */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Technical Narrative &amp; Experimental Analysis
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Executive Summary
              </label>
              <textarea
                rows={3}
                value={activeProject.executiveSummary}
                onChange={(e) =>
                  updateActiveProject((p) => ({
                    ...p,
                    executiveSummary: e.target.value,
                  }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  01. Problem Formulation
                </label>
                <textarea
                  rows={5}
                  value={activeProject.problemStatement}
                  onChange={(e) =>
                    updateActiveProject((p) => ({
                      ...p,
                      problemStatement: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  02. Theoretical &amp; Control Architecture
                </label>
                <textarea
                  rows={5}
                  value={activeProject.methodologyArchitecture}
                  onChange={(e) =>
                    updateActiveProject((p) => ({
                      ...p,
                      methodologyArchitecture: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  03. Experimental Validation
                </label>
                <textarea
                  rows={5}
                  value={activeProject.experimentalValidation}
                  onChange={(e) =>
                    updateActiveProject((p) => ({
                      ...p,
                      experimentalValidation: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hardware &amp; Software Stack (Comma-Separated)
              </label>
              <input
                type="text"
                value={activeProject.hardwareAndSoftwareStack.join(', ')}
                onChange={(e) =>
                  updateActiveProject((p) => ({
                    ...p,
                    hardwareAndSoftwareStack: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* LaTeX Governing Equations Editor with Live Preview */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  LaTeX Mathematical Equations (with Live KaTeX Preview)
                </h3>
                <p className="text-xs text-slate-500">
                  Write standard LaTeX expressions—rendered immediately below each input.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateActiveProject((p) => ({
                    ...p,
                    equations: [
                      ...p.equations,
                      {
                        id: `eq-${Date.now()}`,
                        title: 'Additional Governing Constraint',
                        latex: '\\mathcal{H}(\\mathbf{q}, \\mathbf{p}) = \\frac{1}{2}\\mathbf{p}^T \\mathbf{M}^{-1}(\\mathbf{q})\\mathbf{p} + V(\\mathbf{q})',
                        explanation: 'Hamiltonian total energy conservation law.',
                      },
                    ],
                  }))
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Equation
              </button>
            </div>

            <div className="space-y-4">
              {activeProject.equations.map((eq, idx) => (
                <div
                  key={eq.id || idx}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      value={eq.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateActiveProject((p) => ({
                          ...p,
                          equations: p.equations.map((item, i) =>
                            i === idx ? { ...item, title: val } : item
                          ),
                        }));
                      }}
                      className="flex-1 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-md"
                      placeholder="Equation Title"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateActiveProject((p) => ({
                          ...p,
                          equations: p.equations.filter((_, i) => i !== idx),
                        }))
                      }
                      className="text-xs text-rose-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">
                      LaTeX Source String:
                    </label>
                    <textarea
                      rows={2}
                      value={eq.latex}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateActiveProject((p) => ({
                          ...p,
                          equations: p.equations.map((item, i) =>
                            i === idx ? { ...item, latex: val } : item
                          ),
                        }));
                      }}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-md"
                    />
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-md overflow-x-auto">
                    <div className="text-[10px] font-mono text-slate-400 mb-1">
                      Live Rendered KaTeX Preview:
                    </div>
                    <MathEquation latex={eq.latex} block />
                  </div>

                  <input
                    type="text"
                    value={eq.explanation}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateActiveProject((p) => ({
                        ...p,
                        equations: p.equations.map((item, i) =>
                          i === idx ? { ...item, explanation: val } : item
                        ),
                      }));
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                    placeholder="Variable definitions and physical interpretation"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Quantitative Benchmark Findings Editor */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Quantitative Benchmark Metrics (Summary Cards)
              </h3>
              <button
                type="button"
                onClick={() =>
                  updateActiveProject((p) => ({
                    ...p,
                    simulationMetrics: {
                      ...p.simulationMetrics,
                      keyFindings: [
                        ...p.simulationMetrics.keyFindings,
                        {
                          label: 'New Benchmark Metric',
                          value: '99.0',
                          unit: '%',
                          comparison: 'Verified against baseline',
                        },
                      ],
                    },
                  }))
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Metric Card
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeProject.simulationMetrics.keyFindings.map((kf, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-2 gap-2.5"
                >
                  <div className="col-span-2 flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      Metric Card #{idx + 1}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        updateActiveProject((p) => ({
                          ...p,
                          simulationMetrics: {
                            ...p.simulationMetrics,
                            keyFindings: p.simulationMetrics.keyFindings.filter(
                              (_, i) => i !== idx
                            ),
                          },
                        }))
                      }
                      className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] text-slate-500">
                      Metric Label
                    </label>
                    <input
                      type="text"
                      value={kf.label}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateActiveProject((p) => ({
                          ...p,
                          simulationMetrics: {
                            ...p.simulationMetrics,
                            keyFindings: p.simulationMetrics.keyFindings.map(
                              (item, i) =>
                                i === idx ? { ...item, label: val } : item
                            ),
                          },
                        }));
                      }}
                      className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500">
                      Numeric Value
                    </label>
                    <input
                      type="text"
                      value={kf.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateActiveProject((p) => ({
                          ...p,
                          simulationMetrics: {
                            ...p.simulationMetrics,
                            keyFindings: p.simulationMetrics.keyFindings.map(
                              (item, i) =>
                                i === idx ? { ...item, value: val } : item
                            ),
                          },
                        }));
                      }}
                      className="w-full px-2.5 py-1 text-xs font-mono bg-white border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500">
                      Unit (e.g. ms, rad, %)
                    </label>
                    <input
                      type="text"
                      value={kf.unit}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateActiveProject((p) => ({
                          ...p,
                          simulationMetrics: {
                            ...p.simulationMetrics,
                            keyFindings: p.simulationMetrics.keyFindings.map(
                              (item, i) =>
                                i === idx ? { ...item, unit: val } : item
                            ),
                          },
                        }));
                      }}
                      className="w-full px-2.5 py-1 text-xs font-mono bg-white border border-slate-300 rounded"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] text-slate-500">
                      Benchmark Note
                    </label>
                    <input
                      type="text"
                      value={kf.comparison}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateActiveProject((p) => ({
                          ...p,
                          simulationMetrics: {
                            ...p.simulationMetrics,
                            keyFindings: p.simulationMetrics.keyFindings.map(
                              (item, i) =>
                                i === idx ? { ...item, comparison: val } : item
                            ),
                          },
                        }));
                      }}
                      className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Architecture Block Diagram Nodes Editor */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  System Architecture Block Diagram Stages
                </h3>
                <p className="text-xs text-slate-500">
                  Add, edit, or delete stages in the project&apos;s schematic pipeline diagram.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateActiveProject((p) => ({
                    ...p,
                    systemArchitecture: {
                      ...p.systemArchitecture,
                      nodes: [
                        ...p.systemArchitecture.nodes,
                        {
                          id: `node-${Date.now()}`,
                          label: `Stage 0${p.systemArchitecture.nodes.length + 1}: New Pipeline Block`,
                          sublabel: 'Input -> Transformation -> Output',
                          mathLatex: '\\mathbf{y} = \\mathbf{g}(\\mathbf{x})',
                        },
                      ],
                    },
                  }))
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Diagram Stage
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeProject.systemArchitecture.nodes.map((node, idx) => (
                <div
                  key={node.id || idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-semibold text-slate-600">
                      Stage #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateActiveProject((p) => ({
                          ...p,
                          systemArchitecture: {
                            ...p.systemArchitecture,
                            nodes: p.systemArchitecture.nodes.filter(
                              (_, i) => i !== idx
                            ),
                          },
                        }))
                      }
                      className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                    >
                      Remove Stage
                    </button>
                  </div>
                  <input
                    type="text"
                    value={node.label}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateActiveProject((p) => ({
                        ...p,
                        systemArchitecture: {
                          ...p.systemArchitecture,
                          nodes: p.systemArchitecture.nodes.map((n, i) =>
                            i === idx ? { ...n, label: val } : n
                          ),
                        },
                      }));
                    }}
                    className="w-full px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 rounded"
                    placeholder="Block Label"
                  />
                  <input
                    type="text"
                    value={node.sublabel}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateActiveProject((p) => ({
                        ...p,
                        systemArchitecture: {
                          ...p.systemArchitecture,
                          nodes: p.systemArchitecture.nodes.map((n, i) =>
                            i === idx ? { ...n, sublabel: val } : n
                          ),
                        },
                      }));
                    }}
                    className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded"
                    placeholder="Technical sublabel"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: SECTIONS & SIMULATIONS CONTROL */}
      {activeTab === 'sections-sims' && (
        <div className="space-y-6">
          {/* Card 1: Interactive Simulations Section & Individual Simulation Modules */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-blue-700 font-semibold">
                  Interactive Simulations Control
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  Manage Simulations Section &amp; Individual Simulation Modules
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Hide the entire Simulations section, or keep only selected simulation modules (e.g., keep 1 or 2 out of the 3) and customize their titles and governing equations.
                </p>
              </div>
              <label className="inline-flex items-center gap-2.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer self-start">
                <input
                  type="checkbox"
                  checked={draftSimConfig.enabled && draftSectionControls.showSimulationsSection}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setDraft((prev) => ({
                      ...prev,
                      simulationsConfig: {
                        ...(prev.simulationsConfig ?? draftSimConfig),
                        enabled: checked,
                      },
                      sectionControls: {
                        ...(prev.sectionControls ?? draftSectionControls),
                        showSimulationsSection: checked,
                      },
                    }));
                  }}
                  className="accent-blue-400 w-4 h-4"
                />
                {draftSimConfig.enabled && draftSectionControls.showSimulationsSection
                  ? 'Simulations Section: Visible on Website'
                  : 'Simulations Section: Hidden on Website'}
              </label>
            </div>

            {/* Section Header Text Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section Kicker
                </label>
                <input
                  type="text"
                  value={draftSimConfig.sectionKicker}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraft((prev) => ({
                      ...prev,
                      simulationsConfig: {
                        ...(prev.simulationsConfig ?? draftSimConfig),
                        sectionKicker: val,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  value={draftSimConfig.sectionTitle}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraft((prev) => ({
                      ...prev,
                      simulationsConfig: {
                        ...(prev.simulationsConfig ?? draftSimConfig),
                        sectionTitle: val,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section Subtitle / Description
                </label>
                <textarea
                  rows={2}
                  value={draftSimConfig.sectionDescription}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraft((prev) => ({
                      ...prev,
                      simulationsConfig: {
                        ...(prev.simulationsConfig ?? draftSimConfig),
                        sectionDescription: val,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* Individual Simulation Modules List */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Individual Simulation Modules (Keep, Hide, or Edit Each Simulation)
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  {draftSimConfig.modules.filter((m) => m.enabled).length} of {draftSimConfig.modules.length} modules kept active
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {draftSimConfig.modules.map((mod, idx) => (
                  <div
                    key={mod.id}
                    className={`p-4 rounded-xl border transition-all ${
                      mod.enabled
                        ? 'bg-slate-50/80 border-slate-200'
                        : 'bg-slate-100/60 border-slate-200 opacity-70'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 text-[11px] font-mono font-semibold bg-white border border-slate-200 rounded text-slate-700">
                          Module 0{idx + 1}: {mod.id}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded ${
                            mod.enabled
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {mod.enabled ? 'Kept (Active)' : 'Hidden / Removed'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDraft((prev) => {
                              const currentCfg = prev.simulationsConfig ?? draftSimConfig;
                              return {
                                ...prev,
                                simulationsConfig: {
                                  ...currentCfg,
                                  modules: currentCfg.modules.map((m, i) =>
                                    i === idx ? { ...m, enabled: !m.enabled } : m
                                  ),
                                },
                              };
                            });
                          }}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-colors ${
                            mod.enabled
                              ? 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                              : 'bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800'
                          }`}
                        >
                          {mod.enabled ? 'Hide / Remove This Simulation' : 'Keep / Enable This Simulation'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Tab Button Label
                        </label>
                        <input
                          type="text"
                          value={mod.tabLabel}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraft((prev) => {
                              const currentCfg = prev.simulationsConfig ?? draftSimConfig;
                              return {
                                ...prev,
                                simulationsConfig: {
                                  ...currentCfg,
                                  modules: currentCfg.modules.map((m, i) =>
                                    i === idx ? { ...m, tabLabel: val } : m
                                  ),
                                },
                              };
                            });
                          }}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Simulation Header Title
                        </label>
                        <input
                          type="text"
                          value={mod.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraft((prev) => {
                              const currentCfg = prev.simulationsConfig ?? draftSimConfig;
                              return {
                                ...prev,
                                simulationsConfig: {
                                  ...currentCfg,
                                  modules: currentCfg.modules.map((m, i) =>
                                    i === idx ? { ...m, title: val } : m
                                  ),
                                },
                              };
                            });
                          }}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Governing Equation (LaTeX)
                        </label>
                        <input
                          type="text"
                          value={mod.governingEquationLatex}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraft((prev) => {
                              const currentCfg = prev.simulationsConfig ?? draftSimConfig;
                              return {
                                ...prev,
                                simulationsConfig: {
                                  ...currentCfg,
                                  modules: currentCfg.modules.map((m, i) =>
                                    i === idx ? { ...m, governingEquationLatex: val } : m
                                  ),
                                },
                              };
                            });
                          }}
                          className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Website Sections Visibility & Custom Titles */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-[11px] font-mono uppercase tracking-widest text-blue-700 font-semibold">
                Homepage Architecture &amp; Section Visibility
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                Show, Hide, or Rename Any Website Section
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Uncheck any section below to remove it from the public website and navigation bar, or edit its heading text.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                {
                  key: 'showHeroPillarsStrip' as const,
                  label: 'Hero 4-Pillar Strip (Under Intro)',
                },
                {
                  key: 'showAboutSection' as const,
                  label: '01. About & Academic Background',
                },
                {
                  key: 'showResearchInterestsSection' as const,
                  label: '02. Research Interests Pillars',
                },
                {
                  key: 'showProjectsSection' as const,
                  label: '03. Research & Engineering Projects',
                },
                {
                  key: 'showCategoryFilterBar' as const,
                  label: 'Project Category Filter Buttons',
                },
                {
                  key: 'showSimulationsSection' as const,
                  label: '04. Interactive Simulations Lab',
                },
                {
                  key: 'showPublicationsSection' as const,
                  label: '05. Publications & Proceedings',
                },
                {
                  key: 'showEducationSection' as const,
                  label: '06. Education & Academic Record',
                },
                {
                  key: 'showCertificationsSection' as const,
                  label: 'Online Courses & Certifications',
                },
                {
                  key: 'showExperienceSection' as const,
                  label: 'Research & Engineering Experience',
                },
                {
                  key: 'showSkillsSection' as const,
                  label: '07. Technical Skills & Tooling',
                },
                {
                  key: 'showCvDownloadSection' as const,
                  label: '08. Curriculum Vitae (CV) Download',
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className={`flex items-center justify-between gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                    draftSectionControls[item.key]
                      ? 'bg-slate-50 border-slate-200 text-slate-900'
                      : 'bg-rose-50/40 border-rose-200 text-slate-500'
                  }`}
                >
                  <span className="text-xs font-semibold">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={draftSectionControls[item.key]}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setDraft((prev) => ({
                        ...prev,
                        sectionControls: {
                          ...(prev.sectionControls ?? draftSectionControls),
                          [item.key]: checked,
                        },
                      }));
                    }}
                    className="accent-blue-600 w-4 h-4"
                  />
                </label>
              ))}
            </div>

            {/* Section Headings Editor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  About Section Heading
                </label>
                <input
                  type="text"
                  value={draftSectionControls.aboutSectionTitle}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraft((prev) => ({
                      ...prev,
                      sectionControls: {
                        ...(prev.sectionControls ?? draftSectionControls),
                        aboutSectionTitle: val,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Research Interests Section Heading
                </label>
                <input
                  type="text"
                  value={draftSectionControls.researchInterestsTitle}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraft((prev) => ({
                      ...prev,
                      sectionControls: {
                        ...(prev.sectionControls ?? draftSectionControls),
                        researchInterestsTitle: val,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Projects Section Heading
                </label>
                <input
                  type="text"
                  value={draftSectionControls.projectsSectionTitle}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraft((prev) => ({
                      ...prev,
                      sectionControls: {
                        ...(prev.sectionControls ?? draftSectionControls),
                        projectsSectionTitle: val,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Publications Section Heading
                </label>
                <input
                  type="text"
                  value={draftSectionControls.publicationsSectionTitle}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraft((prev) => ({
                      ...prev,
                      sectionControls: {
                        ...(prev.sectionControls ?? draftSectionControls),
                        publicationsSectionTitle: val,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Research Interests Subtitle
                </label>
                <input
                  type="text"
                  value={draftSectionControls.researchInterestsSubtitle}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraft((prev) => ({
                      ...prev,
                      sectionControls: {
                        ...(prev.sectionControls ?? draftSectionControls),
                        researchInterestsSubtitle: val,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Projects Section Subtitle
                </label>
                <input
                  type="text"
                  value={draftSectionControls.projectsSectionSubtitle}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraft((prev) => ({
                      ...prev,
                      sectionControls: {
                        ...(prev.sectionControls ?? draftSectionControls),
                        projectsSectionSubtitle: val,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IDENTITY & BIOGRAPHY */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Researcher Identity, Links &amp; Biography
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Replace the unfabricated placeholders with your exact name, university, advisor links, and biographical narrative.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.profile.showPlaceholderBanners}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    profile: {
                      ...prev.profile,
                      showPlaceholderBanners: e.target.checked,
                    },
                  }))
                }
                className="accent-blue-600"
              />
              Show Editable Placeholder Guides on Public Site
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={draft.profile.fullName}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, fullName: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Role / Subtitle
              </label>
              <input
                type="text"
                value={draft.profile.academicTitle}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, academicTitle: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PhD Application Cycle Notice
              </label>
              <input
                type="text"
                value={draft.profile.applicationCycleNotice}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    profile: {
                      ...prev.profile,
                      applicationCycleNotice: e.target.value,
                    },
                  }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current University / Laboratory Affiliation
              </label>
              <input
                type="text"
                value={draft.profile.currentAffiliation}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    profile: {
                      ...prev.profile,
                      currentAffiliation: e.target.value,
                    },
                  }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Email Address
              </label>
              <input
                type="email"
                value={draft.profile.email}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, email: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={draft.profile.location}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, location: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GitHub Profile URL
              </label>
              <input
                type="text"
                value={draft.profile.githubUrl}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, githubUrl: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Google Scholar URL
              </label>
              <input
                type="text"
                value={draft.profile.googleScholarUrl}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    profile: {
                      ...prev.profile,
                      googleScholarUrl: e.target.value,
                    },
                  }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hero Headline Statement
              </label>
              <input
                type="text"
                value={draft.profile.heroHeadline}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, heroHeadline: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hero Lead Paragraph
              </label>
              <textarea
                rows={3}
                value={draft.profile.heroLeadParagraph}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    profile: {
                      ...prev.profile,
                      heroLeadParagraph: e.target.value,
                    },
                  }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                About Me — Biographical Paragraphs (Separate paragraphs with a blank line)
              </label>
              <textarea
                rows={7}
                value={draft.profile.aboutBiography.join('\n\n')}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    profile: {
                      ...prev.profile,
                      aboutBiography: e.target.value
                        .split(/\n\s*\n/)
                        .map((p) => p.trim())
                        .filter(Boolean),
                    },
                  }))
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RESEARCH INTERESTS */}
      {activeTab === 'interests' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Research Interest Pillars
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Add, edit, or delete research pillars displayed in the Hero Strip and Research Interests section.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  researchInterests: [
                    ...prev.researchInterests,
                    {
                      id: `pillar-${Date.now()}`,
                      index: `0${prev.researchInterests.length + 1}`,
                      title: 'New Research Pillar',
                      subtitle: 'Sub-discipline • Modeling • Control',
                      description: 'Describe your research focus and methodology.',
                      coreEquationLatex: '\\dot{\\mathbf{x}} = \\mathbf{f}(\\mathbf{x}, \\mathbf{u})',
                      coreEquationCaption: 'Governing state-space dynamical system',
                      keyTopics: ['Nonlinear Dynamics', 'Machine Learning'],
                    },
                  ],
                }))
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Research Pillar
            </button>
          </div>

          {draft.researchInterests.map((pillar, idx) => (
            <div
              key={pillar.id}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-mono font-bold text-slate-600">
                  Pillar #{idx + 1} ({pillar.index})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      researchInterests: prev.researchInterests.filter(
                        (_, i) => i !== idx
                      ),
                    }))
                  }
                  className="inline-flex items-center gap-1 text-xs text-rose-600 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Pillar
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pillar {pillar.index} Title
                  </label>
                  <input
                    type="text"
                    value={pillar.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraft((prev) => ({
                        ...prev,
                        researchInterests: prev.researchInterests.map((item, i) =>
                          i === idx ? { ...item, title: val } : item
                        ),
                      }));
                    }}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sub-disciplines Kicker
                  </label>
                  <input
                    type="text"
                    value={pillar.subtitle}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraft((prev) => ({
                        ...prev,
                        researchInterests: prev.researchInterests.map((item, i) =>
                          i === idx ? { ...item, subtitle: val } : item
                        ),
                      }));
                    }}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Technical Description
                  </label>
                  <textarea
                    rows={3}
                    value={pillar.description}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraft((prev) => ({
                        ...prev,
                        researchInterests: prev.researchInterests.map((item, i) =>
                          i === idx ? { ...item, description: val } : item
                        ),
                      }));
                    }}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Representative Governing Equation (LaTeX)
                  </label>
                  <input
                    type="text"
                    value={pillar.coreEquationLatex}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraft((prev) => ({
                        ...prev,
                        researchInterests: prev.researchInterests.map((item, i) =>
                          i === idx ? { ...item, coreEquationLatex: val } : item
                        ),
                      }));
                    }}
                    className="w-full px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                  <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg overflow-x-auto">
                    <MathEquation latex={pillar.coreEquationLatex} block />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: PUBLICATIONS MANAGER */}
      {activeTab === 'publications' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Publications, Preprints &amp; Theses
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Add conference proceedings, journal articles, arXiv preprints, or thesis manuscripts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const newPub: PublicationItem = {
                  id: `pub-${Date.now()}`,
                  title: 'New Manuscript or Thesis Title',
                  authors: `${draft.profile.fullName}, Co-Authors`,
                  venue: 'IEEE ICRA / IROS / Automatica / Preprint',
                  year: '2026',
                  status: 'Under Review',
                  researchDomain: 'Robotics & Control',
                  doiUrl: '',
                  pdfUrl: '',
                  codeUrl: '',
                  abstract: 'Enter abstract summary here.',
                  bibtex: `@article{author2026,\n  title={New Manuscript Title},\n  author={${draft.profile.fullName}},\n  year={2026}\n}`,
                };
                setDraft((prev) => ({
                  ...prev,
                  publications: [newPub, ...prev.publications],
                }));
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Publication Entry
            </button>
          </div>

          {draft.publications.map((pub, idx) => (
            <div
              key={pub.id}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-mono text-slate-500">
                  Publication #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      publications: prev.publications.filter((_, i) => i !== idx),
                    }))
                  }
                  className="text-xs text-rose-600 hover:underline cursor-pointer"
                >
                  Delete Entry
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={pub.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraft((prev) => ({
                        ...prev,
                        publications: prev.publications.map((item, i) =>
                          i === idx ? { ...item, title: val } : item
                        ),
                      }));
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={pub.status}
                    onChange={(e) => {
                      const val = e.target.value as PublicationItem['status'];
                      setDraft((prev) => ({
                        ...prev,
                        publications: prev.publications.map((item, i) =>
                          i === idx ? { ...item, status: val } : item
                        ),
                      }));
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Published">Published</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Preprint">Preprint (arXiv)</option>
                    <option value="In Preparation">In Preparation</option>
                    <option value="Template Placeholder">Template Placeholder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Authors
                  </label>
                  <input
                    type="text"
                    value={pub.authors}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraft((prev) => ({
                        ...prev,
                        publications: prev.publications.map((item, i) =>
                          i === idx ? { ...item, authors: val } : item
                        ),
                      }));
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Journal / Conference Venue
                  </label>
                  <input
                    type="text"
                    value={pub.venue}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraft((prev) => ({
                        ...prev,
                        publications: prev.publications.map((item, i) =>
                          i === idx ? { ...item, venue: val } : item
                        ),
                      }));
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Year
                  </label>
                  <input
                    type="text"
                    value={pub.year}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraft((prev) => ({
                        ...prev,
                        publications: prev.publications.map((item, i) =>
                          i === idx ? { ...item, year: val } : item
                        ),
                      }));
                    }}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Abstract
                  </label>
                  <textarea
                    rows={2}
                    value={pub.abstract}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraft((prev) => ({
                        ...prev,
                        publications: prev.publications.map((item, i) =>
                          i === idx ? { ...item, abstract: val } : item
                        ),
                      }));
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    BibTeX Entry
                  </label>
                  <textarea
                    rows={3}
                    value={pub.bibtex}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraft((prev) => ({
                        ...prev,
                        publications: prev.publications.map((item, i) =>
                          i === idx ? { ...item, bibtex: val } : item
                        ),
                      }));
                    }}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: EDUCATION, EXPERIENCE & CV PDF UPLOAD */}
      {activeTab === 'cv-edu' && (
        <div className="space-y-8">
          {/* CV PDF Upload Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Curriculum Vitae (CV) PDF Replacement
            </h2>
            <p className="text-xs text-slate-600">
              Upload your compiled academic CV PDF directly below, or provide an external link (e.g. Google Drive / GitHub release). Visitors can view or download it with one click.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload PDF Document (Stored in Portfolio DB)
                </label>
                <label className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Select PDF File from Computer
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') {
                            setDraft((prev) => ({
                              ...prev,
                              cv: {
                                ...prev.cv,
                                fileName: file.name,
                                lastUpdated: new Date().toLocaleDateString('en-US', {
                                  month: 'long',
                                  year: 'numeric',
                                }),
                                uploadedPdfDataUrl: reader.result as string,
                              },
                            }));
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                {draft.cv.uploadedPdfDataUrl && (
                  <span className="ml-3 text-xs font-mono text-emerald-700">
                    ✓ Custom PDF Loaded ({draft.cv.fileName})
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Or External CV PDF URL
                </label>
                <input
                  type="text"
                  value={draft.cv.externalPdfUrl || ''}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      cv: { ...prev.cv, externalPdfUrl: e.target.value },
                    }))
                  }
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Education Editor */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Education History
              </h2>
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    education: [
                      ...prev.education,
                      {
                        id: `edu-${Date.now()}`,
                        degree: 'B.S. / M.S. in Engineering',
                        department: 'Department of Mechanical / Electrical Engineering',
                        institution: 'University Name',
                        location: 'City, Country',
                        period: '2022 – 2026',
                        gpaOrHonors: 'CGPA: X.XX / 4.00',
                        thesisTitle: 'Thesis Title',
                        advisorPlaceholder: 'Prof. Name',
                        coursework: ['Nonlinear Control', 'Robotics'],
                        isPlaceholder: false,
                      },
                    ],
                  }))
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Degree
              </button>
            </div>

            {draft.education.map((edu, idx) => (
              <div
                key={edu.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-3"
              >
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Degree Title
                  </label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraft((prev) => ({
                        ...prev,
                        education: prev.education.map((item, i) =>
                          i === idx ? { ...item, degree: val, isPlaceholder: false } : item
                        ),
                      }));
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">
                    University / Institution
                  </label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraft((prev) => ({
                        ...prev,
                        education: prev.education.map((item, i) =>
                          i === idx ? { ...item, institution: val } : item
                        ),
                      }));
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Period
                  </label>
                  <input
                    type="text"
                    value={edu.period}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraft((prev) => ({
                        ...prev,
                        education: prev.education.map((item, i) =>
                          i === idx ? { ...item, period: val } : item
                        ),
                      }));
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">
                    GPA / Honors
                  </label>
                  <input
                    type="text"
                    value={edu.gpaOrHonors}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraft((prev) => ({
                        ...prev,
                        education: prev.education.map((item, i) =>
                          i === idx ? { ...item, gpaOrHonors: val } : item
                        ),
                      }));
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Thesis Title
                  </label>
                  <input
                    type="text"
                    value={edu.thesisTitle}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraft((prev) => ({
                        ...prev,
                        education: prev.education.map((item, i) =>
                          i === idx ? { ...item, thesisTitle: val } : item
                        ),
                      }));
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: GITHUB PAGES 1-CLICK AUTO-COMMIT & $0 HOSTING */}
      {activeTab === 'deployment' && (
        <div className="space-y-6">
          {/* Primary Card: Direct Browser-to-GitHub Auto-Commit & GitHub Actions Integration */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-blue-700 font-semibold">
                  Zero-Code GitHub Pages Auto-Deploy · $0.00 Forever
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  Direct Visual CMS → GitHub Commit → GitHub Actions Deployment
                </h2>
                <p className="text-sm text-slate-600 mt-1 max-w-3xl">
                  Connect your GitHub repository once below. Whenever you edit or add a project and click <strong>Save &amp; Auto-Publish to GitHub</strong>, this CMS automatically commits the updated data (<code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">src/data/defaultPortfolioData.ts</code> and <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">public/data/portfolio.json</code>) directly to your GitHub repository via the official GitHub REST API—triggering <strong>GitHub Actions</strong> to rebuild and deploy your live <strong>GitHub Pages</strong> site without ever downloading files or running terminal commands.
                </p>
              </div>

              {computeGitHubPagesUrl(ghConfig.owner, ghConfig.repo) && (
                <a
                  href={computeGitHubPagesUrl(ghConfig.owner, ghConfig.repo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors shrink-0"
                >
                  Live GitHub Pages URL
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Configuration Form */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4 bg-slate-50 border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="text-xs font-bold uppercase font-mono text-slate-700 flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5 text-blue-600" />
                    GitHub Repository &amp; API Credentials
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Direct HTTPS to api.github.com
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      GitHub Username / Owner
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. skhumain"
                      value={ghConfig.owner}
                      onChange={(e) =>
                        updateGhConfig((prev) => ({ ...prev, owner: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Repository Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. skhumain.github.io"
                      value={ghConfig.repo}
                      onChange={(e) =>
                        updateGhConfig((prev) => ({ ...prev, repo: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Branch
                    </label>
                    <input
                      type="text"
                      placeholder="main"
                      value={ghConfig.branch}
                      onChange={(e) =>
                        updateGhConfig((prev) => ({ ...prev, branch: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GitHub Fine-Grained Personal Access Token (PAT)
                  </label>
                  <input
                    type="password"
                    placeholder="github_pat_..."
                    value={ghConfig.token}
                    onChange={(e) =>
                      updateGhConfig((prev) => ({ ...prev, token: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Requires only <strong>Contents: Read and write</strong> permission scoped strictly to your portfolio repository. Never leaves your browser except to authenticate with <code className="font-mono">https://api.github.com</code>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Commit Message for Next Publish
                  </label>
                  <input
                    type="text"
                    value={commitMessageInput}
                    onChange={(e) => setCommitMessageInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="pt-2 space-y-2 border-t border-slate-200 text-xs text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ghConfig.autoPublishOnSave}
                      onChange={(e) =>
                        updateGhConfig((prev) => ({
                          ...prev,
                          autoPublishOnSave: e.target.checked,
                        }))
                      }
                      className="accent-blue-600"
                    />
                    <span>
                      <strong>Auto-Commit on Save:</strong> Automatically commit &amp; trigger GitHub Actions deployment whenever I click &ldquo;Save &amp; Publish&rdquo;
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ghConfig.rememberTokenInLocalStorage}
                      onChange={(e) =>
                        updateGhConfig((prev) => ({
                          ...prev,
                          rememberTokenInLocalStorage: e.target.checked,
                        }))
                      }
                      className="accent-blue-600"
                    />
                    <span>
                      Remember token in this browser (<code className="font-mono">localStorage</code>). Leave unchecked on shared computers to keep token in <code className="font-mono">sessionStorage</code> (erased when tab closes).
                    </span>
                  </label>
                </div>

                <div className="pt-3 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleTestGitHubConnection}
                    disabled={isTestingGitHub || isPublishingGitHub}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    {isTestingGitHub ? 'Testing Connection...' : '1. Verify Repo & Write Access'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePublishToGitHubNow(draft)}
                    disabled={isPublishingGitHub || !isGitHubConfigured}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg cursor-pointer"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    {isPublishingGitHub
                      ? 'Committing to GitHub...'
                      : '2. Commit & Trigger GitHub Actions Now'}
                  </button>

                  {ghConfig.token && (
                    <button
                      type="button"
                      onClick={() => {
                        clearGitHubSyncCredentials();
                        setGhConfig(loadGitHubSyncConfig());
                        setGhStatusMsg({
                          type: 'info',
                          text: 'Personal Access Token cleared from browser storage.',
                        });
                      }}
                      className="px-3 py-2 text-xs font-medium text-rose-700 hover:underline cursor-pointer"
                    >
                      Clear Token
                    </button>
                  )}
                </div>

                {ghStatusMsg && (
                  <div
                    className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
                      ghStatusMsg.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : ghStatusMsg.type === 'error'
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : 'bg-blue-50 border-blue-200 text-blue-900'
                    }`}
                  >
                    <div className="font-semibold">{ghStatusMsg.text}</div>
                    {(ghStatusMsg.commitUrl || ghStatusMsg.actionsUrl || ghStatusMsg.pagesUrl) && (
                      <div className="mt-2 flex flex-wrap items-center gap-4 font-mono text-[11px]">
                        {ghStatusMsg.commitUrl && (
                          <a
                            href={ghStatusMsg.commitUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 underline font-bold"
                          >
                            Inspect GitHub Commit <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {ghStatusMsg.actionsUrl && (
                          <a
                            href={ghStatusMsg.actionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 underline font-bold"
                          >
                            Watch GitHub Actions Build <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {ghStatusMsg.pagesUrl && (
                          <a
                            href={ghStatusMsg.pagesUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 underline font-bold"
                          >
                            Open Live GitHub Pages Site <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Live GitHub Actions Status & Security Architecture */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                <div className="p-5 bg-slate-900 text-white rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-blue-400">
                      GitHub Actions Deployment Monitor
                    </span>
                    <button
                      type="button"
                      onClick={() => refreshWorkflowStatus(ghConfig)}
                      className="inline-flex items-center gap-1 text-xs font-mono text-slate-300 hover:text-white cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </div>

                  {latestWorkflow ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Latest Workflow:</span>
                        <span className="font-mono font-semibold">{latestWorkflow.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Build Status:</span>
                        <span
                          className={`font-mono font-bold uppercase ${
                            latestWorkflow.conclusion === 'success'
                              ? 'text-emerald-400'
                              : latestWorkflow.status === 'in_progress' ||
                                latestWorkflow.status === 'queued'
                              ? 'text-amber-400'
                              : 'text-slate-200'
                          }`}
                        >
                          {latestWorkflow.status}{' '}
                          {latestWorkflow.conclusion ? `(${latestWorkflow.conclusion})` : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Triggered At:</span>
                        <span className="font-mono text-slate-300">
                          {new Date(latestWorkflow.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="pt-2">
                        <a
                          href={latestWorkflow.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-blue-400 hover:underline font-mono"
                        >
                          View Workflow Logs on GitHub <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Connect your repository and click <strong>Verify Repo</strong> or <strong>Commit Now</strong> to monitor live GitHub Actions build and Pages deployment status here.
                    </p>
                  )}

                  <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-300 leading-relaxed space-y-1.5">
                    <div className="font-semibold text-white">
                      How Authentication &amp; Security Work ($0 Serverless):
                    </div>
                    <p>
                      • <strong>No Paid Backend or Database:</strong> GitHub Pages hosts your compiled static website for $0/month, while GitHub’s REST API acts as your secure serverless Git backend.
                    </p>
                    <p>
                      • <strong>Token Never Enters Code:</strong> Your Fine-Grained PAT is stored only in your browser (<code className="font-mono">sessionStorage</code> by default) and is never written into <code className="font-mono">defaultPortfolioData.ts</code> or exposed to public visitors.
                    </p>
                    <p>
                      • <strong>Direct Binary Uploads:</strong> When connected, uploading an image or CV PDF inside the CMS commits the file directly into <code className="font-mono">public/assets/uploads/</code> in your repository.
                    </p>
                  </div>
                </div>

                {/* Secondary Manual Backup / Restore Tools */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-slate-900">
                    Optional Offline Backups &amp; Snapshots
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={exportDatabaseJson}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export JSON Backup
                    </button>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      Restore JSON
                      <input
                        type="file"
                        accept="application/json"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = async () => {
                              if (typeof reader.result === 'string') {
                                const ok = await importDatabaseJson(reader.result);
                                if (ok) {
                                  setDraft(JSON.parse(reader.result));
                                  setSaveBanner('Database restored from JSON snapshot.');
                                }
                              }
                            };
                            reader.readAsText(file);
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        await resetToDefaults();
                        window.location.reload();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset Defaults
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* One-Time 3-Step Setup Guide & Included GitHub Actions Workflow */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">
                  One-Time GitHub Pages &amp; Fine-Grained Token Setup (Takes 2 Minutes)
                </h3>
                <ol className="text-xs text-slate-600 space-y-2.5 list-decimal list-inside leading-relaxed">
                  <li>
                    <strong>Push Repository to GitHub:</strong> Push this project to a public GitHub repository (e.g., <code className="font-mono">&lt;username&gt;.github.io</code>). The workflow file <code className="font-mono">.github/workflows/deploy.yml</code> is already included in the repository!
                  </li>
                  <li>
                    <strong>Enable GitHub Actions Pages Source:</strong> On GitHub.com, open your repository → <strong>Settings</strong> → <strong>Pages</strong> → under <em>Build and deployment (Source)</em>, select <strong>GitHub Actions</strong>.
                  </li>
                  <li>
                    <strong>Create a Fine-Grained Personal Access Token:</strong> On GitHub.com, go to <strong>Settings</strong> (top-right profile menu) → <strong>Developer settings</strong> → <strong>Personal access tokens</strong> → <strong>Fine-grained tokens</strong> → <strong>Generate new token</strong>:
                    <ul className="pl-5 mt-1 space-y-1 list-disc text-slate-500">
                      <li>
                        <strong>Repository access:</strong> Select <em>Only select repositories</em> and choose your portfolio repository.
                      </li>
                      <li>
                        <strong>Repository permissions:</strong> Set <strong>Contents</strong> to <strong>Read and write</strong> (and optionally <strong>Actions: Read-only</strong>).
                      </li>
                    </ul>
                  </li>
                  <li>
                    <strong>Paste Token Above &amp; Click Publish:</strong> From now on, you can open your live <code className="font-mono">&lt;username&gt;.github.io</code> website from any browser, unlock the Admin CMS, edit or add projects, and click <strong>Save &amp; Auto-Publish to GitHub</strong>. GitHub Actions will automatically build and deploy your changes in ~45 seconds!
                  </li>
                </ol>
              </div>

              <div className="lg:col-span-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-800">
                    Included Workflow: .github/workflows/deploy.yml
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(GITHUB_ACTIONS_WORKFLOW_YAML);
                      setCopiedWorkflowYaml(true);
                      setTimeout(() => setCopiedWorkflowYaml(false), 2500);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedWorkflowYaml ? 'Copied!' : 'Copy YAML'}
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-[250px] leading-relaxed">
                  {GITHUB_ACTIONS_WORKFLOW_YAML}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
