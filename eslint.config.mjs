import nextPlugin from "@next/eslint-plugin-next";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import reactHooksPlugin from "eslint-plugin-react-hooks";

const eslintConfig = [
    {
        files: ["**/*.ts", "**/*.tsx"],
        plugins: {
            "@next/next": nextPlugin,
            "@typescript-eslint": typescriptPlugin,
            "react-hooks": reactHooksPlugin,
        },
        rules: {
            ...nextPlugin.configs.recommended.rules,
            ...nextPlugin.configs["core-web-vitals"].rules,
            ...typescriptPlugin.configs.recommended.rules,
            ...reactHooksPlugin.configs.recommended.rules,
            "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
            "@typescript-eslint/no-explicit-any": "warn",
        },
        languageOptions: {
            parser: typescriptParser,
        },
    },
    {
        ignores: [
            "node_modules/**",
            ".next/**",
            "drizzle/**",
            "scripts/**/*.mjs",
        ],
    },
];

export default eslintConfig;
