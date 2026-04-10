import * as THREE from 'three';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export const loadGLTF = (path) => {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(path, (gltf) => {
            resolve(gltf);
        });
    });
}

export const loadAudio = (path) => {
    return new Promise((resolve, reject) => {
        const loader = new THREE.AudioLoader();
        loader.load(path, (buffer) => {
            resolve(buffer);
        });
    });
}