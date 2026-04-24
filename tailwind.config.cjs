/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/minigames/oubliette-no9/**/*.{ts,tsx}"],
  theme: {
    extend: {
      animation: {
        fadeIn: "fadeIn 0.5s ease-in forwards",
        slideInFromRight: "slideInFromRight 0.5s ease-out forwards",
        slideLeftAndFade: "slideLeftAndFade 3s ease-in forwards",
        floatUpAndFade: "floatUpAndFade 2.5s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideInFromRight: {
          from: { opacity: "0", transform: "translateX(100px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        slideLeftAndFade: {
          "0%": { opacity: "1", transform: "translateX(0)" },
          "100%": { opacity: "0", transform: "translateX(-200px)" },
        },
        floatUpAndFade: {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(-60px)" },
        },
      },
    },
  },
  plugins: [],
};
