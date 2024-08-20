document.querySelector('button').addEventListener('click', () => {
	alert('Welcome to Joy\'s Enterprise!');
});

// Handle form submission with AJAX
const form = document.querySelector('form');
form.addEventListener('submit', function(e) {
	e.preventDefault();

	const formData = new FormData(this);

	fetch('/api/submit', {
		method: 'POST',
		body: formData
	})
	.then(response => response.json())
	.then(data => {
		alert('Form submitted successfully!');
	})
	.catch(error => console.error('Error:', error));
});
