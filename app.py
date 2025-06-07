from flask import Flask, request, jsonify, render_template, redirect, url_for, flash, session
from hotel_scraper import get_hotels_by_city, import_csv_data, Hotel, Session
import logging
import traceback
import os
from models import db, User, init_db
from dotenv import load_dotenv
import requests

load_dotenv()
API_KEY = os.getenv('API_KEY')

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)  # For session management
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///semsar_mate.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)
init_db(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def login_required(f):
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('signin'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@app.route('/')
def root():
    return redirect(url_for('home'))

@app.route('/index')
def index():
    return redirect(url_for('signin'))

@app.route('/home')
def home():
    if 'user_id' in session:
        return render_template('index.html')
    return render_template('home.html')

@app.route('/signin', methods=['GET', 'POST'])
def signin():
    if 'user_id' in session:
        return redirect(url_for('home'))
        
    if request.method == 'POST':
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not all([email, password]):
            return jsonify({'error': 'Email and password are required'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['user_name'] = user.name
            return jsonify({'success': True, 'message': 'Login successful'})
        else:
            return jsonify({'error': 'Invalid email or password'}), 401
    
    return render_template('signin.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        
        # Validate input
        if not all([name, email, password]):
            return jsonify({'error': 'All fields are required'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new user
        user = User(name=name, email=email)
        user.set_password(password)
        
        try:
            db.session.add(user)
            db.session.commit()
            return jsonify({'success': True, 'message': 'Registration successful'})
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error during signup: {str(e)}")
            return jsonify({'error': 'Registration failed. Please try again.'}), 500
    
    return render_template('signup.html')

@app.route('/signout')
def signout():
    session.clear()
    return redirect(url_for('home'))

@app.route('/search', methods=['POST'])
def search():
    try:
        city = request.form.get('city', '').strip()
        if not city:
            return jsonify({'error': 'Please enter a city name'})
        
        logger.info(f"Searching for hotels in {city}")
        
        # Import CSV data if searching for Moroccan cities
        if city.lower() in ['casablanca', 'rabat', 'agadir', 'marrakech', 'tangier', 'fes', 'essaouira']:
            logger.info("Importing CSV data for Moroccan city")
            import_csv_data()
        
        # Get hotels from database
        hotels = get_hotels_by_city(city)
        logger.info(f"Found {len(hotels)} hotels for {city}")
        
        if not hotels:
            # If no hotels found, try to get sample data
            session = Session()
            try:
                sample_hotels = session.query(Hotel).filter(Hotel.city.ilike(f"%{city}%")).all()
                if sample_hotels:
                    hotels = [{
                        'name': hotel.name,
                        'price': hotel.price,
                        'rating': hotel.rating,
                        'address': hotel.address,
                        'description': hotel.description
                    } for hotel in sample_hotels]
                    logger.info(f"Found {len(hotels)} sample hotels")
            finally:
                session.close()
        
        if not hotels:
            return jsonify({'error': f'No hotels found for {city}'})
        
        return jsonify({'hotels': hotels})
    except Exception as e:
        logger.error(f"Error searching for hotels: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'An error occurred while searching for hotels. Please try again.'})

@app.route('/get-user-info')
def get_user_info():
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        if user:
            return jsonify({
                'name': user.name,
                'email': user.email
            })
    return jsonify({'error': 'Not logged in'}), 401

@app.route('/assistant', methods=['GET', 'POST'])
def assistant():
    if request.method == 'POST':
        try:
            data = request.get_json()
            if not data or 'message' not in data:
                return jsonify({'error': 'No message provided'}), 400

            # Get the message from the request
            message = data['message']

            # Make API call to OpenRouter
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {API_KEY}',
                'HTTP-Referer': request.host_url,
                'X-Title': 'Semsar Mate'
            }

            payload = {
                'model': 'anthropic/claude-3-haiku:beta',
                'max_tokens': 300,
                'messages': [
                    {
                        'role': 'system',
                        'content': 'You are a helpful travel assistant for Semsar Mate, a hotel booking platform in Morocco. Keep responses concise and focused on hotel recommendations and travel advice.'
                    },
                    {
                        'role': 'user',
                        'content': message
                    }
                ]
            }

            response = requests.post('https://openrouter.ai/api/v1/chat/completions', 
                                  headers=headers, 
                                  json=payload)
            
            if response.ok:
                data = response.json()
                if data.get('choices') and data['choices'][0].get('message'):
                    return jsonify({'response': data['choices'][0]['message']['content']})
                else:
                    return jsonify({'error': 'Invalid response format from API'}), 500
            else:
                return jsonify({'error': 'Failed to get response from AI service'}), 500

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return render_template('assistant.html')

if __name__ == '__main__':
    try:
        app.run(debug=True)
    except Exception as e:
        logger.error(f"Error starting the application: {str(e)}")
        logger.error(traceback.format_exc()) 