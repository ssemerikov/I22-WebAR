import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { CSS3DObject } from "three/addons/renderers/CSS3DRenderer.js";


document.addEventListener("DOMContentLoaded", async () => {
    const mindarThree = new MindARThree({
        container: document.querySelector("#container"),
        imageTargetSrc: "../assets/citraiod.mind",
        maxTrack: 2,
    });

    const { renderer, cssRenderer, scene, cssScene, camera } = mindarThree;


    const anchor1 = mindarThree.addCSSAnchor(0);
    anchor1.group.visible = true;
    //const anchor2 = mindarThree.addCSSAnchor(1);

    const arDiv = document.querySelector("#ar-div");
    //arDiv.style.display = "none";   
    const obj = new CSS3DObject(arDiv);

    anchor1.group.add(obj);   

    //anchor2.group.add(model2);


    // Target found/lost handlers with visibility control
    anchor1.onTargetFound = () => {
        console.log("target found: пачка цитрамону");
        arDiv.style.visibility = "visible";
    };
    anchor1.onTargetLost = () => {
        console.log("target lost: пачка цитрамону");
        arDiv.style.visibility = "hidden";
    };

    /*
    anchor2.onTargetFound = () => {
        console.log("target found: пачка йодомарину");
    };
    anchor2.onTargetLost = () => {
        console.log("target lost: пачка йодомарину");
    };
    */

    await mindarThree.start();

    renderer.setAnimationLoop((ctime) => {
        renderer.render(scene, camera);
        cssRenderer.render(cssScene, camera);
    });
});