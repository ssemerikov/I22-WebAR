# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Student coursework site for "Augmented Reality on the Web" (Доповнена реальність у веб), group I-22. The course progresses through 17 tasks (`task01/` – `task17/`), each building toward browser-based AR using Three.js and the webcam.

**Language:** UI text and comments are in Ukrainian. Code variable names and technical terms are in English.

## Running the Project

No build system. Serve files over HTTP (required for ES modules and `getUserMedia`):

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Architecture

**No build toolchain.** Vanilla HTML + JS ES modules loaded directly in the browser.

**Three.js** is loaded via browser-native importmaps in each HTML file — no npm install needed. Each task declares its own importmap and can pin its own Three.js version.

**Version compatibility constraint:** MindAR v1.2.5 imports `sRGBEncoding` from Three.js, which was removed in r162. Tasks using MindAR must pin Three.js to `0.161.0` or earlier. Tasks using native WebXR (task11+) can use newer Three.js versions (e.g., 0.170.0).

**AR overlay pattern** (task01): webcam `<video>` + Three.js `<canvas>` are both `position: absolute`, layered in DOM order — video first, canvas on top with `alpha: true` renderer so the 3D scene is transparent where no geometry exists.

**SimpleAR class** (`task01/ar.js`): Educational marker detection implementation using OpenCV.js. Detects black square markers via contour detection, sorts corners using sum/difference approach, then uses `solvePnP` to compute 6DOF pose. OpenCV coordinates (Y-down, Z-forward) are converted to Three.js (Y-up, Z-toward-viewer) by negating Y and Z components.

**Task structure**: Each `taskXX/` folder is self-contained with its own HTML entry points and JS modules. The root `index.html` links to each task.

**Shared utilities** (`mylib/`): Reusable loader functions (`loadGLTF`, `loadAudio`, `loadVideo`) wrapped as Promises for cleaner async/await patterns. Import from `"../mylib/loader.js"`.

**Vendored libraries:**
- `mindar/` — local copies of MindAR production bundles (image-tracking, face-tracking, A-Frame and Three.js integrations). Reference from importmaps as `"mindar-image-three": "../mindar/mindar-image-three.prod.js"` or `"mindar-face-three": "../mindar/mindar-face-three.prod.js"`.
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
- `task08/index.html` → `main.js`: MindAR face-tracking with YouTube and Vimeo video overlays via CSS3DObject
- `task09/index.html` → `main.js`: MindAR face-tracking with occlusion using renderOrder and occluder materials
- `task10/index.html` → `code.js`: MindAR face-tracking with textured face mesh using `addFaceMesh()`
- `task11/index.html` → `main.js`: Native WebXR immersive-ar session with manual XR button (Three.js 0.170.0, no MindAR)
- `task12/index.html` → `main.js`: Native WebXR with custom `UARButton` class (localized Ukrainian labels, DOM overlay) and conditional rendering (Three.js 0.170.0, no MindAR)
- `task13/index.html` → `main.js`: Native WebXR з розміщенням випадкових 3D моделей пташок (GLTFLoader) на поверхнях за допомогою hit-test, reticle-індикатор, контролер `select` подія (Three.js 0.170.0, UARButton)

## MindAR Integration Pattern

### Image Tracking

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
    renderer.render(scene, camera); // also render Three.js scene
});
```

### Face Tracking

**Face landmark anchors**: Face tracking uses numeric landmark IDs instead of image target indices. There are 468 landmarks available. Common landmarks include 10 (top of head), 168 (between eyes), 234 (left cheek area), and 454 (right cheek area):

```javascript
import { MindARThree } from 'mindar-face-three';

const mindarThree = new MindARThree({
    container: document.querySelector("#container"),
});

const anchor1 = mindarThree.addCSSAnchor(234); // left face area
const anchor2 = mindarThree.addCSSAnchor(454); // right face area
```

**Face mesh with texture** (task10): Use `addFaceMesh()` to create a mesh that follows the face, then apply a texture:

```javascript
const faceMesh = mindarThree.addFaceMesh();
const textureLoader = new THREE.TextureLoader();
textureLoader.load('../assets/texture.png', (texture) => {
    faceMesh.material.map = texture;
    faceMesh.material.transparent = true;
    faceMesh.material.needsUpdate = true;
});
scene.add(faceMesh);
```

**Face mesh visibility control** (task09): Manually control face mesh visibility in the animation loop to prevent MindAR from auto-showing it:

```javascript
let maskActive = false;
faceMesh.visible = maskActive;

renderer.setAnimationLoop(() => {
    faceMesh.visible = maskActive;
    if (faceMesh.material) faceMesh.material.visible = maskActive;
    renderer.render(scene, camera);
});
```

**Video player integration** (task08): Use CSS3DObject to overlay YouTube/Vimeo players on face landmarks:

```javascript
// YouTube IFrame API
const YT = await loadYouTubeIframeAPI();
const youtubePlayer = new YT.Player('youtube-player', {
    videoId: 'VIDEO_ID',
    playerVars: { 'autoplay': 0, 'controls': 0 }
});

// Vimeo Player API
const vimeoPlayer = new Vimeo.Player(document.querySelector('#vimeo-player'));

// Toggle visibility on target found/lost
anchor1.onTargetFound = () => {
    arDiv.style.visibility = "visible";
    youtubePlayer.playVideo();
};
anchor1.onTargetLost = () => {
    arDiv.style.visibility = "hidden";
    youtubePlayer.pauseVideo();
};
```

**Video toggle** (task10): Hide the webcam video while keeping AR rendering:

```javascript
const toggleBtn = document.querySelector("#toggle-btn");
toggleBtn.addEventListener("click", () => {
    const video = document.querySelector("#container video");
    if (video) {
        video.style.visibility = videoVisible ? "hidden" : "visible";
    }
});
```

**Occlusion** (task09): Use renderOrder and occluder materials to hide AR objects behind the face:

```javascript
// Occluder mesh (head model) - renders first, invisible to eye but blocks later renders
const occluderMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, colorWrite: false });
occluder.scene.traverse((o) => {
    if (o.isMesh) {
        o.material = occluderMaterial;
    }
});
occluder.scene.renderOrder = 0; // Render first

// Visible AR object (e.g., hat) - renders second, occluded by occluder
hat.scene.renderOrder = 1; // Render second
```

### Common Patterns

**VideoTexture** (task06): Load video onto tracked images using `THREE.VideoTexture`:

```javascript
const video = await loadVideo("path/to/video.mp4");
const texture = new THREE.VideoTexture(video);
const material = new THREE.MeshBasicMaterial({ map: texture });
```

**Event handlers**: Anchors emit `onTargetFound` and `onTargetLost` for triggering actions (play/pause audio, video, animations).

**Animation loop**: Use `renderer.setAnimationLoop()` instead of `requestAnimationFrame()` for proper timing with MindAR's internal loop.

### WebXR (Native)

Tasks 11+ use the native WebXR API instead of MindAR. Key differences:

**Session management**: Use `navigator.xr.requestSession("immersive-ar", ...)` to start an AR session. Check support first with `navigator.xr.isSessionSupported("immersive-ar")`.

**DOM overlay**: Pass `{ optionalFeatures: ["dom-overlay"], domOverlay: { root: document.body } }` to overlay HTML elements on the AR view.

**Conditional rendering**: Guard the render loop with `renderer.xr.isPresenting` (task12) or track session state manually (task11) — don't render when no XR session is active.

**Custom AR button**: Task12 defines a `UARButton` class (modeled on Three.js's `XRButton`) with Ukrainian labels, styled button, and session lifecycle handling. This replaces the built-in `XRButton` import.