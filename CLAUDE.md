# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Student coursework site for "Augmented Reality on the Web" (Доповнена реальність у веб), group І-22. The course progresses through 17 tasks (`task01/` – `task17/`), each building toward browser-based AR using Three.js and the webcam.

## Running the Project

There is no build system. Serve files over HTTP — required because:
- ES modules cannot load from `file://` protocol
- `navigator.mediaDevices.getUserMedia()` requires a secure context (localhost or HTTPS)

```bash
# Any of these work from the repo root:
python3 -m http.server 8080
npx serve .
```

Then open `http://localhost:8080` in a browser.

## Architecture

**No build toolchain.** Everything is vanilla HTML + JS ES modules loaded directly in the browser.

**Three.js** is loaded via browser-native importmaps in each HTML file — no npm install needed:
```html
<script type="importmap">
{
    "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.183.2/build/three.module.min.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/"
    }
}
</script>
```

**AR overlay pattern** (established in task01): webcam video + Three.js canvas are both `position: absolute`, layered in DOM order — video first, canvas on top with `alpha: true` renderer so the 3D scene is transparent where no geometry exists.

**Task structure**: Each `taskXX/` folder is self-contained with its own HTML entry points and JS modules. The root `index.html` links to each task.

## Current State

- `task01/exp1.html` → `main.js`: rotating blue cube over live webcam feed
- `task01/exp2.html` → `mainar.js`: same scene with pseudocode stub showing where a real AR pose-estimation engine would plug in
- Tasks 02–17 are listed in `index.html` but their directories don't exist yet
