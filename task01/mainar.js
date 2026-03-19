import * as THREE from 'three';
import { SimpleAR } from './ar.js';

document.addEventListener("DOMContentLoaded", () => {
    // ── Scene setup ──────────────────────────────────────────────────────────
    const scene = new THREE.Scene();

    // Cube is sized relative to the marker (markerSize = 0.1 m → cube = 0.08 m)
    const geometry = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const material = new THREE.MeshBasicMaterial({ color: "#0000FF" });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Camera starts with a 53° FOV estimate; updated once video metadata loads
    const camera = new THREE.PerspectiveCamera(53, window.innerWidth / window.innerHeight, 0.001, 100);
    camera.position.set(0, 0, 0);

    // ── Renderer fills the window, sits on top of the video ──────────────────
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top      = "0";
    renderer.domElement.style.left     = "0";

    // ── Video element (behind the canvas) ────────────────────────────────────
    const video = document.createElement("video");
    video.autoplay   = true;
    video.playsInline = true;
    video.style.position   = "absolute";
    video.style.top        = "0";
    video.style.left       = "0";
    video.style.width      = "100%";
    video.style.height     = "100%";
    video.style.objectFit  = "cover";

    // Video first in DOM → behind the canvas
    document.body.appendChild(video);
    document.body.appendChild(renderer.domElement);

    // ── AR engine ────────────────────────────────────────────────────────────
    const ar = new SimpleAR(video, 0.1);   // marker is 10 cm square

    navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
            video.srcObject = stream;
            video.play();

            // Once dimensions are known, align the Three.js camera to the webcam
            video.addEventListener('loadedmetadata', () => {
                const w  = video.videoWidth;
                const h  = video.videoHeight;
                const fx = w;  // focal length estimate (same as ar.js _initCameraMatrix)
                camera.fov    = 2 * Math.atan(h / (2 * fx)) * (180 / Math.PI);
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
            });
        })
        .catch(err => console.error('Camera access denied:', err));

    // ── Animation loop ───────────────────────────────────────────────────────
    renderer.setAnimationLoop(() => {
        const pose = ar.computePose();
        if (pose) {
            cube.position.copy(pose.position);
            cube.quaternion.copy(pose.quaternion);
        }
        renderer.render(scene, camera);
    });
});
