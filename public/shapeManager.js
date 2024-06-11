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

        // Check if the cell is already occupied by a shape
        if (isOccupied(x, z, addState)) {
            alert('One or more cells are already occupied!');
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

        // Remove the shape from the cell
        removeShape(x, z);
    }
}

function isOccupied(x, z, shape) {
    const cellsToCheck = getCellsToOccupy(x, z, shape);
    return cellsToCheck.some(cellKey => occupiedCells[cellKey]);
}

function getCellsToOccupy(x, z, shape) {
    let cellsToOccupy = [];
    switch (shape) {
        case 'box':
        case 'sphere':
        case 'cylinder':
            cellsToOccupy = [`${x},${z}`];
            break;
        case 'rectangle':
            cellsToOccupy = [`${x},${z}`, `${x + 5},${z}`]; // Adjust for grid size
            break;
        case 'largeSquare':
            cellsToOccupy = [
                `${x},${z}`, `${x + 5},${z}`,
                `${x},${z + 5}`, `${x + 5},${z + 5}`
            ]; // Adjust for grid size
            break;
        default:
            break;
    }
    return cellsToOccupy;
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
        case 'rectangle':
            geometry = new THREE.BoxGeometry(9, 4, 4); // Adjust for grid size
            x += 2.5; // Center the rectangle between two cells
            break;
        case 'largeSquare':
            geometry = new THREE.BoxGeometry(9, 4, 9); // Adjust for grid size
            x += 2.5; // Center the square over four cells
            z += 2.5; // Center the square over four cells
            break;
        default:
            return;
    }

    const cellsToOccupy = getCellsToOccupy(x - (shape === 'rectangle' ? 2.5 : 0), z - (shape === 'largeSquare' ? 2.5 : 0), shape);

    // Mark the cells as occupied
    cellsToOccupy.forEach(cellKey => {
        occupiedCells[cellKey] = true;
    });

    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 2.5, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { shape, cellsToOccupy }; // Store shape data in userData
    scene.add(mesh);
    objects.push(mesh);
}

export function removeShape(x, z) {
    const cellKey = `${x},${z}`;
    if (occupiedCells[cellKey]) {
        const objectToRemove = objects.find(obj => obj.userData.cellsToOccupy.includes(cellKey));
        if (objectToRemove) {
            objectToRemove.userData.cellsToOccupy.forEach(key => {
                delete occupiedCells[key];
            });
            scene.remove(objectToRemove);
            objects = objects.filter(obj => obj !== objectToRemove);
        }
    } else {
        alert('No shape to remove in this cell!');
    }
}
