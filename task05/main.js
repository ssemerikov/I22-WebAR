import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { loadGLTF, loadAudio } from "./loader.js";


document.addEventListener("DOMContentLoaded", async () => {
    const mindarThree = new MindARThree({
        container: document.body,
        imageTargetSrc: "../assets/citraiod.mind",
        maxTrack: 2,
    });

    const { renderer, scene, camera } = mindarThree;

    // AudioListener for positional audio
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const anchor1 = mindarThree.addAnchor(0);
    const anchor2 = mindarThree.addAnchor(1);

    // Load audio files
    const audioClip1 = await loadAudio(
        "https://ia802807.us.archive.org/9/items/Jazz_Sampler-9619/Kevin_MacLeod_-_AcidJazz.mp3"
    );
    const audioClip2 = await loadAudio("../assets/mixkit-game-show-suspense-waiting-667.wav");

    // Create positional audio for anchor 1 (mercedes)
    const audio1 = new THREE.PositionalAudio(listener);
    anchor1.group.add(audio1);
    audio1.setBuffer(audioClip1);
    audio1.setRefDistance(100);
    audio1.setLoop(true);

    // Create positional audio for anchor 2 (owl)
    const audio2 = new THREE.PositionalAudio(listener);
    anchor2.group.add(audio2);
    audio2.setBuffer(audioClip2);
    audio2.setRefDistance(100);
    audio2.setLoop(true);

    let mixer1 = null, mixer2 = null;

    // Load model 1 (mercedes)
    const gltf1 = await loadGLTF("../assets/mercedes_donka.glb");
    console.log("model 1 loaded", gltf1);
    const model1 = gltf1.scene;
    model1.scale.set(0.15, 0.15, 0.15);
    model1.rotation.set(0, Math.PI / 2, 0);
    mixer1 = new THREE.AnimationMixer(model1);
    if (gltf1.animations.length != 0) {
        const action = mixer1.clipAction(gltf1.animations[0]);
        action.play();
    }
    anchor1.group.add(model1);

    // Load model 2 (owl)
    const gltf2 = await loadGLTF("../assets/the_owl_with_his_hood_up.glb");
    console.log("model 2 loaded", gltf2);
    const model2 = gltf2.scene;
    model2.scale.set(0.01, 0.01, 0.01);
    mixer2 = new THREE.AnimationMixer(model2);
    if (gltf2.animations.length != 0) {
        const action = mixer2.clipAction(gltf2.animations[0]);
        action.play();
    }
    anchor2.group.add(model2);

    // Target found/lost handlers with audio play/pause
    anchor1.onTargetFound = () => {
        console.log("target found: пачка цитрамону");
        audio1.play();
    };
    anchor1.onTargetLost = () => {
        console.log("target lost: пачка цитрамону");
        audio1.pause();
    };

    anchor2.onTargetFound = () => {
        console.log("target found: пачка йодомарину");
        audio2.play();
    };
    anchor2.onTargetLost = () => {
        console.log("target lost: пачка йодомарину");
        audio2.pause();
    };

    var light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2);
    scene.add(light);

    await mindarThree.start();

    let ptime = 0;

    renderer.setAnimationLoop((ctime) => {
        let delta = (ctime - ptime);
        ptime = ctime;
        mixer1.update(0.001 * delta);
        mixer2.update(0.005 * delta);
        renderer.render(scene, camera);
    });
});