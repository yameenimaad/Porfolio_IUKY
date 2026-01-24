const Space = {
    name: "The_End_Void",
    config: { sky: 0x020617, grass: 0xfef3c7, trunk: 0x3b0764, leaf: 0xa855f7 },
    getHeight: (x, z) => (Math.abs(x) < 3) ? 0 : -20, // Floating void islands
    spawnStructure: (x, y, z, create) => {
        if(y === 0) {
            // Obsidian Pillar
            if(Math.random() > 0.95) {
                for(let i=0; i<12; i++) create(x, y+i, z, 0x0f172a);
                create(x, y+12, z, 0xf43f5e); // Crystal
            } else {
                // Chorus Plant
                create(x, y+1, z, 0x3b0764);
                create(x, y+2, z, 0xa855f7);
            }
        }
    }
};
