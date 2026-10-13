/* ============================================================================
   tailwind-config.js -- Tailwind Play CDN configuration for the portfolio.

   Must load as a plain <script src> in <head>, AFTER the Tailwind CDN script
   tag and BEFORE anything that uses these utility classes -- the CDN reads
   window.tailwind.config and scans the DOM for classes as soon as it runs,
   so this has to execute first. Kept separate from main.js (which loads at
   the end of <body>, long after this needs to have already run) rather than
   merged into it.
   ============================================================================ */
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                industrial: {
                // Original Industrial Palette
                    orange: "#FF6B00",
                    blue: "#0047AB",
                    steel: "#1e293b",
                    dark: "#0f172a",
                    purple: "#800080" ,
                    yellow: "#ffff00" ,
                    red: "#ff0000"  ,
                // Expanded Accent Palette
                    white: "#FFFFFF",
                    black: "#000000" ,
                    silver: "#C0C0C0",
                    grey: "#808080",
                    brown: "#8B4513",
                    green: "#00FF00",
                    indigo: "#4B0082",
                    violet: "#EE82EE",
                    maroon: "#800000",
                    pink: "#FFC0CB",
                    skyblue: "#87CEEB",
                },
            },
            fontFamily: {
                mono: ["JetBrains Mono", "monospace"],
            },
        },
    },
};
