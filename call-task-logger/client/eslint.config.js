export default [
    {
        ignores: ["node_modules/", "dist/"],
    },
    {
        files: ["src/**/*.{js,jsx}"],
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                }
            }
        },
        rules: {
            "semi": "error",
            "prefer-const": "error"
        }
    }
];
