# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Student coursework site for "Augmented Reality on the Web" (Доповнена реальність у веб), group I-22. The course progresses through 17 tasks (`task01/` – `task17/`), each building toward browser-based AR using Three.js and the webcam.

## Running the Project

No build system. Serve files over HTTP (required for ES modules and `getUserMedia`):

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Architecture

**No build toolchain.** Vanilla HTML + JS ES modules loaded directly in the browser.

**Three.js** is loaded via browser-native importmaps in each HTML file — no npm install needed. Each task declares its own importmap and can pin its own Three.js version.

**Version compatibility constraint:** MindAR v1.2.5 imports `sRGBEncoding` from Three.js, which was removed in r162. Tasks using MindAR must pin Three.js to `0.161.0` or earlier. The vendored `mindar/` bundles may be patched to work with newer versions.

**AR overlay pattern** (task01): webcam `<video>` + Three.js `<canvas>` are both `position: absolute`, layered in DOM order — video first, canvas on top with `alpha: true` renderer so the 3D scene is transparent where no geometry exists.

**SimpleAR class** (`task01/ar.js`): Educational marker detection implementation using OpenCV.js. Detects black square markers via contour detection, sorts corners using sum/difference approach, then uses `solvePnP` to compute 6DOF pose. OpenCV coordinates (Y-down, Z-forward) are converted to Three.js (Y-up, Z-toward-viewer) by negating Y and Z components.

**Task structure**: Each `taskXX/` folder is self-contained with its own HTML entry points and JS modules. The root `index.html` links to each task.

**Shared utilities** (`mylib/`): Reusable loader functions (`loadGLTF`, `loadAudio`, `loadVideo`) wrapped as Promises for cleaner async/await patterns. Import from `"../mylib/loader.js"`.

**Vendored libraries:**
- `mindar/` — local copies of MindAR production bundles (image-tracking, face-tracking, A-Frame and Three.js integrations). Reference from importmaps as `"mindar-image-three": "../mindar/mindar-image-three.prod.js"`.
- `mind-ar-js-master/` — full repository clone for reference (not used directly).

**Assets:** `assets/` contains image targets (`.png`), compiled MindAR target files (`.mind`), and 3D models (`.glb`).

## Current State

- `task01/exp1.html` → `main.js`: rotating cube over live webcam feed (Three.js 0.183.2)
- `task01/exp2.html` → `mainar.js` + `ar.js`: OpenCV.js marker detection with `SimpleAR` class using solvePnP (Three.js 0.183.2, OpenCV.js via CDN)
- `task02/index.html` → `main.js`: MindAR image-tracking with basic geometries (cube, lathe, capsule)
- `task03/index.html` → `main.js`: MindAR with textured meshes and TextGeometry
- `task04/index.html` → `main.js`: MindAR with GLTFLoader for 3D model loading, anchor event handlers
- `task05/index.html` → `main.js`: MindAR with animated GLTF models, positional audio
- `task06/index.html` → `main.js`: MindAR with VideoTexture for playing video on tracked images
- `task07/index.html` → `main.js`: MindAR with CSS3DRenderer for overlaying HTML content on tracked images

## MindAR Integration Pattern

**Anchor system**: MindAR uses anchors to track image targets. Create anchors with `mindarThree.addAnchor(index)` where index corresponds to targets in the `.mind` file. Add 3D content to `anchor.group`:

```javascript
const anchor = mindarThree.addAnchor(0);
anchor.group.add(myMesh);
```

**CSS anchors** (for HTML overlays): Use `mindarThree.addCSSAnchor(index)` with CSS3DRenderer to overlay HTML elements. MindAR provides `cssRenderer`, `cssScene`, and `camera` alongside the regular `renderer` and `scene`:

```javascript
const { renderer, cssRenderer, scene, cssScene, camera } = mindarThree;
const anchor = mindarThree.addCSSAnchor(0);
const cssObject = new CSS3DObject(htmlElement);
anchor.group.add(cssObject);

renderer.setAnimationLoop(() => {
    cssRenderer.render(cssScene, camera);
});
```

**Event handlers**: Anchors emit `onTargetFound` and `onTargetLost` for triggering actions (play/pause audio, video, animations).

**Animation loop**: Use `renderer.setAnimationLoop()` instead of `requestAnimationFrame()` for proper timing with MindAR's internal loop.
