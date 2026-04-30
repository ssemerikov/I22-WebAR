/**
 * Використовуючи матеріал тижня, до кожної з 468 опорних точок обличчя
 * прив'яжіть сфери синього кольору.
 */

import * as THREE from 'three';
import { MindARThree } from 'mindar-face-three';


document.addEventListener("DOMContentLoaded", async () => {

    const mindarThree = new MindARThree({
        container: document.querySelector("#container"),
    });

    const { renderer, scene, camera } = mindarThree;

    const sphereGeometry = new THREE.SphereGeometry(0.01, 16, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });

    // Add blue sphere to each of the 468 face landmark points
    for (let i = 0; i < 468; i++) {
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        const anchor = mindarThree.addAnchor(i);
        anchor.group.add(sphere);
    }


    await mindarThree.start();

    // Toggle button functionality - hide only video, keep Three.js rendering
    const toggleBtn = document.querySelector("#toggle-btn");
    let videoVisible = true;

    toggleBtn.addEventListener("click", () => {
        videoVisible = !videoVisible;
        const video = document.querySelector("#container video");
        if (video) {
            video.style.visibility = videoVisible ? "visible" : "hidden";
        }
        toggleBtn.textContent = videoVisible ? "Приховати відео" : "Показати відео";
    });

    renderer.setAnimationLoop((ctime) => {
        renderer.render(scene, camera);
    });
});
