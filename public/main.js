import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { initMap } from './map.js';
import TWEEN from 'https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@18.6.4/dist/tween.esm.js';
import { initShapeManager, setAddState, handleAddShapeClick, handleRemoveShapeClick } from './shapeManager.js';

let scene, camera, renderer, raycaster, cells;
let objects = [];
let isDragging = false;
let previousMousePosition = {
    x: 0,
    y: 0
};
let currentView = '2D'; // Possible values: '2D', 'isometric', '2.5D'
let occupiedCells = {};
let addState = null; // Possible values: 'box', 'sphere', 'cylinder', 'rectangle', 'largeSquare'
let hoveredCell = null;

init();
animate();

function init() {
    ({ scene, camera, objects, cells } = initMap());

    raycaster = new THREE.Raycaster();
    initShapeManager(scene, raycaster, cells, objects, occupiedCells, camera);

    set2DView();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // Enable shadow maps
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    const mouse = new THREE.Vector2();

    // Add event listener for mouse click
    window.addEventListener('click', (event) => {
        if (addState) {
            handleAddShapeClick(event, addState);
        } else {
            handleObjectClick(event);
        }
    });

    // Add event listener for right-click to remove shape
    window.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        if (addState) {
            handleRemoveShapeClick(event);
        }
    });

    // Add event listener for mouse move
    window.addEventListener('mousemove', (event) => {
        if (addState) {
            handleCellHover(event);
        }
    });

    // Add event listener for window resize
    window.addEventListener('resize', () => {
        const aspect = window.innerWidth / window.innerHeight;
        const d = 50;
        camera.left = -d * aspect;
        camera.right = d * aspect;
        camera.top = d;
        camera.bottom = -d;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Add event listeners for dragging
    window.addEventListener('mousedown', (event) => {
        isDragging = true;
        previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    });

    window.addEventListener('mousemove', (event) => {
        if (isDragging) {
            const deltaMove = {
                x: event.clientX - previousMousePosition.x,
                y: event.clientY - previousMousePosition.y
            };

            const moveSpeed = 0.1; // Adjust this value to control panning speed

            camera.position.x -= deltaMove.x * moveSpeed;
            camera.position.z -= deltaMove.y * moveSpeed;

            previousMousePosition = {
                x: event.clientX,
                y: event.clientY
            };
        }
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Add basic zoom controls
    document.addEventListener('wheel', (event) => {
        camera.zoom += event.deltaY * 0.001;
        camera.updateProjectionMatrix();
    });

    // Add toggle button event listener
    document.getElementById('toggleButton').addEventListener('click', toggleView);

    // Add buttons event listeners for adding shapes
    document.getElementById('addBoxButton').addEventListener('click', () => {
        addState = 'box';
        setAddState('box');
    });
    document.getElementById('addSphereButton').addEventListener('click', () => {
        addState = 'sphere';
        setAddState('sphere');
    });
    document.getElementById('addCylinderButton').addEventListener('click', () => {
        addState = 'cylinder';
        setAddState('cylinder');
    });
    document.getElementById('addRectangleButton').addEventListener('click', () => {
        addState = 'rectangle';
        setAddState('rectangle');
    });
    document.getElementById('addLargeSquareButton').addEventListener('click', () => {
        addState = 'largeSquare';
        setAddState('largeSquare');
    });
    document.getElementById('exitAddStateButton').addEventListener('click', () => {
        addState = null;
        setAddState(null);
    });
}

function set2DView() {
    camera.position.set(0, 100, 0);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    currentView = '2D';
}

function setIsometricView() {
    camera.position.set(100, 100, 100);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    currentView = 'isometric';
}

function set25DView() {
    camera.position.set(50, 50, 50);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    currentView = '2.5D';
}

function toggleView() {
    if (currentView === '2D') {
        animateToView(setIsometricView);
    } else if (currentView === 'isometric') {
        animateToView(set25DView);
    } else {
        animateToView(set2DView);
    }
}

function animateToView(setViewFunction) {
    const from = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
        zoom: camera.zoom
    };

    setViewFunction();

    const to = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
        zoom: camera.zoom
    };

    new TWEEN.Tween(from)
        .to(to, 1000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(() => {
            camera.position.set(from.x, from.y, from.z);
            camera.zoom = from.zoom;
            camera.updateProjectionMatrix();
        })
        .start();
}

function handleObjectClick(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(objects);
    if (intersects.length > 0) {
        alert('Object clicked!');
    }
}

function handleCellHover(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(cells);
    if (intersects.length > 0) {
        const cell = intersects[0].object;
        if (hoveredCell !== cell) {
            if (hoveredCell) {
                hoveredCell.material.color.set(0xffffff);
                hoveredCell.material.opacity = 0.0;
            }
            hoveredCell = cell;
            hoveredCell.material.color.set(0xff0000);
            hoveredCell.material.opacity = 0.5;
        }
    } else if (hoveredCell) {
        hoveredCell.material.color.set(0xffffff);
        hoveredCell.material.opacity = 0.0;
        hoveredCell = null;
    }
}

function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    renderer.render(scene, camera);
}
