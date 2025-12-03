export default {
    testEnvironment: "jsdom",
    roots: ["<rootDir>/tests"],
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    // unit tests
    testMatch: ["**/tests/unit/**/*.test.js"]
};