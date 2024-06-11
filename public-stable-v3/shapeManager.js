import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

let scene, raycaster, cells, objects, occupiedCells, camera;

export function initShapeManager(sceneRef, raycasterRef, cellsRef, objectsRef, occupiedCellsRef, cameraRef) {
    scene = sceneRef;
    raycaster = raycasterRef;
    cells = cellsRef;
    objects = objectsRef;
    occupiedCells = occupiedCellsRef;
    camera = cameraRef;
}

export function setAddState(state) {
    if (state) {
        alert(`Add state set to ${state}. Click on a cell to add a ${state}. Right-click to remove shape.`);
    } else {
        alert('Exited add state.');
    }
}

export function handleAddShapeClick(event, addState) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(cells);
    if (intersects.length > 0) {
        const cell = intersects[0].object;
        const x = cell.position.x;
        const z = cell.position.z;

        // Check if the cell is already occupied
        const cellKey = `${x},${z}`;
        if (occupiedCells[cellKey]) {
            alert('Cell is already occupied!');
            return;
        }

        // Add the shape to the cell
        addShape(addState, x, z);
    }
}

export function handleRemoveShapeClick(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(cells);
    if (intersects.length > 0) {
        const cell = intersects[0].object;
        const x = cell.position.x;
        const z = cell.position.z;

        // Check if the cell has a shape to remove
        const cellKey = `${x},${z}`;
        if (!occupiedCells[cellKey]) {
            alert('No shape to remove in this cell!');
            return;
        }

        // Remove the shape from the cell
        removeShape(x, z);
    }
}

export function addShape(shape, x, z) {
    let geometry, material, mesh;

    material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });

    switch (shape) {
        case 'box':
            geometry = new THREE.BoxGeometry(4, 4, 4);
            break;
        case 'sphere':
            geometry = new THREE.SphereGeometry(2, 32, 32);
            break;
        case 'cylinder':
            geometry = new THREE.CylinderGeometry(2, 2, 4, 32);
            break;
        default:
            return;
    }

    // Mark the cell as occupied
    const cellKey = `${x},${z}`;
    occupiedCells[cellKey] = true;

    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 2.5, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);
}

export function removeShape(x, z) {
    const cellKey = `${x},${z}`;
    if (occupiedCells[cellKey]) {
        const objectToRemove = objects.find(obj => obj.position.x === x && obj.position.z === z);
        if (objectToRemove) {
            scene.remove(objectToRemove);
            objects = objects.filter(obj => obj !== objectToRemove);
            delete occupiedCells[cellKey];
        }
    }
}
