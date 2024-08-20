// jest.config.js
module.exports = {
	testTimeout: 120000,                  // Set the default timeout to 300 seconds
	transform: {
		"^.+\\.js$": "babel-jest"
	},
	testMatch: ["**/__tests__/**/*.js?(x)", "**/?(*.)+(spec|test).js?(x)"],
	testPathIgnorePatterns: ["/node_modules/"],
};
