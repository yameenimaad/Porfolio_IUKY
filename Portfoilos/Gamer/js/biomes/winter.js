const Winter = {
    name: "Frozen_Waste",
    config: { sky: 0xe2e8f0, grass: 0xffffff, trunk: 0x4a3728, leaf: 0xf8fafc },
    getHeight: (x, z) => Math.floor(Math.sin(x * 0.15) * 2.5),
    spawnStructure: (x, y, z, create) => {
        if (Math.random() > 0.5) { // Ice patches
            create(x, y, z, 0x93c5fd);
        }
        // Spruce Trees (Pointy)
        const h = 5;
        for (let i = -1; i < h; i++) create(x, y + i, z, 0x4a3728);
        create(x, y + h, z, 0xffffff); 
        create(x+1, y+h-1, z, 0xffffff); create(x-1, y+h-1, z, 0xffffff);
    }
};
