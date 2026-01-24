const Underground = {
    name: "Deep_Dark_Mines",
    config: { sky: 0x111111, grass: 0x3f3f3f, trunk: 0x71717a, leaf: 0x18181b },
    getHeight: (x, z) => 3 + Math.floor(Math.sin(x * 0.8) * 2),
    spawnStructure: (x, y, z, create) => {
        const ores = [0xd4d4d8, 0xfacc15, 0x22d3ee]; // Iron, Gold, Diamond
        if(Math.random() > 0.7) create(x, y+1, z, ores[Math.floor(Math.random()*3)]);
        // Support Beams
        if(x === 0) {
            for(let i=0; i<5; i++) create(x, y+i, z, 0x431407);
            create(x+1, y+4, z, 0x431407); create(x-1, y+4, z, 0x431407);
        }
    }
};
