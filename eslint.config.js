import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

/**
 * Web globals that must not appear outside `src/platform/**`.
 * This app is headed for React Native; anything reaching for these
 * directly is code that cannot make the trip.
 */
const webApiBan = [
  "error",
  { name: "window", message: "Use a platform port from @/core/platform — this must run under React Native." },
  { name: "document", message: "Use a platform port from @/core/platform — this must run under React Native." },
  { name: "localStorage", message: "Use StoragePort from @/core/platform." },
  { name: "sessionStorage", message: "Use StoragePort from @/core/platform." },
  { name: "matchMedia", message: "Use AppearancePort/AccessibilityPort from @/core/platform." },
  { name: "navigator", message: "Use a platform port from @/core/platform." },
];

export default tseslint.config(
  { ignores: ["dist/**", "coverage/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.browser,
    },
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Fires on PaymentCard's reset-on-deselect effect (App.tsx:778). A real
      // anti-pattern, but fixing it changes behaviour, so it waits for the
      // baseline snapshot and is resolved in usePaymentCardViewModel.
      "react-hooks/set-state-in-effect": "warn",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      eqeqeq: ["error", "smart"],
    },
  },
  // The React Native portability fence. Live for all new code; src/App.tsx is
  // exempt only until the monolith is dismantled and its web APIs move behind
  // ports (migration step 7), at which point that entry comes out.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/platform/**", "src/main.tsx", "src/test/**", "src/App.tsx"],
    rules: { "no-restricted-globals": webApiBan },
  },
  // Views must not reach past their ViewModel into state, data, or formatting.
  {
    files: ["src/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/core/stores/*", "@/core/data/*", "@/core/money/*"],
              message: "Views read from a ViewModel. Move this into the screen's use*ViewModel hook.",
            },
          ],
        },
      ],
    },
  },
);
