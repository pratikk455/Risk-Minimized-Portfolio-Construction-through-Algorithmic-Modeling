import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#F6F7FB",
          100: "#E8EAF4",
          200: "#C9CEE1",
          300: "#9EA4C2",
          400: "#6B709B",
          500: "#3D4165",
          600: "#232744",
          700: "#151833",
          800: "#0D0F23",
          900: "#07081A",
        },
        brand: {
          indigo: "#5B5BF6",
          mint: "#00D4A8",
          peach: "#F76343",
          amber: "#F7B955",
          sky: "#6EB9FF",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-poppins)", "var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      fontSize: {
        mega: ["clamp(4rem, 9vw, 8rem)", { lineHeight: "1", letterSpacing: "-0.04em" }],
        huge: ["clamp(3rem, 6vw, 5.5rem)", { lineHeight: "1.02", letterSpacing: "-0.035em" }],
        display: ["clamp(2.25rem, 4.5vw, 4rem)", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        headline: ["clamp(1.5rem, 2.4vw, 2.25rem)", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
      },
      backgroundImage: {
        "gradient-aurora":
          "radial-gradient(120% 80% at 20% 0%, rgba(91,91,246,0.35) 0%, transparent 55%), radial-gradient(90% 60% at 100% 100%, rgba(0,212,168,0.25) 0%, transparent 55%), radial-gradient(80% 70% at 70% 20%, rgba(247,99,67,0.2) 0%, transparent 60%)",
      },
      boxShadow: {
        glow: "0 0 60px -10px rgba(91,91,246,0.35)",
        card: "0 30px 80px -30px rgba(0,0,0,0.6), 0 10px 30px -15px rgba(91,91,246,0.25)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.6s ease-out forwards",
        shimmer: "shimmer 6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
