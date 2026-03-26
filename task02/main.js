import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';

document.addEventListener("DOMContentLoaded", async () => {
    const mindarThree = new MindARThree({
	    container: document.body,
	    imageTargetSrc: "../assets/cup_and_face.mind",
        maxTrack: 2
      });

    const {renderer, scene, camera} = mindarThree;

    console.log(mindarThree);

    const anchor1 = mindarThree.addAnchor(0);


    //const scene = new THREE.Scene();

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({color: "#0000FF"});
    const cube = new THREE.Mesh(geometry, material);

    cube.position.set(0, 0, -2);
    cube.rotation.set(0, Math.PI/4, 0);
    anchor1.group.add(cube);

    const anchor2 = mindarThree.addAnchor(1);

    //const scene = new THREE.Scene();

    //const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material2 = new THREE.MeshBasicMaterial({color: "#00ffcc"});
    const cube2 = new THREE.Mesh(geometry, material2);

    anchor2.group.add(cube2);

    await mindarThree.start();

    //const camera = new THREE.PerspectiveCamera();
    //camera.position.set(1, 1, 5);

    //const renderer = new THREE.WebGLRenderer({alpha: true});
    //renderer.setSize(500, 500);
    //renderer.render(scene, camera);

    renderer.setAnimationLoop(() => {
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
    });

    // video before canvas in DOM
    /*
    const video = document.createElement("video");

    navigator.mediaDevices.getUserMedia({video:true})
        .then((stream) => {
            video.srcObject = stream;
            video.play();
        });

    video.style.position = "absolute";
    video.style.width = renderer.domElement.width;
    video.style.height = renderer.domElement.height;
    renderer.domElement.style.position = "absolute";

    document.body.appendChild(video);
    document.body.appendChild(renderer.domElement);
    */
});