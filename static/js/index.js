// Index Page JavaScript

// User Authentication
function updateUserName() {
    fetch('/get-user-info')
        .then(response => {
            if (!response.ok) throw new Error('Not logged in');
            return response.json();
        })
        .then(data => {
            if (data.name) {
                document.getElementById('userName').textContent = data.name;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            window.location.href = '/signin';
        });
}

// City Navigation
function scrollCities(direction) {
    const container = document.querySelector('.popular-cities-container');
    const scrollAmount = 300;
    const currentScroll = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;
    
    const newScroll = direction === 'left' 
        ? Math.max(0, currentScroll - scrollAmount)
        : Math.min(maxScroll, currentScroll + scrollAmount);
    
    container.scrollTo({
        left: newScroll,
        behavior: 'smooth'
    });
    
    const button = direction === 'left' 
        ? document.querySelector('.scroll-left') 
        : document.querySelector('.scroll-right');
    
    button.style.backgroundColor = '#D4AF37';
    setTimeout(() => button.style.backgroundColor = '#0A2463', 200);
}

function updateScrollButtons() {
    const container = document.querySelector('.popular-cities-container');
    const leftButton = document.querySelector('.scroll-left');
    const rightButton = document.querySelector('.scroll-right');
    
    leftButton.style.display = container.scrollLeft > 0 ? 'flex' : 'none';
    rightButton.style.display = 
        container.scrollLeft < (container.scrollWidth - container.clientWidth) ? 'flex' : 'none';
}

function resetScrollPosition() {
    const container = document.querySelector('.popular-cities-container');
    if (container) {
        container.scrollLeft = 0;
        updateScrollButtons();
    }
}

// Hotel Search
function searchCity(city) {
    document.getElementById('cityInput').value = city;
    document.getElementById('searchForm').dispatchEvent(new Event('submit'));
}

function searchHotels(city) {
    const loading = document.querySelector('.loading');
    const results = document.getElementById('results');
    
    loading.style.display = 'block';
    results.innerHTML = '<h3 class="section-title">Search Results</h3><div class="row" id="hotelResults"></div>';
    
    fetch('/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `city=${encodeURIComponent(city)}`
    })
    .then(response => response.json())
    .then(data => {
        loading.style.display = 'none';
        const hotelResults = document.getElementById('hotelResults');
        
        if (data.error) {
            hotelResults.innerHTML = `<div class="col-12"><div class="alert alert-warning">${data.error}</div></div>`;
            return;
        }
        
        if (data.hotels?.length > 0) {
            hotelResults.innerHTML = data.hotels.map(hotel => `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card hotel-card">
                        <div class="card-body">
                            <h5 class="card-title">${hotel.name}</h5>
                            ${hotel.price ? `<p class="price-tag">${hotel.price}$</p>` : ''}
                            ${hotel.rating ? `<p class="rating">Rating: ${hotel.rating}/10</p>` : ''}
                            ${hotel.address ? `<p class="hotel-address">${hotel.address}</p>` : ''}
                            ${hotel.description ? `<p class="hotel-description">${hotel.description.substring(0, 100)}...</p>` : ''}
                            <button class="view-details-btn" onclick='showHotelDetails(${JSON.stringify(hotel)})'>
                                <i class="fas fa-info-circle"></i>View Details
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            hotelResults.innerHTML = '<div class="col-12"><div class="alert alert-warning">No hotels found for this city.</div></div>';
        }
    })
    .catch(error => {
        loading.style.display = 'none';
        results.innerHTML = '<div class="alert alert-danger">An error occurred while searching for hotels. Please try again.</div>';
        console.error('Error:', error);
    });
}

// Hotel Details
function showHotelDetails(hotel) {
    const modal = new bootstrap.Modal(document.getElementById('hotelDetailsModal'));
    
    document.getElementById('modalHotelName').textContent = hotel.name;
    document.getElementById('modalHotelPrice').textContent = hotel.price ? `${hotel.price}$` : 'Price not available';
    document.getElementById('modalHotelRating').textContent = hotel.rating ? `Rating: ${hotel.rating}/10` : 'No rating available';
    document.getElementById('modalHotelAddress').textContent = hotel.address || 'Address not available';
    document.getElementById('modalHotelDescription').textContent = hotel.description || 'No description available';
    document.getElementById('modalHotelLocation').textContent = hotel.address || 'Location not available';
    
    const amenities = [
        { icon: 'wifi', name: 'Free WiFi' },
        { icon: 'swimming-pool', name: 'Swimming Pool' },
        { icon: 'utensils', name: 'Restaurant' },
        { icon: 'parking', name: 'Free Parking' },
        { icon: 'concierge-bell', name: '24/7 Front Desk' },
        { icon: 'bed', name: 'Room Service' }
    ];
    
    document.getElementById('modalHotelAmenities').innerHTML = amenities.map(amenity => `
        <div class="amenity-item">
            <i class="fas fa-${amenity.icon}"></i>
            <span>${amenity.name}</span>
        </div>
    `).join('');
    
    modal.show();
}

// Booking System
function bookHotel() {
    const hotelName = document.getElementById('modalHotelName').textContent;
    const hotelPrice = document.getElementById('modalHotelPrice').textContent;
    
    document.getElementById('bookingHotelName').textContent = hotelName;
    document.getElementById('bookingBasePrice').textContent = hotelPrice;
    
    const hotelDetailsModal = bootstrap.Modal.getInstance(document.getElementById('hotelDetailsModal'));
    hotelDetailsModal.hide();
    
    const bookingModal = new bootstrap.Modal(document.getElementById('bookingModal'));
    bookingModal.show();
}

// Store bookings in localStorage
function storeBooking(bookingData) {
    let bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    bookings.push(bookingData);
    localStorage.setItem('bookings', JSON.stringify(bookings));
}

// Load bookings from localStorage
function loadBookings() {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const bookingsList = document.getElementById('bookingsList');
    const statusFilter = document.getElementById('bookingStatusFilter').value;
    const searchTerm = document.getElementById('bookingSearch').value.toLowerCase();

    // Filter bookings based on status and search term
    let filteredBookings = bookings;

    if (statusFilter !== 'all') {
        filteredBookings = filteredBookings.filter(booking => getBookingStatus(booking) === statusFilter);
    }

    if (searchTerm) {
        filteredBookings = filteredBookings.filter(booking =>
            booking.hotelName.toLowerCase().includes(searchTerm) ||
            booking.ref.toLowerCase().includes(searchTerm) ||
            booking.roomType.toLowerCase().includes(searchTerm)
        );
    }

    if (filteredBookings.length === 0) {
        bookingsList.innerHTML = `
            <div class="no-bookings">
                <i class="fas fa-calendar-times"></i>
                <h4>No Bookings Found</h4>
                <p>${searchTerm ? `No bookings found matching "${searchTerm}"` : 'You haven\'t made any bookings yet.'}</p>
            </div>
        `;
        return;
    }

    // Sort bookings by check-in date
    filteredBookings.sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn));

    bookingsList.innerHTML = filteredBookings.map(booking => {
        const status = getBookingStatus(booking);
        return `
            <div class="booking-card">
                <div class="booking-header">
                    <span class="booking-ref">Booking #${booking.ref}</span>
                    <span class="booking-status status-${status}">
                        ${status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                </div>
                <div class="booking-details">
                    <div class="booking-info">
                        <span class="booking-info-label">Hotel</span>
                        <span class="booking-info-value">${booking.hotelName}</span>
                    </div>
                    <div class="booking-info">
                        <span class="booking-info-label">Check-in</span>
                        <span class="booking-info-value">${booking.checkIn}</span>
                    </div>
                    <div class="booking-info">
                        <span class="booking-info-label">Check-out</span>
                        <span class="booking-info-value">${booking.checkOut}</span>
                    </div>
                    <div class="booking-info">
                        <span class="booking-info-label">Guests</span>
                        <span class="booking-info-value">${booking.guests}</span>
                    </div>
                    <div class="booking-info">
                        <span class="booking-info-label">Room Type</span>
                        <span class="booking-info-value">${booking.roomType}</span>
                    </div>
                    <div class="booking-info">
                        <span class="booking-info-label">Total Price</span>
                        <span class="booking-info-value">${booking.totalPrice}</span>
                    </div>
                </div>
                <div class="booking-actions">
                    <button class="btn btn-view" onclick="viewBookingDetails('${booking.ref}')" title="View booking details">
                        <i class="fas fa-eye me-2"></i>View Details
                    </button>
                    ${status === 'upcoming' ? `
                        <button class="btn btn-cancel" onclick="cancelBooking('${booking.ref}')" title="Cancel booking">
                            <i class="fas fa-times me-2"></i>Cancel Booking
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function getBookingStatus(booking) {
    const today = new Date();
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);

    if (booking.status === 'cancelled') return 'cancelled';
    if (checkOut < today) return 'past';
    if (checkIn > today) return 'upcoming';
    return 'current';
}

function cancelBooking(bookingRef) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        let bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        bookings = bookings.map(booking => {
            if (booking.ref === bookingRef) {
                return { ...booking, status: 'cancelled' };
            }
            return booking;
        });
        localStorage.setItem('bookings', JSON.stringify(bookings));
        showNotification('Booking cancelled successfully', 'success');
        loadBookings();
    }
}

// My Bookings Functions
function showMyBookings() {
    const modal = new bootstrap.Modal(document.getElementById('myBookingsModal'));
    loadBookings();
    modal.show();
}

function refreshBookings() {
    loadBookings();
    showNotification('Bookings refreshed', 'info');
}

function viewBookingDetails(bookingRef) {
    // Implement booking details view
    console.log('Viewing booking:', bookingRef);
}

// Notifications
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

// Voice Agent Functionality
const voiceAgentBtn = document.getElementById('voiceAgentBtn');
const voiceAgentInput = document.getElementById('voiceAgentInput');
const commandInput = document.getElementById('commandInput');
const sendCommandBtn = document.getElementById('sendCommandBtn');

let isAgentListening = false;
let agentRecognition = null;

function initAgentRecognition() {
    if ('webkitSpeechRecognition' in window) {
        agentRecognition = new webkitSpeechRecognition();
        agentRecognition.continuous = true;
        agentRecognition.interimResults = false;
        agentRecognition.lang = 'en-US';

        agentRecognition.onstart = () => {
            isAgentListening = true;
            voiceAgentBtn.classList.add('active');
            voiceAgentInput.classList.add('active');
        };

        agentRecognition.onend = () => {
            if (isAgentListening) {
                // Restart recognition if it was supposed to be listening
                setTimeout(() => {
                    if (isAgentListening) {
                        agentRecognition.start();
                    }
                }, 100);
            }
        };

        agentRecognition.onresult = (event) => {
            const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
            commandInput.value = command;
            handleAgentCommand(command);
        };

        agentRecognition.onerror = (event) => {
            console.error('Agent recognition error:', event.error);
        };
    }
}

function startAgentListening() {
    if (agentRecognition && !isAgentListening) {
        isAgentListening = true;
        voiceAgentBtn.classList.add('active');
        voiceAgentInput.classList.add('active');
        agentRecognition.start();
        speakResponse('Voice agent activated. How can I help you?');
    }
}

function stopAgentListening() {
    if (agentRecognition && isAgentListening) {
        isAgentListening = false;
        voiceAgentBtn.classList.remove('active');
        voiceAgentInput.classList.remove('active');
        agentRecognition.stop();
        speakResponse('Voice agent deactivated');
        localStorage.removeItem('agentActive');
    }
}

function handleAgentCommand(command) {
    command = command.toLowerCase();

    // Scrolling commands
    if (command.includes('scroll up')) {
        window.scrollBy(0, -300);
        speakResponse('Scrolling up');
    } else if (command.includes('scroll down')) {
        window.scrollBy(0, 300);
        speakResponse('Scrolling down');
    } else if (command.includes('scroll to top')) {
        window.scrollTo(0, 0);
        speakResponse('Scrolling to top');
    } else if (command.includes('scroll to bottom')) {
        window.scrollTo(0, document.body.scrollHeight);
        speakResponse('Scrolling to bottom');
    }
    // Navigation commands
    else if (command.includes('go to assistant')) {
        localStorage.setItem('agentActive', 'true');
        window.location.href = '/assistant';
        speakResponse('Navigating to assistant');
    }
    // Search commands
    else if (command.includes('search for')) {
        const city = command.replace('search for', '').trim();
        if (city) {
            document.getElementById('cityInput').value = city;
            searchHotels(city);
            speakResponse(`Searching for hotels in ${city}`);
        }
    }
    // City search commands
    else if (command.includes('casablanca')) {
        searchCity('Casablanca');
        speakResponse('Searching hotels in Casablanca');
    } else if (command.includes('marrakech')) {
        searchCity('Marrakech');
        speakResponse('Searching hotels in Marrakech');
    } else if (command.includes('rabat')) {
        searchCity('Rabat');
        speakResponse('Searching hotels in Rabat');
    }
    // Help command
    else if (command.includes('help') || command.includes('what can you do')) {
        speakResponse('I can help you scroll, search for hotels, navigate to different pages, and search specific cities. Just tell me what you want to do.');
    }
    // Deactivation command
    else if (command.includes('deactivate') || command.includes('stop listening')) {
        stopAgentListening();
    }
    // Unknown command
    else {
        speakResponse('Sorry, I did not understand that command. Say help to know what I can do.');
    }
}

function speakResponse(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
    }
}

// Event Listeners for the voice agent
voiceAgentBtn.addEventListener('click', () => {
    if (!isAgentListening) {
        startAgentListening();
    } else {
        stopAgentListening();
    }
});

sendCommandBtn.addEventListener('click', () => {
    const command = commandInput.value.toLowerCase();
    if (command) {
        handleAgentCommand(command);
        commandInput.value = '';
    }
});

commandInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const command = commandInput.value.toLowerCase();
        if (command) {
            handleAgentCommand(command);
            commandInput.value = '';
        }
    }
});

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    updateUserName();
    resetScrollPosition();
    searchCity('Casablanca');
    initAgentRecognition();
    if (localStorage.getItem('agentActive') === 'true') {
        startAgentListening();
    }
});

document.getElementById('searchForm').addEventListener('submit', function(e) {
    e.preventDefault();
    searchHotels(document.getElementById('cityInput').value);
});

document.querySelector('.popular-cities-container').addEventListener('scroll', updateScrollButtons);

// Update the booking form submission handler
document.getElementById('bookingForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const bookingData = {
        ref: 'BK' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        hotelName: document.getElementById('bookingHotelName').textContent,
        checkIn: document.getElementById('checkIn').value,
        checkOut: document.getElementById('checkOut').value,
        guests: document.getElementById('guests').value,
        roomType: document.getElementById('roomType').value,
        specialRequests: document.getElementById('specialRequests').value,
        totalPrice: document.getElementById('bookingBasePrice').textContent,
        status: 'upcoming',
        createdAt: new Date().toISOString()
    };

    // Store booking in localStorage
    let bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    bookings.push(bookingData);
    localStorage.setItem('bookings', JSON.stringify(bookings));

    const bookingModal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
    bookingModal.hide();

    showNotification(`Booking confirmed! Your booking reference is: ${bookingData.ref}`, 'success');
    this.reset();
});

// Add filter functionality
document.getElementById('bookingStatusFilter').addEventListener('change', function() {
    const status = this.value;
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');

    if (status === 'all') {
        loadBookings();
        return;
    }

    const filteredBookings = bookings.filter(booking => getBookingStatus(booking) === status);
    const bookingsList = document.getElementById('bookingsList');

    if (filteredBookings.length === 0) {
        bookingsList.innerHTML = `
            <div class="no-bookings">
                <i class="fas fa-calendar-times"></i>
                <h4>No ${status} Bookings</h4>
                <p>You don't have any ${status} bookings.</p>
            </div>
        `;
        return;
    }

    // Update the display with filtered bookings
    loadBookings(); // This will now use the filtered status
});

// Add search functionality
document.getElementById('bookingSearch').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');

    const filteredBookings = bookings.filter(booking =>
        booking.hotelName.toLowerCase().includes(searchTerm) ||
        booking.ref.toLowerCase().includes(searchTerm) ||
        booking.roomType.toLowerCase().includes(searchTerm)
    );

    const bookingsList = document.getElementById('bookingsList');

    if (filteredBookings.length === 0) {
        bookingsList.innerHTML = `
            <div class="no-bookings">
                <i class="fas fa-search"></i>
                <h4>No Matching Bookings</h4>
                <p>No bookings found matching "${searchTerm}"</p>
            </div>
        `;
        return;
    }

    // Update the display with filtered bookings
    loadBookings(); // This will now use the filtered results
});
