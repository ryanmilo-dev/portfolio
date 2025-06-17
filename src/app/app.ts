import { Component, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CircleMenuComponent } from './circle-menu/circle-menu';
import { GLTFLoader } from 'three-stdlib';

import * as THREE from 'three';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, CircleMenuComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent implements AfterViewInit {
  password: string = '';
  message: string = '';
  loading = false;
  private timeoutHandle: any;
  private debounceTimeout: any;

  accessGranted = false;
  showCircleMenu = false;
  resultHtml = '';

  //Data from child
  selectedCircleMenuIndex: number | null = null;

  feedback: 'success' | 'error' | '' = '';
  private feedbackTimeout: any = null;

  constructor(private http: HttpClient) {}

  // ---- THREE.JS ANIMATION ----
  @ViewChild('bgCanvas', { static: true }) bgCanvas!: ElementRef<HTMLCanvasElement>;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  points: THREE.Vector3[] = [];
  basePoints: THREE.Vector3[] = [];
  //pointMesh!: THREE.Points;
  //lineMesh!: THREE.Line;
  pointMesh: THREE.Points | undefined;
  lineMesh: THREE.Line | undefined;
  mixer?: THREE.AnimationMixer;
  clock = new THREE.Clock();
  model?: THREE.Object3D; // or THREE.Group, or specific type if you know it
  mouse = { x: 1, y: 1 };
  shakeAmount = 0;
  spreadAmount = 0;
  currentSpread = 0;
  collapseAmount = 0;
  currentCollapse = 1.0;
  spreadActive = false;
  collapseActive = false;
  mouseScroll = 0;
  mouseScrollCounter = 0;
  mouseScrollCount = 1;
  newPointsPositionSet = false;

  titleFaded = false;
  isMobile = false;

  //3D model
  movedToMiddle = false;
  currentPosition = [0, -10, 200];
  movePosition = [0, -10, 150];
  menuSelectionEvent = false;
  menuDeselectionEvent = false;

  pointSize = 3;      // Set this to any number for size
  pointColor = 0x55ffff; // Set this to any hex color (0xffffff = white)
  spreadEndSize = 1.2;

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  ngAfterViewInit() {
    this.onResize(); // initialize
    this.initThree();
    this.animate();
  }

  initThree() {
    const width = window.innerWidth, height = window.innerHeight;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 220;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1); // color, intensity
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 3.2);//0xaebfff
    dirLight.position.set(0, 150, 300);
    this.scene.add(dirLight);

    const fog = new THREE.Fog(0x9281e3, 150, 290);
    this.scene.fog = fog;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.bgCanvas.nativeElement,
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(width, height);

    this.createPoints();

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // For GLB/GLTF models
    const loader = new GLTFLoader();
    loader.load('assets/me.glb', (gltf) => {
      const model = gltf.scene;
      model.position.set(this.currentPosition[0], this.currentPosition[1], this.currentPosition[2]); // Center, adjust as needed
      model.scale.set(10, 10, 10); // Adjust size if needed
      this.scene.add(model);
      this.model = model; // <---- Save reference!
      console.log(model);

      // Animate if there are animations
      if (gltf.animations && gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(model);
        this.mixer.clipAction(gltf.animations[0]).play();
      }
    });
  }

  makeCircleTexture(): THREE.Texture {
    const size = 64; // Texture size (can be 32–128)
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, size, size);

    // Draw circle
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, 2 * Math.PI, false);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Alpha edges (optional: feather for antialiasing)
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, size / 2 - 1,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    return new THREE.CanvasTexture(canvas);
  }

  createPoints() {
    if (this.pointMesh) {
      this.scene.remove(this.pointMesh);
      this.pointMesh.geometry.dispose();

      const pm = this.pointMesh.material;
      if (Array.isArray(pm)) {
        pm.forEach(m => m.dispose && m.dispose());
      } else {
        pm.dispose && pm.dispose();
      }

      this.pointMesh = undefined;
    }

    if (this.lineMesh) {
      this.scene.remove(this.lineMesh);
      this.lineMesh.geometry.dispose();

      const lm = this.lineMesh.material;
      if (Array.isArray(lm)) {
        lm.forEach(m => m.dispose && m.dispose());
      } else {
        lm.dispose && lm.dispose();
      }

      this.lineMesh = undefined;
    }

    // Random points in a 3D sphere
    this.points = [];
    this.basePoints = [];
    for (let i = 0; i < 100; i++) {
      const phi = Math.random() * Math.PI * 2;
      const costheta = Math.random() * 2 - 1;
      const u = Math.random();
      const theta = Math.acos(costheta);
      const r = 90 * Math.cbrt(u);

      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(theta);
      const vec = new THREE.Vector3(x, y, z);
      this.points.push(vec.clone());
      this.basePoints.push(vec.clone());
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(this.points);

    // Use your size and color variables here
    const material = new THREE.PointsMaterial({
      color: this.pointColor,
      size: this.pointSize,
      sizeAttenuation: true,
      map: this.makeCircleTexture(),
      alphaTest: 0.5,      // Important: removes black square background
      transparent: true
    });

    this.pointMesh = new THREE.Points(geometry, material);

    // Line connects points in sequence, plus closes the loop
    const linePoints = this.points.concat([this.points[0]]);
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xaaffff, linewidth: 1 }); //line colour
    this.lineMesh = new THREE.Line(lineGeometry, lineMaterial);

    this.scene.add(this.pointMesh);
    this.scene.add(this.lineMesh);
  }

  setPointsToSphere(radius: number = 90) {
    this.basePoints = [];
    const numPoints = 100;

    // Golden Section Spiral (Fibonacci sphere) for even-ish distribution
    const offset = 2 / numPoints;
    const increment = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < numPoints; i++) {
      const y = ((i * offset) - 1) + (offset / 2);
      const r = Math.sqrt(1 - y * y);
      const phi = i * increment;

      const x = Math.cos(phi) * r;
      const z = Math.sin(phi) * r;

      // Multiply by radius
      this.basePoints.push(new THREE.Vector3(x * radius, y * radius, z * radius));
    }

    // Optionally also copy to this.points if needed
    this.points = this.basePoints.map(v => v.clone());
  }

  setPointsToCube(sideLength: number = 180) {
    this.basePoints = [];
    const numPoints = 100;
    const pointsPerFace = Math.floor(numPoints / 6);
    const remainder = numPoints % 6;
    const half = sideLength / 2;

    let pointIdx = 0;
    let faceCounts = Array(6).fill(pointsPerFace);
    for (let i = 0; i < remainder; i++) {
      faceCounts[i]++;
    }

    for (let face = 0; face < 6; face++) {
      const ptsOnThisFace = faceCounts[face];
      const gridSize = Math.ceil(Math.sqrt(ptsOnThisFace));
      for (let i = 0; i < ptsOnThisFace && pointIdx < numPoints; i++, pointIdx++) {
        const u = (i % gridSize) / (gridSize - 1);
        const v = Math.floor(i / gridSize) / (gridSize - 1);
        const x = (u - 0.5) * sideLength;
        const y = (v - 0.5) * sideLength;
        switch (face) {
          case 0: this.basePoints.push(new THREE.Vector3( half, y, x)); break; // +X
          case 1: this.basePoints.push(new THREE.Vector3(-half, y, x)); break; // -X
          case 2: this.basePoints.push(new THREE.Vector3(x,  half, y)); break; // +Y
          case 3: this.basePoints.push(new THREE.Vector3(x, -half, y)); break; // -Y
          case 4: this.basePoints.push(new THREE.Vector3(x, y,  half)); break; // +Z
          case 5: this.basePoints.push(new THREE.Vector3(x, y, -half)); break; // -Z
        }
      }
    }
    this.points = this.basePoints.map(v => v.clone());
  }

  setPointsToPyramid(baseSize: number = 180, height: number = 180) {
    this.basePoints = [];
    const numPoints = 100;

    // Decide how many points to put on the base and on the sides
    // We'll use a 9x9 grid for the base (81 points), rest for the sides (19 points)
    const baseGrid = 9; // 9x9 = 81 points on base
    const basePoints = baseGrid * baseGrid;
    const sidePoints = numPoints - basePoints;
    const halfBase = baseSize / 2;

    // 1. Distribute points on the base (z = 0 plane)
    for (let i = 0; i < baseGrid; i++) {
      for (let j = 0; j < baseGrid; j++) {
        const x = ((i / (baseGrid - 1)) - 0.5) * baseSize;
        const y = ((j / (baseGrid - 1)) - 0.5) * baseSize;
        const z = 0;
        this.basePoints.push(new THREE.Vector3(x, y, z));
      }
    }

    // 2. Distribute points on the 4 side faces, interpolating between base edge and apex
    // Each side gets approx sidePoints/4 points
    const apex = new THREE.Vector3(0, 0, height);
    const pointsPerSide = Math.ceil(sidePoints / 4);
    const baseCorners = [
      new THREE.Vector3(-halfBase, -halfBase, 0),
      new THREE.Vector3(halfBase, -halfBase, 0),
      new THREE.Vector3(halfBase, halfBase, 0),
      new THREE.Vector3(-halfBase, halfBase, 0)
    ];

    let addedSidePoints = 0;
    for (let side = 0; side < 4 && addedSidePoints < sidePoints; side++) {
      const cornerA = baseCorners[side];
      const cornerB = baseCorners[(side + 1) % 4];
      for (let i = 0; i < pointsPerSide && addedSidePoints < sidePoints; i++, addedSidePoints++) {
        // t moves along the edge; s moves up toward the apex
        const t = i / (pointsPerSide - 1);
        // To create a nice surface, s will go from 0 (base edge) to 1 (apex)
        // We'll distribute s logarithmically for better spacing (optional)
        const s = t; // linear (you can experiment with Math.sqrt(t) or t*t for curve)

        // Interpolate along base edge
        const edgePoint = cornerA.clone().lerp(cornerB, t);
        // Interpolate from edge point up to apex
        const pyramidPoint = edgePoint.clone().lerp(apex, s);
        this.basePoints.push(pyramidPoint);
      }
    }

    // Optionally, copy to this.points
    this.points = this.basePoints.map(v => v.clone());
  }

  setPointsToTorus(
    majorRadius: number = 80, 
    minorRadius: number = 30, 
    numPoints: number = 100
  ) {
    this.basePoints = [];

    // Arrange points in a grid around the torus: sqrt(numPoints) along theta and phi
    const tubeSteps = Math.round(Math.sqrt(numPoints));
    const ringSteps = Math.ceil(numPoints / tubeSteps);
    let count = 0;

    for (let i = 0; i < ringSteps; i++) {
      const theta = (i / ringSteps) * 2 * Math.PI;
      for (let j = 0; j < tubeSteps && count < numPoints; j++, count++) {
        const phi = (j / tubeSteps) * 2 * Math.PI;
        const x = (majorRadius + minorRadius * Math.cos(phi)) * Math.cos(theta);
        const y = (majorRadius + minorRadius * Math.cos(phi)) * Math.sin(theta);
        const z = minorRadius * Math.sin(phi);
        this.basePoints.push(new THREE.Vector3(x, y, z));
      }
    }

    // Optionally, update points as well
    this.points = this.basePoints.map(v => v.clone());
  }

  setPointsToDoubleHelix(
    helixRadius: number = 40,
    helixPitch: number = 12,   // Vertical distance per turn
    helixTurns: number = 4,    // How many turns for both strands
    numPoints: number = 100
  ) {
    this.basePoints = [];

    const strandPoints = Math.floor(numPoints / 2);

    // Strand 1
    for (let i = 0; i < strandPoints; i++) {
      const t = (i / strandPoints) * (helixTurns * 2 * Math.PI);
      const x = helixRadius * Math.cos(t);
      const y = helixRadius * Math.sin(t);
      const z = helixPitch * (t / (2 * Math.PI));
      this.basePoints.push(new THREE.Vector3(x, y, z));
    }

    // Strand 2, offset by 180° (π radians)
    for (let i = 0; i < strandPoints; i++) {
      const t = (i / strandPoints) * (helixTurns * 2 * Math.PI) + Math.PI;
      const x = helixRadius * Math.cos(t);
      const y = helixRadius * Math.sin(t);
      const z = helixPitch * ((t - Math.PI) / (2 * Math.PI));
      this.basePoints.push(new THREE.Vector3(x, y, z));
    }

    // Optionally, fill to numPoints if it's odd
    while (this.basePoints.length < numPoints) {
      this.basePoints.push(new THREE.Vector3(0, 0, 0)); // or duplicate the last point
    }

    // Copy to this.points for animation system
    this.points = this.basePoints.map(v => v.clone());
  }
  //electric
  setPointsToTesseract(
    size: number = 80,
    numPoints: number = 100,
    perspective: boolean = true
  ) {
    this.basePoints = [];
    const tesseractVertices: number[][] = [];

    // 1. Generate all 16 (±1, ±1, ±1, ±1) vertices
    for (let a = -1; a <= 1; a += 2) {
      for (let b = -1; b <= 1; b += 2) {
        for (let c = -1; c <= 1; c += 2) {
          for (let d = -1; d <= 1; d += 2) {
            tesseractVertices.push([a, b, c, d]);
          }
        }
      }
    }

    // 2. Project 4D vertices into 3D
    const project4Dto3D = (p: number[]): THREE.Vector3 => {
      // Simple perspective projection
      let w = perspective ? 2 / (2 - p[3]) : 1;
      return new THREE.Vector3(
        p[0] * size * w,
        p[1] * size * w,
        p[2] * size * w
      );
    };

    // Add 16 vertices
    for (const v of tesseractVertices) {
      this.basePoints.push(project4Dto3D(v));
    }

    // 3. For the remaining points, interpolate along edges
    const edges: Array<[number, number]> = [];
    for (let i = 0; i < 16; i++) {
      for (let j = i + 1; j < 16; j++) {
        // Vertices differ by exactly one coordinate: that's an edge
        const diff = tesseractVertices[i].filter((v, k) => v !== tesseractVertices[j][k]).length;
        if (diff === 1) edges.push([i, j]);
      }
    }

    const edgePointsNeeded = numPoints - 16;
    let edgePointIndex = 0;
    const pointsPerEdge = Math.ceil(edgePointsNeeded / edges.length);

    // Add interpolated points along edges
    for (const [i1, i2] of edges) {
      const v1 = tesseractVertices[i1];
      const v2 = tesseractVertices[i2];
      for (let k = 1; k < pointsPerEdge && this.basePoints.length < numPoints; k++) {
        const t = k / pointsPerEdge;
        const interp = [
          v1[0] * (1 - t) + v2[0] * t,
          v1[1] * (1 - t) + v2[1] * t,
          v1[2] * (1 - t) + v2[2] * t,
          v1[3] * (1 - t) + v2[3] * t,
        ];
        this.basePoints.push(project4Dto3D(interp));
      }
      if (this.basePoints.length >= numPoints) break;
    }

    // Fill up if still short (shouldn't usually happen)
    while (this.basePoints.length < numPoints) {
      this.basePoints.push(this.basePoints[this.basePoints.length - 1].clone());
    }

    this.points = this.basePoints.map(v => v.clone());
  }

  setPointsToTetrahedron(size: number = 90, numPoints: number = 100) {
    this.basePoints = [];

    // The 4 vertices of a regular tetrahedron centered at origin
    const sqrt2over3 = Math.sqrt(2) / 3;
    const sqrt6over3 = Math.sqrt(6) / 3;
    const a = size / Math.sqrt(3); // side length adjusted to fit size

    const vertices = [
      new THREE.Vector3(0, 0, a),
      new THREE.Vector3(2 * a * Math.sqrt(2) / 3, 0, -a / 3),
      new THREE.Vector3(-a * Math.sqrt(2) / 3, a * sqrt6over3, -a / 3),
      new THREE.Vector3(-a * Math.sqrt(2) / 3, -a * sqrt6over3, -a / 3)
    ];

    // Add vertices first
    for (const v of vertices) {
      this.basePoints.push(v.clone());
    }

    // Tetrahedron has 6 edges, fill them with points
    const edges: Array<[number, number]> = [
      [0, 1], [0, 2], [0, 3],
      [1, 2], [2, 3], [1, 3]
    ];
    const edgePointsTotal = Math.floor(numPoints * 0.36); // About 36 points on edges
    const edgePointsPerEdge = Math.floor(edgePointsTotal / edges.length);

    for (const [start, end] of edges) {
      const vStart = vertices[start];
      const vEnd = vertices[end];
      for (let i = 1; i < edgePointsPerEdge; i++) {
        const t = i / edgePointsPerEdge;
        this.basePoints.push(
          new THREE.Vector3(
            vStart.x * (1 - t) + vEnd.x * t,
            vStart.y * (1 - t) + vEnd.y * t,
            vStart.z * (1 - t) + vEnd.z * t
          )
        );
      }
    }

    // Distribute remaining points on the faces
    const facePointsTotal = numPoints - this.basePoints.length;
    const faces: Array<[number, number, number]> = [
      [0, 1, 2],
      [0, 1, 3],
      [0, 2, 3],
      [1, 2, 3]
    ];
    const facePointsPerFace = Math.floor(facePointsTotal / faces.length);

    for (const [i1, i2, i3] of faces) {
      const v1 = vertices[i1], v2 = vertices[i2], v3 = vertices[i3];
      for (let i = 0; i < facePointsPerFace; i++) {
        // Random barycentric coordinates
        let a = Math.random(), b = Math.random();
        if (a + b > 1) { a = 1 - a; b = 1 - b; }
        const c = 1 - a - b;
        this.basePoints.push(new THREE.Vector3(
          v1.x * a + v2.x * b + v3.x * c,
          v1.y * a + v2.y * b + v3.y * c,
          v1.z * a + v2.z * b + v3.z * c
        ));
      }
    }

    // Fill up if still short (shouldn't happen)
    while (this.basePoints.length < numPoints) {
      this.basePoints.push(this.basePoints[this.basePoints.length - 1].clone());
    }

    this.points = this.basePoints.map(v => v.clone());
  }

  setPointsToSpikeySphere(
    sphereRadius: number = 70,
    spikeLength: number = 40,
    numPoints: number = 100,
    spikeFraction: number = 0.18 // ~18% of points are spikes (18 of 100)
  ) {
    this.basePoints = [];

    // Calculate number of spikes and regular points
    const numSpikes = Math.floor(numPoints * spikeFraction);
    const numBase = numPoints - numSpikes;

    // 1. Distribute base points on the sphere (Fibonacci sphere)
    for (let i = 0; i < numBase; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / numBase);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

      const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
      const y = sphereRadius * Math.sin(phi) * Math.sin(theta);
      const z = sphereRadius * Math.cos(phi);

      this.basePoints.push(new THREE.Vector3(x, y, z));
    }

    // 2. Add spikes
    for (let i = 0; i < numSpikes; i++) {
      // Spread spikes evenly, but randomize the exact angle a bit
      const phi = Math.acos(1 - 2 * (i + 0.5) / numSpikes);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

      // Direction vector (on sphere)
      const dx = Math.sin(phi) * Math.cos(theta);
      const dy = Math.sin(phi) * Math.sin(theta);
      const dz = Math.cos(phi);

      // Place spike point well outside the sphere radius
      const x = (sphereRadius + spikeLength) * dx;
      const y = (sphereRadius + spikeLength) * dy;
      const z = (sphereRadius + spikeLength) * dz;

      this.basePoints.push(new THREE.Vector3(x, y, z));
    }

    // Optionally: shuffle the points for more randomness
    // this.basePoints = this.basePoints.sort(() => Math.random() - 0.5);

    // Copy to .points for animation/visualization
    this.points = this.basePoints.map(v => v.clone());
  }

  setPointsToFace(
    headWidth: number = 60,
    headHeight: number = 90,
    headDepth: number = 50,
    numPoints: number = 100
  ) {
    this.basePoints = [];

    // 1. Main head/face oval (ellipsoid)
    const facePoints = 60;
    for (let i = 0; i < facePoints; i++) {
      const theta = Math.PI * (i / facePoints); // 0 (top) to pi (bottom)
      const phi = 2 * Math.PI * (i / (facePoints / 2)); // around the face
      // Emphasize more points at the front of the face
      const x = (headWidth / 2) * Math.sin(theta) * Math.cos(phi) * 0.8;
      const y = (headHeight / 2) * Math.cos(theta);
      const z = (headDepth / 2) * Math.sin(theta) * Math.sin(phi) * 1.2;
      // Flatten the back, push points forward
      const zz = (z > 0) ? z : z * 0.5;
      this.basePoints.push(new THREE.Vector3(x, y, zz));
    }

    // 2. Eyes (clusters)
    const eyeY = headHeight * 0.15;
    const eyeZ = headDepth * 0.32;
    const eyeSep = headWidth * 0.22;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const r = 4;
      // Left eye
      this.basePoints.push(new THREE.Vector3(-eyeSep, eyeY + Math.sin(angle)*r, eyeZ + Math.cos(angle)*r));
      // Right eye
      this.basePoints.push(new THREE.Vector3(eyeSep, eyeY + Math.sin(angle)*r, eyeZ + Math.cos(angle)*r));
    }

    // 3. Nose (vertical cluster)
    for (let i = 0; i < 6; i++) {
      this.basePoints.push(new THREE.Vector3(0, eyeY - 5 - i * 2, headDepth * 0.36 - Math.abs(i-2)));
    }

    // 4. Mouth (arc/curve)
    const mouthY = -headHeight * 0.15;
    const mouthZ = headDepth * 0.30;
    for (let i = 0; i < 8; i++) {
      const angle = Math.PI * (i / 7) - Math.PI/2; // from -π/2 to π/2
      this.basePoints.push(new THREE.Vector3(Math.sin(angle) * headWidth * 0.19, mouthY + Math.cos(angle) * 3, mouthZ));
    }

    // 5. Chin (a few points)
    for (let i = 0; i < 5; i++) {
      const angle = Math.PI * (i / 4) - Math.PI/2;
      this.basePoints.push(new THREE.Vector3(Math.sin(angle) * headWidth * 0.11, -headHeight/2 + 5, headDepth * 0.10 + Math.cos(angle)*2));
    }

    // 6. Ears (left and right)
    const earY = headHeight * 0.04;
    const earZ = -headDepth * 0.10;
    for (let i = 0; i < 4; i++) {
      const earAngle = (Math.PI * i) / 3;
      // Left ear
      this.basePoints.push(new THREE.Vector3(-headWidth / 2, earY + Math.sin(earAngle)*5, earZ + Math.cos(earAngle)*4));
      // Right ear
      this.basePoints.push(new THREE.Vector3(headWidth / 2, earY + Math.sin(earAngle)*5, earZ + Math.cos(earAngle)*4));
    }

    // 7. Fill any remaining points randomly on the face
    while (this.basePoints.length < numPoints) {
      const theta = Math.random() * Math.PI;
      const phi = Math.random() * 2 * Math.PI;
      const x = (headWidth / 2) * Math.sin(theta) * Math.cos(phi) * 0.8;
      const y = (headHeight / 2) * Math.cos(theta);
      const z = (headDepth / 2) * Math.sin(theta) * Math.sin(phi) * 1.2;
      const zz = (z > 0) ? z : z * 0.5;
      this.basePoints.push(new THREE.Vector3(x, y, zz));
    }

    this.points = this.basePoints.map(v => v.clone());
  }

  animate = () => {
    requestAnimationFrame(this.animate);

    const t = performance.now() * 0.001;
    // Animate points
    if(this.pointMesh){
      const positions = (this.pointMesh.geometry as THREE.BufferGeometry).attributes['position'] as THREE.BufferAttribute;

      for (let i = 0; i < this.points.length; i++) {
        // Copy base point
        let base = this.basePoints[i].clone();

        // Mouse sway
        if(!this.collapseActive){
          base.x += Math.sin(t + i) * this.mouse.x * 15;
          base.y += Math.cos(t + i) * this.mouse.y * 15;
        } else {
          const random = 1 + Math.random() * 0.1;
          base.x += 5 * Math.sin(t + i) * this.mouse.x;
          base.y += 5 * Math.cos(t + i) * this.mouse.y;
        }

        // Shake (on typing)
        if (this.shakeAmount > 0.01) {
          base.x += (Math.random() - 0.5) * this.shakeAmount;
          base.y += (Math.random() - 0.5) * this.shakeAmount;
          base.z += (Math.random() - 0.5) * this.shakeAmount;
        }

        if(this.spreadActive){
          //if (this.spreadAmount > 0.01) {
          if (this.currentSpread > 0.01) {
            this.currentSpread *= 0.999;
            this.collapseAmount = this.spreadAmount;
            base.multiplyScalar(1 + this.spreadAmount - this.currentSpread);
          } else {
            if(this.collapseAmount > 0.001){
              base.multiplyScalar(1 + this.collapseAmount);
            } else {
              this.spreadActive = false;
              this.currentSpread = 0;
            }
          }
        }
        if(this.collapseActive){
          if (this.currentCollapse > 0.01) {
              base.multiplyScalar(this.currentCollapse);
              this.currentCollapse *= 0.999;
          } else {
            if(!this.newPointsPositionSet){
              switch (this.selectedCircleMenuIndex){
                case 1:
                  this.setPointsToSphere(90)
                  break;
                case 2:
                  this.setPointsToCube(110);
                  break;
                case 3:
                  this.setPointsToPyramid(220, 220);
                  break;
                case 4:
                  this.setPointsToTorus(80, 30, 100);
                  break;
                case 5:
                  this.setPointsToTesseract(35, 100, true);
                  break;
                case 6:
                  this.setPointsToFace(140, 180, 100, 100);
                  break;
                case 0:
                  this.setPointsToSpikeySphere(70, 40, 100, 0.18);
                  break;
                default:
                  this.setPointsToDoubleHelix(90, 18, 10, 100);// radius, pitch, turns, num points
              }
              //this.setPointsToSphere(90);
              //this.setPointsToCube(110);
              //this.setPointsToPyramid(220, 220);
              //this.setPointsToTorus(80, 30, 100);
              //this.setPointsToDoubleHelix(90, 18, 10, 150);// radius, pitch, turns, num points
              //this.setPointsToTesseract(35, 100, true);
              //this.setPointsToFace(140, 180, 100, 100);
              //this.setPointsToTetrahedron(90, 100);
              //this.setPointsToSpikeySphere(70, 40, 100, 0.18);
              this.newPointsPositionSet = true;
              if (this.debounceTimeout) clearTimeout(this.debounceTimeout);
            }
            if(this.collapseAmount > 0.01){
              base.multiplyScalar(this.spreadEndSize + 0.01 - this.collapseAmount);
              this.collapseAmount *= 0.999
            } else {
              base.multiplyScalar(this.spreadEndSize + this.mouseScroll);
              //base.multiplyScalar(this.spreadEndSize);
              this.newPointsPositionSet = false;
            }
          }
        }

        positions.setXYZ(i, base.x, base.y, base.z);
      }
      positions.needsUpdate = true;

      // Update line geometry
      const linePoints = [];
      for (let i = 0; i < this.points.length; i++) {
        linePoints.push(new THREE.Vector3(
          positions.getX(i), positions.getY(i), positions.getZ(i)
        ));
      }
      linePoints.push(linePoints[0]);
      if(this.lineMesh)
      (this.lineMesh.geometry as THREE.BufferGeometry).setFromPoints(linePoints);

      // Animate back to normal
      this.shakeAmount *= 0.8;
      if(!(this.currentSpread > 0.01 && this.spreadActive)){
        this.collapseAmount *= 0.98;
      }
    }

    //For 3D model

    // Rotate model slowly if present
    if (this.model && this.accessGranted) {
      if(!this.movedToMiddle){
        let indexCount = 0;
        for (let j = 0; j < this.currentPosition.length; j++){
          if(!(this.currentPosition[j] > (this.movePosition[j] - 1.0) && this.currentPosition[j] < (this.movePosition[j] + 1.0))){
            this.currentPosition[j] *= 0.98;
          } else {
            indexCount++;
          }
        }
        if(this.currentPosition.length === indexCount){
          this.model.position.set(this.movePosition[0], this.movePosition[1], this.movePosition[2]);
          this.movedToMiddle = true;
          console.log("Moved to middle captured.");
        } else {
          this.model.position.set(this.currentPosition[0], this.currentPosition[1], this.currentPosition[2]);
        }
        //this.model.scale.set(10, 10, 10);
      }
      /*
      if(this.model.rotation.y > (this.mouseScroll - 1.0) && this.model.rotation.y < (this.mouseScroll + 1.0)){
        this.model.rotation.y = this.mouseScroll; // scroll to rotate 3D model
      } else {
        this.model.rotation.y += (this.model.rotation.y/this.mouseScroll)*0.1;
      }
        */
      if(this.mouseScrollCounter > this.mouseScrollCount){
        this.mouseScrollCounter = 0;
        if(this.mouseScroll < 0.01 && this.mouseScroll > -0.01){
          this.mouseScroll = 0.0;
        } else {
          this.mouseScroll *= 0.9;
        }
      } else {
        this.mouseScrollCounter++;
      }
      if(this.mouseScroll != 0.0){
        //this.model.rotation.y += this.mouseScroll;
      }
      this.model.rotation.y = this.mouse.x;

      if(this.menuSelectionEvent){
        const targetYPosition = 20;
        if(this.model.position.y < targetYPosition + 0.1 && this.model.position.y > targetYPosition - 0.1){
          this.model.position.y = targetYPosition;
          this.menuSelectionEvent = false;
        } else {
          this.model.position.y += (targetYPosition - this.model.position.y + 1)/targetYPosition;
        }
      }

      if(this.menuDeselectionEvent){
        //const targetYPosition = this.movePosition[1];
        if(this.model.position.y < this.movePosition[1] + 0.1 && this.model.position.y > this.movePosition[1] - 0.1){
          this.model.position.y = this.movePosition[1];
          this.menuDeselectionEvent = false;
        } else {
          this.model.position.y -= (this.movePosition[1] - this.model.position.y - 1)/this.movePosition[1];
        }
      }
      
    }

    if (this.mixer) {
      this.mixer.update(this.clock.getDelta());
    }

    this.renderer.render(this.scene, this.camera);
  };

  // Mouse movement: subtle sway
  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = (event.clientY / window.innerHeight) * 2 - 1;
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    // Example variables:
    // Adjust point size with scroll
    if (event.deltaY < 0) {
      //this.mouseScroll = Math.min(this.mouseScroll + 0.5, 50); // Increase, max 50
      this.mouseScroll-=0.01;
    } else {
      //this.mouseScroll = Math.max(this.mouseScroll - 0.5, -50); // Decrease, min 1
      this.mouseScroll+=0.01;
    }

  }

  // Focus/click: randomize points
  onPasswordFocus() {
    //this.createPoints();
  }

  // Input typing: shake
  onPasswordInput(value: string) {
    if(value.length === 8){
      if (this.debounceTimeout) clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => {
        this.checkPassword();
      }, 500);
    }

    this.shakeAmount = 5;//12
  }

  // Password check logic (unchanged except animation triggers)
  checkPassword() {
    if (!this.password) {
      this.message = '';
      this.feedback = '';
      return;
    }
    this.loading = true;
    this.message = '';

    if (this.timeoutHandle) clearTimeout(this.timeoutHandle);
    this.timeoutHandle = setTimeout(() => {
      this.loading = false;
      this.message = 'error, try again';
      this.setFeedback('error');
      this.triggerIncorrect();
    }, 20000);

    this.http.post<{timestamp: number}>(
      'https://digitorumflex.com/fullstack_password.php',
      { password: this.password }
    ).subscribe({
      next: (data: {timestamp: number}) => {
        clearTimeout(this.timeoutHandle);
        this.loading = false;
        const CORRECT_TIMESTAMP = 1749182760;
        if (data?.timestamp === CORRECT_TIMESTAMP) {
          this.setFeedback('success');
          this.triggerCorrect();
          setTimeout(() => {this.circleMenuShow(); this.grantAccess()}, 700); // Delay for green flash
        } else {
          this.setFeedback('error');
          this.message = "You don't have access";
          this.triggerIncorrect();
        }
      },
      error: () => {
        clearTimeout(this.timeoutHandle);
        this.loading = false;
        this.setFeedback('error');
        this.message = 'error, try again';
        this.triggerIncorrect();
      }
    });
  }

  setFeedback(state: 'success' | 'error' | '') {
    this.feedback = state;
    if (this.feedbackTimeout) clearTimeout(this.feedbackTimeout);
    if (state !== '') {
      this.feedbackTimeout = setTimeout(() => {
        this.feedback = '';
      }, 800);
    }
  }

  grantAccess() {
    this.accessGranted = true;
  }

  circleMenuShow(){
    this.showCircleMenu = true;
  }

  // Animation triggers
  triggerIncorrect() {
    this.spreadAmount = 1.5; // Spread out (then collapses via animate)
    this.currentSpread = this.spreadAmount;
    this.spreadActive = true;
    this.collapseActive = false;
  }
  triggerCorrect() {
    this.collapseAmount = this.spreadEndSize; // Collapse to center
    this.collapseActive = true;
    this.spreadActive = false;
  }

  onMenuSelected(index: number) {
    if (this.isMobile) {
      this.titleFaded = true;
    }
    if(this.selectedCircleMenuIndex !== index){
      this.selectedCircleMenuIndex = index;
      this.collapseAmount = this.spreadEndSize; // Collapse to center
      this.collapseActive = true;
      this.spreadActive = false;
    }
    // Do whatever you need, e.g., show content, log, fetch data, etc.
    console.log('Menu selected:', index);
    this.menuSelectionEvent = true;
    this.menuDeselectionEvent = false;
  }

  onMenuDeselected(){
    if (this.isMobile) {
      // Fade in after a short delay (matches animation duration)
      setTimeout(() => this.titleFaded = false, 400);
    }
    if(this.selectedCircleMenuIndex !== 7){
      this.selectedCircleMenuIndex = 7;
      this.collapseAmount = this.spreadEndSize; // Collapse to center
      this.collapseActive = true;
      this.spreadActive = false;
    }
    console.log('Menu deselected.');
    this.menuDeselectionEvent = true;
    this.menuSelectionEvent = false;
  }
}
