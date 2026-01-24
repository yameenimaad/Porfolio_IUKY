/**
 * engine.js - The Voxel Heart
 */
let scene, camera, renderer, blocks = [];
let lastZ = 0;
const renderDist = 50;
const moveSpeed = 0.04;
let activeBiome;

// Biome Rotation Logic
const biomes = [Spring, Winter, Autumn, Summer, Ocean, Underground, Space];
let biomeIdx = 0;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#three-canvas'), antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Set First Biome
    setBiome(biomes[0]);

    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(10, 20, 10);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6), sun);

    camera.position.set(0, 4, 5);
    for (let z = 10; z > -renderDist; z--) generateRow(z);

    setInterval(() => {
        biomeIdx = (biomeIdx + 1) % biomes.length;
        setBiome(biomes[biomeIdx]);
    }, 15000); // 15 seconds per biome

    animate();
}

function setBiome(biomeObj) {
    activeBiome = biomeObj;
    renderer.setClearColor(activeBiome.config.sky);
    document.getElementById('biome-display').innerText = activeBiome.name;
}

function generateRow(z) {
    for (let x = -8; x < 8; x++) {
        const h = activeBiome.getHeight(x, z);
        createCube(x, h, z, activeBiome.config.grass);
        if (Math.random() > 0.985) activeBiome.spawnStructure(x, h, z, createCube);
    }
}

function createCube(x, y, z, color) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshLambertMaterial({ color: color })
    );
    mesh.position.set(x, y, z);
    scene.add(mesh);
    blocks.push(mesh);
}

function animate() {
    requestAnimationFrame(animate);
    camera.position.z -= moveSpeed;
    const currentZ = Math.floor(camera.position.z) - renderDist;
    if (currentZ < lastZ) {
        generateRow(currentZ);
        lastZ = currentZ;
        // Cleanup behind camera
        blocks = blocks.filter(b => {
            if (b.position.z > camera.position.z + 10) {
                scene.remove(b);
                return false;
            }
            return true;
        });
    }
    renderer.render(scene, camera);
}
init();
