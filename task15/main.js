import * as THREE from "three";
import { UARButton } from "../mylib/UARButton.js";
import { loadGLTF } from "../mylib/loader.js";

document.addEventListener("DOMContentLoaded", () => {
    const initialize = async () => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.1,
            20
        );
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(renderer.domElement);

        // Add lighting
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

        // Load assets
        const [owlGLTF, reticleTexture] = await Promise.all([
            loadGLTF("../assets/the_owl_with_his_hood_up.glb"),
            new Promise((resolve) => {
                const textureLoader = new THREE.TextureLoader();
                textureLoader.load("../assets/reticle2.png", resolve);
            })
        ]);

        // Prepare owl model - apply scale to all meshes directly
        const owlScale = 0.000001; // Дуже малий масштаб

        // First, apply scale to original model's meshes
        owlGLTF.scene.scale.set(owlScale, owlScale, owlScale);

        const owlModel = owlGLTF.scene;
        console.log("🦉 Модель сови завантажена, масштаб застосовано до геометрії:", owlScale);

        // Create reticle (ring with texture)
        const reticleGeometry = new THREE.RingGeometry(0.1, 0.13, 32);
        reticleGeometry.rotateX(-Math.PI / 2);
        const reticleMaterial = new THREE.MeshBasicMaterial({
            map: reticleTexture,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
        reticle.matrixAutoUpdate = false;
        reticle.visible = false;
        scene.add(reticle);

        console.log("🎯 Ретікул завантажений, розмір:", reticleGeometry.parameters);

        // Array to hold placed owl instances
        const placedOwls = [];

        // Enable XR
        renderer.xr.enabled = true;

        // Hit-test and controller variables
        let hitTestSource = null;
        let isXrSession = false;
        let controller = null;
        const selectListener = () => {
            console.log("👆 Select event triggered");
            if (reticle.visible) {
                // Clone the owl model for placement
                const owlInstance = owlModel.clone();
                owlInstance.scale.set(owlScale, owlScale, owlScale);

                // Position and orient at the reticle position
                owlInstance.position.setFromMatrixPosition(reticle.matrix);
                owlInstance.quaternion.setFromRotationMatrix(reticle.matrix);

                // Add some random variation for visual interest (optional)
                // owlInstance.rotation.y = Math.random() * Math.PI * 2; // Uncomment for random Y rotation

                scene.add(owlInstance);
                placedOwls.push(owlInstance);
                console.log("🦉 Сову розміщено! Всього сов:", placedOwls.length);
            } else {
                console.log("⚠️ Ретікул не видимий - поверхню не виявлено");
            }
        };

        // Set up hit-testing session listeners
        renderer.xr.addEventListener("sessionstart", async () => {
            console.log("🚀 WebXR session started");
            isXrSession = true;
            const session = renderer.xr.getSession();
            console.log("📡 Session:", session);
            const viewerReferenceSpace = await session.requestReferenceSpace("viewer");
            hitTestSource = await session.requestHitTestSource({ space: viewerReferenceSpace });
            console.log("🎯 Hit-test source створено");

            // Get controller when session starts
            controller = renderer.xr.getController(0);
            if (controller) {
                controller.addEventListener('select', selectListener);
                console.log("🎮 Контролер активований");
            }
        });

        renderer.xr.addEventListener("sessionend", () => {
            console.log("🛑 WebXR session ended");
            isXrSession = false;
            hitTestSource = null;
            if (controller) {
                controller.removeEventListener('select', selectListener);
                controller = null;
            }
            reticle.visible = false;
            // Hide all placed owls when session ends
            placedOwls.forEach(owl => owl.visible = false);
        });

        // Temporary vectors for extracting position from matrix
        const tempPosition = new THREE.Vector3();
        const tempQuaternion = new THREE.Quaternion();
        const tempScale = new THREE.Vector3();

        // Animation loop
        let hitCount = 0;
        let lastLogPos = null;
        renderer.setAnimationLoop((timestamp, frame) => {
            if (isXrSession && frame && hitTestSource) {
                const hitTestResults = frame.getHitTestResults(hitTestSource);

                if (hitTestResults.length > 0) {
                    const hit = hitTestResults[0];
                    const referenceSpace = renderer.xr.getReferenceSpace();
                    const hitPose = hit.getPose(referenceSpace);

                    if (hitPose) {
                        // Show reticle and position it on the hit surface
                        reticle.visible = true;
                        reticle.matrix.fromArray(hitPose.transform.matrix);

                        // Extract position from matrix for logging
                        tempPosition.setFromMatrixPosition(reticle.matrix);

                        hitCount++;
                        // Log every time position changes significantly
                        if (!lastLogPos || Math.abs(tempPosition.x - lastLogPos.x) > 0.01 ||
                            Math.abs(tempPosition.y - lastLogPos.y) > 0.01 ||
                            Math.abs(tempPosition.z - lastLogPos.z) > 0.01) {
                            console.log("✅ Hit-test успішний, позиція:", tempPosition.toArray().map(v => v.toFixed(3)));
                            lastLogPos = tempPosition.clone();
                        }
                    }
                } else {
                    // No hit test results - hide reticle
                    reticle.visible = false;
                }
            }

            // Render only when XR session is presenting
            if (renderer.xr.isPresenting) {
                renderer.render(scene, camera);
            }
        });

        // Create and add AR button
        const xrButton = UARButton.createButton(renderer, {
            requiredFeatures: ["hit-test"],
            optionalFeatures: ["dom-overlay"],
            domOverlay: { root: document.body }
        });

        document.body.appendChild(xrButton);
    }

    initialize();
});