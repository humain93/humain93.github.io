import React, { useState, useRef, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  Download,
  Upload,
  Plus,
  Trash2,
  Eye,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Sliders,
  Layers,
  BookOpen,
  User,
  Compass,
  Award,
  ArrowLeft,
  CloudUpload,
  GitBranch,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Cpu,
  Briefcase,
  Wrench,
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import {
  PortfolioDatabase,
  ResearchProject,
  PublicationItem,
  ResearchInterestPillar,
  ProjectInteractiveModuleType,
  WebsiteSectionControls,
  SimulationsSectionConfig,
  SimulationModuleItemConfig,
  SimulationMode,
  ProjectEquation,
  SystemDiagramNode,
} from '../types/portfolio';
import { MathEquation } from './MathEquation';
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
  | 'simulations'
  | 'sections'
  | 'profile'
  | 'research'
  | 'publications'
  | 'cv'
  | 'github-deploy';

type ProjectEditorSubTab =
  | 'overview'
  | 'narrative'
  | 'interactive'
  | 'metrics-graph'
  | 'equations'
  | 'architecture-docs';

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

export const AdminCmsDashboard: React.FC<AdminCmsDashboardProps> = ({
  initialEditProjectId,
  onExitCms,
  onPreviewProject,
}) => {
  const {
    data,
    isSaving,
    lastSavedAt,
    isAdminAuthenticated,
    adminPasscode,
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
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    initialEditProjectId || null
  );
  const [projectSubTab, setProjectSubTab] = useState<ProjectEditorSubTab>('overview');
  const [projectFilterCategory, setProjectFilterCategory] = useState<string>('All');
  const [newCategoryInput, setNewCategoryInput] = useState<string>('');

  const [draft, setDraft] = useState<PortfolioDatabase>(() =>
    JSON.parse(JSON.stringify(data))
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmResetModal, setConfirmResetModal] = useState(false);

  // GitHub Auto-Publisher state
  const [ghConfig, setGhConfig] = useState<GitHubSyncConfig>(() => loadGitHubSyncConfig());
  const [isPublishingGh, setIsPublishingGh] = useState(false);
  const [isVerifyingGh, setIsVerifyingGh] = useState(false);
  const [ghStatusBanner, setGhStatusBanner] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    commitUrl?: string;
    pagesUrl?: string;
    actionsUrl?: string;
  } | null>(null);
  const [latestWorkflow, setLatestWorkflow] = useState<GitHubWorkflowStatus | null>(null);
  const [copiedWorkflowYaml, setCopiedWorkflowYaml] = useState(false);

  const fileImportRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(JSON.parse(JSON.stringify(data)));
  }, [data]);

  useEffect(() => {
    if (initialEditProjectId) {
      setActiveTab('projects');
      setSelectedProjectId(initialEditProjectId);
    }
  }, [initialEditProjectId]);

  useEffect(() => {
    if (ghConfig.owner && ghConfig.repo) {
      fetchLatestWorkflowRun(ghConfig).then((run) => {
        if (run) setLatestWorkflow(run);
      });
    }
  }, [ghConfig]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Ensure draft has explicit projectCategories array
  const draftCategories: string[] =
    Array.isArray(draft.projectCategories) && draft.projectCategories.length > 0
      ? draft.projectCategories
      : [
          'Nonlinear Dynamics & RL',
          'Thermo-Fluid & Combustion Modeling',
          'Cyber-Physical & Smart Grid Systems',
          'Hybrid Machine Learning Framework for Predictive Maintenance from sensor data',
        ];

  const draftSec: WebsiteSectionControls = {
    ...DEFAULT_SECTION_CONTROLS,
    ...(draft.sectionControls || {}),
  };

  const draftSimCfg: SimulationsSectionConfig = {
    ...DEFAULT_SIMULATIONS_CONFIG,
    ...(draft.simulationsConfig || {}),
    modules:
      draft.simulationsConfig?.modules && draft.simulationsConfig.modules.length > 0
        ? draft.simulationsConfig.modules
        : DEFAULT_SIMULATIONS_CONFIG.modules,
  };

  const updateSectionControls = (patch: Partial<WebsiteSectionControls>) => {
    setDraft((prev) => ({
      ...prev,
      sectionControls: {
        ...DEFAULT_SECTION_CONTROLS,
        ...(prev.sectionControls || {}),
        ...patch,
      },
    }));
  };

  const updateSimulationsConfig = (patch: Partial<SimulationsSectionConfig>) => {
    setDraft((prev) => ({
      ...prev,
      simulationsConfig: {
        ...DEFAULT_SIMULATIONS_CONFIG,
        ...(prev.simulationsConfig || {}),
        modules:
          prev.simulationsConfig?.modules && prev.simulationsConfig.modules.length > 0
            ? prev.simulationsConfig.modules
            : DEFAULT_SIMULATIONS_CONFIG.modules,
        ...patch,
      },
    }));
  };

  const updateSimModule = (
    moduleId: string,
    index: number,
    patch: Partial<SimulationModuleItemConfig>
  ) => {
    const nextModules = draftSimCfg.modules.map((m, idx) =>
      idx === index || m.id === moduleId ? { ...m, ...patch } : m
    );
    updateSimulationsConfig({ modules: nextModules });
  };

  const moveSimModule = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= draftSimCfg.modules.length) return;
    const nextModules = [...draftSimCfg.modules];
    const [item] = nextModules.splice(index, 1);
    nextModules.splice(targetIdx, 0, item);
    updateSimulationsConfig({ modules: nextModules });
  };

  const addSimModule = () => {
    const newMod: SimulationModuleItemConfig = {
      id: 'sindy-rl-cartpole',
      enabled: true,
      tabLabel: `Simulation 0${draftSimCfg.modules.length + 1}`,
      title: `0${draftSimCfg.modules.length + 1}. Custom Dynamical System Simulation`,
      governingEquationLatex: '\\dot{\\mathbf{x}} = \\mathbf{f}(\\mathbf{x}, \\mathbf{u})',
    };
    updateSimulationsConfig({ modules: [...draftSimCfg.modules, newMod] });
    showToast('Added simulation module to Simulations Lab.');
  };

  const deleteSimModule = (index: number) => {
    const nextModules = draftSimCfg.modules.filter((_, idx) => idx !== index);
    updateSimulationsConfig({ modules: nextModules });
    showToast('Removed simulation module.');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const ok = await verifyAdminPasscode(passcodeInput);
    if (!ok) {
      setAuthError('Invalid passcode. Please enter your authorized administrator passcode.');
    } else {
      setPasscodeInput('');
    }
  };

  const handleSaveAll = async (forceGitHubPublish = false) => {
    // Clean empty category strings before saving
    const cleanedCategories = draftCategories.map((c) => c.trim()).filter(Boolean);
    const cleanedDraft: PortfolioDatabase = {
      ...draft,
      projectCategories:
        cleanedCategories.length > 0 ? Array.from(new Set(cleanedCategories)) : draftCategories,
      cv: {
        ...draft.cv,
        lastUpdated: new Date().toISOString().slice(0, 10),
      },
    };
    setDraft(cleanedDraft);

    const ok = await savePortfolioData(cleanedDraft);

    const shouldPushToGitHub =
      (forceGitHubPublish || ghConfig.autoPublishOnSave) &&
      Boolean(ghConfig.owner.trim() && ghConfig.repo.trim() && ghConfig.token.trim());

    if (shouldPushToGitHub) {
      setIsPublishingGh(true);
      setGhStatusBanner({
        type: 'info',
        text: `Committing changes to ${ghConfig.owner}/${ghConfig.repo} (${ghConfig.branch || 'main'})...`,
      });
      const ghRes = await publishPortfolioToGitHub(ghConfig, cleanedDraft);
      setIsPublishingGh(false);

      if (ghRes.ok) {
        setGhStatusBanner({
          type: 'success',
          text: ghRes.message,
          commitUrl: ghRes.commitUrl,
          pagesUrl: ghRes.pagesUrl,
          actionsUrl: ghRes.actionsUrl,
        });
        showToast('Saved locally & committed directly to GitHub Pages!');
        setTimeout(() => {
          fetchLatestWorkflowRun(ghConfig).then((run) => {
            if (run) setLatestWorkflow(run);
          });
        }, 2500);
      } else {
        setGhStatusBanner({
          type: 'error',
          text: ghRes.message,
        });
        showToast('Saved locally, but GitHub commit failed. Check GitHub Sync tab.');
      }
      return;
    }

    if (ok) {
      showToast('All changes saved to workspace (public/data/portfolio.json & defaultPortfolioData.ts).');
    } else {
      showToast('Saved to browser storage.');
    }
  };

  const handleVerifyGitHub = async () => {
    saveGitHubSyncConfig(ghConfig);
    setIsVerifyingGh(true);
    setGhStatusBanner({
      type: 'info',
      text: 'Verifying GitHub repository permissions...',
    });
    const res = await verifyGitHubRepoConnection(ghConfig);
    setIsVerifyingGh(false);

    if (res.ok) {
      setGhStatusBanner({
        type: 'success',
        text: res.message,
        pagesUrl: res.pagesUrl,
      });
      const run = await fetchLatestWorkflowRun(ghConfig);
      if (run) setLatestWorkflow(run);
      showToast('GitHub repository connected & verified!');
    } else {
      setGhStatusBanner({
        type: 'error',
        text: res.message,
      });
    }
  };

  /**
   * Smart File Upload Helper:
   * Uploads PDFs and images to `/public/assets/uploads/<filename>` on the local server
   * AND commits directly to `public/assets/uploads/<filename>` on GitHub if PAT is configured.
   * Never bloats `portfolio.json` with 600KB+ base64 PDF strings.
   */
  const handleFileUploadAsUrl = async (
    file: File | undefined,
    onResult: (url: string, fileName: string) => void
  ) => {
    if (!file) return;

    showToast(`Uploading ${file.name}...`);
    const uploadRes = await uploadAssetFileToGitHub(ghConfig, file, adminPasscode);
    if (uploadRes.ok && uploadRes.assetPath) {
      onResult(uploadRes.assetPath, file.name);
      showToast(uploadRes.message);
      return;
    }

    // Fallback to Data URL only if running offline without Express or GitHub PAT
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onResult(reader.result, file.name);
        showToast(`Loaded ${file.name} into draft. Click "Save All Changes" to persist.`);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- PROJECT CRUD HELPERS ---
  const handleAddNewProject = () => {
    const defaultCategory = draftCategories[0] || 'Nonlinear Dynamics & RL';
    const newId = `proj-${Date.now()}`;
    const newProj: ResearchProject = {
      id: newId,
      slug: `new-research-project-${Date.now()}`,
      title: 'New Research Monograph / Engineering Project',
      subtitle: 'Mathematical Modeling, System Identification & Experimental Validation',
      category: defaultCategory,
      status: 'Published',
      isTemplatePlaceholder: false,
      period: '2025 – Present',
      role: 'Lead Researcher',
      laboratoryOrInstitution: 'Department of Mechanical Engineering',
      heroImage:
        'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=85',
      galleryImages: [
        {
          url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=85',
          caption: 'Figure 1: System architecture and simulation trajectory.',
        },
      ],
      videoEmbedUrl: '',
      githubUrl: '',
      paperUrl: '',
      liveDemoSimulationId: 'none',
      executiveSummary:
        'Concise executive summary of the mathematical formulation, methodology, and quantitative validation results.',
      problemStatement:
        'Detailed explanation of the physical or computational challenge addressed by this research.',
      methodologyArchitecture:
        'Step-by-step technical breakdown of the governing algorithms, physical models, and software stack.',
      experimentalValidation:
        'Summary of empirical benchmarks, error reduction, and comparative performance.',
      equations: [
        {
          id: `eq-${Date.now()}`,
          title: 'Governing Dynamical State Equation',
          latex: '\\dot{\\mathbf{x}}(t) = \\mathbf{f}(\\mathbf{x}(t), \\mathbf{u}(t); \\boldsymbol{\\theta})',
          explanation:
            'State evolution governed by nonlinear vector field parameterized by sparse coefficients.',
        },
      ],
      systemArchitecture: {
        title: 'Closed-Loop Computational Pipeline',
        nodes: [
          {
            id: 'n1',
            label: 'Sensor Data & Trajectories',
            sublabel: 'State & Control Sampling',
            mathLatex: '\\{\\mathbf{x}_k, \\mathbf{u}_k\\}_{k=1}^N',
          },
          {
            id: 'n2',
            label: 'Sparse Dictionary Identification',
            sublabel: 'Regularized Regression',
            mathLatex: '\\boldsymbol{\\Theta}(\\mathbf{X})\\boldsymbol{\\Xi}',
          },
          {
            id: 'n3',
            label: 'Surrogate Rollout & Optimization',
            sublabel: 'Policy / Control Synthesis',
            mathLatex: '\\pi^*(\\mathbf{u}|\\mathbf{x})',
          },
          {
            id: 'n4',
            label: 'Physical Plant Validation',
            sublabel: 'Closed-Loop Deployment',
            mathLatex: 'J(\\pi^*) \\to \\max',
          },
        ],
        feedbackLoopDescription:
          'Active rollout trajectories iteratively refine the surrogate dynamics.',
      },
      simulationMetrics: {
        chartTitle: 'Convergence & Comparative Benchmark Trajectory',
        xAxisLabel: 'Iteration / Evaluation Step',
        yAxisLabel: 'Normalized Performance Metric',
        theoreticalLabel: 'Reference / Analytical Bound',
        empiricalLabel: 'Proposed Framework',
        baselineLabel: 'Conventional Baseline',
        dataPoints: [
          { x: 1, theoretical: 0.95, empirical: 0.65, baseline: 0.45 },
          { x: 2, theoretical: 0.95, empirical: 0.82, baseline: 0.58 },
          { x: 3, theoretical: 0.95, empirical: 0.91, baseline: 0.67 },
          { x: 4, theoretical: 0.95, empirical: 0.94, baseline: 0.72 },
        ],
        keyFindings: [
          {
            label: 'Primary Accuracy / Score',
            value: '94.2%',
            unit: 'accuracy',
            comparison: '+22% vs. Baseline',
          },
          {
            label: 'Sample Efficiency',
            value: '12.5×',
            unit: 'faster',
            comparison: 'Sparse Model Rollouts',
          },
        ],
      },
      hardwareAndSoftwareStack: ['Python', 'PyTorch / NumPy', 'MATLAB / Simulink'],
      documents: [],
      moduleVisibility: {
        showKeyFindings: true,
        showNarrativeBreakdown: true,
        showEquations: true,
        showSystemDiagram: true,
        showPerformanceGraph: true,
        showInteractiveModule: true,
        interactiveModuleType: 'auto',
        showReportSimulator: true,
        showReportCharts: true,
        showReportDiagnosticsOrTables: true,
      },
    };

    setDraft((prev) => ({
      ...prev,
      projectCategories: draftCategories,
      projects: [newProj, ...prev.projects],
    }));
    setSelectedProjectId(newId);
    setProjectSubTab('overview');
    showToast('Created new project draft. Edit fields below and click "Save All Changes".');
  };

  const handleDuplicateProject = (proj: ResearchProject) => {
    const copyId = `proj-${Date.now()}`;
    const copyProj: ResearchProject = {
      ...JSON.parse(JSON.stringify(proj)),
      id: copyId,
      slug: `${proj.slug}-copy-${Date.now().toString().slice(-4)}`,
      title: `${proj.title} (Copy)`,
    };
    setDraft((prev) => ({
      ...prev,
      projects: [copyProj, ...prev.projects],
    }));
    setSelectedProjectId(copyId);
    showToast(`Duplicated "${proj.title}".`);
  };

  const handleMoveProject = (projectId: string, direction: -1 | 1) => {
    const idx = draft.projects.findIndex((p) => p.id === projectId);
    if (idx === -1) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= draft.projects.length) return;
    const nextProjects = [...draft.projects];
    const [moved] = nextProjects.splice(idx, 1);
    nextProjects.splice(targetIdx, 0, moved);
    setDraft((prev) => ({ ...prev, projects: nextProjects }));
  };

  const handleDeleteProject = (projectId: string) => {
    setDraft((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== projectId),
    }));
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    }
    showToast('Project removed from draft. Click "Save All Changes" to commit.');
  };

  const updateProjectField = <K extends keyof ResearchProject>(
    projectId: string,
    field: K,
    value: ResearchProject[K]
  ) => {
    setDraft((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId ? { ...p, [field]: value } : p
      ),
    }));
  };

  // --- CATEGORY CRUD HELPERS (Index-Based so renaming never loses focus or orphans projects) ---
  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (draftCategories.includes(trimmed)) {
      showToast('Category already exists.');
      return;
    }
    setDraft((prev) => ({
      ...prev,
      projectCategories: [...draftCategories, trimmed],
    }));
    setNewCategoryInput('');
    showToast(`Added category "${trimmed}".`);
  };

  const handleRenameCategoryByIndex = (index: number, newName: string) => {
    const oldName = draftCategories[index];
    const nextCategories = [...draftCategories];
    nextCategories[index] = newName;
    setDraft((prev) => ({
      ...prev,
      projectCategories: nextCategories,
      projects: prev.projects.map((p) =>
        p.category === oldName ? { ...p, category: newName } : p
      ),
    }));
  };

  const handleMoveCategory = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= draftCategories.length) return;
    const nextCategories = [...draftCategories];
    const [moved] = nextCategories.splice(index, 1);
    nextCategories.splice(targetIdx, 0, moved);
    setDraft((prev) => ({
      ...prev,
      projectCategories: nextCategories,
    }));
  };

  const handleDeleteCategoryByIndex = (index: number) => {
    if (draftCategories.length <= 1) {
      showToast('At least one project category must remain.');
      return;
    }
    const catToRemove = draftCategories[index];
    const remaining = draftCategories.filter((_, idx) => idx !== index);
    const fallbackCat = remaining[0] || 'General Research';
    setDraft((prev) => ({
      ...prev,
      projectCategories: remaining,
      projects: prev.projects.map((p) =>
        p.category === catToRemove ? { ...p, category: fallbackCat } : p
      ),
    }));
    showToast(`Removed category "${catToRemove}". Assigned its projects to "${fallbackCat}".`);
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 px-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-slate-900 text-white rounded-lg">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Administrator CMS Authentication
              </h1>
              <p className="text-xs text-slate-500">
                Restricted access for portfolio owner only
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed mb-6">
            This administrative dashboard is hidden from public visitors. Enter your administrator passcode to manage projects, categories, simulations, equations, publications, and GitHub Pages synchronization.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Administrator Passcode
              </label>
              <input
                type="password"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder="Enter admin passcode..."
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                autoFocus
              />
              {authError && (
                <p className="text-xs text-red-600 mt-1.5">{authError}</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onExitCms}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                ← Return to Public Website
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                Unlock Admin CMS
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const activeProject = draft.projects.find((p) => p.id === selectedProjectId) || null;
  const isGitHubConfigured = Boolean(
    ghConfig.owner.trim() && ghConfig.repo.trim() && ghConfig.token.trim()
  );

  const visibleProjectsList =
    projectFilterCategory === 'All'
      ? draft.projects
      : draft.projects.filter((p) => p.category === projectFilterCategory);

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2.5 text-xs font-medium border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top CMS Action Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
              ADMIN CMS UNLOCKED
            </span>
            {isGitHubConfigured ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200 rounded">
                <GitBranch className="w-3 h-3" />
                GitHub Sync: {ghConfig.owner}/{ghConfig.repo}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('github-deploy')}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200 rounded hover:bg-amber-100 cursor-pointer"
              >
                <CloudUpload className="w-3 h-3" />
                Connect GitHub Auto-Deploy →
              </button>
            )}
            {lastSavedAt && (
              <span className="text-xs font-mono text-slate-500">
                Last saved at {lastSavedAt}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Portfolio Content, Projects &amp; Simulations Manager
          </h1>
          <p className="text-xs text-slate-500">
            Public visitors cannot see any Admin CMS buttons. Access this dashboard anytime via{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">/#admin</code> or{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Ctrl+Shift+A</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleSaveAll(false)}
            disabled={isSaving || isPublishingGh}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving
              ? 'Saving...'
              : isPublishingGh
              ? 'Publishing to GitHub...'
              : isGitHubConfigured && ghConfig.autoPublishOnSave
              ? 'Save & Sync to GitHub'
              : 'Save All Changes'}
          </button>

          {isGitHubConfigured && !ghConfig.autoPublishOnSave && (
            <button
              type="button"
              onClick={() => handleSaveAll(true)}
              disabled={isSaving || isPublishingGh}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              Push to GitHub Now
            </button>
          )}

          <button
            type="button"
            onClick={exportDatabaseJson}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>

          <input
            ref={fileImportRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = async () => {
                if (typeof reader.result === 'string') {
                  const ok = await importDatabaseJson(reader.result);
                  if (ok) showToast('Database JSON imported and saved!');
                }
              };
              reader.readAsText(file);
            }}
          />
          <button
            type="button"
            onClick={() => fileImportRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Import JSON
          </button>

          <button
            type="button"
            onClick={() => setConfirmResetModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          <button
            type="button"
            onClick={logoutAdmin}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            Lock
          </button>
        </div>
      </div>

      {/* Live GitHub Publish Status Banner */}
      {ghStatusBanner && (
        <div
          className={`mb-6 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            ghStatusBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : ghStatusBanner.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {ghStatusBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : ghStatusBanner.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
            )}
            <span className="font-medium">{ghStatusBanner.text}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {ghStatusBanner.commitUrl && (
              <a
                href={ghStatusBanner.commitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold underline"
              >
                View Commit <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {ghStatusBanner.actionsUrl && (
              <a
                href={ghStatusBanner.actionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold underline"
              >
                Build Progress <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {ghStatusBanner.pagesUrl && (
              <a
                href={ghStatusBanner.pagesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold underline"
              >
                Open Live Site <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4 mb-6">
        {(
          [
            {
              id: 'projects',
              label: `1. Projects Manager (${draft.projects.length})`,
              icon: Layers,
            },
            {
              id: 'simulations',
              label: `2. Simulations Lab (${draftSimCfg.modules.filter((m) => m.enabled).length}/${draftSimCfg.modules.length})`,
              icon: Cpu,
            },
            {
              id: 'sections',
              label: '3. Website Sections',
              icon: Sliders,
            },
            { id: 'profile', label: '4. Profile & Bio', icon: User },
            {
              id: 'research',
              label: `5. Research Interests (${draft.researchInterests.length})`,
              icon: Compass,
            },
            {
              id: 'publications',
              label: `6. Publications (${draft.publications.length})`,
              icon: BookOpen,
            },
            {
              id: 'cv',
              label: '7. CV, Education & Experience',
              icon: Award,
            },
            {
              id: 'github-deploy',
              label: '8. GitHub Sync & Auto-Deploy',
              icon: CloudUpload,
            },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          TAB 1: PROJECTS MANAGER (Categories, Ordering, Sub-modules & Monographs)
         ===================================================================== */}
      {activeTab === 'projects' && (
        <div>
          {!activeProject ? (
            <div className="space-y-6">
              {/* 1A. Project Categories Manager (Index-based so editing never loses focus or orphans projects) */}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-200">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Project Categories &amp; Homepage Filter Tabs
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Add, rename, reorder, or delete categories. Renaming a category automatically updates all projects assigned to it.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftSec.showCategoryFilterBar !== false}
                      onChange={(e) =>
                        updateSectionControls({ showCategoryFilterBar: e.target.checked })
                      }
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Show Category Filter Bar on Homepage
                  </label>
                </div>

                <div className="space-y-2.5 mb-4">
                  {draftCategories.map((cat, idx) => {
                    const count = draft.projects.filter((p) => p.category === cat).length;
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                      >
                        <span className="text-xs font-mono text-slate-400 w-6">
                          #{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={cat}
                          onChange={(e) => handleRenameCategoryByIndex(idx, e.target.value)}
                          placeholder="Category name..."
                          className="flex-1 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-600"
                        />
                        <span className="px-2 py-0.5 text-[11px] font-mono bg-white border border-slate-200 rounded text-slate-600 shrink-0">
                          {count} {count === 1 ? 'project' : 'projects'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(idx, -1)}
                          disabled={idx === 0}
                          title="Move category up"
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(idx, 1)}
                          disabled={idx === draftCategories.length - 1}
                          title="Move category down"
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategoryByIndex(idx)}
                          title="Delete category"
                          className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                    placeholder="New category name (e.g., Robotics & Control)..."
                    className="flex-1 min-w-[240px] px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Category
                  </button>
                </div>
              </div>

              {/* 1B. Projects List & Quick Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    All Research &amp; Engineering Projects ({draft.projects.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Reorder projects, change categories or publish status inline, or click &ldquo;Edit Project &amp; Sub-Modules&rdquo; to edit full technical details.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <select
                    value={projectFilterCategory}
                    onChange={(e) => setProjectFilterCategory(e.target.value)}
                    className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700"
                  >
                    <option value="All">Filter: All Categories ({draft.projects.length})</option>
                    {draftCategories.filter(Boolean).map((cat, i) => (
                      <option key={i} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleAddNewProject}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add New Project
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {visibleProjectsList.map((proj) => {
                  const globalIdx = draft.projects.findIndex((p) => p.id === proj.id);
                  const vis = proj.moduleVisibility || {};
                  return (
                    <div
                      key={proj.id}
                      className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold">
                            #{globalIdx + 1}
                          </span>
                          <select
                            value={proj.status}
                            onChange={(e) =>
                              updateProjectField(
                                proj.id,
                                'status',
                                e.target.value as 'Published' | 'Draft'
                              )
                            }
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border cursor-pointer ${
                              proj.status === 'Published'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            <option value="Published">Published (Visible on Site)</option>
                            <option value="Draft">Draft (Hidden from Site)</option>
                          </select>

                          <select
                            value={proj.category}
                            onChange={(e) =>
                              updateProjectField(proj.id, 'category', e.target.value)
                            }
                            className="px-2.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-xs font-medium cursor-pointer max-w-xs truncate"
                          >
                            {!draftCategories.includes(proj.category) && proj.category && (
                              <option value={proj.category}>{proj.category}</option>
                            )}
                            {draftCategories.filter(Boolean).map((cat, i) => (
                              <option key={i} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>

                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500">{proj.period}</span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900">
                          {proj.title}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {proj.executiveSummary}
                        </p>

                        {/* Sub-module status pills */}
                        <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-500">
                          <span
                            className={
                              vis.showKeyFindings !== false ? 'text-emerald-700' : 'text-slate-400 line-through'
                            }
                          >
                            Metrics ({proj.simulationMetrics.keyFindings.length})
                          </span>
                          <span>·</span>
                          <span
                            className={
                              vis.showEquations !== false ? 'text-emerald-700' : 'text-slate-400 line-through'
                            }
                          >
                            Equations ({proj.equations.length})
                          </span>
                          <span>·</span>
                          <span
                            className={
                              vis.showSystemDiagram !== false ? 'text-emerald-700' : 'text-slate-400 line-through'
                            }
                          >
                            Block Diagram ({proj.systemArchitecture.nodes.length})
                          </span>
                          <span>·</span>
                          <span
                            className={
                              vis.showPerformanceGraph !== false ? 'text-emerald-700' : 'text-slate-400 line-through'
                            }
                          >
                            Graph ({proj.simulationMetrics.dataPoints.length} pts)
                          </span>
                          <span>·</span>
                          <span
                            className={
                              vis.showInteractiveModule !== false ? 'text-blue-700 font-semibold' : 'text-slate-400 line-through'
                            }
                          >
                            Interactive Sim/Report: {vis.interactiveModuleType || 'auto'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleMoveProject(proj.id, -1)}
                            disabled={globalIdx === 0}
                            title="Move Project Up"
                            className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveProject(proj.id, 1)}
                            disabled={globalIdx === draft.projects.length - 1}
                            title="Move Project Down"
                            className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer border-l border-slate-200"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProjectId(proj.id);
                            setProjectSubTab('overview');
                          }}
                          className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          Edit Project &amp; Sub-Modules
                        </button>

                        <button
                          type="button"
                          onClick={() => onPreviewProject(proj.slug)}
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Preview
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicateProject(proj)}
                          title="Duplicate Project"
                          className="p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteProject(proj.id)}
                          title="Delete Project"
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ===============================================================
               SINGLE PROJECT EDITOR WITH 6 ORGANIZED SUB-TABS
               =============================================================== */
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedProjectId(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to All Projects List
                  </button>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    Editing: {activeProject.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onPreviewProject(activeProject.slug)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview Live Page
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveAll(false)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Project Changes
                  </button>
                </div>
              </div>

              {/* 6 Sub-Tabs for Clean, Intuitive Project Editing */}
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 border border-slate-200 rounded-xl">
                {(
                  [
                    { id: 'overview', label: '1. Overview & Media' },
                    { id: 'narrative', label: '2. Narrative & Tech Stack' },
                    { id: 'interactive', label: '3. Interactive Sim & Report' },
                    { id: 'metrics-graph', label: '4. Key Metrics & Performance Graph' },
                    {
                      id: 'equations',
                      label: `5. Governing Equations (${activeProject.equations.length})`,
                    },
                    {
                      id: 'architecture-docs',
                      label: `6. System Diagram & Documents`,
                    },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setProjectSubTab(st.id)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      projectSubTab === st.id
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* SUB-TAB 1: OVERVIEW & MEDIA */}
              {projectSubTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Project Title
                      </label>
                      <input
                        type="text"
                        value={activeProject.title}
                        onChange={(e) =>
                          updateProjectField(activeProject.id, 'title', e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Subtitle / Technical Tagline
                      </label>
                      <input
                        type="text"
                        value={activeProject.subtitle}
                        onChange={(e) =>
                          updateProjectField(activeProject.id, 'subtitle', e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        URL Slug (unique identifier)
                      </label>
                      <input
                        type="text"
                        value={activeProject.slug}
                        onChange={(e) =>
                          updateProjectField(activeProject.id, 'slug', e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Category (Select existing or type custom below)
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={
                            draftCategories.includes(activeProject.category)
                              ? activeProject.category
                              : '__custom__'
                          }
                          onChange={(e) => {
                            if (e.target.value !== '__custom__') {
                              updateProjectField(activeProject.id, 'category', e.target.value);
                            }
                          }}
                          className="w-1/2 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                        >
                          {draftCategories.filter(Boolean).map((cat, i) => (
                            <option key={i} value={cat}>
                              {cat}
                            </option>
                          ))}
                          <option value="__custom__">Custom Category...</option>
                        </select>
                        <input
                          type="text"
                          value={activeProject.category}
                          onChange={(e) =>
                            updateProjectField(activeProject.id, 'category', e.target.value)
                          }
                          placeholder="Category name..."
                          className="w-1/2 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Period / Timeline
                      </label>
                      <input
                        type="text"
                        value={activeProject.period}
                        onChange={(e) =>
                          updateProjectField(activeProject.id, 'period', e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Role &amp; Co-Authors
                      </label>
                      <input
                        type="text"
                        value={activeProject.role}
                        onChange={(e) =>
                          updateProjectField(activeProject.id, 'role', e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Laboratory / Institution / Conference Venue
                      </label>
                      <input
                        type="text"
                        value={activeProject.laboratoryOrInstitution}
                        onChange={(e) =>
                          updateProjectField(
                            activeProject.id,
                            'laboratoryOrInstitution',
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Visibility Status
                      </label>
                      <select
                        value={activeProject.status}
                        onChange={(e) =>
                          updateProjectField(
                            activeProject.id,
                            'status',
                            e.target.value as 'Published' | 'Draft'
                          )
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="Published">Published (Visible on Website)</option>
                        <option value="Draft">Draft (Hidden from Public View)</option>
                      </select>
                    </div>
                  </div>

                  {/* Media, Figures & External Links */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-slate-700 font-semibold">
                      Hero Image, Primary Figure Caption, Paper PDF &amp; Links
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Hero Image URL or Uploaded Path
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={activeProject.heroImage}
                            onChange={(e) =>
                              updateProjectField(
                                activeProject.id,
                                'heroImage',
                                e.target.value
                              )
                            }
                            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                          />
                          <label className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer shrink-0">
                            <ImageIcon className="w-3.5 h-3.5" />
                            Upload
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleFileUploadAsUrl(e.target.files?.[0], (url) =>
                                  updateProjectField(activeProject.id, 'heroImage', url)
                                )
                              }
                            />
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Hero Figure Caption
                        </label>
                        <input
                          type="text"
                          value={activeProject.galleryImages[0]?.caption || ''}
                          onChange={(e) => {
                            const nextGallery = [...activeProject.galleryImages];
                            if (nextGallery[0]) {
                              nextGallery[0] = {
                                ...nextGallery[0],
                                url: activeProject.heroImage,
                                caption: e.target.value,
                              };
                            } else {
                              nextGallery.push({
                                url: activeProject.heroImage,
                                caption: e.target.value,
                              });
                            }
                            updateProjectField(
                              activeProject.id,
                              'galleryImages',
                              nextGallery
                            );
                          }}
                          placeholder="Figure 1: Caption describing the primary figure..."
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Published Paper / Technical Report PDF (URL or Upload)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={activeProject.paperUrl || ''}
                            onChange={(e) =>
                              updateProjectField(activeProject.id, 'paperUrl', e.target.value)
                            }
                            placeholder="/assets/aistudio/... or https://..."
                            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                          />
                          <label className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer shrink-0">
                            <FileText className="w-3.5 h-3.5" />
                            Upload PDF
                            <input
                              type="file"
                              accept=".pdf"
                              className="hidden"
                              onChange={(e) =>
                                handleFileUploadAsUrl(e.target.files?.[0], (url) =>
                                  updateProjectField(activeProject.id, 'paperUrl', url)
                                )
                              }
                            />
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          GitHub Repository URL (Optional)
                        </label>
                        <input
                          type="text"
                          value={activeProject.githubUrl || ''}
                          onChange={(e) =>
                            updateProjectField(
                              activeProject.id,
                              'githubUrl',
                              e.target.value
                            )
                          }
                          placeholder="https://github.com/..."
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Video Demonstration Embed URL (Optional YouTube / MP4 embed URL)
                        </label>
                        <input
                          type="text"
                          value={activeProject.videoEmbedUrl || ''}
                          onChange={(e) =>
                            updateProjectField(
                              activeProject.id,
                              'videoEmbedUrl',
                              e.target.value
                            )
                          }
                          placeholder="https://www.youtube.com/embed/..."
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: NARRATIVE & TECH STACK */}
              {projectSubTab === 'narrative' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Show 3-Column Narrative Breakdown on Project Page
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Controls visibility of 01. Problem Addressed, 02. Methodology, and 03. Results &amp; Impact.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={
                        activeProject.moduleVisibility?.showNarrativeBreakdown !== false
                      }
                      onChange={(e) =>
                        updateProjectField(activeProject.id, 'moduleVisibility', {
                          ...(activeProject.moduleVisibility || {}),
                          showNarrativeBreakdown: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-slate-300 text-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Executive Summary (Shown on both Homepage Card &amp; Monograph Header)
                    </label>
                    <textarea
                      rows={3}
                      value={activeProject.executiveSummary}
                      onChange={(e) =>
                        updateProjectField(
                          activeProject.id,
                          'executiveSummary',
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      01. Problem Addressed &amp; Motivation
                    </label>
                    <textarea
                      rows={4}
                      value={activeProject.problemStatement}
                      onChange={(e) =>
                        updateProjectField(
                          activeProject.id,
                          'problemStatement',
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      02. Methodology, Architecture &amp; Computational Pipeline
                    </label>
                    <textarea
                      rows={5}
                      value={activeProject.methodologyArchitecture}
                      onChange={(e) =>
                        updateProjectField(
                          activeProject.id,
                          'methodologyArchitecture',
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      03. Experimental Validation, Quantitative Results &amp; Impact
                    </label>
                    <textarea
                      rows={4}
                      value={activeProject.experimentalValidation}
                      onChange={(e) =>
                        updateProjectField(
                          activeProject.id,
                          'experimentalValidation',
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Hardware, Tools &amp; Software Stack (Comma-separated list)
                    </label>
                    <input
                      type="text"
                      value={activeProject.hardwareAndSoftwareStack.join(', ')}
                      onChange={(e) =>
                        updateProjectField(
                          activeProject.id,
                          'hardwareAndSoftwareStack',
                          e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean)
                        )
                      }
                      placeholder="Python, PyTorch, Ray RLlib, PostgreSQL / PostGIS..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: INTERACTIVE SIM & REPORT CONTROLS */}
              {projectSubTab === 'interactive' && (
                <div className="space-y-6">
                  <div className="p-5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Project-Page Interactive Simulation &amp; Technical Report Configuration
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Choose which interactive simulation or multi-tab research report appears at the bottom of this project&apos;s detail page, and toggle its sub-components.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Project Detail Page Interactive Module
                        </label>
                        <select
                          value={
                            activeProject.moduleVisibility?.interactiveModuleType || 'auto'
                          }
                          onChange={(e) =>
                            updateProjectField(activeProject.id, 'moduleVisibility', {
                              ...(activeProject.moduleVisibility || {}),
                              interactiveModuleType: e.target
                                .value as ProjectInteractiveModuleType,
                              showInteractiveModule: e.target.value !== 'none',
                            })
                          }
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                        >
                          <option value="auto">
                            Auto-Detect from Project ID / Slug (Default)
                          </option>
                          <option value="sindy-rl-report">
                            SINDy-RL Full Interactive Research Report &amp; Swing-Up Simulator
                          </option>
                          <option value="si-engine-report">
                            SI Engine Heat Transfer Full Thesis Report &amp; Crank-Angle Simulator
                          </option>
                          <option value="predictive-maintenance-report">
                            Hybrid RF-ANN Predictive Maintenance Report &amp; Live Sensor Inference
                          </option>
                          <option value="sindy-rl-cartpole">
                            Standalone SINDy-RL CartPole Dynamical Simulator
                          </option>
                          <option value="si-engine-heat-transfer">
                            Standalone Two-Zone SI Engine Heat Transfer Simulator
                          </option>
                          <option value="grid-digital-twin">
                            Standalone NESCO 2M-Meter Utility Grid &amp; Sensor ML Simulator
                          </option>
                          <option value="none">
                            None (Hide Interactive Report / Simulation on this Project Page)
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Homepage Project Card &ldquo;Interactive Sim&rdquo; Quick-Jump Button
                        </label>
                        <select
                          value={activeProject.liveDemoSimulationId || 'none'}
                          onChange={(e) =>
                            updateProjectField(
                              activeProject.id,
                              'liveDemoSimulationId',
                              e.target.value as
                                | 'sindy-rl-cartpole'
                                | 'si-engine-heat-transfer'
                                | 'grid-digital-twin'
                                | 'none'
                            )
                          }
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                        >
                          <option value="none">
                            None (Do not show Quick-Jump Sim button on Homepage card)
                          </option>
                          <option value="sindy-rl-cartpole">
                            Jump to SINDy-RL CartPole Simulation Tab
                          </option>
                          <option value="si-engine-heat-transfer">
                            Jump to SI Engine Heat Transfer Simulation Tab
                          </option>
                          <option value="grid-digital-twin">
                            Jump to Digital Twin &amp; Sensor ML Simulation Tab
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Granular Sub-Component Toggles inside the Interactive Report */}
                    <div className="pt-3 border-t border-blue-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {(
                        [
                          {
                            key: 'showInteractiveModule',
                            label: 'Master Enable Interactive Module',
                          },
                          {
                            key: 'showReportSimulator',
                            label: 'Show Interactive Physics / ML Simulator',
                          },
                          {
                            key: 'showReportCharts',
                            label: 'Show Quantitative Charts & Curves',
                          },
                          {
                            key: 'showReportDiagnosticsOrTables',
                            label: 'Show Diagnostic Matrices & Tables',
                          },
                        ] as const
                      ).map((item) => {
                        const currentVis = activeProject.moduleVisibility || {};
                        const isChecked = currentVis[item.key] !== false;
                        return (
                          <label
                            key={item.key}
                            className="flex items-center gap-2.5 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-blue-400 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) =>
                                updateProjectField(
                                  activeProject.id,
                                  'moduleVisibility',
                                  {
                                    ...currentVis,
                                    [item.key]: e.target.checked,
                                  }
                                )
                              }
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs font-medium text-slate-800">
                              {item.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 4: KEY METRICS & PERFORMANCE GRAPH */}
              {projectSubTab === 'metrics-graph' && (
                <div className="space-y-8">
                  {/* 4A. Key Findings & Quantitative Metrics Editor */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-bold text-slate-900">
                          Critical Findings &amp; Key Metrics Cards (
                          {activeProject.simulationMetrics.keyFindings.length})
                        </h3>
                        <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={
                              activeProject.moduleVisibility?.showKeyFindings !== false
                            }
                            onChange={(e) =>
                              updateProjectField(activeProject.id, 'moduleVisibility', {
                                ...(activeProject.moduleVisibility || {}),
                                showKeyFindings: e.target.checked,
                              })
                            }
                            className="rounded border-slate-300 text-blue-600"
                          />
                          Show Key Findings Panel
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const nextMetrics = {
                            ...activeProject.simulationMetrics,
                            keyFindings: [
                              ...activeProject.simulationMetrics.keyFindings,
                              {
                                label: 'New Metric Label',
                                value: '99.0%',
                                unit: 'unit',
                                comparison: 'Benchmark Note',
                              },
                            ],
                          };
                          updateProjectField(
                            activeProject.id,
                            'simulationMetrics',
                            nextMetrics
                          );
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Metric Card
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeProject.simulationMetrics.keyFindings.map((kf, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-slate-500">
                              Metric Card #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const nextKf =
                                  activeProject.simulationMetrics.keyFindings.filter(
                                    (_, i) => i !== idx
                                  );
                                updateProjectField(
                                  activeProject.id,
                                  'simulationMetrics',
                                  {
                                    ...activeProject.simulationMetrics,
                                    keyFindings: nextKf,
                                  }
                                );
                              }}
                              className="text-xs text-red-600 hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-2">
                              <label className="block text-[11px] text-slate-500">
                                Metric Label
                              </label>
                              <input
                                type="text"
                                value={kf.label}
                                onChange={(e) => {
                                  const nextKf = [
                                    ...activeProject.simulationMetrics.keyFindings,
                                  ];
                                  nextKf[idx] = { ...kf, label: e.target.value };
                                  updateProjectField(
                                    activeProject.id,
                                    'simulationMetrics',
                                    {
                                      ...activeProject.simulationMetrics,
                                      keyFindings: nextKf,
                                    }
                                  );
                                }}
                                placeholder="e.g., Peak Return"
                                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-500">
                                Value
                              </label>
                              <input
                                type="text"
                                value={kf.value}
                                onChange={(e) => {
                                  const nextKf = [
                                    ...activeProject.simulationMetrics.keyFindings,
                                  ];
                                  nextKf[idx] = { ...kf, value: e.target.value };
                                  updateProjectField(
                                    activeProject.id,
                                    'simulationMetrics',
                                    {
                                      ...activeProject.simulationMetrics,
                                      keyFindings: nextKf,
                                    }
                                  );
                                }}
                                placeholder="e.g., 588.8"
                                className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-500">
                                Unit
                              </label>
                              <input
                                type="text"
                                value={kf.unit}
                                onChange={(e) => {
                                  const nextKf = [
                                    ...activeProject.simulationMetrics.keyFindings,
                                  ];
                                  nextKf[idx] = { ...kf, unit: e.target.value };
                                  updateProjectField(
                                    activeProject.id,
                                    'simulationMetrics',
                                    {
                                      ...activeProject.simulationMetrics,
                                      keyFindings: nextKf,
                                    }
                                  );
                                }}
                                placeholder="e.g., reward"
                                className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-[11px] text-slate-500">
                                Comparison / Context Note
                              </label>
                              <input
                                type="text"
                                value={kf.comparison}
                                onChange={(e) => {
                                  const nextKf = [
                                    ...activeProject.simulationMetrics.keyFindings,
                                  ];
                                  nextKf[idx] = { ...kf, comparison: e.target.value };
                                  updateProjectField(
                                    activeProject.id,
                                    'simulationMetrics',
                                    {
                                      ...activeProject.simulationMetrics,
                                      keyFindings: nextKf,
                                    }
                                  );
                                }}
                                placeholder="e.g., Update 32 Evaluation"
                                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4B. Quantitative Performance Graph & Data Points Editor */}
                  <div className="pt-6 border-t border-slate-200 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <BarChart3 className="w-4 h-4 text-blue-600" />
                          Quantitative Performance Graph &amp; Data Points (
                          {activeProject.simulationMetrics.dataPoints.length} pts)
                        </h3>
                        <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={
                              activeProject.moduleVisibility?.showPerformanceGraph !==
                              false
                            }
                            onChange={(e) =>
                              updateProjectField(activeProject.id, 'moduleVisibility', {
                                ...(activeProject.moduleVisibility || {}),
                                showPerformanceGraph: e.target.checked,
                              })
                            }
                            className="rounded border-slate-300 text-blue-600"
                          />
                          Show Graph on Project Page
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const pts = activeProject.simulationMetrics.dataPoints;
                          const nextX = pts.length > 0 ? pts[pts.length - 1].x + 1 : 1;
                          updateProjectField(activeProject.id, 'simulationMetrics', {
                            ...activeProject.simulationMetrics,
                            dataPoints: [
                              ...pts,
                              {
                                x: nextX,
                                empirical: 0.9,
                                theoretical: 0.95,
                                baseline: 0.7,
                              },
                            ],
                          });
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Data Point
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Chart Title
                        </label>
                        <input
                          type="text"
                          value={activeProject.simulationMetrics.chartTitle}
                          onChange={(e) =>
                            updateProjectField(activeProject.id, 'simulationMetrics', {
                              ...activeProject.simulationMetrics,
                              chartTitle: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          X-Axis Label
                        </label>
                        <input
                          type="text"
                          value={activeProject.simulationMetrics.xAxisLabel}
                          onChange={(e) =>
                            updateProjectField(activeProject.id, 'simulationMetrics', {
                              ...activeProject.simulationMetrics,
                              xAxisLabel: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Primary Curve Label (Blue Line)
                        </label>
                        <input
                          type="text"
                          value={activeProject.simulationMetrics.empiricalLabel}
                          onChange={(e) =>
                            updateProjectField(activeProject.id, 'simulationMetrics', {
                              ...activeProject.simulationMetrics,
                              empiricalLabel: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Reference Curve Label (Dark Line)
                        </label>
                        <input
                          type="text"
                          value={activeProject.simulationMetrics.theoreticalLabel}
                          onChange={(e) =>
                            updateProjectField(activeProject.id, 'simulationMetrics', {
                              ...activeProject.simulationMetrics,
                              theoreticalLabel: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Baseline Curve Label (Dashed Line)
                        </label>
                        <input
                          type="text"
                          value={activeProject.simulationMetrics.baselineLabel || ''}
                          onChange={(e) =>
                            updateProjectField(activeProject.id, 'simulationMetrics', {
                              ...activeProject.simulationMetrics,
                              baselineLabel: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Data Points Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono">
                            <th className="py-2 px-3">#</th>
                            <th className="py-2 px-3">X Value</th>
                            <th className="py-2 px-3">
                              Empirical ({activeProject.simulationMetrics.empiricalLabel || 'Model'})
                            </th>
                            <th className="py-2 px-3">
                              Reference ({activeProject.simulationMetrics.theoreticalLabel || 'Ref'})
                            </th>
                            <th className="py-2 px-3">
                              Baseline ({activeProject.simulationMetrics.baselineLabel || 'Baseline'})
                            </th>
                            <th className="py-2 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {activeProject.simulationMetrics.dataPoints.map((pt, idx) => (
                            <tr key={idx}>
                              <td className="py-2 px-3 font-mono text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  step="any"
                                  value={pt.x}
                                  onChange={(e) => {
                                    const nextPts = [
                                      ...activeProject.simulationMetrics.dataPoints,
                                    ];
                                    nextPts[idx] = {
                                      ...pt,
                                      x: Number(e.target.value),
                                    };
                                    updateProjectField(
                                      activeProject.id,
                                      'simulationMetrics',
                                      {
                                        ...activeProject.simulationMetrics,
                                        dataPoints: nextPts,
                                      }
                                    );
                                  }}
                                  className="w-24 px-2 py-1 font-mono border border-slate-300 rounded"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  step="any"
                                  value={pt.empirical}
                                  onChange={(e) => {
                                    const nextPts = [
                                      ...activeProject.simulationMetrics.dataPoints,
                                    ];
                                    nextPts[idx] = {
                                      ...pt,
                                      empirical: Number(e.target.value),
                                    };
                                    updateProjectField(
                                      activeProject.id,
                                      'simulationMetrics',
                                      {
                                        ...activeProject.simulationMetrics,
                                        dataPoints: nextPts,
                                      }
                                    );
                                  }}
                                  className="w-28 px-2 py-1 font-mono border border-slate-300 rounded"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  step="any"
                                  value={pt.theoretical}
                                  onChange={(e) => {
                                    const nextPts = [
                                      ...activeProject.simulationMetrics.dataPoints,
                                    ];
                                    nextPts[idx] = {
                                      ...pt,
                                      theoretical: Number(e.target.value),
                                    };
                                    updateProjectField(
                                      activeProject.id,
                                      'simulationMetrics',
                                      {
                                        ...activeProject.simulationMetrics,
                                        dataPoints: nextPts,
                                      }
                                    );
                                  }}
                                  className="w-28 px-2 py-1 font-mono border border-slate-300 rounded"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  step="any"
                                  value={pt.baseline ?? ''}
                                  onChange={(e) => {
                                    const nextPts = [
                                      ...activeProject.simulationMetrics.dataPoints,
                                    ];
                                    nextPts[idx] = {
                                      ...pt,
                                      baseline:
                                        e.target.value === ''
                                          ? undefined
                                          : Number(e.target.value),
                                    };
                                    updateProjectField(
                                      activeProject.id,
                                      'simulationMetrics',
                                      {
                                        ...activeProject.simulationMetrics,
                                        dataPoints: nextPts,
                                      }
                                    );
                                  }}
                                  className="w-28 px-2 py-1 font-mono border border-slate-300 rounded"
                                />
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextPts =
                                      activeProject.simulationMetrics.dataPoints.filter(
                                        (_, i) => i !== idx
                                      );
                                    updateProjectField(
                                      activeProject.id,
                                      'simulationMetrics',
                                      {
                                        ...activeProject.simulationMetrics,
                                        dataPoints: nextPts,
                                      }
                                    );
                                  }}
                                  className="text-red-600 hover:underline cursor-pointer"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 5: GOVERNING EQUATIONS (LaTeX) */}
              {projectSubTab === 'equations' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-bold text-slate-900">
                        Governing Mathematical Equations ({activeProject.equations.length})
                      </h3>
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeProject.moduleVisibility?.showEquations !== false}
                          onChange={(e) =>
                            updateProjectField(activeProject.id, 'moduleVisibility', {
                              ...(activeProject.moduleVisibility || {}),
                              showEquations: e.target.checked,
                            })
                          }
                          className="rounded border-slate-300 text-blue-600"
                        />
                        Show Equations Section on Project Page
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newEq: ProjectEquation = {
                          id: `eq-${Date.now()}`,
                          title: 'New Mathematical Formulation',
                          latex: '\\mathbf{y} = \\mathbf{A}\\mathbf{x} + \\mathbf{b}',
                          explanation: 'Physical interpretation of variables and terms.',
                        };
                        updateProjectField(activeProject.id, 'equations', [
                          ...activeProject.equations,
                          newEq,
                        ]);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add LaTeX Equation
                    </button>
                  </div>

                  <div className="space-y-4">
                    {activeProject.equations.map((eq, idx) => (
                      <div
                        key={eq.id || idx}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={eq.title}
                            onChange={(e) => {
                              const nextEqs = [...activeProject.equations];
                              nextEqs[idx] = { ...eq, title: e.target.value };
                              updateProjectField(activeProject.id, 'equations', nextEqs);
                            }}
                            placeholder="Equation Title..."
                            className="flex-1 px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nextEqs = activeProject.equations.filter(
                                (_, i) => i !== idx
                              );
                              updateProjectField(activeProject.id, 'equations', nextEqs);
                            }}
                            className="text-xs text-red-600 hover:underline cursor-pointer shrink-0"
                          >
                            Delete Equation
                          </button>
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-slate-500 mb-1">
                            LaTeX Expression:
                          </label>
                          <input
                            type="text"
                            value={eq.latex}
                            onChange={(e) => {
                              const nextEqs = [...activeProject.equations];
                              nextEqs[idx] = { ...eq, latex: e.target.value };
                              updateProjectField(activeProject.id, 'equations', nextEqs);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                          />
                        </div>

                        <div className="p-3 bg-white border border-slate-200 rounded overflow-x-auto">
                          <div className="text-[10px] font-mono text-slate-400 mb-1">
                            Live KaTeX Preview:
                          </div>
                          <MathEquation latex={eq.latex} block />
                        </div>

                        <textarea
                          rows={2}
                          value={eq.explanation}
                          onChange={(e) => {
                            const nextEqs = [...activeProject.equations];
                            nextEqs[idx] = { ...eq, explanation: e.target.value };
                            updateProjectField(activeProject.id, 'equations', nextEqs);
                          }}
                          placeholder="Physical explanation of terms..."
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUB-TAB 6: SYSTEM DIAGRAM & DOCUMENTS */}
              {projectSubTab === 'architecture-docs' && (
                <div className="space-y-8">
                  {/* System Block Diagram Nodes */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-bold text-slate-900">
                          System Architecture Block Diagram Stages (
                          {activeProject.systemArchitecture.nodes.length})
                        </h3>
                        <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={
                              activeProject.moduleVisibility?.showSystemDiagram !== false
                            }
                            onChange={(e) =>
                              updateProjectField(activeProject.id, 'moduleVisibility', {
                                ...(activeProject.moduleVisibility || {}),
                                showSystemDiagram: e.target.checked,
                              })
                            }
                            className="rounded border-slate-300 text-blue-600"
                          />
                          Show System Diagram on Project Page
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const newNode: SystemDiagramNode = {
                            id: `node-${Date.now()}`,
                            label: 'New Pipeline Stage',
                            sublabel: 'Stage Description',
                            mathLatex: '\\mathbf{x}_k',
                          };
                          updateProjectField(activeProject.id, 'systemArchitecture', {
                            ...activeProject.systemArchitecture,
                            nodes: [...activeProject.systemArchitecture.nodes, newNode],
                          });
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Diagram Stage
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Diagram Pipeline Title
                        </label>
                        <input
                          type="text"
                          value={activeProject.systemArchitecture.title}
                          onChange={(e) =>
                            updateProjectField(activeProject.id, 'systemArchitecture', {
                              ...activeProject.systemArchitecture,
                              title: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Iterative Feedback Loop Description
                        </label>
                        <input
                          type="text"
                          value={
                            activeProject.systemArchitecture.feedbackLoopDescription || ''
                          }
                          onChange={(e) =>
                            updateProjectField(activeProject.id, 'systemArchitecture', {
                              ...activeProject.systemArchitecture,
                              feedbackLoopDescription: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeProject.systemArchitecture.nodes.map((node, idx) => (
                        <div
                          key={node.id || idx}
                          className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-slate-500">
                              STAGE 0{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const nextNodes =
                                  activeProject.systemArchitecture.nodes.filter(
                                    (_, i) => i !== idx
                                  );
                                updateProjectField(
                                  activeProject.id,
                                  'systemArchitecture',
                                  {
                                    ...activeProject.systemArchitecture,
                                    nodes: nextNodes,
                                  }
                                );
                              }}
                              className="text-xs text-red-600 hover:underline cursor-pointer"
                            >
                              Remove Stage
                            </button>
                          </div>
                          <input
                            type="text"
                            value={node.label}
                            onChange={(e) => {
                              const nextNodes = [
                                ...activeProject.systemArchitecture.nodes,
                              ];
                              nextNodes[idx] = { ...node, label: e.target.value };
                              updateProjectField(
                                activeProject.id,
                                'systemArchitecture',
                                {
                                  ...activeProject.systemArchitecture,
                                  nodes: nextNodes,
                                }
                              );
                            }}
                            placeholder="Stage Title"
                            className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded bg-white"
                          />
                          <input
                            type="text"
                            value={node.sublabel}
                            onChange={(e) => {
                              const nextNodes = [
                                ...activeProject.systemArchitecture.nodes,
                              ];
                              nextNodes[idx] = { ...node, sublabel: e.target.value };
                              updateProjectField(
                                activeProject.id,
                                'systemArchitecture',
                                {
                                  ...activeProject.systemArchitecture,
                                  nodes: nextNodes,
                                }
                              );
                            }}
                            placeholder="Sublabel"
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                          />
                          <input
                            type="text"
                            value={node.mathLatex || ''}
                            onChange={(e) => {
                              const nextNodes = [
                                ...activeProject.systemArchitecture.nodes,
                              ];
                              nextNodes[idx] = { ...node, mathLatex: e.target.value };
                              updateProjectField(
                                activeProject.id,
                                'systemArchitecture',
                                {
                                  ...activeProject.systemArchitecture,
                                  nodes: nextNodes,
                                }
                              );
                            }}
                            placeholder="LaTeX formula inside block (optional)"
                            className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Attached Documents */}
                  <div className="pt-6 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">
                        Attached Reports, Slides &amp; Supplementary PDFs (
                        {(activeProject.documents || []).length})
                      </h3>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        Upload Document / PDF
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            handleFileUploadAsUrl(file, (url, fileName) => {
                              const newDoc = {
                                title: fileName.replace(/\.[^/.]+$/, ''),
                                type: 'PDF Report',
                                url,
                              };
                              updateProjectField(activeProject.id, 'documents', [
                                ...(activeProject.documents || []),
                                newDoc,
                              ]);
                            });
                          }}
                        />
                      </label>
                    </div>

                    {(activeProject.documents || []).length > 0 && (
                      <div className="space-y-2">
                        {(activeProject.documents || []).map((doc, idx) => (
                          <div
                            key={idx}
                            className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                              <input
                                type="text"
                                value={doc.title}
                                onChange={(e) => {
                                  const nextDocs = [...(activeProject.documents || [])];
                                  nextDocs[idx] = { ...doc, title: e.target.value };
                                  updateProjectField(
                                    activeProject.id,
                                    'documents',
                                    nextDocs
                                  );
                                }}
                                className="flex-1 px-2 py-1 text-xs font-medium bg-white border border-slate-300 rounded"
                              />
                              <span className="text-[11px] font-mono text-slate-400 truncate max-w-[160px]">
                                ({doc.type})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const nextDocs = (activeProject.documents || []).filter(
                                  (_, i) => i !== idx
                                );
                                updateProjectField(
                                  activeProject.id,
                                  'documents',
                                  nextDocs
                                );
                              }}
                              className="text-xs text-red-600 hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 2: SIMULATIONS LAB MANAGER (Homepage & Project-Page Simulations)
         ===================================================================== */}
      {activeTab === 'simulations' && (
        <div className="space-y-6">
          {/* 2A. Homepage Interactive Simulations Lab Master Configuration */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Homepage Interactive Simulations Lab Section
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure the interactive mathematical &amp; physical simulations showcase on your homepage. You can add, edit, reorder, enable/disable, or delete individual simulation modules.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-900 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={
                    draftSimCfg.enabled !== false &&
                    draftSec.showSimulationsSection !== false
                  }
                  onChange={(e) => {
                    updateSimulationsConfig({ enabled: e.target.checked });
                    updateSectionControls({ showSimulationsSection: e.target.checked });
                  }}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Show Simulations Section on Homepage
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Section Kicker (Monospace Header Label)
                </label>
                <input
                  type="text"
                  value={draftSimCfg.sectionKicker}
                  onChange={(e) =>
                    updateSimulationsConfig({ sectionKicker: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Section Main Heading
                </label>
                <input
                  type="text"
                  value={draftSimCfg.sectionTitle}
                  onChange={(e) =>
                    updateSimulationsConfig({ sectionTitle: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Section Subtitle / Instructions
                </label>
                <input
                  type="text"
                  value={draftSimCfg.sectionDescription}
                  onChange={(e) =>
                    updateSimulationsConfig({ sectionDescription: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* Individual Simulation Modules List */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
                  Simulation Lab Modules ({draftSimCfg.modules.length})
                </div>
                <button
                  type="button"
                  onClick={addSimModule}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Simulation Module
                </button>
              </div>

              {draftSimCfg.modules.map((mod, idx) => (
                <div
                  key={`${mod.id}-${idx}`}
                  className={`p-5 rounded-xl border transition-colors ${
                    mod.enabled
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-slate-100/60 border-slate-200 opacity-75'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-200">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={mod.enabled}
                          onChange={(e) =>
                            updateSimModule(mod.id, idx, { enabled: e.target.checked })
                          }
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-bold text-slate-900">
                          {mod.tabLabel}
                        </span>
                      </label>

                      <select
                        value={mod.id}
                        onChange={(e) =>
                          updateSimModule(mod.id, idx, {
                            id: e.target.value as SimulationModuleItemConfig['id'],
                          })
                        }
                        className="px-2.5 py-1 text-xs font-mono bg-white border border-slate-300 rounded text-slate-700"
                      >
                        <option value="sindy-rl-cartpole">
                          Engine: SINDy-RL CartPole Swing-Up (RK4 + Learned Dictionary)
                        </option>
                        <option value="si-engine-heat-transfer">
                          Engine: Two-Zone SI Engine Heat Transfer (5 Correlations)
                        </option>
                        <option value="grid-digital-twin">
                          Engine: Utility Grid Digital Twin &amp; Hybrid RF-ANN Sensor ML
                        </option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 text-[11px] font-mono rounded ${
                          mod.enabled
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {mod.enabled ? 'ACTIVE ON HOMEPAGE' : 'HIDDEN'}
                      </span>

                      <button
                        type="button"
                        onClick={() => moveSimModule(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSimModule(idx, 1)}
                        disabled={idx === draftSimCfg.modules.length - 1}
                        className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSimModule(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Tab Selector Button Label
                      </label>
                      <input
                        type="text"
                        value={mod.tabLabel}
                        onChange={(e) =>
                          updateSimModule(mod.id, idx, { tabLabel: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Simulation Banner Title
                      </label>
                      <input
                        type="text"
                        value={mod.title}
                        onChange={(e) =>
                          updateSimModule(mod.id, idx, { title: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Governing Equation LaTeX (Displayed in Simulation Header)
                      </label>
                      <input
                        type="text"
                        value={mod.governingEquationLatex}
                        onChange={(e) =>
                          updateSimModule(mod.id, idx, {
                            governingEquationLatex: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
                      />
                      <div className="mt-2 p-2.5 bg-white border border-slate-200 rounded overflow-x-auto">
                        <MathEquation
                          latex={mod.governingEquationLatex}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2B. Project-Page Interactive Reports & Simulators Matrix */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Project-Page Interactive Reports &amp; Simulators Matrix
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Quickly assign or toggle the interactive report / simulator embedded inside each project&apos;s dedicated monograph page.
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="py-3 px-4 font-semibold">Project Title</th>
                    <th className="py-3 px-4 font-semibold">
                      Project Page Interactive Module
                    </th>
                    <th className="py-3 px-4 font-semibold">Simulator</th>
                    <th className="py-3 px-4 font-semibold">Charts</th>
                    <th className="py-3 px-4 font-semibold">Tables / Diagnostics</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {draft.projects.map((proj) => {
                    const vis = proj.moduleVisibility || {};
                    return (
                      <tr key={proj.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">
                          {proj.title}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={vis.interactiveModuleType || 'auto'}
                            onChange={(e) =>
                              updateProjectField(proj.id, 'moduleVisibility', {
                                ...vis,
                                interactiveModuleType: e.target
                                  .value as ProjectInteractiveModuleType,
                                showInteractiveModule: e.target.value !== 'none',
                              })
                            }
                            className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                          >
                            <option value="auto">Auto-Detect (Default)</option>
                            <option value="sindy-rl-report">
                              SINDy-RL Interactive Report &amp; Sim
                            </option>
                            <option value="si-engine-report">
                              SI Engine Thesis Interactive Report &amp; Sim
                            </option>
                            <option value="predictive-maintenance-report">
                              Predictive Maintenance Report &amp; Sensor Sim
                            </option>
                            <option value="sindy-rl-cartpole">
                              Standalone CartPole Simulator
                            </option>
                            <option value="si-engine-heat-transfer">
                              Standalone SI Engine Simulator
                            </option>
                            <option value="grid-digital-twin">
                              Standalone Grid Digital Twin Simulator
                            </option>
                            <option value="none">None (Disabled)</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={vis.showReportSimulator !== false}
                            onChange={(e) =>
                              updateProjectField(proj.id, 'moduleVisibility', {
                                ...vis,
                                showReportSimulator: e.target.checked,
                              })
                            }
                            className="rounded border-slate-300 text-blue-600"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={vis.showReportCharts !== false}
                            onChange={(e) =>
                              updateProjectField(proj.id, 'moduleVisibility', {
                                ...vis,
                                showReportCharts: e.target.checked,
                              })
                            }
                            className="rounded border-slate-300 text-blue-600"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={vis.showReportDiagnosticsOrTables !== false}
                            onChange={(e) =>
                              updateProjectField(proj.id, 'moduleVisibility', {
                                ...vis,
                                showReportDiagnosticsOrTables: e.target.checked,
                              })
                            }
                            className="rounded border-slate-300 text-blue-600"
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProjectId(proj.id);
                              setProjectSubTab('interactive');
                              setActiveTab('projects');
                            }}
                            className="text-blue-700 hover:underline font-medium cursor-pointer"
                          >
                            Configure →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: WEBSITE SECTIONS & LAYOUT VISIBILITY
         ===================================================================== */}
      {activeTab === 'sections' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Website Section Visibility &amp; Custom Headings
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Keep or hide any section of your portfolio website and customize section headings. Navigation links automatically adapt to enabled sections.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(
              [
                {
                  key: 'showHeroPillarsStrip',
                  title: '01. Hero Research Pillars Strip',
                  desc: '4-column domain summary strip below the hero section.',
                },
                {
                  key: 'showAboutSection',
                  title: '02. About & Biography Section',
                  desc: 'Doctoral research vision, contact info, and full biography.',
                },
                {
                  key: 'showResearchInterestsSection',
                  title: '03. Research Interests & Formulations',
                  desc: 'Core research domains with LaTeX equations and key topics.',
                },
                {
                  key: 'showProjectsSection',
                  title: '04. Research & Engineering Projects',
                  desc: 'Main technical monographs showcase and category filter bar.',
                },
                {
                  key: 'showCategoryFilterBar',
                  title: '04b. Project Category Filter Tabs',
                  desc: 'Segmented category filter bar above the project cards.',
                },
                {
                  key: 'showSimulationsSection',
                  title: '05. Interactive Simulations Lab',
                  desc: 'Live mathematical & physical simulations section on homepage.',
                },
                {
                  key: 'showPublicationsSection',
                  title: '06. Publications & Presentations',
                  desc: 'Peer-reviewed conference papers and BibTeX citations.',
                },
                {
                  key: 'showEducationSection',
                  title: '07. Education & Standardized Tests',
                  desc: 'BUET B.Sc. credentials, CGPA trend, GRE, and TOEFL scores.',
                },
                {
                  key: 'showCertificationsSection',
                  title: '08. Certifications & International Training',
                  desc: 'Specialized engineering and leadership certifications.',
                },
                {
                  key: 'showExperienceSection',
                  title: '09. Professional Experience',
                  desc: 'Engineering, computational, and academic appointments.',
                },
                {
                  key: 'showSkillsSection',
                  title: '10. Technical Skills Matrix',
                  desc: '3-column computational, modeling, and software competencies.',
                },
                {
                  key: 'showCvDownloadSection',
                  title: '11. Curriculum Vitae (CV) PDF Banner',
                  desc: 'Dark banner with inline PDF viewer and direct download.',
                },
              ] as const
            ).map((item) => {
              const isChecked = draftSec[item.key] !== false;
              return (
                <label
                  key={item.key}
                  className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-slate-50/80 border-slate-200 hover:border-blue-400'
                      : 'bg-slate-100/50 border-slate-200 opacity-65'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) =>
                      updateSectionControls({ [item.key]: e.target.checked })
                    }
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {item.desc}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                About Section Heading
              </label>
              <input
                type="text"
                value={draftSec.aboutSectionTitle || ''}
                onChange={(e) =>
                  updateSectionControls({ aboutSectionTitle: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Research Interests Section Heading
              </label>
              <input
                type="text"
                value={draftSec.researchInterestsTitle || ''}
                onChange={(e) =>
                  updateSectionControls({ researchInterestsTitle: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Projects Showcase Section Heading
              </label>
              <input
                type="text"
                value={draftSec.projectsSectionTitle || ''}
                onChange={(e) =>
                  updateSectionControls({ projectsSectionTitle: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Publications Section Heading
              </label>
              <input
                type="text"
                value={draftSec.publicationsSectionTitle || ''}
                onChange={(e) =>
                  updateSectionControls({ publicationsSectionTitle: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: PROFILE & BIOGRAPHY EDITOR
         ===================================================================== */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Researcher Identity, Hero Banner &amp; Biography
            </h2>
            <button
              type="button"
              onClick={() => handleSaveAll(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Save Profile Changes
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
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
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Academic Title / Position Line
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
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Top Application Cycle Notice / Status Kicker
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
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Hero Main Headline
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
                className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
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
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Doctoral Research Vision Statement (Quote Box)
              </label>
              <textarea
                rows={2}
                value={draft.profile.researchVisionStatement}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    profile: {
                      ...prev.profile,
                      researchVisionStatement: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address
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
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target Doctoral Programs
              </label>
              <input
                type="text"
                value={draft.profile.targetDepartments}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    profile: {
                      ...prev.profile,
                      targetDepartments: e.target.value,
                    },
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Hero Featured Image (URL or Upload)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={draft.profile.heroImage}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      profile: { ...prev.profile, heroImage: e.target.value },
                    }))
                  }
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 cursor-pointer">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUploadAsUrl(e.target.files?.[0], (url) =>
                        setDraft((prev) => ({
                          ...prev,
                          profile: { ...prev.profile, heroImage: url },
                        }))
                      )
                    }
                  />
                </label>
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-700">
                  About Me Biography Paragraphs ({draft.profile.aboutBiography.length})
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      profile: {
                        ...prev.profile,
                        aboutBiography: [
                          ...prev.profile.aboutBiography,
                          'New biography paragraph...',
                        ],
                      },
                    }))
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Add Paragraph
                </button>
              </div>
              {draft.profile.aboutBiography.map((para, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <textarea
                    rows={3}
                    value={para}
                    onChange={(e) => {
                      const nextBio = [...draft.profile.aboutBiography];
                      nextBio[idx] = e.target.value;
                      setDraft((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, aboutBiography: nextBio },
                      }));
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                  {draft.profile.aboutBiography.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextBio = draft.profile.aboutBiography.filter(
                          (_, i) => i !== idx
                        );
                        setDraft((prev) => ({
                          ...prev,
                          profile: { ...prev.profile, aboutBiography: nextBio },
                        }));
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: RESEARCH INTERESTS EDITOR
         ===================================================================== */}
      {activeTab === 'research' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Research Interest Pillars &amp; Core Equations
              </h2>
              <p className="text-xs text-slate-500">
                Add, edit, or delete research domains and their mathematical formulations.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const newPillar: ResearchInterestPillar = {
                  id: `ri-${Date.now()}`,
                  index: `0${draft.researchInterests.length + 1}`,
                  title: 'New Research Direction',
                  subtitle: 'Sub-Disciplinary Focus',
                  description:
                    'Description of theoretical foundations and applications.',
                  coreEquationLatex:
                    '\\dot{\\mathbf{x}} = \\mathbf{f}(\\mathbf{x}, \\mathbf{u})',
                  coreEquationCaption: 'Governing Formulation',
                  keyTopics: ['Sparse Identification', 'Dynamical Systems'],
                };
                setDraft((prev) => ({
                  ...prev,
                  researchInterests: [...prev.researchInterests, newPillar],
                }));
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Research Interest Pillar
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {draft.researchInterests.map((ri, idx) => (
              <div
                key={ri.id}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-700">
                    Domain {ri.index}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        researchInterests: prev.researchInterests.filter(
                          (item) => item.id !== ri.id
                        ),
                      }))
                    }
                    className="text-xs text-red-600 hover:underline cursor-pointer"
                  >
                    Remove Pillar
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={ri.title}
                    onChange={(e) => {
                      const next = [...draft.researchInterests];
                      next[idx] = { ...ri, title: e.target.value };
                      setDraft((prev) => ({ ...prev, researchInterests: next }));
                    }}
                    placeholder="Title"
                    className="px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={ri.subtitle}
                    onChange={(e) => {
                      const next = [...draft.researchInterests];
                      next[idx] = { ...ri, subtitle: e.target.value };
                      setDraft((prev) => ({ ...prev, researchInterests: next }));
                    }}
                    placeholder="Subtitle"
                    className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <textarea
                  rows={2}
                  value={ri.description}
                  onChange={(e) => {
                    const next = [...draft.researchInterests];
                    next[idx] = { ...ri, description: e.target.value };
                    setDraft((prev) => ({ ...prev, researchInterests: next }));
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">
                      LaTeX Equation
                    </label>
                    <input
                      type="text"
                      value={ri.coreEquationLatex}
                      onChange={(e) => {
                        const next = [...draft.researchInterests];
                        next[idx] = { ...ri, coreEquationLatex: e.target.value };
                        setDraft((prev) => ({ ...prev, researchInterests: next }));
                      }}
                      className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">
                      Key Topics (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={ri.keyTopics.join(', ')}
                      onChange={(e) => {
                        const next = [...draft.researchInterests];
                        next[idx] = {
                          ...ri,
                          keyTopics: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        };
                        setDraft((prev) => ({ ...prev, researchInterests: next }));
                      }}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                {ri.coreEquationLatex && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg overflow-x-auto">
                    <MathEquation latex={ri.coreEquationLatex} block />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 6: PUBLICATIONS EDITOR
         ===================================================================== */}
      {activeTab === 'publications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Publications &amp; Conference Proceedings ({draft.publications.length})
              </h2>
              <p className="text-xs text-slate-500">
                Add, edit, or delete peer-reviewed papers, conference presentations, and BibTeX entries.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const newPub: PublicationItem = {
                  id: `pub-${Date.now()}`,
                  title: 'New Conference / Journal Publication Title',
                  authors: 'Sk. Humain Ahmed, Co-Author Name',
                  venue: 'Proceedings of International Engineering Conference',
                  year: '2026',
                  status: 'Published',
                  researchDomain: 'Physics-Informed Machine Learning',
                  abstract:
                    'Summary of the methodology, data analysis, and experimental conclusions.',
                  bibtex: `@inproceedings{ahmed2026new,\n  author = {Ahmed, Sk. Humain},\n  title = {New Publication},\n  year = {2026}\n}`,
                };
                setDraft((prev) => ({
                  ...prev,
                  publications: [newPub, ...prev.publications],
                }));
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Publication
            </button>
          </div>

          <div className="space-y-4">
            {draft.publications.map((pub, idx) => (
              <div
                key={pub.id}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-700">
                    Publication [{idx + 1}] · {pub.year}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        publications: prev.publications.filter(
                          (item) => item.id !== pub.id
                        ),
                      }))
                    }
                    className="text-xs text-red-600 hover:underline cursor-pointer"
                  >
                    Delete Publication
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-3">
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Paper Title
                    </label>
                    <input
                      type="text"
                      value={pub.title}
                      onChange={(e) => {
                        const next = [...draft.publications];
                        next[idx] = { ...pub, title: e.target.value };
                        setDraft((prev) => ({ ...prev, publications: next }));
                      }}
                      className="w-full px-3 py-1.5 text-sm font-semibold border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Year
                    </label>
                    <input
                      type="text"
                      value={pub.year}
                      onChange={(e) => {
                        const next = [...draft.publications];
                        next[idx] = { ...pub, year: e.target.value };
                        setDraft((prev) => ({ ...prev, publications: next }));
                      }}
                      className="w-full px-3 py-1.5 text-sm font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Authors List
                    </label>
                    <input
                      type="text"
                      value={pub.authors}
                      onChange={(e) => {
                        const next = [...draft.publications];
                        next[idx] = { ...pub, authors: e.target.value };
                        setDraft((prev) => ({ ...prev, publications: next }));
                      }}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Conference / Journal Venue
                    </label>
                    <input
                      type="text"
                      value={pub.venue}
                      onChange={(e) => {
                        const next = [...draft.publications];
                        next[idx] = { ...pub, venue: e.target.value };
                        setDraft((prev) => ({ ...prev, publications: next }));
                      }}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Abstract / Technical Summary
                  </label>
                  <textarea
                    rows={2}
                    value={pub.abstract}
                    onChange={(e) => {
                      const next = [...draft.publications];
                      next[idx] = { ...pub, abstract: e.target.value };
                      setDraft((prev) => ({ ...prev, publications: next }));
                    }}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-500 mb-1">
                    BibTeX Entry
                  </label>
                  <textarea
                    rows={4}
                    value={pub.bibtex}
                    onChange={(e) => {
                      const next = [...draft.publications];
                      next[idx] = { ...pub, bibtex: e.target.value };
                      setDraft((prev) => ({ ...prev, publications: next }));
                    }}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 7: CV PDF, EDUCATION, EXPERIENCE, SKILLS & CERTIFICATIONS
         ===================================================================== */}
      {activeTab === 'cv' && (
        <div className="space-y-8">
          {/* 7A. Official CV PDF Manager */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Curriculum Vitae (CV) PDF Document
            </h2>
            <p className="text-xs text-slate-600">
              Upload a new CV PDF or provide a file path. Uploaded PDFs are saved cleanly to{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded">/assets/uploads/</code> so your database and GitHub commits stay fast and lightweight.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  CV PDF File Name (Used when visitors download CV)
                </label>
                <input
                  type="text"
                  value={draft.cv.fileName}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      cv: { ...prev.cv, fileName: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  CV PDF Path or External URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={draft.cv.externalPdfUrl}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        cv: {
                          ...prev.cv,
                          externalPdfUrl: e.target.value,
                          uploadedPdfDataUrl: '',
                        },
                      }))
                    }
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    Upload CV PDF
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) =>
                        handleFileUploadAsUrl(
                          e.target.files?.[0],
                          (url, fileName) =>
                            setDraft((prev) => ({
                              ...prev,
                              cv: {
                                ...prev.cv,
                                fileName,
                                externalPdfUrl: url.startsWith('data:')
                                  ? prev.cv.externalPdfUrl
                                  : url,
                                uploadedPdfDataUrl: url.startsWith('data:') ? url : '',
                                lastUpdated: new Date().toISOString().slice(0, 10),
                              },
                            }))
                        )
                      }
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 7B. Education Entries */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Academic Education &amp; Standardized Tests ({draft.education.length})
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
                        degree: 'B.Sc. / M.Sc. in Mechanical Engineering',
                        department: 'Department of Mechanical Engineering',
                        institution: 'University Name',
                        location: 'City, Country',
                        period: 'Year',
                        gpaOrHonors: 'CGPA: 3.50 / 4.00',
                        thesisTitle: 'Thesis Title',
                        advisorPlaceholder: '',
                        coursework: ['GRE: 311', 'TOEFL: 97'],
                        isPlaceholder: false,
                      },
                    ],
                  }))
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Education Entry
              </button>
            </div>

            {draft.education.map((edu, idx) => (
              <div
                key={edu.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500">
                    Education #{idx + 1}
                  </span>
                  {draft.education.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          education: prev.education.filter((_, i) => i !== idx),
                        }))
                      }
                      className="text-xs text-red-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => {
                      const next = [...draft.education];
                      next[idx] = { ...edu, institution: e.target.value };
                      setDraft((prev) => ({ ...prev, education: next }));
                    }}
                    placeholder="Institution"
                    className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded bg-white"
                  />
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => {
                      const next = [...draft.education];
                      next[idx] = { ...edu, degree: e.target.value };
                      setDraft((prev) => ({ ...prev, education: next }));
                    }}
                    placeholder="Degree"
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded bg-white"
                  />
                  <input
                    type="text"
                    value={edu.gpaOrHonors}
                    onChange={(e) => {
                      const next = [...draft.education];
                      next[idx] = { ...edu, gpaOrHonors: e.target.value };
                      setDraft((prev) => ({ ...prev, education: next }));
                    }}
                    placeholder="CGPA / Honors"
                    className="px-3 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                  />
                  <input
                    type="text"
                    value={edu.location}
                    onChange={(e) => {
                      const next = [...draft.education];
                      next[idx] = { ...edu, location: e.target.value };
                      setDraft((prev) => ({ ...prev, education: next }));
                    }}
                    placeholder="Location & Graduation Date"
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded bg-white"
                  />
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={edu.thesisTitle || ''}
                      onChange={(e) => {
                        const next = [...draft.education];
                        next[idx] = { ...edu, thesisTitle: e.target.value };
                        setDraft((prev) => ({ ...prev, education: next }));
                      }}
                      placeholder="Thesis Title"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 7C. Professional Experience Entries */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                Professional Experience Appointments ({draft.experience.length})
              </h2>
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    experience: [
                      {
                        id: `exp-${Date.now()}`,
                        role: 'New Engineering / Research Role',
                        laboratoryOrOrganization: 'Organization / Laboratory Name',
                        institution: 'Organization / Institution',
                        location: 'City, Country',
                        period: '2025 – Present',
                        principalInvestigator: '',
                        highlights: [
                          'Key technical responsibility or quantitative achievement.',
                        ],
                        isPlaceholder: false,
                      },
                      ...prev.experience,
                    ],
                  }))
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Experience
              </button>
            </div>

            <div className="space-y-4">
              {draft.experience.map((exp, idx) => (
                <div
                  key={exp.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-blue-700">
                      Appointment #{idx + 1} · {exp.period}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          experience: prev.experience.filter((_, i) => i !== idx),
                        }))
                      }
                      className="text-xs text-red-600 hover:underline cursor-pointer"
                    >
                      Remove Experience
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) => {
                        const next = [...draft.experience];
                        next[idx] = { ...exp, role: e.target.value };
                        setDraft((prev) => ({ ...prev, experience: next }));
                      }}
                      placeholder="Role / Title"
                      className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded bg-white"
                    />
                    <input
                      type="text"
                      value={exp.laboratoryOrOrganization}
                      onChange={(e) => {
                        const next = [...draft.experience];
                        next[idx] = {
                          ...exp,
                          laboratoryOrOrganization: e.target.value,
                        };
                        setDraft((prev) => ({ ...prev, experience: next }));
                      }}
                      placeholder="Organization / Company"
                      className="px-3 py-1.5 text-xs border border-slate-300 rounded bg-white"
                    />
                    <input
                      type="text"
                      value={exp.period}
                      onChange={(e) => {
                        const next = [...draft.experience];
                        next[idx] = { ...exp, period: e.target.value };
                        setDraft((prev) => ({ ...prev, experience: next }));
                      }}
                      placeholder="Period (e.g., Dec 2024 – Present)"
                      className="px-3 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                    />
                    <input
                      type="text"
                      value={exp.location}
                      onChange={(e) => {
                        const next = [...draft.experience];
                        next[idx] = { ...exp, location: e.target.value };
                        setDraft((prev) => ({ ...prev, experience: next }));
                      }}
                      placeholder="Location"
                      className="px-3 py-1.5 text-xs border border-slate-300 rounded bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Bullet Point Highlights (One bullet point per line)
                    </label>
                    <textarea
                      rows={4}
                      value={exp.highlights.join('\n')}
                      onChange={(e) => {
                        const next = [...draft.experience];
                        next[idx] = {
                          ...exp,
                          highlights: e.target.value
                            .split('\n')
                            .map((line) => line.trim())
                            .filter(Boolean),
                        };
                        setDraft((prev) => ({ ...prev, experience: next }));
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7D. Technical Skills Matrix */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                Technical Skill Categories ({draft.skillGroups.length})
              </h2>
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    skillGroups: [
                      ...prev.skillGroups,
                      {
                        id: `sg-${Date.now()}`,
                        category: 'New Competency Category',
                        description: 'Core tools and methodologies',
                        skills: [
                          {
                            name: 'Tool / Language Name',
                            specification: 'Libraries, Frameworks, or Applications',
                          },
                        ],
                      },
                    ],
                  }))
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Skill Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {draft.skillGroups.map((group, gIdx) => (
                <div
                  key={group.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={group.category}
                      onChange={(e) => {
                        const next = [...draft.skillGroups];
                        next[gIdx] = { ...group, category: e.target.value };
                        setDraft((prev) => ({ ...prev, skillGroups: next }));
                      }}
                      className="flex-1 px-2.5 py-1 text-xs font-bold border border-slate-300 rounded bg-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          skillGroups: prev.skillGroups.filter((_, i) => i !== gIdx),
                        }))
                      }
                      className="text-xs text-red-600 hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>

                  <input
                    type="text"
                    value={group.description || ''}
                    onChange={(e) => {
                      const next = [...draft.skillGroups];
                      next[gIdx] = { ...group, description: e.target.value };
                      setDraft((prev) => ({ ...prev, skillGroups: next }));
                    }}
                    placeholder="Category subtitle..."
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded bg-white"
                  />

                  <div className="space-y-2">
                    {group.skills.map((sk, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-2.5 bg-white border border-slate-200 rounded space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <input
                            type="text"
                            value={sk.name}
                            onChange={(e) => {
                              const nextGroups = [...draft.skillGroups];
                              const nextSkills = [...group.skills];
                              nextSkills[sIdx] = { ...sk, name: e.target.value };
                              nextGroups[gIdx] = { ...group, skills: nextSkills };
                              setDraft((prev) => ({
                                ...prev,
                                skillGroups: nextGroups,
                              }));
                            }}
                            placeholder="Skill Name"
                            className="flex-1 px-2 py-1 text-xs font-semibold border border-slate-200 rounded"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nextGroups = [...draft.skillGroups];
                              nextGroups[gIdx] = {
                                ...group,
                                skills: group.skills.filter((_, i) => i !== sIdx),
                              };
                              setDraft((prev) => ({
                                ...prev,
                                skillGroups: nextGroups,
                              }));
                            }}
                            className="text-slate-400 hover:text-red-600 cursor-pointer px-1"
                          >
                            ×
                          </button>
                        </div>
                        <input
                          type="text"
                          value={sk.specification || ''}
                          onChange={(e) => {
                            const nextGroups = [...draft.skillGroups];
                            const nextSkills = [...group.skills];
                            nextSkills[sIdx] = {
                              ...sk,
                              specification: e.target.value,
                            };
                            nextGroups[gIdx] = { ...group, skills: nextSkills };
                            setDraft((prev) => ({
                              ...prev,
                              skillGroups: nextGroups,
                            }));
                          }}
                          placeholder="Specification / Packages"
                          className="w-full px-2 py-1 text-[11px] font-mono border border-slate-200 rounded"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const nextGroups = [...draft.skillGroups];
                      nextGroups[gIdx] = {
                        ...group,
                        skills: [
                          ...group.skills,
                          { name: 'New Skill', specification: 'Details' },
                        ],
                      };
                      setDraft((prev) => ({ ...prev, skillGroups: nextGroups }));
                    }}
                    className="w-full py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 cursor-pointer"
                  >
                    + Add Skill Item
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 7E. Certifications & International Training */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Certifications &amp; International Specialized Training (
                {(draft.cv.awardsAndHonors || []).length})
              </h2>
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    cv: {
                      ...prev.cv,
                      awardsAndHonors: [
                        ...(prev.cv.awardsAndHonors || []),
                        {
                          title: 'New Certification / Specialized Training',
                          organization: 'Issuing Institution',
                          year: '2025',
                          note: 'Summary of curriculum and technical scope.',
                        },
                      ],
                    },
                  }))
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Certification
              </button>
            </div>

            <div className="space-y-3">
              {(draft.cv.awardsAndHonors || []).map((cert, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-500">
                      Certification #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          cv: {
                            ...prev.cv,
                            awardsAndHonors: (prev.cv.awardsAndHonors || []).filter(
                              (_, i) => i !== idx
                            ),
                          },
                        }))
                      }
                      className="text-xs text-red-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      value={cert.title}
                      onChange={(e) => {
                        const next = [...(draft.cv.awardsAndHonors || [])];
                        next[idx] = { ...cert, title: e.target.value };
                        setDraft((prev) => ({
                          ...prev,
                          cv: { ...prev.cv, awardsAndHonors: next },
                        }));
                      }}
                      placeholder="Certification Title"
                      className="px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded bg-white"
                    />
                    <input
                      type="text"
                      value={cert.organization}
                      onChange={(e) => {
                        const next = [...(draft.cv.awardsAndHonors || [])];
                        next[idx] = { ...cert, organization: e.target.value };
                        setDraft((prev) => ({
                          ...prev,
                          cv: { ...prev.cv, awardsAndHonors: next },
                        }));
                      }}
                      placeholder="Organization"
                      className="px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                    />
                    <input
                      type="text"
                      value={cert.year}
                      onChange={(e) => {
                        const next = [...(draft.cv.awardsAndHonors || [])];
                        next[idx] = { ...cert, year: e.target.value };
                        setDraft((prev) => ({
                          ...prev,
                          cv: { ...prev.cv, awardsAndHonors: next },
                        }));
                      }}
                      placeholder="Year & Location"
                      className="px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                    />
                    <div className="md:col-span-3">
                      <input
                        type="text"
                        value={cert.note || ''}
                        onChange={(e) => {
                          const next = [...(draft.cv.awardsAndHonors || [])];
                          next[idx] = { ...cert, note: e.target.value };
                          setDraft((prev) => ({
                            ...prev,
                            cv: { ...prev.cv, awardsAndHonors: next },
                          }));
                        }}
                        placeholder="Details / Note"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 8: GITHUB SYNC & AUTO-DEPLOY
         ===================================================================== */}
      {activeTab === 'github-deploy' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-blue-700 mb-1">
                  <CloudUpload className="w-4 h-4" />
                  DIRECT IN-APP GITHUB AUTO-PUBLISHER
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  One-Click GitHub Repository Sync &amp; Automatic GitHub Pages Deployment
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                  Every time you click <strong>&ldquo;SaveAll Changes&rdquo;</strong> in this CMS:
                  <br />
                  1. Changes are saved to <code className="bg-slate-100 px-1 py-0.5 rounded">public/data/portfolio.json</code> and <code className="bg-slate-100 px-1 py-0.5 rounded">src/data/defaultPortfolioData.ts</code> (with any uploaded CV PDFs extracted to <code className="bg-slate-100 px-1 py-0.5 rounded">/assets/uploads/</code> so files never bloat).
                  <br />
                  2. If your GitHub Personal Access Token (PAT) is connected below, the CMS commits directly to <code className="bg-slate-100 px-1 py-0.5 rounded">{ghConfig.owner || 'humain93'}/{ghConfig.repo || 'humain93.github.io'}</code> via the official GitHub REST API and triggers GitHub Actions to deploy your live website automatically.
                </p>
              </div>

              {ghConfig.owner && ghConfig.repo && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono shrink-0 space-y-1">
                  <div className="text-slate-500">Target Live Website URL:</div>
                  <a
                    href={computeGitHubPagesUrl(ghConfig.owner, ghConfig.repo)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    {computeGitHubPagesUrl(ghConfig.owner, ghConfig.repo)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* GitHub Repository & Token Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  GitHub Username / Owner
                </label>
                <input
                  type="text"
                  value={ghConfig.owner}
                  onChange={(e) => {
                    const next = { ...ghConfig, owner: e.target.value };
                    setGhConfig(next);
                    saveGitHubSyncConfig(next);
                  }}
                  placeholder="e.g., humain93"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Repository Name
                </label>
                <input
                  type="text"
                  value={ghConfig.repo}
                  onChange={(e) => {
                    const next = { ...ghConfig, repo: e.target.value };
                    setGhConfig(next);
                    saveGitHubSyncConfig(next);
                  }}
                  placeholder="e.g., humain93.github.io"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Branch
                </label>
                <input
                  type="text"
                  value={ghConfig.branch}
                  onChange={(e) => {
                    const next = { ...ghConfig, branch: e.target.value };
                    setGhConfig(next);
                    saveGitHubSyncConfig(next);
                  }}
                  placeholder="main"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                />
              </div>

              <div className="md:col-span-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">
                    GitHub Personal Access Token (PAT with &ldquo;Contents: Read and write&rdquo; permission)
                  </label>
                  <a
                    href="https://github.com/settings/tokens?type=beta"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-700 hover:underline inline-flex items-center gap-1"
                  >
                    Generate Fine-Grained Token on GitHub <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  value={ghConfig.token}
                  onChange={(e) => {
                    const next = { ...ghConfig, token: e.target.value };
                    setGhConfig(next);
                    saveGitHubSyncConfig(next);
                  }}
                  placeholder="github_pat_... or ghp_..."
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                />
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Security guarantee: Your token is stored only in your browser and is never written into any repository file.
                </p>
              </div>
            </div>

            {/* Checkboxes & Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ghConfig.autoPublishOnSave}
                    onChange={(e) => {
                      const next = {
                        ...ghConfig,
                        autoPublishOnSave: e.target.checked,
                      };
                      setGhConfig(next);
                      saveGitHubSyncConfig(next);
                    }}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span className="font-medium">
                    Automatically commit &amp; publish to GitHub every time I click &ldquo;Save All Changes&rdquo;
                  </span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ghConfig.rememberTokenInLocalStorage}
                    onChange={(e) => {
                      const next = {
                        ...ghConfig,
                        rememberTokenInLocalStorage: e.target.checked,
                      };
                      setGhConfig(next);
                      saveGitHubSyncConfig(next);
                    }}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span>
                    Remember token on this private device (uncheck on shared computers)
                  </span>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleVerifyGitHub}
                  disabled={isVerifyingGh || isPublishingGh}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isVerifyingGh ? 'animate-spin' : ''}`}
                  />
                  {isVerifyingGh ? 'Verifying...' : '1. Verify Repo Connection'}
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAll(true)}
                  disabled={isPublishingGh || !isGitHubConfigured}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  {isPublishingGh
                    ? 'Committing to GitHub...'
                    : '2. Save & Publish to GitHub Now'}
                </button>

                {ghConfig.token && (
                  <button
                    type="button"
                    onClick={() => {
                      clearGitHubSyncCredentials();
                      setGhConfig(loadGitHubSyncConfig());
                      setGhStatusBanner(null);
                      showToast('Cleared GitHub token from browser.');
                    }}
                    className="px-3 py-2 text-xs font-medium text-red-600 hover:underline cursor-pointer"
                  >
                    Clear Token
                  </button>
                )}
              </div>
            </div>

            {/* Live GitHub Actions Build Status Card */}
            {latestWorkflow && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[11px] font-mono uppercase text-slate-500">
                    Latest GitHub Actions Deployment Run
                  </div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>{latestWorkflow.name}</span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                        latestWorkflow.conclusion === 'success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : latestWorkflow.status === 'in_progress' ||
                            latestWorkflow.status === 'queued'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {latestWorkflow.status === 'completed'
                        ? latestWorkflow.conclusion?.toUpperCase()
                        : latestWorkflow.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      const run = await fetchLatestWorkflowRun(ghConfig);
                      if (run) setLatestWorkflow(run);
                      showToast('Refreshed GitHub Actions status.');
                    }}
                    className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
                  </button>
                  <a
                    href={latestWorkflow.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-700 hover:underline inline-flex items-center gap-1"
                  >
                    Inspect Run on GitHub <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Workflow YAML Reference */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Included GitHub Actions Workflow (
                  <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                    .github/workflows/deploy.yml
                  </code>
                  )
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Already included in your project repository to build and deploy your static bundle on every commit to <code className="bg-slate-100 px-1 py-0.5 rounded">main</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(GITHUB_ACTIONS_WORKFLOW_YAML);
                  setCopiedWorkflowYaml(true);
                  setTimeout(() => setCopiedWorkflowYaml(false), 2500);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md cursor-pointer"
              >
                {copiedWorkflowYaml ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Copied YAML
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy deploy.yml
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60">
              {GITHUB_ACTIONS_WORKFLOW_YAML}
            </pre>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {confirmResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-700">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">
                Reset Portfolio to Default Snapshot?
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will restore all projects, simulations, biography paragraphs, and publications back to the default snapshot in{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded">defaultPortfolioData.ts</code>.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmResetModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await resetToDefaults();
                  setConfirmResetModal(false);
                  showToast('Portfolio restored to default snapshot.');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
