from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from models import db, BlogPost, CityGuide, Event, Restaurant, Transportation, User
from datetime import datetime
from functools import wraps
from flask import session

cms = Blueprint('cms', __name__)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('signin'))
        user = User.query.get(session['user_id'])
        if not user or not user.is_admin:
            flash('You do not have permission to access this page.')
            return redirect(url_for('home'))
        return f(*args, **kwargs)
    return decorated_function

# Blog Routes
@cms.route('/blog')
def blog_list():
    posts = BlogPost.query.order_by(BlogPost.created_at.desc()).all()
    return render_template('cms/blog_list.html', posts=posts)

@cms.route('/blog/<int:post_id>')
def blog_post(post_id):
    post = BlogPost.query.get_or_404(post_id)
    return render_template('cms/blog_post.html', post=post)

@cms.route('/blog/new', methods=['GET', 'POST'])
@admin_required
def new_blog_post():
    if request.method == 'POST':
        post = BlogPost(
            title=request.form['title'],
            content=request.form['content'],
            author_id=session['user_id'],
            category=request.form['category'],
            image_url=request.form.get('image_url')
        )
        db.session.add(post)
        db.session.commit()
        return redirect(url_for('cms.blog_post', post_id=post.id))
    return render_template('cms/blog_form.html')

# City Guide Routes
@cms.route('/city-guides')
def city_guides():
    guides = CityGuide.query.all()
    return render_template('cms/city_guides.html', guides=guides)

@cms.route('/city-guide/<int:guide_id>')
def city_guide(guide_id):
    guide = CityGuide.query.get_or_404(guide_id)
    return render_template('cms/city_guide.html', guide=guide)

@cms.route('/city-guide/new', methods=['GET', 'POST'])
@admin_required
def new_city_guide():
    if request.method == 'POST':
        guide = CityGuide(
            city_name=request.form['city_name'],
            description=request.form['description'],
            attractions=request.form['attractions'],
            best_time_to_visit=request.form['best_time_to_visit'],
            image_url=request.form.get('image_url')
        )
        db.session.add(guide)
        db.session.commit()
        return redirect(url_for('cms.city_guide', guide_id=guide.id))
    return render_template('cms/city_guide_form.html')

# Event Routes
@cms.route('/events')
def events():
    events = Event.query.filter(Event.start_date >= datetime.now()).order_by(Event.start_date).all()
    return render_template('cms/events.html', events=events)

@cms.route('/event/<int:event_id>')
def event(event_id):
    event = Event.query.get_or_404(event_id)
    return render_template('cms/event.html', event=event)

@cms.route('/event/new', methods=['GET', 'POST'])
@admin_required
def new_event():
    if request.method == 'POST':
        event = Event(
            title=request.form['title'],
            description=request.form['description'],
            city=request.form['city'],
            venue=request.form['venue'],
            start_date=datetime.strptime(request.form['start_date'], '%Y-%m-%dT%H:%M'),
            end_date=datetime.strptime(request.form['end_date'], '%Y-%m-%dT%H:%M'),
            image_url=request.form.get('image_url')
        )
        db.session.add(event)
        db.session.commit()
        return redirect(url_for('cms.event', event_id=event.id))
    return render_template('cms/event_form.html')

# Restaurant Routes
@cms.route('/restaurants')
def restaurants():
    city = request.args.get('city')
    query = Restaurant.query
    if city:
        query = query.filter_by(city=city)
    restaurants = query.all()
    return render_template('cms/restaurants.html', restaurants=restaurants)

@cms.route('/restaurant/<int:restaurant_id>')
def restaurant(restaurant_id):
    restaurant = Restaurant.query.get_or_404(restaurant_id)
    return render_template('cms/restaurant.html', restaurant=restaurant)

@cms.route('/restaurant/new', methods=['GET', 'POST'])
@admin_required
def new_restaurant():
    if request.method == 'POST':
        restaurant = Restaurant(
            name=request.form['name'],
            description=request.form['description'],
            city=request.form['city'],
            address=request.form['address'],
            cuisine_type=request.form['cuisine_type'],
            price_range=request.form['price_range'],
            rating=float(request.form['rating']),
            image_url=request.form.get('image_url')
        )
        db.session.add(restaurant)
        db.session.commit()
        return redirect(url_for('cms.restaurant', restaurant_id=restaurant.id))
    return render_template('cms/restaurant_form.html')

# Transportation Routes
@cms.route('/transportation')
def transportation():
    city = request.args.get('city')
    query = Transportation.query
    if city:
        query = query.filter_by(city=city)
    transport_options = query.all()
    return render_template('cms/transportation.html', transport_options=transport_options)

@cms.route('/transportation/<int:transport_id>')
def transport_info(transport_id):
    transport = Transportation.query.get_or_404(transport_id)
    return render_template('cms/transport_info.html', transport=transport)

@cms.route('/transportation/new', methods=['GET', 'POST'])
@admin_required
def new_transportation():
    if request.method == 'POST':
        transport = Transportation(
            city=request.form['city'],
            transport_type=request.form['transport_type'],
            description=request.form['description'],
            routes=request.form['routes'],
            schedule=request.form['schedule'],
            price_info=request.form['price_info']
        )
        db.session.add(transport)
        db.session.commit()
        return redirect(url_for('cms.transport_info', transport_id=transport.id))
    return render_template('cms/transportation_form.html') 