import { Component, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';

@Component({
  selector: 'three-d-viewer',
  standalone: true,
  template: `<div #canvasContainer style="width:100vw; height:100vh;"></div>`,
})
export class ThreeDViewerComponent implements AfterViewInit {
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef;

  ngAfterViewInit() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);

    const camera = new THREE.PerspectiveCamera(
      45,
      this.canvasContainer.nativeElement.offsetWidth / this.canvasContainer.nativeElement.offsetHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.5, 3);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      this.canvasContainer.nativeElement.offsetWidth,
      this.canvasContainer.nativeElement.offsetHeight
    );
    this.canvasContainer.nativeElement.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
    scene.add(hemiLight);

    // Correct usage:
    const loader = new GLTFLoader();
    loader.load('assets/me_glb_1.glb', (gltf) => {
      const model = gltf.scene;
      model.position.set(0, 0, 0);
      model.scale.set(1, 1, 1);
      scene.add(model);

      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        mixer.clipAction(gltf.animations[0]).play();
        const clock = new THREE.Clock();

        function animate() {
          requestAnimationFrame(animate);
          mixer.update(clock.getDelta());
          renderer.render(scene, camera);
        }
        animate();
      } else {
        function animate() {
          requestAnimationFrame(animate);
          renderer.render(scene, camera);
        }
        animate();
      }
    });
  }
}
