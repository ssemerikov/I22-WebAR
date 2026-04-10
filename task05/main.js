import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";


document.addEventListener("DOMContentLoaded", async () => {
    const mindarThree = new MindARThree({
	    container: document.body,
	    imageTargetSrc: "../assets/citraiod.mind",
        maxTrack: 2,
      });

    const {renderer, scene, camera} = mindarThree;

    const loader = new GLTFLoader();

    const anchor1 = mindarThree.addAnchor(0);

    anchor1.onTargetFound = () => {
        console.log("target found: пачка цитрамону");
    }

    anchor1.onTargetLost = () => {
        console.log("target lost: пачка цитрамону");
    };

    const anchor2 = mindarThree.addAnchor(1);

    anchor2.onTargetFound = () => {
        console.log("target found: пачка йoдомарина");
    }

    anchor2.onTargetLost = () => {
        console.log("target lost: пачка йoдомарина");
    };

    let mixer1=null, mixer2=null;

    loader.load("../assets/mercedes_donka.glb", 
        (gltf) => { // onLoad
            console.log("model 1 loaded", gltf);
            const model = gltf.scene;
            model.scale.set(0.15, 0.15, 0.15);
            //model.position.set(0, -0.5, 0);
            model.rotation.set(0, Math.PI/2, 0);
            mixer1 = new THREE.AnimationMixer(model);
            if(gltf.animations.length != 0) {
                const action = mixer1.clipAction(gltf.animations[0]);
                action.play();
            }

            anchor1.group.add(model);
        },
        (xhr) => { // onProgress
            console.log((xhr.loaded / xhr.total * 100) + '% loaded of model 1');
        },
        (error) => { // onError
            console.error('An error happened while load model 1', error);
        }   
    );

    loader.load("../assets/the_owl_with_his_hood_up.glb", 
        (gltf) => { // onLoad
            console.log("model 2 loaded", gltf);
            const model = gltf.scene;
            model.scale.set(0.01, 0.01, 0.01);
            //model.position.set(0, -0.5, 0);
            //model.rotation.set(0, Math.PI, 0);
            mixer2 = new THREE.AnimationMixer(model);
            if(gltf.animations.length != 0) {
                const action = mixer2.clipAction(gltf.animations[0]);
                action.play();
            }

            anchor2.group.add(model);
        },
        (xhr) => { // onProgress
            console.log((xhr.loaded / xhr.total * 100) + '% loaded of model 2');
        },
        (error) => { // onError
            console.error('An error happened while load model 2', error);
        }   
    );

    var light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2);
    scene.add(light);

    await mindarThree.start();

    let ptime = 0;

    renderer.setAnimationLoop((ctime) => {
        let delta = (ctime - ptime);
        ptime = ctime;
        mixer1.update(0.001*delta);
        mixer2.update(0.005*delta);
        renderer.render(scene, camera);
    });
});