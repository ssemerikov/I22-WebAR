# GEMINI.md - Project Instructions

This project is a student coursework site for "Augmented Reality on the Web" (Доповнена реальність у веб), group I-22. It focuses on browser-based AR using Three.js and MindAR.

## Core Mandates

- **No Build System:** Do NOT introduce build tools (Webpack, Vite, etc.) or npm dependencies for the client-side code. Use Vanilla HTML + JS ES modules loaded directly in the browser.
- **Three.js via Import Maps:** Three.js and other libraries must be loaded via browser-native importmaps in each HTML file.
- **Version Compatibility:** MindAR v1.2.5 requires Three.js version `0.161.0` or earlier (due to the removal of `sRGBEncoding` in r162). Always check the pinned version in a task's importmap before making changes.
- **Local Serving:** Always use a simple HTTP server (e.g., `python3 -m http.server 8080`) to test, as ES modules and `getUserMedia` require a proper origin.

## Project Structure

- `task01/` – `task17/`: Individual, self-contained coursework tasks.
- `assets/`: Shared assets including image targets (`.mind`), 3D models (`.glb`), and media.
- `mindar/`: Vendored production bundles for MindAR.
- `mylib/`: Shared helper functions (loaders, etc.).

## Development Workflow

### Adding New Tasks
1. Create a new directory `taskXX/`.
2. Create `index.html` with a `<script type="importmap">` for library resolution.
3. Create `main.js` for the AR logic.
4. Link the new task in the root `index.html`.

### Using Shared Utilities
Prefer using the loaders in `mylib/loader.js` for GLTF models, audio, and video to maintain consistency and clean async patterns.

```javascript
import { loadGLTF, loadAudio, loadVideo } from "../mylib/loader.js";
```

### MindAR Patterns
- **Image Tracking:** Use `mindar-image-three` and anchors.
- **Face Tracking:** Use `mindar-face-three` and landmark IDs.
- **Animation:** Always use `renderer.setAnimationLoop()` for MindAR compatibility.

## Testing and Validation
Verify changes by serving the root directory and navigating to the specific task. Ensure that the webcam feed initializes correctly and AR elements are tracked as expected.
