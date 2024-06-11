import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

let scene, objects = [], cells = [];

export function initMap() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const aspect = window.innerWidth / window.innerHeight;
    const d = 50;
    const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048; // Default is 512
    directionalLight.shadow.mapSize.height = 2048; // Default is 512
    scene.add(directionalLight);

    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // Rotate to lie flat
    floor.position.y = -0.5; // Position it below the objects
    floor.receiveShadow = true; // Floor receives shadows
    floor.name = 'floor'; // Add name to the floor
    scene.add(floor);

    // Create grid helper
    const gridHelper = new THREE.GridHelper(100, 20);
    scene.add(gridHelper);

    // Create cells
    const cellSize = 5;
    for (let i = -50 + cellSize / 2; i < 50; i += cellSize) {
        for (let j = -50 + cellSize / 2; j < 50; j += cellSize) {
            const cellGeometry = new THREE.PlaneGeometry(cellSize, cellSize);
            const cellMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.0, transparent: true });
            const cell = new THREE.Mesh(cellGeometry, cellMaterial);
            cell.position.set(i, 0, j);
            cell.rotation.x = -Math.PI / 2;
            cell.name = 'cell';
            scene.add(cell);
            cells.push(cell);
        }
    }

    return { scene, camera, objects, cells };
}
