# Kinevro

Kinevro is a webcam-based, hand-gesture-controlled generative visual
environment developed as part of a master's thesis. The project
investigates the reliability and responsiveness of static-pose versus
temporal gesture classification for real-time visual control.

The goal is to create an expressive desktop application in which users
manipulate generative visuals through natural hand movements, while
evaluating the recognition methods behind that interaction.

## Project status

Kinevro is under active development. The current prototype includes:

-   An Electron desktop application.
-   A React and TypeScript frontend built with Vite.
-   A Canvas 2D particle system.
-   Webcam access and hand-landmark tracking with MediaPipe.
-   Tracking of up to two hands.
-   Initial rule-based recognition of open-palm, fist, and pinch
    gestures.
-   Basic hand-driven particle interaction.

The Python machine-learning backend, temporal gesture classification,
and final research evaluation pipeline are planned components; they are
not yet part of the working prototype.

## Technology stack

  -----------------------------------------------------------------------
  Area                    Technology              Status
  ----------------------- ----------------------- -----------------------
  Desktop application     Electron                Implemented

  Frontend                React, TypeScript, CSS  Implemented

  Build tooling           Vite                    Implemented

  Generative visuals      Canvas 2D               Implemented

  Hand tracking           MediaPipe Tasks Vision  Implemented

  Initial gesture         Landmark-based          Prototype
  recognition             TypeScript rules        

  Runtime ML backend      Python                  Planned

  ML and data processing  NumPy, pandas,          Planned
                          scikit-learn            

  Deep learning           PyTorch, if justified   Optional / under
                                                  consideration

  Research and            Jupyter / Google Colab  Planned
  experimentation                                 

  Version control         Git and GitHub          In use
  -----------------------------------------------------------------------

Electron and the renderer use JavaScript/TypeScript, the standard
application model for this stack. Python is intended for the dedicated
runtime ML backend and classifier-related processing. The project does
not currently require a separate Java or .NET service.

## Planned architecture and data flow

1.  Electron creates and manages the desktop application window.
2.  React renders the user interface and generative visual scene.
3.  MediaPipe tracks hands in the renderer and produces landmark data.
4.  A small, versioned protocol passes landmarks, derived features, or
    feature sequences to the Python process.
5.  Python performs the selected classification and returns gesture
    events or classifier results.
6.  The frontend applies interaction and activation rules, then updates
    the visual scene.

The process transport (for example, standard input/output or a
loopback-only API/socket) will be selected when backend integration
begins. Avoid adding a server framework before a concrete requirement
exists.

The architecture should keep hand tracking, gesture classification,
interaction mapping, and visual rendering as separate responsibilities.
This will make it easier to compare static-pose and temporal approaches
without coupling the research logic to the particle system.

## Repository structure

The current application lives in `frontend/`. The following is the
intended structure as the project grows; not every directory exists yet.

``` text
Kinevro/
├── frontend/
│   ├── electron/       # Electron main process and preload
│   ├── src/            # React renderer, hand tracking, UI, and visuals
│   └── ...
├── python/             # Planned runtime Python backend and protocol
├── ml/                 # Planned offline training, notebooks, and evaluation
├── vision/             # Optional tracking experiments; avoid duplicating runtime code
├── research/           # Thesis materials and research documentation
├── protocol/           # Versioned frontend/backend message definitions
├── tests/              # Automated tests
├── docs/               # Architecture and development documentation
└── README.md
```

Create directories incrementally when their contents are needed. Keep
the runtime implementation distinct from offline experiments and
training code.

See
[`Kinevro_Thesis_Roadmap_Electron.md`](Kinevro_Thesis_Roadmap_Electron.md)
for the thesis roadmap and milestones, if that document is present in
the repository root.

## Getting started

### Prerequisites

-   Node.js and npm.
-   A webcam.
-   A Windows environment for the current desktop development setup.

### Install dependencies

Open a terminal in the frontend directory:

``` powershell
cd frontend
npm install
```

### Run the application

``` powershell
npm run dev
```

The available npm scripts are defined in `frontend/package.json`. Use
that file as the source of truth if development or build commands
change.

> Note: MediaPipe's model and WebAssembly assets are currently loaded by
> the frontend from their configured remote URLs. An internet connection
> may therefore be required for initial setup and runtime.

## Security and privacy

-   Keep `contextIsolation: true` and `nodeIntegration: false` in
    Electron's renderer configuration.
-   Expose only a narrow, intentional API through the Electron preload
    script and `contextBridge`.
-   Validate data crossing Electron IPC and frontend/backend boundaries.
-   Keep webcam processing local by default.
-   Do not record or persist webcam video by default.
-   Do not commit private datasets, participant recordings, credentials,
    secrets, or large model artifacts.
-   Document future data collection and obtain appropriate consent
    before collecting participant data.

## Research methodology and integrity

The central research question concerns the reliability and
responsiveness of static-pose versus temporal gesture classification for
real-time visual control.

The comparison should use equivalent experimental conditions and clearly
documented evaluation procedures:

-   Prevent participant and session leakage between training,
    validation, and test splits.
-   Define gesture classes and activation rules before evaluation.
-   Measure false activations and missed activations, not only overall
    accuracy.
-   Measure end-to-end response latency and frame rate.
-   Record relevant hardware, software, and runtime conditions.
-   Report limitations, uncertainty, and failure cases.

The choice between static and temporal classification should be treated
as an empirical question. No approach should be described as superior
until the results support that conclusion.

## Development principles

-   Keep features small and independently testable.
-   Separate tracking, classification, interaction logic, and rendering.
-   Prefer explicit, versioned interfaces between TypeScript and Python.
-   Avoid introducing dependencies or infrastructure without a clear
    need.
-   Develop features on dedicated Git branches and merge them into
    `main` through GitHub Pull Requests.
-   Update this README when implementation status, setup instructions,
    or architecture changes.

## Roadmap

1.  Complete and refine gesture-driven particle interactions.
2.  Add two-hand gestures and higher-level visual controls.
3.  Introduce visual customization and interaction presets.
4.  Develop and integrate the Python classification backend.
5.  Compare static-pose and temporal classification experimentally.
6.  Improve usability, performance, reliability, and packaging for the
    final desktop application.

The roadmap may change as implementation and research findings develop.
