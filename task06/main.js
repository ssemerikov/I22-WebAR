import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { loadGLTF, loadVideo } from "../mylib/loader.js";


document.addEventListener("DOMContentLoaded", async () => {
    const mindarThree = new MindARThree({
        container: document.body,
        imageTargetSrc: "../assets/citraiod.mind",
        maxTrack: 2,
    });

    const { renderer, scene, camera } = mindarThree;


    const anchor1 = mindarThree.addAnchor(0);
    const anchor2 = mindarThree.addAnchor(1);

    //const arfox = document.getElementById("video1");
    const video = await loadVideo("../assets/arcticfox.mp4");
    const texture = new THREE.VideoTexture(video);
    // 1675 × 942 pixels = 1 x 0.5624
    const geometry = new THREE.PlaneGeometry(1, 0.5625);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const plane = new THREE.Mesh(geometry, material);
    anchor1.group.add(plane);   


    // Load model 2 (owl)
    const gltf2 = await loadGLTF("../assets/the_owl_with_his_hood_up.glb");
    console.log("model 2 loaded", gltf2);
    const model2 = gltf2.scene;
    model2.scale.set(0.01, 0.01, 0.01);
    const mixer2 = new THREE.AnimationMixer(model2);
    if (gltf2.animations.length != 0) {
        const action = mixer2.clipAction(gltf2.animations[0]);
        action.play();
    }
    anchor2.group.add(model2);

    // Click detection setup
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Handle clicks/taps on the model
    // При кожному натисканні на модель вона має повертатись навколо вісі x на довільний кут від 45 до 90 градусів
    document.body.addEventListener('click', (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        // Convert to normalized device coordinates (-1 to +1)
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        // true = recursive (needed for GLTF models with nested meshes)
        const intersects = raycaster.intersectObject(model2, true);

        if (intersects.length > 0) {
            // Random angle between 45° and 90°
            const randomDegrees = Math.random() * (90 - 45) + 45;
            const randomRadians = randomDegrees * Math.PI / 180;
            model2.rotation.x += randomRadians;
        }
    }); 

    // Target found/lost handlers with audio play/pause
    anchor1.onTargetFound = () => {
        console.log("target found: пачка цитрамону");
        video.play();
        //arfox.style.display = "block";
    };
    anchor1.onTargetLost = () => {
        console.log("target lost: пачка цитрамону");
        video.pause();
        //arfox.style.display = "none";
    };

    video.addEventListener("play", () => {
        video.currentTime = 6;
    });

    anchor2.onTargetFound = () => {
        console.log("target found: пачка йодомарину");
    };
    anchor2.onTargetLost = () => {
        console.log("target lost: пачка йодомарину");
    };

    var light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2);
    scene.add(light);

    await mindarThree.start();

    let ptime = 0;

    renderer.setAnimationLoop((ctime) => {
        let delta = (ctime - ptime);
        ptime = ctime;
        mixer2.update(0.005 * delta);
        renderer.render(scene, camera);
    });
});