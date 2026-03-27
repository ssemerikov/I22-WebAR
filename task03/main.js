import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';


document.addEventListener("DOMContentLoaded", async () => {
    const mindarThree = new MindARThree({
	    container: document.body,
	    imageTargetSrc: "../assets/cup_and_face.mind",
        maxTrack: 2
      });

    const {renderer, scene, camera} = mindarThree;

    const loader = new THREE.TextureLoader();

    const anchor1 = mindarThree.addAnchor(0);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
        map: loader.load("../assets/morda.png")
    });
    const cube = new THREE.Mesh(geometry, material);

    cube.position.set(0, 0, -2);
    cube.rotation.set(0, Math.PI/4, 0);
    anchor1.group.add(cube);

    const points = [];
    for ( let i = 0; i < 10; i ++ ) {
        points.push( new THREE.Vector2( Math.sin( i * 0.2 ) * 10 + 5, ( i - 5 ) * 2 ) );
    }
    const geometry2 = new THREE.LatheGeometry( points );
    const material2 = new THREE.MeshBasicMaterial( { color: 0xffff00, 
        side: THREE.DoubleSide,
        map: loader.load("https://images.ctfassets.net/aukesvz1i7g8/4I9nMF37Ttf0NogKYsTNlv/6e4457f1e80ee6baf49ea05227ef8bf7/22C0217_001.jpg")
    } );
    const lathe = new THREE.Mesh( geometry2, material2);
    lathe.position.set(2, 0, -75);
    anchor1.group.add(lathe );

    const geometry3 = new THREE.CapsuleGeometry( 1, 1, 4, 8, 1 );
    const material3 = new THREE.MeshBasicMaterial( { color: 0x00ff00, 
        side: THREE.DoubleSide,
        map: loader.load("https://raw.githubusercontent.com/hiukim/mind-ar-js/refs/heads/master/examples/image-tracking/assets/band-example/raccoon.png")
    } );
    const capsule = new THREE.Mesh( geometry3, material3 );
    capsule.position.set(-2, 0, -6);
    anchor1.group.add(capsule);

    const fontloader = new FontLoader();
    const font = await fontloader.loadAsync( 'https://cdn.jsdelivr.net/npm/three@0.183.2/examples/fonts/helvetiker_regular.typeface.json' );
    const textgeometry = new TextGeometry( 'Semerikov', {
        font: font,
        size: 80,
        depth: 5,
        curveSegments: 12
    } );
    const textmaterial = new THREE.MeshBasicMaterial( { color: 0xffffff} );
    const textmesh = new THREE.Mesh( textgeometry, textmaterial );
    textmesh.position.set(0, 0.5, -10);

    scene.add( textmesh );


    await mindarThree.start();

    renderer.setAnimationLoop(() => {
        cube.position.x += 0.01;
        if (cube.position.x > 2) {
            cube.position.x = -2;
        }
        cube.rotation.y += 0.01;
        cube.rotation.x += 0.012;
        cube.rotation.z += 0.015;
        lathe.rotation.x += 0.01;
        lathe.rotation.z += 0.001;
        capsule.scale.setScalar(0.55 + 0.5 * Math.sin(Date.now() * 0.002));
        renderer.render(scene, camera);
    });
});