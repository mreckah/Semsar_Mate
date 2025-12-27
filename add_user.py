from app import app, db, User

with app.app_context():
    user = User(name="Oussama", email="m.reckahwalt@gmail.com")
    user.set_password("oussama")
    db.session.add(user)
    db.session.commit()
    print("User added successfully")
