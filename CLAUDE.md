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

**Version compatibility constraint:** MindAR v1.2.5 imports `sRGBEncoding` from Three.js, which was removed in r162. Tasks using MindAR must pin Three.js to `0.161.0` or earlier. Tasks without MindAR can use any version (currently `0.183.2`).

**AR overlay pattern** (task01): webcam `<video>` + Three.js `<canvas>` are both `position: absolute`, layered in DOM order — video first, canvas on top with `alpha: true` renderer so the 3D scene is transparent where no geometry exists.

**Task structure**: Each `taskXX/` folder is self-contained with its own HTML entry points and JS modules. The root `index.html` links to each task.

**Vendored libraries:**
- `mindar/` — local copies of MindAR production bundles (image-tracking, face-tracking, A-Frame and Three.js integrations). These can be referenced from importmaps instead of the CDN.

**Assets:** `assets/` contains image targets (`.png`) and compiled MindAR target files (`.mind`).

## Current State

- `task01/exp1.html` → `main.js`: rotating blue cube over live webcam feed (Three.js 0.183.2)
- `task01/exp2.html` → `mainar.js` + `ar.js`: OpenCV-based marker detection with `SimpleAR` class using solvePnP (Three.js 0.183.2, OpenCV.js via CDN)
- `task02/index.html` → `main.js`: Three.js scene with MindAR image-tracking integration (Three.js 0.161.0, MindAR 1.2.5 via CDN)
