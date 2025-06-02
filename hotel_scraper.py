import requests
from bs4 import BeautifulSoup
import sqlalchemy
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import time
import random
import logging
from fake_useragent import UserAgent
import pandas as pd
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database setup
Base = declarative_base()
engine = create_engine('sqlite:///hotels.db')
Session = sessionmaker(bind=engine)

class Hotel(Base):
    __tablename__ = 'hotels'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    city = Column(String)
    price = Column(Float, nullable=True)
    rating = Column(Float, nullable=True)
    address = Column(String, nullable=True)
    description = Column(String, nullable=True)

# Create tables
Base.metadata.create_all(engine)

def scrape_hotels(city):
    """Scrape hotels from TripAdvisor"""
    logger.info(f"Scraping hotels for {city}")
    hotels = []
    
    try:
        ua = UserAgent()
        headers = {
            'User-Agent': ua.random,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
        }
        
        url = f"https://www.tripadvisor.com/Search?q={city}&searchType=hotel"
        time.sleep(random.uniform(2, 4))
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        hotel_elements = soup.find_all('div', class_='result-title')
        
        for element in hotel_elements[:10]:
            try:
                name = element.find('span').text.strip()
                price_element = element.find_next('div', class_='price')
                price = float(price_element.text.strip().replace('$', '').replace(',', '')) if price_element else None
                rating_element = element.find_next('div', class_='rating')
                rating = float(rating_element.text.strip().split('/')[0]) if rating_element else None
                address_element = element.find_next('div', class_='address')
                address = address_element.text.strip() if address_element else None
                desc_element = element.find_next('div', class_='description')
                description = desc_element.text.strip() if desc_element else None
                
                hotels.append({
                    'name': name,
                    'price': price,
                    'rating': rating,
                    'address': address,
                    'description': description
                })
                
                time.sleep(random.uniform(0.5, 1.5))
                
            except Exception as e:
                logger.error(f"Error processing hotel: {str(e)}")
                continue
        
        logger.info(f"Successfully scraped {len(hotels)} hotels for {city}")
        return hotels
        
    except Exception as e:
        logger.error(f"Error scraping hotels: {str(e)}")
        return []

def import_csv_data():
    """Import hotel data from CSV file"""
    try:
        if not os.path.exists('hotels_morocco.csv'):
            logger.error("CSV file not found")
            return False

        df = pd.read_csv('hotels_morocco.csv')
        session = Session()
        hotels_added = 0
        
        try:
            moroccan_cities = ['Casablanca', 'Rabat', 'Agadir', 'Marrakech', 'Tangier', 'Fes', 'Essaouira']
            session.query(Hotel).filter(Hotel.city.in_(moroccan_cities)).delete()
            session.commit()
            
            for _, row in df.iterrows():
                try:
                    hotel = Hotel(
                        name=row['Name'],
                        city=row['City'],
                        price=float(row['Price']),
                        rating=float(row['Rating']),
                        address=row['Address'],
                        description=f"Hotel in {row['City']}, Morocco"
                    )
                    session.add(hotel)
                    hotels_added += 1
                except Exception as e:
                    logger.error(f"Error processing row: {e}")
                    continue
            
            if hotels_added > 0:
                session.commit()
                logger.info(f"Successfully imported {hotels_added} hotels from CSV")
                return True
            return False
                
        except Exception as e:
            session.rollback()
            logger.error(f"Error during CSV import: {e}")
            raise
        finally:
            session.close()
            
    except Exception as e:
        logger.error(f"Error importing CSV data: {e}")
        return False

def get_hotels_by_city(city):
    """Get hotels for a specific city"""
    session = Session()
    try:
        hotels = []
        
        # First try to get from database
        db_hotels = session.query(Hotel).filter(Hotel.city.ilike(f"%{city}%")).all()
        if db_hotels:
            hotels.extend([{
                'name': hotel.name,
                'price': hotel.price,
                'rating': hotel.rating,
                'address': hotel.address,
                'description': hotel.description
            } for hotel in db_hotels])
        
        # If no hotels found or less than 5 hotels, try scraping
        if len(hotels) < 5:
            scraped_hotels = scrape_hotels(city)
            if scraped_hotels:
                for hotel_data in scraped_hotels:
                    existing_hotel = session.query(Hotel).filter_by(
                        name=hotel_data['name'],
                        city=city
                    ).first()
                    
                    if not existing_hotel:
                        hotel = Hotel(
                            name=hotel_data['name'],
                            city=city,
                            price=hotel_data['price'],
                            rating=hotel_data['rating'],
                            address=hotel_data['address'],
                            description=hotel_data['description']
                        )
                        session.add(hotel)
                        hotels.append(hotel_data)
                
                session.commit()
        
        # If still no hotels and it's a Moroccan city, try importing from CSV
        if not hotels and city.lower() in ['casablanca', 'rabat', 'agadir', 'marrakech', 'tangier', 'fes', 'essaouira']:
            import_csv_data()
            csv_hotels = session.query(Hotel).filter(Hotel.city.ilike(f"%{city}%")).all()
            if csv_hotels:
                hotels.extend([{
                    'name': hotel.name,
                    'price': hotel.price,
                    'rating': hotel.rating,
                    'address': hotel.address,
                    'description': hotel.description
                } for hotel in csv_hotels])
        
        return hotels
        
    except Exception as e:
        logger.error(f"Error getting hotels: {str(e)}")
        return []
    finally:
        session.close()

if __name__ == "__main__":
    # Delete existing database file if it exists
    if os.path.exists('hotels.db'):
        os.remove('hotels.db')
        logger.info("Deleted existing database file")
    
    # Import CSV data
    import_csv_data()
    
    # Test all cities
    test_cities = [
        'Casablanca', 'Rabat', 'Agadir', 'Marrakech', 'Tangier', 'Fes', 'Essaouira',
        'Tokyo', 'Paris', 'London', 'New York', 'Dubai', 'Rome', 'Barcelona', 'Amsterdam'
    ]
    
    print("\nPopulating database with hotel data...")
    for city in test_cities:
        print(f"\nProcessing {city}...")
        hotels = get_hotels_by_city(city)
        if hotels:
            print(f"Found {len(hotels)} hotels in {city}:")
            for hotel in hotels:
                print(f"\n- {hotel['name']}")
                print(f"  Price: ${hotel['price']}")
                print(f"  Rating: {hotel['rating']}/10")
                print(f"  Address: {hotel['address']}")
                print(f"  Description: {hotel['description']}")
        else:
            print(f"No hotels found for {city}")
    
    print("\nDatabase population complete!") 