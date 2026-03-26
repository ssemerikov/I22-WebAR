import * as THREE from 'three';

export class SimpleAR {
    /**
     * @param {HTMLVideoElement} videoEl - live webcam video element
     * @param {number} markerSize - physical marker side length in metres (default 0.1 m)
     */
    constructor(videoEl, markerSize = 0.1) {
        this.video = videoEl;
        this.markerSize = markerSize;

        // Offscreen canvas used to capture video frames into OpenCV
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

        // Camera intrinsic matrices — initialised lazily in _initCameraMatrix()
        this.camMatrix = null;
        this.distCoeffs = null;SimpleAR
    }

    /** True once OpenCV is loaded and the video stream has real dimensions */
    get isReady() {
        return typeof cv !== 'undefined'
            && cv.Mat !== undefined
            && this.video.videoWidth > 0;
    }

    // ─── User contribution ───────────────────────────────────────────────────
    /**
     * Sort 4 detected corner points into a consistent order:
     *   index 0 → Top-Left
     *   index 1 → Top-Right
     *   index 2 → Bottom-Right
     *   index 3 → Bottom-Left
     *
     * This order MUST match the objectPoints defined in computePose() so that
     * solvePnP can correctly pair 2-D image corners with 3-D world corners.
     *
     * @param {Array<{x: number, y: number}>} pts - 4 unsorted corner points
     * @returns {Array<{x: number, y: number}>} same 4 points in TL→TR→BR→BL order
     *
     * TODO: implement this method.
     * Hint — x+y approach (no trig needed):
     *   TL = point with smallest (x + y)
     *   BR = point with largest  (x + y)
     *   TR = point with smallest (x - y)
     *   BL = point with largest  (x - y)
     */
    _sortCorners(pts) {
        // ← Your 5-10 lines go here
        return pts; // placeholder — replace with real sorting
    }
    // ─────────────────────────────────────────────────────────────────────────

    _initCameraMatrix() {
        const fx = this.canvas.width;   // rough focal length ≈ image width → ~53° FOV
        const cx = this.canvas.width  / 2;
        const cy = this.canvas.height / 2;

        if (this.camMatrix)  this.camMatrix.delete();
        if (this.distCoeffs) this.distCoeffs.delete();

        this.camMatrix  = cv.matFromArray(3, 3, cv.CV_64F,
            [fx,  0, cx,
              0, fx, cy,
              0,  0,  1]);
        this.distCoeffs = cv.Mat.zeros(4, 1, cv.CV_64F);
    }

    /**
     * Capture the current video frame, detect a black square marker, and
     * compute its 3-D pose relative to the camera.
     *
     * @returns {{ position: THREE.Vector3, quaternion: THREE.Quaternion } | null}
     */
    computePose() {
        if (!this.isReady) return null;

        // Keep offscreen canvas in sync with video resolution
        if (this.canvas.width  !== this.video.videoWidth ||
            this.canvas.height !== this.video.videoHeight) {
            this.canvas.width  = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            this._initCameraMatrix();
        }

        this.ctx.drawImage(this.video, 0, 0);

        // ── OpenCV pipeline ────────────────────────────────────────────────
        let src, gray, binary, contours, hierarchy;
        let bestCandidate = null;
        let objectPts, imagePts, rvec, tvec;

        try {
            src  = cv.imread(this.canvas);

            // 1. RGBA → Grayscale
            gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

            // 2. Grayscale → Binary (inverted so the dark marker becomes white)
            binary = new cv.Mat();
            cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU);

            // 3. Find external contours
            contours  = new cv.MatVector();
            hierarchy = new cv.Mat();
            cv.findContours(binary, contours, hierarchy,
                cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            // 4. Find the largest quadrilateral
            let bestArea = 0;
            for (let i = 0; i < contours.size(); i++) {
                const contour   = contours.get(i);  // ref owned by MatVector — do NOT delete
                const perimeter = cv.arcLength(contour, true);

                const approx = new cv.Mat();
                cv.approxPolyDP(contour, approx, 0.02 * perimeter, true);

                if (approx.rows === 4) {
                    const area = cv.contourArea(approx);
                    if (area > 500 && cv.isContourConvex(approx) && area > bestArea) {
                        bestArea = area;
                        if (bestCandidate) bestCandidate.delete();
                        bestCandidate = approx;
                    } else {
                        approx.delete();
                    }
                } else {
                    approx.delete();
                }
            }

            if (!bestCandidate) return null;

            // 5. Extract raw corner pixel coords
            const rawPts = [];
            for (let i = 0; i < 4; i++) {
                rawPts.push({
                    x: bestCandidate.data32S[i * 2],
                    y: bestCandidate.data32S[i * 2 + 1],
                });
            }
            bestCandidate.delete();
            bestCandidate = null;

            // 6. Sort corners into TL→TR→BR→BL
            const sorted = this._sortCorners(rawPts);

            // 7. Build OpenCV matrices for solvePnP
            imagePts = cv.matFromArray(4, 1, cv.CV_32FC2,
                sorted.flatMap(p => [p.x, p.y]));

            const half = this.markerSize / 2;
            // World-space corners match the sorted order: TL TR BR BL
            objectPts = cv.matFromArray(4, 1, cv.CV_32FC3, [
                -half,  half, 0,
                 half,  half, 0,
                 half, -half, 0,
                -half, -half, 0,
            ]);

            // 8. Solve for rotation (Rodrigues) and translation vectors
            rvec = new cv.Mat();
            tvec = new cv.Mat();
            cv.solvePnP(objectPts, imagePts,
                this.camMatrix, this.distCoeffs, rvec, tvec);

            const r = rvec.data64F;
            const t = tvec.data64F;

            // 9. Convert OpenCV coords (Y-down, Z-forward)
            //    → Three.js coords  (Y-up,   Z-toward-viewer): negate Y and Z
            const angle = Math.sqrt(r[0]**2 + r[1]**2 + r[2]**2);
            if (angle < 1e-10) return null;

            const axis       = new THREE.Vector3(r[0] / angle, -r[1] / angle, -r[2] / angle);
            const quaternion = new THREE.Quaternion().setFromAxisAngle(axis, angle);
            const position   = new THREE.Vector3(t[0], -t[1], -t[2]);

            return { position, quaternion };

        } catch (err) {
            console.error('SimpleAR.computePose error:', err);
            return null;

        } finally {
            // Every Mat created inside this call must be freed here
            [src, gray, binary, contours, hierarchy, bestCandidate,
             objectPts, imagePts, rvec, tvec]
                .forEach(m => m && m.delete && m.delete());
        }
    }

    /** Release persistent OpenCV Mats */
    dispose() {
        if (this.camMatrix)  { this.camMatrix.delete();  this.camMatrix  = null; }
        if (this.distCoeffs) { this.distCoeffs.delete(); this.distCoeffs = null; }
    }
}
