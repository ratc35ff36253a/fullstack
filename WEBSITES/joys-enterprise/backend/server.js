require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const path = require('path');
const { check, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Define a schema model for form submissions
const FormSubmission = mongoose.model('FormSubmission', {
	name: String,
	email: String
});

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Middleware to log response time for each request
app.use((req, res, next) => {
	const start = process.hrtime();
	res.on('finish', () => {
		const elapsed = process.hrtime(start)
		const elapsedTimeInMs = elapsed[0] * 1000 + elapsed[1] / 1e6;
		console.log(`${req.method} ${req.url} - ${elapsedTimeInMs.toFixed(3)} ms`);
	});
});

// Rate Limiting: Conditionally apply rate limiter if not in test environment
if (process.env.NODE_ENV !== 'test') { 
	const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,                // 15 minutes
	max: 100,                               // Limit each IP to 100 requests per WindowMs
	message: 'Too many requests from this IP, please try again later.'
	});
	app.use(limiter);
}

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for the root URL
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API route example
app.get('/api/data', (req, res) => {
	res.json({message: "Hello from the backend!" });
});

// Route to handle forn submission
app.post('/api/submit', [
	check('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters!'),
	check('email').isEmail().withMessage('Invalid email address')
],	(req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	const { name, email } = req.body;

	// Save the form submission to the MongoDB database
	const submission = new FormSubmission({ name, email});
	submission.save()
	.then(() => {
		console.log(`Received form submission: ${name}, ${email}`);
		res.json({ message: 'Form submission received!'});
	})
	.catch(err => {
		console.error(`Error saving submission:`, err);
		res.status(500).json({ message: 'Error saving submission' });
	});
});

// Error Handling Middleware
app.use((err, req, res, next) => {
	if (err.name === 'MongoError'){
		return res.status(500).json({ message: 'Database error occured' });
	}
	console.error(err.stack);
	res.status(500).json({ message: 'Something went wrong!' });
});

// Start the server
const server = app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});

// Close the server and database connections gracefully on shutdown
const shutdown = () => {
	console.log('Shutting down gracefully ...');
	server.close(() => {
		console.log('Server closed');
		mongoose.connection.close(false, () => {
			console.log('MongoDB Connection Closed');
			process.exit(0);
		});
	});
};

// Graceful shutdown on signal interrupts (e.g., CTRL+C)
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Export both the app and the server
module.exports = { app, server }
