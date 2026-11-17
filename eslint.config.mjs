import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  { ignores: [".history/**", ".next/**", "node_modules/**"] },
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // New in eslint-config-next 16. Existing components (QRScanner,
      // LiveTable, AttendanceToggle, theme-switcher) still trigger it; keep as
      // a warning until they are refactored, then remove this override.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default eslintConfig;
