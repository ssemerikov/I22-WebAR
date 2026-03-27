import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';

document.addEventListener("DOMContentLoaded", async () => {
    const mindarThree = new MindARThree({
	    container: document.body,
	    imageTargetSrc: "../assets/cup_and_face.mind",
        maxTrack: 2
      });

    const {renderer, scene, camera} = mindarThree;

    //console.log(mindarThree);

    const anchor1 = mindarThree.addAnchor(0);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({color: "#0000FF"});
    const cube = new THREE.Mesh(geometry, material);

    cube.position.set(0, 0, -2);
    cube.rotation.set(0, Math.PI/4, 0);
    anchor1.group.add(cube);

    const points = [];
    for ( let i = 0; i < 10; i ++ ) {
        points.push( new THREE.Vector2( Math.sin( i * 0.2 ) * 10 + 5, ( i - 5 ) * 2 ) );
    }
    const geometry2 = new THREE.LatheGeometry( points );
    const material2 = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
    const lathe = new THREE.Mesh( geometry2, material2);
    lathe.position.set(2, 0, -75);
    anchor1.group.add(lathe );

    const geometry3 = new THREE.CapsuleGeometry( 1, 1, 4, 8, 1 );
    const edges = new THREE.EdgesGeometry( geometry3 );
    const line = new THREE.LineSegments( edges );
    line.position.set(-2, 0, -4);
    anchor1.group.add(line);


    /*
    const anchor2 = mindarThree.addAnchor(1);

    //const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material2 = new THREE.MeshBasicMaterial({color: "#00ffcc"});
    const cube2 = new THREE.Mesh(geometry, material2);

    anchor2.group.add(cube2);
    */

    await mindarThree.start();

    renderer.setAnimationLoop(() => {
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
    });
});