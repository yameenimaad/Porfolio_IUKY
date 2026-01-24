const Summer = {
    name: "Overgrown_Jungle",
    config: { sky: 0x0ea5e9, grass: 0x14532d, trunk: 0x271709, leaf: 0x064e3b },
    getHeight: (x, z) => Math.floor(Math.sin(x * 0.1) * 0.5), // Flatter swamp
    spawnStructure: (x, y, z, create) => {
        // Giant Trees (2x2)
        const h = 8;
        for (let i = -1; i < h; i++) {
            create(x, y+i, z, 0x271709);
            create(x+1, y+i, z, 0x271709);
        }
        // Huge canopy
        for(let ox=-2; ox<=2; ox++)
            for(let oz=-2; oz<=2; oz++)
                create(x+ox, y+h, z+oz, 0x064e3b);
    }
};

