/**
 * Завдання 14: Аналіз обличчя, емоцій та жестів із бібліотекою human
 *
 * Етап 1 — визначення віку, статі та емоцій людини через бібліотеку human.
 * Етап 2 — розміщення моделі mercedes_donka.glb перед обличчям із керуванням поглядом.
 * Етап 3 — зміна освітлення моделі залежно від емоцій.
 * Етап 4 — управління жестами (масштаб, обертання, переміщення).
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MindARThree } from 'mindar-face-three';
import * as H from 'human';

document.addEventListener("DOMContentLoaded", async () => {
    // --- 1. Ініціалізація MindAR ---
    const mindarThree = new MindARThree({
        container: document.querySelector("#container"),
    });
    const { renderer, scene, camera } = mindarThree;

    // Освітлення
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2);
    scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(-0.5, 1, 1);
    scene.add(dirLight);

    const infoDiv = document.querySelector("#info");

    // --- 2. Ініціалізація бібліотеки human ---
    const humanConfig = {
        modelBasePath: '../human-main/models',
        backend: 'webgl',
        face: {
            enabled: true,
            detector: { rotation: false },
            mesh: { enabled: true },
            iris: { enabled: true },
            description: { enabled: true },   // вік, стать
            emotion: { enabled: true },         // емоції
        },
        hand: { enabled: true, landmarks: true },
        gesture: { enabled: true },
        body: { enabled: false },
        object: { enabled: false },
        segmentation: { enabled: false },
    };
    const human = new H.Human(humanConfig);

    try {
        await human.load();
        infoDiv.textContent = "Моделі human завантажено. Запуск камери...";
    } catch (err) {
        console.error("Помилка завантаження human:", err);
        infoDiv.textContent = "Помилка завантаження моделей human";
    }

    // --- 3. Завантаження 3D-моделі ---
    const loader = new GLTFLoader();
    let carModel = null;
    try {
        const gltf = await loader.loadAsync('../assets/mercedes_donka.glb');
        carModel = gltf.scene;
        // Початковий масштаб і позиція перед обличчям (лоб)
        carModel.scale.set(0.08, 0.08, 0.08);
        carModel.position.set(0, 0.12, 0.3);
    } catch (err) {
        console.error("Помилка завантаження GLB:", err);
    }

    // Прикріплюємо модель до anchor 168 (між очима)
    if (carModel) {
        const modelAnchor = mindarThree.addAnchor(168);
        modelAnchor.group.add(carModel);
    }

    // --- 4. Запуск MindAR ---
    await mindarThree.start();
    const video = document.querySelector('#container video');

    // --- 5. Цикл аналізу human (знижена частота) ---
    let humanResult = null;
    let detecting = false;
    const detectInterval = setInterval(async () => {
        if (detecting || !video || video.readyState < 2) return;
        detecting = true;
        try {
            humanResult = await human.detect(video);
        } catch (err) {
            // Пропускаємо кадри з помилками
        }
        detecting = false;
    }, 150); // ~6–7 FPS

    // --- 6. Стан для управління жестами та освітленням ---
    let modelScale = 0.08;
    let modelTargetScale = 0.08;
    let modelRotationY = 0;
    let modelTargetRotationY = 0;
    let modelPosZ = 0.3;
    let modelTargetPosZ = 0.3;

    const emotionMap = {
        happy:   { color: new THREE.Color(0xffffaa), intensity: 1.2 },
        sad:     { color: new THREE.Color(0x6666ff), intensity: 0.3 },
        angry:   { color: new THREE.Color(0xff3333), intensity: 0.9 },
        surprise:{ color: new THREE.Color(0xffffff), intensity: 1.5 },
        fear:    { color: new THREE.Color(0x8844ff), intensity: 0.5 },
        disgust: { color: new THREE.Color(0x44aa44), intensity: 0.7 },
        neutral: { color: new THREE.Color(0xffffff), intensity: 0.6 },
    };
    let currentEmotion = 'neutral';
    let targetIntensity = 0.6;
    let targetColor = new THREE.Color(0xffffff);

    const getDominantEmotion = (arr) => {
        if (!arr || arr.length === 0) return 'neutral';
        return arr.reduce((a, b) => a.score > b.score ? a : b).emotion;
    };

    // --- 7. Головний анімаційний цикл ---
    renderer.setAnimationLoop(() => {
        if (humanResult && humanResult.face && humanResult.face.length > 0) {
            const face = humanResult.face[0];

            // Оновлення інформації про обличчя
            const dominant = getDominantEmotion(face.emotion);
            currentEmotion = dominant;
            const genderText = face.gender === 'male' ? 'Чоловік' : 'Жінка';
            const ageText = Math.round(face.age);
            infoDiv.textContent = `Вік: ${ageText} | Стать: ${genderText} | Емоція: ${dominant}`;

            // Керування поглядом моделі
            if (face.gaze) {
                // gaze.bearing — горизонтальний кут (азимут), gaze.elevation — вертикальний
                modelTargetRotationY = -face.gaze.bearing;
            } else if (face.angle && typeof face.angle.yaw === 'number') {
                // fallback: використовуємо кут повороту голови
                modelTargetRotationY = -face.angle.yaw * (Math.PI / 180);
            }

            // Плавна інтерполяція обертання
            modelRotationY += (modelTargetRotationY - modelRotationY) * 0.1;

            if (carModel) {
                carModel.rotation.y = modelRotationY;
                if (face.gaze) {
                    carModel.rotation.x = face.gaze.elevation * 0.5;
                } else if (face.angle && typeof face.angle.pitch === 'number') {
                    carModel.rotation.x = face.angle.pitch * (Math.PI / 180) * 0.5;
                }
            }

            // Емоційне освітлення
            const mapping = emotionMap[currentEmotion] || emotionMap.neutral;
            targetColor.copy(mapping.color);
            targetIntensity = mapping.intensity;
        }

        // Плавна зміна освітлення
        dirLight.color.lerp(targetColor, 0.05);
        dirLight.intensity += (targetIntensity - dirLight.intensity) * 0.05;

        // --- Жестове управління ---
        if (humanResult && humanResult.gesture && carModel) {
            // Фільтруємо жести рук
            const handGestures = humanResult.gesture.filter(g => g.hand !== undefined);

            for (const g of handGestures) {
                const name = g.gesture;

                // Масштабування
                if (name === 'victory') {
                    modelTargetScale = Math.min(0.5, modelTargetScale + 0.004);
                    console.log('[Жест] victory → збільшення моделі:', modelTargetScale.toFixed(3));
                } else if (name === 'thumbs up') {
                    modelTargetScale = Math.max(0.05, modelTargetScale - 0.004);
                    console.log('[Жест] thumbs up → зменшення моделі:', modelTargetScale.toFixed(3));
                }

                // Переміщення вперед/назад
                if (name === 'point' || name === 'index forward') {
                    modelTargetPosZ = Math.max(0.1, Math.min(0.5, modelTargetPosZ + 0.002));
                    console.log('[Жест] point → наближення моделі:', modelTargetPosZ.toFixed(3));
                } else if (name === 'fist') {
                    modelTargetPosZ = Math.max(0.1, Math.min(0.5, modelTargetPosZ - 0.002));
                    console.log('[Жест] fist → віддалення моделі:', modelTargetPosZ.toFixed(3));
                }
            }

            // Управління положенням руки (bounding box) — обертання та наближення
            if (humanResult.hand && humanResult.hand.length > 0) {
                const hand = humanResult.hand[0];
                if (hand.box && hand.box.length >= 4) {
                    const videoW = video ? video.videoWidth : 640;
                    const videoH = video ? video.videoHeight : 480;
                    const centerX = hand.box[0] + hand.box[2] / 2;
                    const centerY = hand.box[1] + hand.box[3] / 2;

                    const xNorm = centerX / videoW; // 0..1
                    const yNorm = centerY / videoH; // 0..1

                    // Горизонтальне положення руки → обертання моделі
                    const rotOffset = (xNorm - 0.5) * 1.5;
                    modelTargetRotationY += rotOffset * 0.02;

                    // Вертикальне положення руки → наближення/віддалення
                    const zOffset = (yNorm - 0.5) * 0.005;
                    modelTargetPosZ = Math.max(0.1, Math.min(0.5, modelTargetPosZ + zOffset));
                }
            }
        }

        // Плавне застосування трансформацій
        if (carModel) {
            modelScale += (modelTargetScale - modelScale) * 0.08;
            modelPosZ += (modelTargetPosZ - modelPosZ) * 0.08;
            carModel.scale.set(modelScale, modelScale, modelScale);
            carModel.position.z = modelPosZ;
        }

        renderer.render(scene, camera);
    });

    // --- 8. Кнопка приховування відео ---
    const toggleBtn = document.querySelector("#toggle-btn");
    let videoVisible = true;
    toggleBtn.addEventListener("click", () => {
        videoVisible = !videoVisible;
        if (video) {
            video.style.visibility = videoVisible ? "visible" : "hidden";
        }
        toggleBtn.textContent = videoVisible ? "Приховати відео" : "Показати відео";
    });

    // --- 9. Кнопка довідки (приховування/показ картки) ---
    const helpBtn = document.querySelector("#help-btn");
    const helpCard = document.querySelector("#help-card");
    let helpVisible = false;
    helpBtn.addEventListener("click", () => {
        helpVisible = !helpVisible;
        helpCard.style.display = helpVisible ? "block" : "none";
        helpBtn.textContent = helpVisible ? "Сховати довідку" : "Довідка";
    });

    // --- 10. Голосове управління (Web Speech API) ---
    const voiceBtn = document.querySelector("#voice-btn");
    let voiceActive = false;
    let recognition = null;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'uk-UA';
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            const last = event.results[event.results.length - 1];
            if (!last.isFinal) return;
            const cmd = last[0].transcript.trim().toLowerCase();
            console.log('[Голос] розпізнано:', cmd);

            if (cmd.includes('ближче')) {
                modelTargetPosZ = Math.max(0.1, modelTargetPosZ - 0.05);
                console.log('[Голос] ближче → позиція Z:', modelTargetPosZ.toFixed(3));
            } else if (cmd.includes('далі')) {
                modelTargetPosZ = Math.min(0.5, modelTargetPosZ + 0.05);
                console.log('[Голос] далі → позиція Z:', modelTargetPosZ.toFixed(3));
            } else if (cmd.includes('більше')) {
                modelTargetScale = Math.min(0.5, modelTargetScale + 0.05);
                console.log('[Голос] більше → масштаб:', modelTargetScale.toFixed(3));
            } else if (cmd.includes('менше')) {
                modelTargetScale = Math.max(0.05, modelTargetScale - 0.05);
                console.log('[Голос] менше → масштаб:', modelTargetScale.toFixed(3));
            } else if (cmd.includes('вліво')) {
                modelTargetRotationY += 0.3;
                console.log('[Голос] вліво → обертання Y:', modelTargetRotationY.toFixed(3));
            } else if (cmd.includes('вправо')) {
                modelTargetRotationY -= 0.3;
                console.log('[Голос] вправо → обертання Y:', modelTargetRotationY.toFixed(3));
            } else {
                console.log('[Голос] невідома команда');
            }
        };

        recognition.onerror = (event) => {
            console.warn('[Голос] помилка розпізнавання:', event.error);
        };

        recognition.onend = () => {
            if (voiceActive) {
                // Автоматичне перезапуск, якщо користувач не вимкнув
                recognition.start();
            }
        };

        voiceBtn.addEventListener("click", () => {
            voiceActive = !voiceActive;
            if (voiceActive) {
                recognition.start();
                voiceBtn.textContent = "Голос ON";
                voiceBtn.classList.add("active");
                console.log('[Голос] розпізнавання запущено');
            } else {
                recognition.stop();
                voiceBtn.textContent = "Голос OFF";
                voiceBtn.classList.remove("active");
                console.log('[Голос] розпізнавання зупинено');
            }
        });
    } else {
        voiceBtn.textContent = "Голос не підтримується";
        voiceBtn.disabled = true;
        console.warn('[Голос] Web Speech API не підтримується у цьому браузері');
    }
});

