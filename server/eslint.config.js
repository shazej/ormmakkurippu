export default [
    {
        ignores: ["node_modules/", "dist/"],
    },
    {
        files: ["src/**/*.js"],
        rules: {
            "semi": "error",
            "prefer-const": "error"
        }
    }
];
