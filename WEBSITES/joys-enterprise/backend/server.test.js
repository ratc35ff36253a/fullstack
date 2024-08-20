// Set NODE_ENV to 'test' to prevent unwanted behaviors during testing (e.g., rate limiting)
process.env.NODE_ENV = 'test';

const request = require('supertest');
const { app } = require('./server');                      // Import app 
const mongoose = require('mongoose');                    // Import Mongoose

let server;
const PORT = 3001;

// Start the server before each test and assign it to a variable
beforeAll(async () => {
	await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test', {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});
	console.log('Test server running at http://localhost:3001');
});

// Close the server 
afterAll(async () => {
	server.close(() => {
		console.log('Test server closed');
	});
	await mongoose.connection.close(() => {
		console.log('MongoDB connection closed');
	});
});

// Test suite for POST /api/submit route
describe('POST /api/submit', () => {
	// Valid form data should return a 200 status and a success message
	test('should receive valid form data and respond with a success message', async () => {
		const response = await request(app)
		.post('/api/submit')
		.send({ name: 'John Doe', email: 'john@example.com' });

		// Expect a 200 OK response
		expect(response.statusCode).toBe(200);
		// Expect the message in the response to be the success message
		expect(response.body.message).toBe('Form submission received!');
	}, 20000);

	// Test case for invalid email format
	test('should return 400 for invalid email format', async () => {
		const response = await request(app)
		.post('/api/submit')
		.send({ name: 'John Doe', email: 'invalid-email' });

		// Expect a 400 Bad request response due to validation error
		expect(response.statusCode).toBe(400);
		// Expect an error message about invalid email format
		expect(response.body.errors[0].msg).toBe('Invalid email address');
	}, 20000);

	// Test case for missing name field
	test('should return 400 when name is too short', async () => {
		const response = await request(app)
		.post('/api/submit')
		.send({ name: 'J', email: 'john@example.com' });

		// Expect a 400 Bad Request response due to validation error
		expect(response.statusCode).toBe(400);
		// Expect an error message about name being too short
		expect(response.body.errors[0].msg).toBe('Name must be at least 2 characters!');
	}, 20000);
});
