from flask import Flask, request, jsonify, render_template
from hotel_scraper import get_hotels_by_city, import_csv_data, Hotel, Session
import logging
import traceback

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/')
def index():
    return render_template('index.html')

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