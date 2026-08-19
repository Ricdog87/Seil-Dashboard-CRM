import type { Config } from "tailwindcss";

/**
 * Tailwind liest ausschliesslich die CSS-Variablen aus app/tokens.css.
 * Hier stehen bewusst keine Farbwerte, nur Referenzen - damit bleibt
 * tokens.css die einzige Stelle, an der ein Hex-Wert existiert.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        seil: {
          bg: "var(--seil-bg)",
          surface: "var(--seil-surface)",
          card: "var(--seil-card)",
          "card-alt": "var(--seil-card-alt)",
          line: "var(--seil-line)",
          text: "var(--seil-text)",
          body: "var(--seil-body)",
          muted: "var(--seil-muted)",
          accent: "var(--seil-accent)",
          "accent-dk": "var(--seil-accent-dk)",
          "accent-bg": "var(--seil-accent-bg)",
          success: "var(--seil-success)",
          "success-bg": "var(--seil-success-bg)",
          warning: "var(--seil-warning)",
          "warning-bg": "var(--seil-warning-bg)",
          danger: "var(--seil-danger)",
          "danger-bg": "var(--seil-danger-bg)",
          info: "var(--seil-info)",
          "info-bg": "var(--seil-info-bg)",
        },
      },
      fontFamily: {
        sans: "var(--seil-font-sans)",
      },
      fontSize: {
        kicker: ["var(--seil-text-kicker)", { lineHeight: "1.3" }],
        body: ["var(--seil-text-body)", { lineHeight: "1.45" }],
        title: ["var(--seil-text-title)", { lineHeight: "1.2" }],
        display: ["var(--seil-text-display)", { lineHeight: "1.05" }],
      },
      letterSpacing: {
        kicker: "var(--seil-tracking-kicker)",
      },
      borderRadius: {
        seil: "var(--seil-radius)",
      },
      height: {
        control: "var(--seil-control-h)",
        row: "var(--seil-row-h)",
      },
    },
  },
};

export default config;
