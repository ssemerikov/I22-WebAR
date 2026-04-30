/**
 * Використовуючи матеріал тижня, створіть два власні маркери та
 * прив'яжіть до першого довільне відео з YouTube про океан - https://www.youtube.com/watch?v=9pWZIXlEzK0 ,
 * а до другого - довільне відео з Vimeo - https://vimeo.com/165400639 .
 */

import { MindARThree } from 'mindar-face-three';
import { CSS3DObject } from "three/addons/renderers/CSS3DRenderer.js";

// YouTube IFrame API loader
const loadYouTubeIframeAPI = () => {
    return new Promise((resolve, reject) => {
        if (window.YT && window.YT.Player) {
            resolve(window.YT);
            return;
        }
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
            resolve(window.YT);
        };
    });
};

document.addEventListener("DOMContentLoaded", async () => {
    // Load YouTube API first
    const YT = await loadYouTubeIframeAPI();

    const mindarThree = new MindARThree({
        container: document.querySelector("#container"),
        //imageTargetSrc: "../assets/citraiod.mind",
        //maxTrack: 2,
    });

    const { renderer, cssRenderer, scene, cssScene, camera } = mindarThree;

    const arDiv = document.querySelector("#ar-div");
    const arDiv2 = document.querySelector("#ar-div-2");

    const anchor1 = mindarThree.addCSSAnchor(234);
    const cssObj1 = new CSS3DObject(arDiv);
    anchor1.group.add(cssObj1);

    const anchor2 = mindarThree.addCSSAnchor(454);
    const cssObj2 = new CSS3DObject(arDiv2);
    anchor2.group.add(cssObj2);

    // Initialize YouTube player
    const youtubePlayer = new YT.Player('youtube-player', {
        width: '1280',
        height: '720',
        videoId: '9pWZIXlEzK0',
        playerVars: {
            'autoplay': 0,
            'controls': 0,
            'rel': 0,
            'fs': 0,
            'disablekb': 1,
            'modestbranding': 1,
        },
        events: {
            'onReady': () => {
                console.log('YouTube player ready');
            }
        }
    });

    // Initialize Vimeo player
    const vimeoPlayer = new Vimeo.Player(document.querySelector('#vimeo-player'));

    // Target found/lost handlers for YouTube (anchor1)
    anchor1.onTargetFound = () => {
        console.log("target found: пачка цитрамону");
        arDiv.style.visibility = "visible";
        youtubePlayer.playVideo();
    };

    anchor1.onTargetLost = () => {
        console.log("target lost: пачка цитрамону");
        arDiv.style.visibility = "hidden";
        youtubePlayer.pauseVideo();
    };

    // Target found/lost handlers for Vimeo (anchor2)
    anchor2.onTargetFound = () => {
        console.log("target found: пачка йодомарину");
        arDiv2.style.visibility = "visible";
        vimeoPlayer.play().catch(() => {});
    };
    anchor2.onTargetLost = () => {
        console.log("target lost: пачка йодомарину");
        arDiv2.style.visibility = "hidden";
        vimeoPlayer.pause();
    };

    await mindarThree.start();

    renderer.setAnimationLoop((ctime) => {
        renderer.render(scene, camera);
        cssRenderer.render(cssScene, camera);
    });
});
