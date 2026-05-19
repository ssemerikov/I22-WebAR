import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { UARButton } from "../mylib/UARButton.js";

document.addEventListener("DOMContentLoaded", () => {
    const initialize = async () => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;
        document.body.appendChild(renderer.domElement);

        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

        // Моделі пташок для випадкового вибору
        const birdModels = [
            "../assets/bird_poly.glb",
            "../assets/hummingbird.glb",
            "../assets/flying_gull.glb",
            "../assets/chick.glb",
            "../assets/hornbill.glb",
        ];

        const loader = new GLTFLoader();
        const loadedBirds = [];

        for (const url of birdModels) {
            try {
                const gltf = await loader.loadAsync(url);
                loadedBirds.push(gltf.scene);
            } catch (err) {
                console.warn(`Не вдалося завантажити ${url}:`, err);
            }
        }

        if (loadedBirds.length === 0) {
            console.error("Жодної моделі пташки не завантажено");
            return;
        }

        // Кільце-індикатор (reticle) для відображення поверхні дотику
        const reticleGeometry = new THREE.RingGeometry(0.1, 0.13, 32);
        reticleGeometry.rotateX(-Math.PI / 2);
        const reticleMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
        });
        const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
        reticle.matrixAutoUpdate = false;
        reticle.visible = false;
        scene.add(reticle);

        // Контролер (сенсорний екран мобільного пристрою)
        const controller = renderer.xr.getController(0);
        scene.add(controller);

        // Розміщення пташки при натисканні на поверхню
        controller.addEventListener("select", () => {
            if (!reticle.visible) return;

            const birdIndex = Math.floor(Math.random() * loadedBirds.length);
            const original = loadedBirds[birdIndex];
            const clone = original.clone();

            // Клонувати матеріали (щоб кожна пташка мала свій екземпляр)
            clone.traverse((child) => {
                if (child.isMesh) {
                    child.material = child.material.clone();
                }
            });

            // Розмістити пташку в позиції reticle на поверхні
            clone.position.setFromMatrixPosition(reticle.matrix);
            clone.quaternion.setFromRotationMatrix(reticle.matrix);

            // Випадковий розмір (від 0.3 до 1.0)
            const scale = 0.3 + Math.random() * 0.7;
            clone.scale.set(scale, scale, scale);

            // Випадковий поворот навколо вертикальної осі
            clone.rotation.y = Math.random() * Math.PI * 2;

            scene.add(clone);
        });

        // Кнопка AR з hit-test та DOM overlay
        const xrButton = UARButton.createButton(renderer, {
            requiredFeatures: ["hit-test"],
            optionalFeatures: ["dom-overlay"],
            domOverlay: { root: document.body },
        });
        document.body.appendChild(xrButton);

        let hitTestSource = null;
        let isXrSession = false;

        // Єдиний анімаційний цикл для XR і не-XR режимів
        renderer.setAnimationLoop((timestamp, frame) => {
            if (isXrSession && frame && hitTestSource) {
                const hitTestResults = frame.getHitTestResults(hitTestSource);
                if (hitTestResults.length > 0) {
                    const hit = hitTestResults[0];
                    const referenceSpace = renderer.xr.getReferenceSpace();
                    const hitPose = hit.getPose(referenceSpace);
                    if (hitPose) {
                        reticle.visible = true;
                        reticle.matrix.fromArray(hitPose.transform.matrix);
                    }
                } else {
                    reticle.visible = false;
                }
            }
            renderer.render(scene, camera);
        });

        // Налаштування хіт-тесту при початку сесії
        renderer.xr.addEventListener("sessionstart", async () => {
            isXrSession = true;
            const session = renderer.xr.getSession();
            const viewerReferenceSpace = await session.requestReferenceSpace("viewer");
            hitTestSource = await session.requestHitTestSource({ space: viewerReferenceSpace });
        });

        renderer.xr.addEventListener("sessionend", () => {
            isXrSession = false;
            hitTestSource = null;
            reticle.visible = false;
        });
    };

    initialize();
});