export type ResearchCategory = string;

export interface ProjectEquation {
  id: string;
  title: string;
  latex: string;
  explanation: string;
}

export interface SystemDiagramNode {
  id: string;
  label: string;
  sublabel: string;
  mathLatex?: string;
}

export interface SimulationDataPoint {
  x: number;
  theoretical: number;
  empirical: number;
  baseline?: number;
}

export interface ProjectKeyFinding {
  label: string;
  value: string;
  unit: string;
  comparison: string;
}

export interface ProjectSimulationMetrics {
  chartTitle: string;
  xAxisLabel: string;
  yAxisLabel: string;
  theoreticalLabel: string;
  empiricalLabel: string;
  baselineLabel?: string;
  dataPoints: SimulationDataPoint[];
  keyFindings: ProjectKeyFinding[];
}

export type SimulationMode =
  | 'sindy-rl-cartpole'
  | 'si-engine-heat-transfer'
  | 'grid-digital-twin'
  | 'none';

export type ProjectInteractiveModuleType =
  | 'auto'
  | 'sindy-rl-report'
  | 'si-engine-report'
  | 'predictive-maintenance-report'
  | 'sindy-rl-cartpole'
  | 'si-engine-heat-transfer'
  | 'grid-digital-twin'
  | 'none';

export interface ProjectModuleVisibility {
  showKeyFindings?: boolean;
  showNarrativeBreakdown?: boolean;
  showEquations?: boolean;
  showSystemDiagram?: boolean;
  showPerformanceGraph?: boolean;
  showInteractiveModule?: boolean;
  interactiveModuleType?: ProjectInteractiveModuleType;
  showReportSimulator?: boolean;
  showReportCharts?: boolean;
  showReportDiagnosticsOrTables?: boolean;
}

export interface ResearchProject {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: ResearchCategory;
  status: 'Published' | 'Draft';
  isTemplatePlaceholder: boolean;
  period: string;
  role: string;
  laboratoryOrInstitution: string;
  heroImage: string;
  galleryImages: { url: string; caption: string }[];
  videoEmbedUrl?: string;
  githubUrl?: string;
  paperUrl?: string;
  liveDemoSimulationId?: SimulationMode;
  moduleVisibility?: ProjectModuleVisibility;
  executiveSummary: string;
  problemStatement: string;
  methodologyArchitecture: string;
  experimentalValidation: string;
  equations: ProjectEquation[];
  systemArchitecture: {
    title: string;
    nodes: SystemDiagramNode[];
    feedbackLoopDescription: string;
  };
  simulationMetrics: ProjectSimulationMetrics;
  hardwareAndSoftwareStack: string[];
  documents: { title: string; type: string; url: string }[];
}

export interface ResearchInterestPillar {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  description: string;
  coreEquationLatex: string;
  coreEquationCaption: string;
  keyTopics: string[];
}

export interface PublicationItem {
  id: string;
  title: string;
  authors: string;
  venue: string;
  year: string;
  status: 'Published' | 'Under Review' | 'Preprint' | 'In Preparation' | 'Template Placeholder';
  researchDomain: string;
  doiUrl?: string;
  pdfUrl?: string;
  codeUrl?: string;
  abstract: string;
  bibtex: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  department: string;
  institution: string;
  location: string;
  period: string;
  gpaOrHonors: string;
  thesisTitle: string;
  advisorPlaceholder: string;
  coursework: string[];
  isPlaceholder: boolean;
}

export interface ExperienceItem {
  id: string;
  role: string;
  laboratoryOrOrganization: string;
  institution: string;
  location: string;
  period: string;
  principalInvestigator: string;
  highlights: string[];
  isPlaceholder: boolean;
}

export interface SkillGroup {
  id: string;
  category: string;
  description: string;
  skills: { name: string; specification: string }[];
}

export interface ResearcherProfile {
  fullName: string;
  academicTitle: string;
  applicationCycleNotice: string;
  targetDepartments: string;
  currentAffiliation: string;
  location: string;
  email: string;
  githubUrl: string;
  googleScholarUrl: string;
  orcidUrl: string;
  linkedinUrl: string;
  heroHeadline: string;
  heroLeadParagraph: string;
  heroImage: string;
  aboutBiography: string[];
  researchVisionStatement: string;
  showPlaceholderBanners: boolean;
}

export interface CVDocumentData {
  lastUpdated: string;
  fileName: string;
  uploadedPdfDataUrl?: string;
  externalPdfUrl?: string;
  researchObjective: string;
  awardsAndHonors: { title: string; organization: string; year: string; note: string }[];
  teachingAndService: { role: string; courseOrVenue: string; period: string }[];
}

export interface SimulationModuleItemConfig {
  id: 'sindy-rl-cartpole' | 'si-engine-heat-transfer' | 'grid-digital-twin';
  enabled: boolean;
  tabLabel: string;
  title: string;
  governingEquationLatex: string;
}

export interface SimulationsSectionConfig {
  enabled: boolean;
  sectionKicker: string;
  sectionTitle: string;
  sectionDescription: string;
  modules: SimulationModuleItemConfig[];
}

export interface WebsiteSectionControls {
  showHeroPillarsStrip: boolean;
  showAboutSection: boolean;
  aboutSectionTitle: string;
  showResearchInterestsSection: boolean;
  researchInterestsTitle: string;
  researchInterestsSubtitle: string;
  showProjectsSection: boolean;
  projectsSectionTitle: string;
  projectsSectionSubtitle: string;
  showCategoryFilterBar: boolean;
  showSimulationsSection: boolean;
  showPublicationsSection: boolean;
  publicationsSectionTitle: string;
  showEducationSection: boolean;
  showCertificationsSection: boolean;
  showExperienceSection: boolean;
  showSkillsSection: boolean;
  showCvDownloadSection: boolean;
}

export interface PortfolioDatabase {
  profile: ResearcherProfile;
  projectCategories?: string[];
  simulationsConfig?: SimulationsSectionConfig;
  sectionControls?: WebsiteSectionControls;
  researchInterests: ResearchInterestPillar[];
  projects: ResearchProject[];
  publications: PublicationItem[];
  education: EducationItem[];
  experience: ExperienceItem[];
  skillGroups: SkillGroup[];
  cv: CVDocumentData;
}
