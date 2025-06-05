// Function to send welcome email after successful signup
async function sendWelcomeEmail() {
    try {
        const response = await fetch('/send-welcome-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('Welcome email sent successfully');
        } else {
            console.error('Failed to send welcome email:', data.error);
        }
    } catch (error) {
        console.error('Error sending welcome email:', error);
    }
}

// Function to send booking confirmation email
async function sendBookingConfirmation(bookingDetails) {
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
            // Show success message to user
            showNotification('Booking confirmed! Check your email for details.', 'success');
            return data.booking_reference;
        } else {
            showNotification('Failed to send booking confirmation', 'error');
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Error sending booking confirmation:', error);
        showNotification('Error sending booking confirmation', 'error');
        throw error;
    }
}

// Helper function to show notifications
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

// Example usage in your signup form
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch('/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Send welcome email after successful signup
            await sendWelcomeEmail();
            window.location.href = '/index';
        } else {
            showNotification(result.error || 'Signup failed', 'error');
        }
    } catch (error) {
        console.error('Error during signup:', error);
        showNotification('An error occurred during signup', 'error');
    }
});

// Example usage in your booking form
document.getElementById('bookingForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const bookingDetails = {
        hotel_name: formData.get('hotel_name'),
        check_in: formData.get('check_in'),
        check_out: formData.get('check_out'),
        room_type: formData.get('room_type'),
        total_price: formData.get('total_price')
    };
    
    try {
        const bookingReference = await sendBookingConfirmation(bookingDetails);
        
        // Update UI with booking reference
        const bookingRefElement = document.getElementById('bookingReference');
        if (bookingRefElement) {
            bookingRefElement.textContent = `Booking Reference: ${bookingReference}`;
        }
        
        // Redirect to booking confirmation page
        window.location.href = `/booking-confirmation?ref=${bookingReference}`;
    } catch (error) {
        console.error('Error during booking:', error);
    }
}); 