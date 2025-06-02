from flask import Flask, request, jsonify, render_template, redirect, url_for, flash, session
from hotel_scraper import get_hotels_by_city, import_csv_data, Hotel, Session
import logging
import traceback
import os
from models import db, User, init_db

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
    if 'user_id' in session:
        return redirect(url_for('index'))
    return redirect(url_for('signin'))

@app.route('/index')
@login_required
def index():
    return render_template('index.html')

@app.route('/signin', methods=['GET', 'POST'])
def signin():
    if 'user_id' in session:
        return redirect(url_for('index'))
        
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['user_name'] = user.name
            return jsonify({'success': True, 'message': 'Login successful'})
        else:
            return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
    
    return render_template('signin.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirmPassword')
        
        # Validate input
        if not all([name, email, password, confirm_password]):
            return jsonify({'success': False, 'message': 'All fields are required'}), 400
        
        if len(password) < 6:
            return jsonify({'success': False, 'message': 'Password must be at least 6 characters long'}), 400
        
        if password != confirm_password:
            return jsonify({'success': False, 'message': 'Passwords do not match'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({'success': False, 'message': 'Email already registered'}), 400
        
        # Create new user
        user = User(name=name, email=email)
        user.set_password(password)
        
        try:
            db.session.add(user)
            db.session.commit()
            return jsonify({'success': True, 'message': 'Registration successful'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': 'Registration failed'}), 500
    
    return render_template('signup.html')

@app.route('/signout')
def signout():
    session.clear()
    return redirect(url_for('index'))

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
@login_required
def get_user_info():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
        
    user = User.query.get(session['user_id'])
    if user:
        return jsonify({
            'name': user.name,
            'email': user.email
        })
    return jsonify({'error': 'User not found'}), 404

if __name__ == '__main__':
    try:
        # Import CSV data on startup
        logger.info("Initializing database...")
        import_csv_data()
        logger.info("Database initialized successfully")
        app.run(debug=True)
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")
        logger.error(traceback.format_exc()) 