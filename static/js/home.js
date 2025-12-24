document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling functionality
    const scrollIndicators = document.querySelectorAll('.scroll-indicator');

    scrollIndicators.forEach(indicator => {
        indicator.addEventListener('click', function() {
            const nextSection = this.parentElement.nextElementSibling;
            if (nextSection) {
                nextSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Handle booking form submission
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(bookingForm);
            const bookingDetails = {
                hotel_name: formData.get('hotel_name'),
                check_in: formData.get('check_in'),
                check_out: formData.get('check_out'),
                room_type: formData.get('room_type'),
                total_price: formData.get('total_price'),
                user_email: formData.get('user_email')
            };

            try {
                const response = await fetch('/send-booking-confirmation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(bookingDetails)
                });

                const data = await response.json();

                if (data.success) {
                    showNotification('Booking confirmed! Check your email for details.', 'success');
                    // Clear form
                    bookingForm.reset();
                } else {
                    showNotification(data.error || 'Failed to send booking confirmation', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('An error occurred. Please try again.', 'error');
            }
        });
    }
});

// Function to show notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
} 