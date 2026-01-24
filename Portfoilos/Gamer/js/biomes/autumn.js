const Autumn = {
    name: "Amber_Heights",
    config: { sky: 0xfed7aa, grass: 0x9a3412, trunk: 0x431407, leaf: 0xea580c },
    getHeight: (x, z) => Math.floor(Math.cos(x * 0.4) * 2),
    spawnStructure: (x, y, z, create) => {
        const leafColors = [0xea580c, 0xfacc15, 0x9a3412];
        // Fallen leaves
        if (Math.random() > 0.6) create(x, y + 1, z, leafColors[Math.floor(Math.random()*3)]);
        // Maple Trees
        const h = 4;
        for (let i = -1; i < h; i++) create(x, y + i, z, 0x431407);
        for(let j=0; j<2; j++) create(x, y+h+j, z, leafColors[0]);
    }
};
