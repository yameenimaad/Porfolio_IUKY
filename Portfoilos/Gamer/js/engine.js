/**
 * engine.js - Core Voxel System v2.0
 * Troubleshooting: Ensure this script is loaded AFTER all biome scripts in index.html.
 */

let scene, camera, renderer, clock;
let blocks = [];
let lastZGenerated = 0;
let activeBiome = null;
let biomeIndex = 0;

// Configuration
const RENDER_DISTANCE = 50;
const WORLD_WIDTH = 18;
const MOVE_SPEED = 0.03; // Cinematic slow walk
const BIOME_STEP_INTERVAL = 20000; // Switch biome every 20 seconds

function init() {
    // 1. Scene Setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    clock = new THREE.Clock();

    // 2. Renderer Setup
    renderer = new THREE.WebGLRenderer({ 
        canvas: document.querySelector('#three-canvas'), 
        antialias: false // Keeps the pixelated/blocky Minecraft look
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(10, 20, 10);
    scene.add(sunLight);

    camera.position.set(0, 4, 5); // Position camera above the ground

    // 4. Load Initial Biome
    // We check window scope to ensure the separate JS files are loaded
    const availableBiomes = [
        window.Spring, window.Winter, window.Autumn, 
        window.Summer, window.Ocean, window.Underground, window.Space
    ].filter(b => b !== undefined);

    if (availableBiomes.length === 0) {
        console.error("Critical Error: No biomes found. Check script loading order in index.html.");
        return;
    }

    activeBiome = availableBiomes[0];
    updateEnvironment();

    // 5. Initial World Generation
    for (let z = 10; z > -RENDER_DISTANCE; z--) {
        generateRow(z);
    }

    // 6. Biome Rotation Loop
    setInterval(() => {
        biomeIndex = (biomeIndex + 1) % availableBiomes.length;
        activeBiome = availableBiomes[biomeIndex];
        updateEnvironment();
    }, BIOME_STEP_INTERVAL);

    animate();
}

function updateEnvironment() {
    // Update Sky and HUD
    renderer.setClearColor(activeBiome.config.sky);
    const hudDisplay = document.getElementById('biome-display');
    if (hudDisplay) {
        hudDisplay.innerText = activeBiome.name;
        hudDisplay.style.color = `#${activeBiome.config.leaf.toString(16).padStart(6, '0')}`;
    }
}

function generateRow(z) {
    if (!activeBiome) return;

    for (let x = -WORLD_WIDTH / 2; x < WORLD_WIDTH / 2; x++) {
        const h = activeBiome.getHeight(x, z);
        
        // Create the base floor block
        createBlock(x, h, z, activeBiome.config.grass);

        // Check for structures (Trees, Ores, Plants)
        // High-density check
        if (Math.random() > 0.98) {
            activeBiome.spawnStructure(x, h, z, createBlock);
        }
    }
}

function createBlock(x, y, z, color) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshLambertMaterial({ color: color });
    const block = new THREE.Mesh(geometry, material);
    
    block.position.set(x, y, z);
    scene.add(block);
    blocks.push(block);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Constant Forward Movement
    camera.position.z -= MOVE_SPEED;

    // Generate New Terrain on the Horizon
    const currentZ = Math.floor(camera.position.z) - RENDER_DISTANCE;
    if (currentZ < lastZGenerated) {
        generateRow(currentZ);
        lastZGenerated = currentZ;

        // Cleanup Memory: Remove blocks 10 units behind the camera
        const cleanupZ = camera.position.z + 10;
        blocks = blocks.filter(block => {
            if (block.position.z > cleanupZ) {
                scene.remove(block);
                block.geometry.dispose();
                block.material.dispose();
                return false;
            }
            return true;
        });
    }

    renderer.render(scene, camera);
}

// Handle Window Resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the Engine
init();
