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

    // Add lighting to see 3D objects better
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2);
    scene.add(light);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(-0.5, 1, 1);
    scene.add(directionalLight);

    // 1. Create Face Mesh with custom texture
    const faceMesh = mindarThree.addFaceMesh();
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('../assets/female-high-res-head-texture-034-01.png', (texture) => {
        faceMesh.material.map = texture;
        faceMesh.material.transparent = true;
        faceMesh.material.needsUpdate = true;
    });
    scene.add(faceMesh);

    /*
    // 2. Add Scene elements (Ears and Nose)
    const sphereGeometry = new THREE.SphereGeometry(0.04, 32, 32); // Slightly larger for "ears"
    const earMaterial = new THREE.MeshPhongMaterial({ color: 0xff00ff }); // Pinkish ears
    const noseMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // Red nose

    // Left Ear (landmark 103)
    const leftEar = new THREE.Mesh(sphereGeometry, earMaterial);
    const leftAnchor = mindarThree.addAnchor(103);
    leftAnchor.group.add(leftEar);

    // Right Ear (landmark 332)
    const rightEar = new THREE.Mesh(sphereGeometry, earMaterial);
    const rightAnchor = mindarThree.addAnchor(332);
    rightAnchor.group.add(rightEar);

    // Nose (landmark 1)
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.02, 32, 32), noseMaterial);
    const noseAnchor = mindarThree.addAnchor(1);
    noseAnchor.group.add(nose);
    */

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
