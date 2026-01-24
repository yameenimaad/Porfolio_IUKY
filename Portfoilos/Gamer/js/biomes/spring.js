const Spring = {
    name: "Vibrant_Spring",
    config: { sky: 0xA5F3FC, grass: 0x567d46, trunk: 0x795548, leaf: 0x38b000 },
    getHeight: (x, z) => Math.floor(Math.sin(x * 0.3) + Math.cos(z * 0.3)),
    spawnStructure: (x, y, z, create) => {
        const rand = Math.random();
        if (rand > 0.7) { // Spawn Flowers
            const flowerColors = [0xff4d6d, 0xffb703, 0x00b4d8];
            create(x, y + 1, z, flowerColors[Math.floor(Math.random() * 3)]);
        } else { // Spawn Oak Trees
            const height = 4 + Math.floor(Math.random() * 3);
            for (let i = -1; i < height; i++) create(x, y + i, z, 0x795548); // Deep Trunk
            for (let ox = -1; ox <= 1; ox++) 
                for (let oz = -1; oz <= 1; oz++) 
                    create(x + ox, y + height, z + oz, 0x38b000); // Leaf Canopy
        }
    }
};
