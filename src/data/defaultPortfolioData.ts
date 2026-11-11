import { PortfolioDatabase } from '../types/portfolio';

export const DEFAULT_PORTFOLIO_DATA: PortfolioDatabase = {
  "profile": {
    "fullName": "Sk Humain Ahmed",
    "academicTitle": "Mechanical Engineer (B.Sc., BUET) · Executive Engineer, Northern Electricity Supply PLC",
    "applicationCycleNotice": "Prospective Ph.D. Applicant · Intelligent Dynamical Systems, Robotics, Physics-Informed AI & Learning-Based Control",
    "targetDepartments": "Mechanical Engineering · Electrical & Electronics Engineering · Computer Science · Cyber-Physical Systems",
    "currentAffiliation": "Northern Electricity Supply PLC (NESCO) · Alumnus, Bangladesh University of Engineering and Technology (BUET)",
    "location": "Rajshahi, Bangladesh · +880-1756734776",
    "email": "ahmed.humain.92@gmail.com",
    "githubUrl": "https://github.com",
    "googleScholarUrl": "https://scholar.google.com",
    "orcidUrl": "https://orcid.org",
    "linkedinUrl": "https://linkedin.com",
    "heroHeadline": "Intelligent Dynamical Systems, Physics-Informed Machine Learning & Learning-Based Control.",
    "heroLeadParagraph": "Mechanical engineer with 8 years of experience in utility-scale computational modeling, digital twins, and field data systems for a ~2-million-meter power distribution network. Pursuing doctoral research at the intersection of sparse nonlinear system identification (SINDy), model-based reinforcement learning, physics-informed AI, and cyber-physical energy systems.",
    "heroImage": "/src/assets/images/sindy_rl_cartpole_architecture_1794056013583.jpg",
    "aboutBiography": [
      "I am a Mechanical Engineering graduate from the Bangladesh University of Engineering and Technology (BUET, CGPA 3.47/4.00; Senior Year Trend: L4/T1: 3.71, L4/T2: 3.96) with 8 years of engineering experience in computational modeling, thermo-fluid systems, and utility-scale cyber-physical infrastructure.",
      "My independent research and academic publications investigate how interpretable mathematical structure can be combined with modern machine learning and control. Recently, I reimplemented the SINDy-RL framework (Zolman et al., 2025) on the nonlinear CartPole swing-up control task—constructing a 41-term quadratic control-affine basis library via PySINDy (Sequential Thresholded Ridge Regression) and coupling the learned sparse surrogate model with Proximal Policy Optimization (PPO) in Ray RLlib.",
      "In parallel, as an Executive Engineer at Northern Electricity Supply PLC (2018–Present), I contributed to developing a utility-scale digital twin spanning ~2 million customer meters, ~20,000 km of distribution lines, and ~13,000 transformers, and independently architected full-stack Web and Mobile spatial sensing platforms using Python (Django REST Framework), PostgreSQL/PostGIS, and Flutter/Dart."
    ],
    "researchVisionStatement": "Bridging sparse nonlinear system identification, physics-informed machine learning, and sample-efficient reinforcement learning to synthesize interpretable, safety-certified controllers for robotics, thermo-fluid systems, and large-scale cyber-physical networks.",
    "showPlaceholderBanners": false
  },
  "projectCategories": [
    "Nonlinear Dynamics & RL",
    "Thermo-Fluid & Combustion Modeling",
    "Cyber-Physical & Smart Grid Systems",
    "Physics-Informed ML & Sensing"
  ],
  "simulationsConfig": {
    "enabled": true,
    "sectionKicker": "04. Live Mathematical & Physical Simulations of My Research Works",
    "sectionTitle": "Interactive Scientific Demonstrations & Visualizations",
    "sectionDescription": "Interact directly with the numerical models behind my SINDy-RL CartPole Swing-Up, SI Engine Heat Transfer Thesis, and Utility Grid Digital Twin projects.",
    "modules": [
      {
        "id": "sindy-rl-cartpole",
        "enabled": true,
        "tabLabel": "SINDy-RL CartPole",
        "title": "01. SINDy-RL Cart-Pole: 14-Term Learned Dynamics (Update 39, Δt = 0.01 s) + Ray RLlib PPO",
        "governingEquationLatex": "\\mathbf{x}_{k+1} = \\boldsymbol{\\Theta}(\\mathbf{x}_k, u_k)\\boldsymbol{\\Xi}, \\quad \\pi_{\\boldsymbol{\\phi}}(u_k | \\mathbf{x}_k)"
      },
      {
        "id": "si-engine-heat-transfer",
        "enabled": true,
        "tabLabel": "SI Engine Heat Transfer",
        "title": "02. Two-Zone SI Engine Heat Transfer (ICMIEE-PI-160369: Annand, Woschni, Mod. Woschni, Hohenberg, Han)",
        "governingEquationLatex": "h_g(\\theta) = 3.26 B^{-0.2} P(\\theta)^{0.8} T_g(\\theta)^{-0.53} w(\\theta)^{0.8}"
      },
      {
        "id": "grid-digital-twin",
        "enabled": true,
        "tabLabel": "Digital Twin & Sensor ML",
        "title": "03. NESCO 2M-Meter Digital Twin & Hybrid RF-ANN Predictive Maintenance (IEOM 2026, 84.5% Accuracy)",
        "governingEquationLatex": "V_j^2 = V_i^2 - 2(r_{ij}P_{ij} + x_{ij}Q_{ij}) + (r_{ij}^2 + x_{ij}^2)\\ell_{ij}"
      }
    ]
  },
  "sectionControls": {
    "showHeroPillarsStrip": true,
    "showAboutSection": true,
    "aboutSectionTitle": "About Sk Humain Ahmed",
    "showResearchInterestsSection": true,
    "researchInterestsTitle": "Research Interests",
    "researchInterestsSubtitle": "Combining sparse system identification, physics-informed machine learning, and reinforcement learning for dynamical and cyber-physical systems.",
    "showProjectsSection": true,
    "projectsSectionTitle": "Research & Engineering Projects Showcase",
    "projectsSectionSubtitle": "Click any project below to view its dedicated technical page featuring problem formulation, methodology, governing equations, system block diagrams, performance graphs, and interactive simulations.",
    "showCategoryFilterBar": true,
    "showSimulationsSection": true,
    "showPublicationsSection": true,
    "publicationsSectionTitle": "Publications & Presentations",
    "showEducationSection": true,
    "showCertificationsSection": true,
    "showExperienceSection": true,
    "showSkillsSection": true,
    "showCvDownloadSection": true
  },
  "researchInterests": [
    {
      "id": "ri-1",
      "index": "01",
      "title": "Data-Driven Modeling & Physics-Informed Machine Learning",
      "subtitle": "Sparse Symbolic Discovery (SINDy) · Surrogate Dynamics · Hybrid Physical-ML Models",
      "description": "Learning parsimonious, physically consistent dynamical models directly from sensor time-series data by embedding conservation laws, control-affine structure, and differential constraints into regression and neural architectures.",
      "coreEquationLatex": "\\dot{\\mathbf{x}} = \\boldsymbol{\\Theta}(\\mathbf{x}, \\mathbf{u})\\boldsymbol{\\Xi}, \\quad \\min_{\\boldsymbol{\\Xi}} \\frac{1}{2}\\|\\dot{\\mathbf{X}} - \\boldsymbol{\\Theta}(\\mathbf{X}, \\mathbf{U})\\boldsymbol{\\Xi}\\|_2^2 + \\lambda \\|\\boldsymbol{\\Xi}\\|_2^2 \\;\\; \\text{s.t. } |\\Xi_{ij}| \\ge \\eta",
      "coreEquationCaption": "Sequential Thresholded Least-Squares / Ridge Regression (STLRidge) for sparse system identification",
      "keyTopics": [
        "PySINDy & Sparse Regression",
        "Physics-Informed Neural Networks",
        "Ensemble Surrogate Modeling",
        "Hybrid Sensor-Driven Prognostics"
      ]
    },
    {
      "id": "ri-2",
      "index": "02",
      "title": "Nonlinear Dynamics, System Identification & Intelligent Control",
      "subtitle": "Model-Based Reinforcement Learning (SINDy-RL) · Swing-Up Control · Thermo-Fluid Dynamics",
      "description": "Combining identified nonlinear state-space models with policy-gradient reinforcement learning (PPO) and classical nonlinear control to achieve high sample efficiency and interpretable closed-loop policies.",
      "coreEquationLatex": "\\pi_{\\boldsymbol{\\phi}}^{*} = \\arg\\max_{\\boldsymbol{\\phi}} \\mathbb{E}_{\\tau \\sim \\hat{f}_{\\text{SINDy}}} \\left[ \\sum_{k=0}^{T} \\gamma^k r(\\mathbf{x}_k, u_k) \\right], \\quad \\mathbf{x}_{k+1} = \\hat{f}_{\\text{SINDy}}(\\mathbf{x}_k, u_k)",
      "coreEquationCaption": "Dyna-style model-based reinforcement learning over sparse identified surrogate dynamics",
      "keyTopics": [
        "SINDy-RL & Surrogate Policy Training",
        "Proximal Policy Optimization (Ray RLlib)",
        "Underactuated Swing-Up Stabilization",
        "Nonlinear Combustion & Heat Transfer Modeling"
      ]
    },
    {
      "id": "ri-3",
      "index": "03",
      "title": "Sensing, Perception & Autonomy",
      "subtitle": "Multi-Sensor Predictive Maintenance · Field Data Acquisition · Spatial Synchronization",
      "description": "Designing end-to-end sensing pipelines—from industrial vibration/thermal transducers and offline mobile field surveying to automated anomaly detection and state estimation for autonomous and cyber-physical assets.",
      "coreEquationLatex": "\\hat{y}_{\\text{health}} = \\mathcal{M}_{\\text{hybrid}}\\left(\\Phi_{\\text{time}}(\\mathbf{s}_{1:T}), \\, \\Phi_{\\text{freq}}(\\mathcal{F}\\{\\mathbf{s}_{1:T}\\})\\right)",
      "coreEquationCaption": "Hybrid time-frequency sensor feature fusion for predictive fault diagnostics",
      "keyTopics": [
        "Smart Manufacturing Sensor Fusion (IEOM 2026)",
        "Predictive Maintenance & Fault Diagnosis",
        "Mobile Field Sensing & Spatial Sync",
        "State Estimation from Noisy Measurements"
      ]
    },
    {
      "id": "ri-4",
      "index": "04",
      "title": "Energy, Smart Grid Management & Cyber-Physical Digital Twins",
      "subtitle": "Utility-Scale Network Modeling · Load-Flow & Short-Circuit Analysis · SCADA/ADMS",
      "description": "Computational modeling and real-time visualization of large-scale electrical distribution networks (~2M meters, ~20,000 km lines, ~13,000 transformers) integrating spatial graph databases with physics-based power-flow solvers.",
      "coreEquationLatex": "P_{ij} + jQ_{ij} = V_i \\left(\\frac{V_i - V_j}{r_{ij} + jx_{ij}}\\right)^{*}, \\quad \\mathcal{G} = (\\mathcal{V}_{\\text{source} \\to \\text{meter}}, \\mathcal{E}_{\\text{feeder}})",
      "coreEquationCaption": "Power distribution load-flow equations coupled with end-to-end spatial connectivity graph",
      "keyTopics": [
        "Utility-Scale Digital Twins (~2M Nodes)",
        "Load-Flow & Short-Circuit Simulation (WindMil)",
        "PostGIS Spatial Network Topology",
        "SCADA / ADMS & Grid Optimization"
      ]
    }
  ],
  "projects": [
    {
      "id": "proj-sindy-rl",
      "slug": "sindy-rl-model-based-reinforcement-learning",
      "title": "SINDy-RL Cart-Pole: Reproduction, Diagnostics & Learned-Model Simulation",
      "subtitle": "Model-Based RL · Sparse System Identification · Dyna-Style PPO on dm_control Cart-Pole Swing-Up",
      "category": "Nonlinear Dynamics & RL",
      "status": "Published",
      "isTemplatePlaceholder": false,
      "period": "2025 – 2026",
      "role": "Independent Researcher",
      "laboratoryOrInstitution": "End-to-End Reproduction & Failure-Mode Diagnosis of Zolman et al. (2024)",
      "heroImage": "/src/assets/images/sindy_rl_cartpole_architecture_1794056013583.jpg",
      "galleryImages": [
        {
          "url": "/src/assets/images/sindy_rl_cartpole_architecture_1794056013583.jpg",
          "caption": "Figure 1: Dyna-style SINDy-RL closed-loop architecture, 14-term sparse learned discrete-time dynamics (update 39), and 40-update real vs. surrogate evaluation diagnostics."
        }
      ],
      "videoEmbedUrl": "",
      "githubUrl": "https://github.com",
      "paperUrl": "/assets/aistudio/SINDy-RL_Cart-Pole__Reproduction__Diagnostics___Learned-Model_Simulation_2425c262.html",
      "liveDemoSimulationId": "sindy-rl-cartpole",
      "executiveSummary": "An end-to-end reproduction and failure-mode diagnosis of Zolman et al. (2024), SINDy-RL, on the nonlinear dm_control cart-pole swing-up task. Built from scratch on a single laptop CPU using an ensemble of sparse polynomial models (PySINDy, 20 models, STLRidge) to learn discrete-time dynamics (Δt = 0.01 s) and reward from ~48k real environment steps (8k offline + 40 × 1k on-policy), while training a 2×64 tanh PPO policy inside the surrogate via Ray RLlib.",
      "problemStatement": "Model-free RL (such as PPO) needs millions of environment interactions to swing up and balance a cart-pole from hanging down. SINDy-RL replaces the real environment with a tiny, human-readable set of polynomial equations fit from only a few thousand real steps, then trains PPO entirely inside that learned model. However, during Dyna-style training, real returns peak at 610.2 (update 25, inside the paper’s 600–650 band) before oscillating between 250 and 610—raising a fundamental scientific question: is the learned SINDy dynamics model degrading, or is policy optimization exploiting surrogate drift?",
      "methodologyArchitecture": "1. Sparse Dictionary & Ensemble STLRidge (Δt = 0.01 s): Formulated a 41-term quadratic control-affine candidate library Θ(x, u) over state x = [x, cos θ, sin θ, ẋ, θ̇] and scalar force u (205 possible terms across 5 state equations). Fitted a 20-model bagged ensemble via Sequential Thresholded Ridge Regression (STLRidge, threshold = 0.005, α = 0.05), pruning the dynamics down to 14 non-zero terms (93.2% sparse) and reward to 5 terms.\n2. Surrogate-Guided Ray RLlib PPO: Trained a 2×64 tanh MLP policy with PPO entirely inside the learned SINDy world model (70k surrogate steps per Dyna iteration; 2.8M total surrogate steps vs. 48k real steps), collecting 1,000 on-policy real steps per update and clipping out-of-bounds trajectories (|x| > 2 or |v| > 10).\n3. Controlled 6-Hypothesis Diagnostic Investigation: Executed targeted experiments isolating dynamics refit collapse, policy drift / model exploitation, off-policy buffer pollution, reward model collapse, control-authority loss, and single-seed variance.",
      "experimentalValidation": "Across 40 Dyna updates (~48k real steps), the learned 14-term model matched true dm_control control-gain terms within ≤ 4% error (cart acceleration at θ=0: +0.0970 vs +0.0990 true; pole angular acceleration at θ=0: −0.1354 vs −0.1408 true; at θ=π: +0.1354 vs +0.1408 true). Controlled diagnostics proved that freezing dynamics after update 14 did not eliminate return drops—confirming that late-training oscillation stems from PPO policy drift over 70k surrogate steps per update rather than SINDy dynamics degradation.",
      "equations": [
        {
          "id": "eq-sindy-1",
          "title": "Learned 14-Term Discrete-Time SINDy Dynamics (Update 39, Δt = 0.01 s, 93.2% Sparse)",
          "latex": "\\begin{aligned} x^+ &= 0.99994\\,x + 0.01\\,\\dot{x} \\\\ \\cos\\theta^+ &= 0.99975\\,\\cos\\theta - 0.01\\,\\sin\\theta\\cdot\\dot{\\theta} \\\\ \\sin\\theta^+ &= 0.99910\\,\\sin\\theta + 0.01\\,\\cos\\theta\\cdot\\dot{\\theta} \\\\ \\dot{x}^+ &= 0.99927\\,\\dot{x} - 0.01117\\,\\cos\\theta\\sin\\theta + u\\left(0.0581 + 0.03894\\,\\cos^2\\theta + 0.01918\\,\\sin^2\\theta\\right) \\\\ \\dot{\\theta}^+ &= 0.99951\\,\\dot{\\theta} + 0.14807\\,\\sin\\theta - 0.13537\\,\\cos\\theta\\cdot u \\end{aligned}",
          "explanation": "Exact median ensemble coefficients recovered at Update 39 from 41 candidate terms per equation (205 total), retaining only 14 active terms. Note how cos²θ + sin²θ = 1 folds the cart control gain into 0.0970·u at θ=0 (true: 0.0990·u)."
        },
        {
          "id": "eq-sindy-2",
          "title": "Learned 5-Term Sparse Surrogate Reward Function (of 15 Candidates)",
          "latex": "\\hat{r}(\\mathbf{x}, u) = 0.432 + 0.494\\,\\cos\\theta + 0.249\\,\\cos^2\\theta - 0.032\\,x^2 - 0.025\\,\\dot{\\theta}^2",
          "explanation": "Captures upright preference (+cos θ, +cos²θ) and penalties on cart position (−x²) and angular velocity (−θ̇²), fitted via 20-model ensemble STLRidge."
        }
      ],
      "systemArchitecture": {
        "title": "Dyna-Style SINDy-RL Closed-Loop Learning & Diagnostics Pipeline",
        "nodes": [
          {
            "id": "n-real-env",
            "label": "Real Environment (dm_control)",
            "sublabel": "8k Offline + 1k On-Policy / Update",
            "mathLatex": "\\mathbf{x} = [x, \\cos\\theta, \\sin\\theta, \\dot{x}, \\dot{\\theta}]"
          },
          {
            "id": "n-buffer",
            "label": "Trajectory Buffer & Filter",
            "sublabel": "Drop Divergent Rollouts (|x|>2, |v|>10)",
            "mathLatex": "\\mathcal{D}_{\\text{clean}} = \\{(\\mathbf{x}_k, u_k, r_k)\\}"
          },
          {
            "id": "n-sindy",
            "label": "Ensemble SINDy (20× STLRidge)",
            "sublabel": "14 / 205 Terms (93.2% Sparse)",
            "mathLatex": "\\mathbf{x}_{k+1} = f_{\\text{SINDy}}(\\mathbf{x}_k, u_k)"
          },
          {
            "id": "n-ppo",
            "label": "Surrogate Gym + Ray RLlib PPO",
            "sublabel": "2×64 tanh MLP · 70k Steps / Update",
            "mathLatex": "\\pi_{\\boldsymbol{\\phi}}(u|\\mathbf{x}) \\to R_{\\text{best}} = 610.2"
          }
        ],
        "feedbackLoopDescription": "Every 10 PPO iterations inside the learned SINDy world model (70k surrogate steps), the policy collects 1,000 real steps in dm_control and refits the ensemble SINDy dynamics and reward models."
      },
      "simulationMetrics": {
        "chartTitle": "Real Environment Evaluation Return vs. Dyna Update Iteration (Updates 1–40)",
        "xAxisLabel": "Dyna Update Iteration (×1k On-Policy Real Steps + 8k Offline)",
        "yAxisLabel": "Real Evaluation Return (dm_control)",
        "theoreticalLabel": "Paper Benchmark Plateau Band (600–650)",
        "empiricalLabel": "Measured Real Return (Peak 610.2 @ Update 25)",
        "baselineLabel": "Frozen-Dynamics Experiment (Fixed after Update 14)",
        "dataPoints": [
          {
            "x": 1,
            "theoretical": 600,
            "empirical": 112.9,
            "baseline": 112.9
          },
          {
            "x": 5,
            "theoretical": 600,
            "empirical": 416.8,
            "baseline": 416.8
          },
          {
            "x": 12,
            "theoretical": 600,
            "empirical": 500.5,
            "baseline": 500.5
          },
          {
            "x": 14,
            "theoretical": 600,
            "empirical": 583,
            "baseline": 583
          },
          {
            "x": 18,
            "theoretical": 600,
            "empirical": 590.5,
            "baseline": 540
          },
          {
            "x": 25,
            "theoretical": 600,
            "empirical": 610.2,
            "baseline": 515
          },
          {
            "x": 32,
            "theoretical": 600,
            "empirical": 263.5,
            "baseline": 340
          },
          {
            "x": 35,
            "theoretical": 600,
            "empirical": 539.7,
            "baseline": 495
          },
          {
            "x": 39,
            "theoretical": 600,
            "empirical": 423.4,
            "baseline": 440
          }
        ],
        "keyFindings": [
          {
            "label": "Active Dynamics Terms",
            "value": "14",
            "unit": "/ 205 terms",
            "comparison": "93.2% Sparse (41 per eq.)"
          },
          {
            "label": "Total Real Env Steps",
            "value": "~48k",
            "unit": "steps",
            "comparison": "8k Offline + 40×1k Online"
          },
          {
            "label": "Best Real Return",
            "value": "610.2",
            "unit": "return",
            "comparison": "Update 25 (Paper: 600–650)"
          },
          {
            "label": "Control-Gain Error",
            "value": "≤ 4%",
            "unit": "one-step error",
            "comparison": "vs. True dm_control"
          }
        ]
      },
      "hardwareAndSoftwareStack": [
        "Python & NumPy",
        "PySINDy (20-Model Ensemble STLRidge)",
        "Ray RLlib 2.6.3 (PPO, 2×64 tanh MLP)",
        "PyTorch 2.0.1",
        "dm_control 1.0.44 & MuJoCo 3.11",
        "Gymnasium"
      ],
      "documents": [
        {
          "title": "Interactive HTML Report: SINDy-RL Cart-Pole Reproduction, Diagnostics & Learned-Model Simulation",
          "url": "/assets/aistudio/SINDy-RL_Cart-Pole__Reproduction__Diagnostics___Learned-Model_Simulation_2425c262.html",
          "type": "Technical Report"
        }
      ]
    },
    {
      "id": "proj-si-engine-thesis",
      "slug": "heat-transfer-models-si-engine-undergraduate-thesis",
      "title": "Study and Simulation of Various Heat Transfer Models of SI Engine",
      "subtitle": "Undergraduate Thesis (BUET) & ICMIEE-PI-160369 Conference Publication (Dec 2016)",
      "category": "Thermo-Fluid & Combustion Modeling",
      "status": "Published",
      "isTemplatePlaceholder": false,
      "period": "2016",
      "role": "Co-Author & Undergraduate Thesis Researcher (Md Shariful Islam, Sk Humain Ahmed, Afsar Ahammed)",
      "laboratoryOrInstitution": "Department of Mechanical Engineering, BUET (Advisor: Prof. Dr. Md. Zahurul Haq)",
      "heroImage": "/src/assets/images/si_engine_heat_transfer_simulation_1794056015969.jpg",
      "galleryImages": [
        {
          "url": "/src/assets/images/si_engine_heat_transfer_simulation_1794056015969.jpg",
          "caption": "Figure 1: Two-zone spark-ignition engine combustion simulation comparing 5 heat transfer models (Annand, Woschni, Modified Woschni, Hohenberg, Han et al.) against Rakopoulos [8] experimental data."
        }
      ],
      "videoEmbedUrl": "",
      "githubUrl": "https://www.researchgate.net/publication/365315997",
      "paperUrl": "/assets/aistudio/ICMIEE-PI-160369_0cd47271.pdf",
      "liveDemoSimulationId": "si-engine-heat-transfer",
      "executiveSummary": "A comparative numerical study of five empirical convective heat transfer models—Annand (1963), Woschni (1967), Modified Woschni (Finol & Robinson), Hohenberg (1979), and Han et al. (1997)—in a two-zone spark-ignition (SI) engine cycle simulation written in MATLAB (ODE23, 1° crank-angle step). Simulated cylinder pressure, burned/unburned zone temperatures, cumulative work, heat flux, and piston-ring blow-by leakage were benchmarked against experimental pressure measurements by Rakopoulos [8] and evaluated across varying fuels (Gasoline, Methanol), equivalence ratios (φ = 0.8, 1.0, 1.2), engine speeds (3000–3500 rpm), and spark advances (0°–40°).",
      "problemStatement": "Heat transfer from cylinder walls is a major factor governing internal combustion engine performance, exhaust emissions, cooling system design, and thermally induced mechanical stresses. Because a single empirical correlation rarely predicts heat flux accurately across all strokes of the engine cycle, engine modelers need a rigorous two-zone comparative analysis against experimental cylinder pressure traces to determine which heat transfer correlation performs best during compression, combustion, and expansion.",
      "methodologyArchitecture": "1. Two-Zone Closed Thermodynamic Cycle (IVC to EVO): Formulated the First Law of Thermodynamics following Ferguson [1] by splitting the cylinder mixture into burned (T_b) and unburned (T_u) zones sharing uniform pressure P(θ), coupled with a Wiebe burn-rate law (b = 5, n = 3, θ_s = -30°) and exponential piston-ring blow-by mass loss (C_blow_by = 1.1).\n2. Five Heat Transfer Correlations in MATLAB ODE23: Implemented Annand (a = 0.5, b = 0.7), Woschni (C₁ = 2.28, C₂ = 3.24×10⁻³), Modified Woschni (characteristic height L(t) = 4V/πd_p², α = 1000), Hohenberg (instantaneous volume V^(-0.06), C₁ = 130, C₂ = 1.4), and Han et al. (C₁ = 687, C₂ = 0.494, C₃ = 7.3×10⁻⁷, k = 1.35) using a 1° step size in MATLAB ODE23 (Bore B = 3 inch, Stroke = 35/8 inch, ε = 0.25, T_wall = 420 K, T₁ = 310 K, P₁ = 101.325 kPa).\n3. Experimental Validation & Parametric Sweeps: Benchmarked P–θ and P–V indicator diagrams against experimental measurements by Rakopoulos [8], and tested sensitivity across Methanol (φ = 1.0, 3000 rpm), Gasoline (φ = 0.8 at 3000 rpm; φ = 1.2 at 3500 rpm), and spark advance angles (0° to 40°).",
      "experimentalValidation": "Published in Proceedings of the International Conference on Mechanical, Industrial and Energy Engineering (ICMIEE-PI-160369, Dec 26–27, 2016, Khulna, Bangladesh). Comparison against Rakopoulos [8] experimental pressure traces established stage-specific model recommendations: (1) Hohenberg model is closest to experimental data during the compression stage; (2) Han et al. and Woschni models bracket experimental peak pressure best during the combustion stage (where Annand overpredicts heat flux and underpredicts pressure, while Hohenberg overpredicts peak pressure); and (3) Modified Woschni and Annand models match experimental data best during the expansion stage.",
      "equations": [
        {
          "id": "eq-si-1",
          "title": "Two-Zone Control Volume Energy Balance, Wiebe Burn Rate & Blow-By Mass Loss (Eqs. 2–4)",
          "latex": "m\\frac{du}{d\\theta} + u\\frac{dm}{d\\theta} = \\frac{dQ}{d\\theta} - P\\frac{dV}{d\\theta} - \\frac{\\dot{m}_l h_l}{\\omega}, \\quad x(\\theta) = 1 - \\exp\\left[-b\\left(\\frac{\\theta - \\theta_s}{\\theta_b}\\right)^n\\right], \\quad m = m_1 \\exp\\left[\\frac{C(\\theta - \\theta_1)}{\\omega}\\right]",
          "explanation": "Ferguson [1] two-zone energy equation with Wiebe constants b = 5, n = 3 (Eq. 3), blow-by constant C = 1.1 (Eq. 4), and two-zone wall heat loss dQ_l/dθ = (h/ω)(πb²/2 + 4V/b)[√x(T_b - T_u) + (1 - √x)(T_u - T_w)] (Eq. 10)."
        },
        {
          "id": "eq-si-2",
          "title": "Five Benchmarked Convective Heat Transfer Correlations (Eqs. 12–18)",
          "latex": "\\begin{aligned} h_{\\text{Annand}} &= \\frac{k}{B} a \\left(\\frac{\\rho S_p B}{\\mu}\\right)^b, & h_{\\text{Woschni}} &= 3.26\\,T^{-0.53} B^{-0.2} P^{0.8} w^{0.8} \\\\ h_{\\text{Hohenberg}} &= 130\\,V^{-0.06} P^{0.8} T^{-0.4}(V_p + 1.4)^{0.8}, & h_{\\text{Han}} &= 687\\,P^{0.75} U^{0.75} B^{-0.25} T^{-0.465} \\end{aligned}",
          "explanation": "Along with Modified Woschni (Eq. 15): h = α_scaling L(t)^(-0.2) P(t)^(0.8) T^(-0.73) [C₁ V_p + (C₂ V_s T_r / 6 P_r V_r)(P - P_m)]^(0.8) using instantaneous chamber height L(t) = 4V/(π d_p²) and α_scaling = 1000."
        }
      ],
      "systemArchitecture": {
        "title": "Two-Zone MATLAB ODE23 Thermodynamic & Heat Transfer Simulation Pipeline",
        "nodes": [
          {
            "id": "n-kin",
            "label": "Table 1 Engine & Kinematics",
            "sublabel": "B = 3 in, ε = 0.25, T_w = 420 K",
            "mathLatex": "V(\\theta), \\; m(\\theta) = m_1 e^{C(\\theta-\\theta_1)/\\omega}"
          },
          {
            "id": "n-wiebe",
            "label": "Two-Zone Wiebe Combustion",
            "sublabel": "Burned (T_b) & Unburned (T_u)",
            "mathLatex": "x(\\theta) = 1 - e^{-5((\\theta-\\theta_s)/\\theta_b)^3}"
          },
          {
            "id": "n-ht",
            "label": "5 Heat Transfer Models",
            "sublabel": "Annand · Woschni · Mod. · Hohenberg · Han",
            "mathLatex": "h(\\theta) \\mapsto dQ_l/d\\theta, \\; dH_l/d\\theta"
          },
          {
            "id": "n-exp",
            "label": "Rakopoulos [8] Validation",
            "sublabel": "MATLAB ODE23 (1° Step)",
            "mathLatex": "P(\\theta), \\; T_b(\\theta), \\; T_u(\\theta), \\; W(\\theta)"
          }
        ],
        "feedbackLoopDescription": "At each 1° crank-angle step in MATLAB ODE23, P(θ), T_b(θ), and T_u(θ) update gas velocity terms (w, U) and instantaneous convective coefficient h(θ)."
      },
      "simulationMetrics": {
        "chartTitle": "In-Cylinder Pressure P(θ) [MPa] vs. Crank Angle θ [°] (Fig. 1 Validation against Rakopoulos [8])",
        "xAxisLabel": "Crank Angle θ (Degrees around TDC = 0°)",
        "yAxisLabel": "Cylinder Pressure P [MPa]",
        "theoreticalLabel": "Rakopoulos [8] Experimental Data",
        "empiricalLabel": "Woschni / Han et al. Model (MATLAB ODE23)",
        "baselineLabel": "Hohenberg Model (Overpredicts Peak, Best in Compression)",
        "dataPoints": [
          {
            "x": -100,
            "theoretical": 0.18,
            "empirical": 0.22,
            "baseline": 0.21
          },
          {
            "x": -50,
            "theoretical": 0.52,
            "empirical": 0.64,
            "baseline": 0.61
          },
          {
            "x": -30,
            "theoretical": 1.05,
            "empirical": 1.18,
            "baseline": 1.14
          },
          {
            "x": 0,
            "theoretical": 3.48,
            "empirical": 3.62,
            "baseline": 3.74
          },
          {
            "x": 12,
            "theoretical": 4.58,
            "empirical": 4.62,
            "baseline": 4.78
          },
          {
            "x": 30,
            "theoretical": 3.55,
            "empirical": 3.52,
            "baseline": 3.64
          },
          {
            "x": 60,
            "theoretical": 1.72,
            "empirical": 1.69,
            "baseline": 1.74
          },
          {
            "x": 100,
            "theoretical": 0.82,
            "empirical": 0.8,
            "baseline": 0.83
          },
          {
            "x": 150,
            "theoretical": 0.48,
            "empirical": 0.47,
            "baseline": 0.49
          }
        ],
        "keyFindings": [
          {
            "label": "Models Benchmarked",
            "value": "5",
            "unit": "correlations",
            "comparison": "Annand, Woschni, Mod., Hohenberg, Han"
          },
          {
            "label": "Compression Stage Best",
            "value": "Hohenberg",
            "unit": "V^(-0.06)",
            "comparison": "Closest to Rakopoulos [8]"
          },
          {
            "label": "Combustion Stage Best",
            "value": "Han & Woschni",
            "unit": "peak P",
            "comparison": "Brackets Exp. Peak (~4.6 MPa)"
          },
          {
            "label": "Expansion Stage Best",
            "value": "Mod. Woschni",
            "unit": "& Annand",
            "comparison": "Closed-Volume L(t) Scaling"
          }
        ]
      },
      "hardwareAndSoftwareStack": [
        "MATLAB (ODE23 Solver, 1° CA Step)",
        "Two-Zone Combustion Modeling (Ferguson [1])",
        "Wiebe Heat Release & Blow-By Formulation",
        "Experimental Indicator Validation (Rakopoulos [8])"
      ],
      "documents": [
        {
          "title": "ICMIEE-PI-160369 Conference Paper PDF: Study and Simulation of Various Heat Transfer Models of SI Engine",
          "url": "/assets/aistudio/ICMIEE-PI-160369_0cd47271.pdf",
          "type": "Paper PDF"
        }
      ]
    },
    {
      "id": "proj-digital-twin-grid",
      "slug": "utility-scale-electrical-distribution-digital-twin",
      "title": "Utility-Scale Electrical Distribution Digital Twin & Spatial Field Sensing Architecture",
      "subtitle": "Northern Electricity Supply PLC (NESCO) · ~2M Meters, ~20,000 km Lines & ~13,000 Transformers",
      "category": "Cyber-Physical & Smart Grid Systems",
      "status": "Published",
      "isTemplatePlaceholder": false,
      "period": "2018 – Present",
      "role": "Executive Engineer & Lead Full-Stack Systems Architect",
      "laboratoryOrInstitution": "Northern Electricity Supply PLC, Rajshahi, Bangladesh",
      "heroImage": "/src/assets/images/smart_grid_digital_twin_gis_1794056017469.jpg",
      "galleryImages": [
        {
          "url": "/src/assets/images/smart_grid_digital_twin_gis_1794056017469.jpg",
          "caption": "Figure 1: Utility-scale distribution network digital twin displaying spatial GIS feeder topology, transformer loading, and nodal voltage profiles."
        }
      ],
      "videoEmbedUrl": "",
      "githubUrl": "",
      "paperUrl": "",
      "liveDemoSimulationId": "grid-digital-twin",
      "executiveSummary": "Contributed to developing a utility-scale electrical distribution digital twin encompassing ~2 million customer meters, ~20,000 km of lines, and ~13,000 distribution transformers. Independently designed and deployed a production-grade Web GIS visualization platform and an offline-capable Flutter/Dart Mobile field-surveying system backed by Python (Django REST Framework) and PostgreSQL/PostGIS to map complete source-to-meter power connectivity and optimize network operations via load-flow and short-circuit simulations.",
      "problemStatement": "Managing a regional distribution utility serving ~2 million consumers suffers from incomplete topological records between 33/11 kV substations, 11/0.4 kV distribution transformers, and end-user meters. Without an accurate, spatially synchronized digital twin, engineers cannot reliably compute feeder voltage drops, locate technical losses, evaluate short-circuit fault currents, or plan phase-balancing and transformer upgrades.",
      "methodologyArchitecture": "1. Spatial Graph Database & REST Backend: Architected a relational-spatial database in PostgreSQL/PostGIS with a Django REST Framework API modeling hierarchical source-to-meter connectivity (Substation → 11 kV Feeder → Distribution Transformer → Pole → Consumer Meter).\n2. Offline Field Sensing & Mobile Synchronization: Independently built a cross-platform Flutter/Dart mobile surveying application enabling field engineers to capture GPS coordinates, meter telemetry, and pole-to-pole connectivity offline with conflict-free spatial synchronization.\n3. Computational Load-Flow & Reliability Simulation: Integrated network asset data into computational engineering solvers (WindMil / Milsoft) to execute steady-state load-flow simulations, short-circuit current evaluations, and transformer reliability analyses.",
      "experimentalValidation": "Deployed in production across the Northern Electricity Supply PLC distribution network (~20,000 km of lines and ~13,000 transformers). Enabled complete source-to-meter tracing for ~2 million customer meters, supporting data-driven feeder reconfiguration, voltage profile regulation, and capital asset planning.",
      "equations": [
        {
          "id": "eq-grid-1",
          "title": "Radial Distribution Network Branch-Flow (DistFlow) Equations",
          "latex": "P_{ij} = \\sum_{k:(j,k)\\in\\mathcal{E}} P_{jk} + r_{ij}\\ell_{ij} + p_j^c, \\quad Q_{ij} = \\sum_{k:(j,k)\\in\\mathcal{E}} Q_{jk} + x_{ij}\\ell_{ij} + q_j^c, \\quad V_j^2 = V_i^2 - 2(r_{ij}P_{ij} + x_{ij}Q_{ij}) + (r_{ij}^2 + x_{ij}^2)\\ell_{ij}",
          "explanation": "Governing active/reactive power balance and nodal voltage drop along distribution branch (i, j) with impedance z_{ij} = r_{ij} + j x_{ij} and squared current magnitude l_{ij} = |I_{ij}|^2."
        },
        {
          "id": "eq-grid-2",
          "title": "Hierarchical Source-to-Meter Spatial Connectivity Graph",
          "latex": "\\mathcal{G}_{\\text{twin}} = (\\mathcal{V}, \\mathcal{E}), \\quad \\mathcal{V} = \\mathcal{V}_{\\text{sub}} \\cup \\mathcal{V}_{\\text{feeder}} \\cup \\mathcal{V}_{\\text{tx}} \\cup \\mathcal{V}_{\\text{meter}}, \\quad |\\mathcal{V}_{\\text{meter}}| \\approx 2 \\times 10^6",
          "explanation": "Directed acyclic / meshed graph representation stored in PostGIS linking every consumer meter to its upstream distribution transformer and substation breaker."
        }
      ],
      "systemArchitecture": {
        "title": "End-to-End Field Sensing, PostGIS Digital Twin & Load-Flow Optimization Architecture",
        "nodes": [
          {
            "id": "n-flutter",
            "label": "Flutter Mobile Field App",
            "sublabel": "Offline GPS & Meter Surveying",
            "mathLatex": "(\\phi_i, \\lambda_i, \\text{ID}_{\\text{tx}}, \\text{ID}_{\\text{meter}})"
          },
          {
            "id": "n-django",
            "label": "Django REST + PostGIS",
            "sublabel": "Spatial Topology Engine",
            "mathLatex": "\\mathcal{G}_{\\text{twin}} = (\\mathcal{V}, \\mathcal{E})"
          },
          {
            "id": "n-windmil",
            "label": "Load-Flow & Fault Solver",
            "sublabel": "WindMil (Milsoft) Simulation",
            "mathLatex": "V_i, \\; I_{\\text{sc}}, \\; P_{\\text{loss}}"
          },
          {
            "id": "n-webgis",
            "label": "Web GIS Asset Visualizer",
            "sublabel": "Operational Decision Support",
            "mathLatex": "\\min \\sum_{(i,j)\\in\\mathcal{E}} r_{ij}|I_{ij}|^2"
          }
        ],
        "feedbackLoopDescription": "Field survey updates synchronize via Django REST API into PostGIS, continuously updating load-flow models and Web GIS operational dashboards."
      },
      "simulationMetrics": {
        "chartTitle": "11 kV Feeder Voltage Profile V(d) [p.u.] Across 20 km Distribution Corridor",
        "xAxisLabel": "Feeder Distance from Substation (km)",
        "yAxisLabel": "Bus Voltage Magnitude [p.u.]",
        "theoreticalLabel": "Statutory Nominal Target (1.00 p.u.)",
        "empiricalLabel": "Post-Optimization Digital Twin Feeder",
        "baselineLabel": "Pre-Optimization Uncompensated Feeder",
        "dataPoints": [
          {
            "x": 0,
            "theoretical": 1,
            "empirical": 1.02,
            "baseline": 1.02
          },
          {
            "x": 4,
            "theoretical": 1,
            "empirical": 1.005,
            "baseline": 0.992
          },
          {
            "x": 8,
            "theoretical": 1,
            "empirical": 0.991,
            "baseline": 0.965
          },
          {
            "x": 12,
            "theoretical": 1,
            "empirical": 0.982,
            "baseline": 0.941
          },
          {
            "x": 16,
            "theoretical": 1,
            "empirical": 0.971,
            "baseline": 0.918
          },
          {
            "x": 20,
            "theoretical": 1,
            "empirical": 0.962,
            "baseline": 0.896
          }
        ],
        "keyFindings": [
          {
            "label": "Customer Meters Mapped",
            "value": "~2.0M",
            "unit": "meters",
            "comparison": "Source-to-Meter Connectivity"
          },
          {
            "label": "Distribution Network Length",
            "value": "~20,000",
            "unit": "km",
            "comparison": "33kV / 11kV / 0.4kV Lines"
          },
          {
            "label": "Distribution Transformers",
            "value": "~13,000",
            "unit": "units",
            "comparison": "Asset Reliability Tracked"
          },
          {
            "label": "Full-Stack Architecture",
            "value": "Django",
            "unit": "+ PostGIS",
            "comparison": "With Flutter Offline Sync"
          }
        ]
      },
      "hardwareAndSoftwareStack": [
        "Python (Django REST Framework)",
        "PostgreSQL / PostGIS",
        "Flutter / Dart (Offline Sync)",
        "WindMil (Milsoft)",
        "AutoCAD / GIS Spatial Modeling",
        "SCADA / ADMS"
      ],
      "documents": []
    },
    {
      "id": "proj-predictive-maintenance-ieom",
      "slug": "hybrid-ml-predictive-maintenance-smart-manufacturing",
      "title": "Hybrid Machine Learning Framework for Predictive Maintenance in Smart Manufacturing Using Sensors",
      "subtitle": "Conference Research Paper · IEOM 2026 (Barcelona, Spain · DOI: 10.46254/EU09.20260000)",
      "category": "Physics-Informed ML & Sensing",
      "status": "Published",
      "isTemplatePlaceholder": false,
      "period": "2025 – 2026",
      "role": "First Author (Sk. Humain Ahmed, Debashish Debnath, Bishwajit Saha, Ashraful Alam Limon, Md. Nasif Hasan)",
      "laboratoryOrInstitution": "9th European International Conference on Industrial Engineering and Operations Management (IEOM 2026)",
      "heroImage": "/src/assets/images/predictive_maintenance_sensors_1794056017073.jpg",
      "galleryImages": [
        {
          "url": "/src/assets/images/predictive_maintenance_sensors_1794056017073.jpg",
          "caption": "Figure 1: Sensor-instrumented rotating pharmaceutical production machinery monitoring Operating Hours, Temperature, Vibration, Pressure, Humidity, and Load for Hybrid RF-ANN predictive maintenance."
        }
      ],
      "videoEmbedUrl": "",
      "githubUrl": "",
      "paperUrl": "/assets/aistudio/pm_hml_41bf56b1.pdf",
      "liveDemoSimulationId": "grid-digital-twin",
      "executiveSummary": "Presents a hybrid machine learning framework for predictive maintenance using 5,000 sensor-based operational records collected from rotating production equipment in a pharmaceutical manufacturing line (4,772 normal operation records and 228 failure records across 6 sensor variables: Operating Hours, Temperature, Vibration, Pressure, Humidity, and Load). A Random Forest model first analyzes feature importance, followed by a 32-neuron ReLU Artificial Neural Network (ANN) trained on an 80–20 split to predict failure probabilities and drive a three-state maintenance decision rule (Normal, Warning, Maintenance Required).",
      "problemStatement": "Unexpected equipment failures in smart manufacturing environments cause unplanned downtime, high repair costs, and supply-chain disruptions. Reactive maintenance repairs equipment only after breakdown, while fixed-interval preventive maintenance causes unnecessary interventions. Relying on a single machine learning algorithm often limits interpretability and robustness across noisy, multi-variable industrial operating conditions with severe class imbalance (only 4.56% failure events).",
      "methodologyArchitecture": "1. Sensor Data Collection & Preprocessing (N = 5,000): Recorded 6 operational parameters—Operating Hours (mean 4015.54 ± 2279.87 hrs), Temperature (71.92 ± 11.15 °C), Vibration (3.20 ± 1.10 mm/s), Pressure (31.04 ± 5.46 bar), Humidity (45.89 ± 8.89%), and Load (67.33 ± 18.73%)—with binary failure labels (4,772 Normal = 0; 228 Failure = 1). Inspected for missing entries, normalized numerical features, and partitioned via an 80%–20% train-test split (4,000 train / 1,000 test).\n2. Hybrid Random Forest + ANN Architecture: Applied Random Forest across decision trees to rank feature importance, then trained a feed-forward Artificial Neural Network (1 hidden layer with 32 ReLU neurons, sigmoid output layer, Adam optimizer with learning rate = 0.001 for 50 epochs) to output failure probability P(Failure) = g(f_RF(X)).\n3. Three-State Maintenance Decision Rule: Classified machine operating conditions using empirical probability thresholds θ₁ = 0.3 and θ₂ = 0.6 into Normal (P < 0.3), Warning (0.3 ≤ P < 0.6), and Maintenance Required (P ≥ 0.6).",
      "experimentalValidation": "Published in Proceedings of the 9th European International Conference on Industrial Engineering and Operations Management (IEOM, Barcelona, Spain, July 20–22, 2026; DOI: 10.46254/EU09.20260000). Random Forest feature importance revealed that Load Percentage (0.2116) and Operating Hours (0.2044) are the primary drivers of machine failure, followed by Vibration (0.1827), Pressure (0.1655), Temperature (0.1501), and Humidity (0.0857). On the 1,000-record unseen test set, the hybrid model achieved 84.5% overall classification accuracy (836 True Negatives, 119 False Positives, 36 False Negatives, 9 True Positives; Precision = 0.0703, Recall = 0.20, F1-score = 0.104), and the study formulates SMOTE/cost-sensitive extensions to address the 4.56% rare-failure class imbalance.",
      "equations": [
        {
          "id": "eq-pdm-1",
          "title": "Sensor Feature Vector & Hybrid Random Forest–ANN Failure Probability (Eqs. 1–3)",
          "latex": "y = f(X), \\quad X = [OH, T, V, P, H, L], \\quad P(\\text{Failure}) = g\\big(f_{RF}(X)\\big)",
          "explanation": "Where X consists of Operating Hours (OH), Temperature (T), Vibration (V), Pressure (P), Humidity (H), and Load (L); f_RF(X) denotes Random Forest feature selection and g(·) denotes the 32-neuron ReLU + Sigmoid Artificial Neural Network."
        },
        {
          "id": "eq-pdm-2",
          "title": "Three-Tier Predictive Maintenance Decision Rule (Eq. 4, θ₁ = 0.3, θ₂ = 0.6)",
          "latex": "D = \\begin{cases} \\text{Normal}, & P(\\text{Failure}) < 0.3 \\\\ \\text{Warning}, & 0.3 \\le P(\\text{Failure}) < 0.6 \\\\ \\text{Maintenance Required}, & P(\\text{Failure}) \\ge 0.6 \\end{cases}",
          "explanation": "Categorizes continuous ANN failure probabilities into Normal operation, Warning (preventive inspection recommended), and Maintenance Required (immediate intervention)."
        }
      ],
      "systemArchitecture": {
        "title": "Hybrid Random Forest + ANN Predictive Maintenance Decision Support Pipeline",
        "nodes": [
          {
            "id": "n-sens",
            "label": "6-Sensor Operational Dataset",
            "sublabel": "5,000 Records (4,772 Normal, 228 Fail)",
            "mathLatex": "X = [OH, T, V, P, H, L]"
          },
          {
            "id": "n-feat",
            "label": "Random Forest Importance",
            "sublabel": "Load (0.2116) & Hours (0.2044)",
            "mathLatex": "f_{RF}(X) \\mapsto \\text{Ranked Features}"
          },
          {
            "id": "n-hybrid",
            "label": "32-Neuron ReLU ANN",
            "sublabel": "Sigmoid Output · Adam (lr=0.001, 50 ep)",
            "mathLatex": "P(\\text{Failure}) = g(f_{RF}(X))"
          },
          {
            "id": "n-maint",
            "label": "3-State Decision System",
            "sublabel": "84.5% Test Accuracy (θ₁=0.3, θ₂=0.6)",
            "mathLatex": "D \\in \\{\\text{Normal, Warning, Maint.}\\}"
          }
        ],
        "feedbackLoopDescription": "Predicted failure probabilities categorize machines into Normal (<0.3), Warning (0.3–0.6), and Maintenance Required (≥0.6) to prioritize inspection schedules."
      },
      "simulationMetrics": {
        "chartTitle": "Random Forest Feature Importance Score Across the 6 Monitored Sensor Parameters (Figure 2)",
        "xAxisLabel": "Sensor Parameter Index (1=Load, 2=Op. Hours, 3=Vibration, 4=Pressure, 5=Temp, 6=Humidity)",
        "yAxisLabel": "RF Feature Importance Score",
        "theoreticalLabel": "Top Stress Factor Reference (0.2116)",
        "empiricalLabel": "Random Forest Importance Score (IEOM 2026)",
        "baselineLabel": "Uniform Feature Weight Baseline (1/6 = 0.1667)",
        "dataPoints": [
          {
            "x": 1,
            "theoretical": 0.2116,
            "empirical": 0.2116,
            "baseline": 0.1667
          },
          {
            "x": 2,
            "theoretical": 0.2116,
            "empirical": 0.2044,
            "baseline": 0.1667
          },
          {
            "x": 3,
            "theoretical": 0.2116,
            "empirical": 0.1827,
            "baseline": 0.1667
          },
          {
            "x": 4,
            "theoretical": 0.2116,
            "empirical": 0.1655,
            "baseline": 0.1667
          },
          {
            "x": 5,
            "theoretical": 0.2116,
            "empirical": 0.1501,
            "baseline": 0.1667
          },
          {
            "x": 6,
            "theoretical": 0.2116,
            "empirical": 0.0857,
            "baseline": 0.1667
          }
        ],
        "keyFindings": [
          {
            "label": "Dataset Size & Split",
            "value": "5,000",
            "unit": "records",
            "comparison": "80% Train (4k) / 20% Test (1k)"
          },
          {
            "label": "Test Set Accuracy",
            "value": "84.5%",
            "unit": "accuracy",
            "comparison": "836 TN · 9 TP · F1 = 0.104"
          },
          {
            "label": "Top Influencer (RF)",
            "value": "0.2116",
            "unit": "Load %",
            "comparison": "Followed by Op. Hours (0.2044)"
          },
          {
            "label": "Decision Thresholds",
            "value": "0.3 / 0.6",
            "unit": "θ₁ / θ₂",
            "comparison": "Normal · Warning · Maint. Req."
          }
        ]
      },
      "hardwareAndSoftwareStack": [
        "Python",
        "Random Forest (Feature Importance Analysis)",
        "Artificial Neural Network (32-Unit ReLU + Sigmoid, Adam)",
        "Pearson Correlation & Confusion Matrix Diagnostics",
        "3-State Predictive Maintenance Decision System"
      ],
      "documents": [
        {
          "title": "IEOM 2026 Conference Paper PDF: Hybrid Machine Learning Framework for Predictive Maintenance in Smart Manufacturing Using Sensors",
          "url": "/assets/aistudio/pm_hml_41bf56b1.pdf",
          "type": "Paper PDF"
        }
      ]
    }
  ],
  "publications": [
    {
      "id": "pub-ieom-2026",
      "title": "Hybrid Machine Learning Framework for Predictive Maintenance in Smart Manufacturing Using Sensors",
      "authors": "Sk. Humain Ahmed, Debashish Debnath, Bishwajit Saha, Ashraful Alam Limon, and Md. Nasif Hasan",
      "venue": "Proceedings of the 9th European International Conference on Industrial Engineering and Operations Management (IEOM), Barcelona, Catalonia, Spain, July 20–22, 2026",
      "year": "2026",
      "status": "Published",
      "researchDomain": "Physics-Informed ML & Sensing",
      "doiUrl": "https://doi.org/10.46254/EU09.20260000",
      "pdfUrl": "/assets/aistudio/pm_hml_41bf56b1.pdf",
      "codeUrl": "",
      "abstract": "Predictive maintenance has become an essential component of smart manufacturing systems for reducing unexpected equipment failures and improving operational efficiency. This study presents a hybrid machine learning framework for predictive maintenance using sensor-based machine operational data. The dataset consists of 5,000 machine operating records collected from sensor monitoring systems, including parameters such as operating hours, temperature, vibration, pressure, humidity, and machine load. A Random Forest model is first applied to analyze feature importance and identify the most influential parameters associated with machine failure. Subsequently, an Artificial Neural Network (ANN) model is employed to predict machine failure conditions based on the selected operational features. The dataset is divided into training and testing subsets using an 80–20 split to evaluate the predictive capability of the model. Experimental results indicate that load percentage (0.2116) and operating hours (0.2044) are the most influential factors affecting machine failure, followed by vibration (0.1827) and pressure (0.1655). The proposed framework achieved an overall prediction accuracy of 84.5%.",
      "bibtex": "@inproceedings{ahmed2026hybrid,\n  title={Hybrid Machine Learning Framework for Predictive Maintenance in Smart Manufacturing Using Sensors},\n  author={Ahmed, Sk. Humain and Debnath, Debashish and Saha, Bishwajit and Limon, Ashraful Alam and Hasan, Md. Nasif},\n  booktitle={Proceedings of the 9th European International Conference on Industrial Engineering and Operations Management},\n  address={Barcelona, Catalonia, Spain},\n  month={July},\n  year={2026},\n  publisher={IEOM Society International},\n  doi={10.46254/EU09.20260000}\n}"
    },
    {
      "id": "pub-icmiee-2016",
      "title": "Study and Simulation of Various Heat Transfer Models of SI Engine",
      "authors": "Md Shariful Islam, Sk Humain Ahmed, and Afsar Ahammed",
      "venue": "Proceedings of the International Conference on Mechanical, Industrial and Energy Engineering (ICMIEE-PI-160369), 26–27 December, 2016, Khulna, Bangladesh",
      "year": "2016",
      "status": "Published",
      "researchDomain": "Thermo-Fluid & Combustion Modeling",
      "doiUrl": "https://www.researchgate.net/publication/365315997",
      "pdfUrl": "/assets/aistudio/ICMIEE-PI-160369_0cd47271.pdf",
      "codeUrl": "",
      "abstract": "Heat transfer from cylinder walls is a major factor for engine performance, emission and the efficient design of cooling system of internal combustion engines. Furthermore, heat transfer phenomenon causes thermally induced mechanical stresses compromising the reliability of engine components. This paper shows a comparative study of five different heat transfer models of SI engine (Annand, Woschni, Modified Woschni, Hohenberg, and Han et al.) using a two-zone thermodynamic combustion model in MATLAB (ODE23). Simulated cylinder pressure, burned and unburned zone temperatures, work, heat transfer, and heat flux were compared with Rakopoulos experimental data, establishing that Hohenberg performs best during compression, Han et al. and Woschni perform best during combustion, and Modified Woschni and Annand perform best during expansion.",
      "bibtex": "@inproceedings{islam2016study,\n  title={Study and Simulation of Various Heat Transfer Models of SI Engine},\n  author={Islam, Md Shariful and Ahmed, Sk Humain and Ahammed, Afsar},\n  booktitle={Proceedings of the International Conference on Mechanical, Industrial and Energy Engineering (ICMIEE)},\n  pages={ICMIEE-PI-160369},\n  address={Khulna, Bangladesh},\n  month={December},\n  year={2016}\n}"
    }
  ],
  "education": [
    {
      "id": "edu-buet",
      "degree": "B.Sc. in Mechanical Engineering",
      "department": "Department of Mechanical Engineering",
      "institution": "Bangladesh University of Engineering and Technology (BUET)",
      "location": "Dhaka, Bangladesh",
      "period": "Graduated",
      "gpaOrHonors": "CGPA: 3.47 / 4.00 (Senior Year Trend: L4/T1: 3.71, L4/T2: 3.96)",
      "thesisTitle": "Study and Simulation of Various Heat Transfer Models of SI Engine",
      "advisorPlaceholder": "Prof. Dr. Md. Zahurul Haq (Department of Mechanical Engineering, BUET)",
      "coursework": [
        "GRE: 311 (Verbal: 151, Quantitative: 160, Analytical Writing: 3.5)",
        "TOEFL iBT: 97 (Reading: 25, Listening: 24, Speaking: 27, Writing: 21)"
      ],
      "isPlaceholder": false
    }
  ],
  "experience": [
    {
      "id": "exp-nesco",
      "role": "Executive Engineer",
      "laboratoryOrOrganization": "Northern Electricity Supply PLC (NESCO)",
      "institution": "Power Distribution Utility",
      "location": "Rajshahi, Bangladesh",
      "period": "2018 – Present",
      "principalInvestigator": "",
      "highlights": [
        "Contributed to the development of a digital twin for a large-scale electrical distribution network with ~2 million customer meters, ~20,000 km of lines, and ~13,000 transformers.",
        "Performed load-flow simulations, short circuit current evaluations, and asset reliability analyses using computational tools (WindMil / Milsoft) to optimize network operational decision-making.",
        "Independently designed and deployed a production-grade Web application for visualizing electrical distribution network assets and a Mobile application for surveying customer meters with complete power connectivity from source to meter point using Python (Django REST Framework), PostgreSQL/PostGIS, and Flutter/Dart integrating offline field sensing, spatial synchronization, and utility-scale asset management."
      ],
      "isPlaceholder": false
    },
    {
      "id": "exp-erl",
      "role": "Probationary Engineer (Mechanical)",
      "laboratoryOrOrganization": "Eastern Refinery Ltd",
      "institution": "Petroleum Refining & Process Plant",
      "location": "Chattogram, Bangladesh",
      "period": "2017 – 2018",
      "principalInvestigator": "",
      "highlights": [
        "Conducted mechanical inspection, troubleshooting, and maintenance of complex thermo-fluid process systems, including centrifugal pumps, gas compressors, and steam-turbine units."
      ],
      "isPlaceholder": false
    },
    {
      "id": "exp-uttara",
      "role": "Lecturer (Part-time)",
      "laboratoryOrOrganization": "Uttara University",
      "institution": "Undergraduate Engineering Faculty",
      "location": "Dhaka, Bangladesh",
      "period": "2016 – 2017",
      "principalInvestigator": "",
      "highlights": [
        "Delivered undergraduate lectures on foundational mechanical engineering and physics principles."
      ],
      "isPlaceholder": false
    }
  ],
  "skillGroups": [
    {
      "id": "sk-prog-ml",
      "category": "Programming, System ID & Machine Learning",
      "description": "Sparse dynamical identification, model-based RL, and scientific computing.",
      "skills": [
        {
          "name": "Python & C/C++",
          "specification": "Scientific Computing, Numerical ODEs & Control Algorithms"
        },
        {
          "name": "PySINDy & Sparse Regression",
          "specification": "STLRidge, Ensemble Bagging, 41-Term Control-Affine Libraries"
        },
        {
          "name": "Ray RLlib & PyTorch",
          "specification": "Proximal Policy Optimization (PPO), Neural Surrogate Control"
        },
        {
          "name": "DeepMind Control Suite & Scikit-Learn",
          "specification": "Continuous Control Benchmarks & Hybrid Predictive ML"
        }
      ]
    },
    {
      "id": "sk-eng-sim",
      "category": "Engineering, Thermo-Fluid & Grid Simulation",
      "description": "Multiphysics simulation, CAD, and utility power network analysis.",
      "skills": [
        {
          "name": "MATLAB / Simulink",
          "specification": "Combustion & Heat Transfer ODE Modeling, Control System Design"
        },
        {
          "name": "ANSYS",
          "specification": "Finite Element & Thermo-Fluid Computational Analysis"
        },
        {
          "name": "WindMil (Milsoft)",
          "specification": "Distribution Load-Flow, Short-Circuit & Reliability Analysis"
        },
        {
          "name": "SolidWorks & AutoCAD",
          "specification": "3D Mechanical CAD & Engineering Drafting"
        }
      ]
    },
    {
      "id": "sk-soft-db",
      "category": "Cyber-Physical Software & Spatial Databases",
      "description": "Full-stack digital twin platforms and offline field sensing systems.",
      "skills": [
        {
          "name": "PostgreSQL & PostGIS",
          "specification": "Spatial Database Design & ~2M-Node Grid Connectivity Graphs"
        },
        {
          "name": "Django REST Framework",
          "specification": "Production Backend APIs & Spatial Synchronization"
        },
        {
          "name": "Flutter / Dart",
          "specification": "Cross-Platform Offline Field Sensing & Asset Surveying Apps"
        }
      ]
    }
  ],
  "cv": {
    "lastUpdated": "July 2026",
    "fileName": "Sk_Humain_Ahmed_CV.pdf",
    "uploadedPdfDataUrl": "",
    "externalPdfUrl": "/assets/aistudio/CV_Gemini_870e22d1.pdf",
    "researchObjective": "Mechanical engineer with 8 years of experience in utility-scale computational modeling, digital twins, and field data systems for a ~2-million-meter power distribution network. Highly motivated to pursue a Ph.D. focusing on intelligent dynamical systems, robotics, and physics-informed AI, learning-based control, with applications to energy and cyber-physical systems.",
    "awardsAndHonors": [
      {
        "title": "Technical Exposure Program on Smart Grid Systems and SCADA/ADMS",
        "organization": "NRECA Headquarters, USA",
        "year": "2024",
        "note": "International smart grid automation, SCADA/ADMS, and utility control systems training."
      },
      {
        "title": "Advanced GIS-Based Management System Training – Spatial Database Design, Electrical Network Modeling for Grid Optimization",
        "organization": "NRECA International",
        "year": "2023–2024",
        "note": "Spatial network database architecture and computational distribution grid optimization."
      }
    ],
    "teachingAndService": [
      {
        "role": "Lecturer (Part-time)",
        "courseOrVenue": "Uttara University, Dhaka, Bangladesh — Delivered undergraduate lectures on foundational mechanical engineering and physics principles",
        "period": "2016 – 2017"
      }
    ]
  }
};
