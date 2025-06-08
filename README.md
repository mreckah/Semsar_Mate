# 🏨 Semsar Mate - AI-Powered Hotel Booking Platform
<h1 align="center">
  <a>
    <img height="120" src="images/logo.png" alt="QuizApp" style="max-width: 300px; border-radius: 10px;">
  </a>
</h1>
<p align="center">
  &nbsp;    
  <a target="_blank" href="https://www.linkedin.com/in/nabbar-oussama/">
    <img height="20" src="https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white" alt="LinkedIn Badge" />
  </a>
  <a href="mailto:m.reckahwalt@gmail.com" target="_blank" onclick="window.open(this.href,'_blank'); return false;">
    <img height="20" src="https://img.shields.io/badge/Gmail-D14836?style=flat&logo=gmail&logoColor=white" alt="Gmail Badge" />
  </a>
  <a target="_blank" href="https://github.com/mreckah">
    <img height="20" src="https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white" alt="GitHub Badge" />
  </a>
</p>

**Semsar Mate** is a modern, AI-powered hotel booking platform designed specifically for Morocco and international destinations. Built with Flask, Bootstrap, and integrated AI assistance, it provides users with an intuitive hotel search and booking experience.

## ✨ Features

### 🔍 **Smart Hotel Search**

- Real-time hotel search across multiple cities
- Popular destinations with one-click search
- Advanced filtering and sorting options
- Responsive design for all devices

### 🤖 **AI Assistant Integration**

- Intelligent travel companion powered by OpenRouter AI
- Multi-language support (English, French, Darija)
- Voice input and text-to-speech capabilities
- Personalized recommendations and travel insights

### 📅 **Booking Management**

- Complete booking workflow with form validation
- My Bookings dashboard with status tracking
- Booking cancellation with reason tracking
- Search and filter bookings functionality

### 🎙️ **Voice Agent**

- Voice-controlled navigation and search
- Hands-free hotel browsing
- Voice commands for scrolling and page navigation
- Cross-page voice agent persistence

### 🔐 **User Authentication**

- Secure user registration and login
- Session management
- User profile management
- Protected routes and data


## 🛠️ Technology Stack

### **Backend**

- **Flask** - Python web framework
- **SQLAlchemy** - Database ORM
- **SQLite** - Database (development)
- **Python 3.8+** - Programming language

### **Frontend**

- **Bootstrap 5** - CSS framework
- **JavaScript (ES6+)** - Client-side functionality
- **Font Awesome** - Icons
- **Responsive Design** - Mobile-first approach

### **AI Integration**

- **OpenRouter API** - AI assistant functionality
- **Web Speech API** - Voice recognition and synthesis
- **Natural Language Processing** - Command interpretation

### **Additional Libraries**

- **Flask-Session** - Session management
- **Requests** - HTTP client
- **JSON** - Data serialization

## 📋 Prerequisites

Before running this project, make sure you have:

- **Python 3.8+** installed
- **pip** package manager
- **OpenRouter API key** (for AI assistant)
- **Modern web browser** with JavaScript enabled

## ⚙️ Installation & Setup

### **1. Clone the Repository**

```bash
git clone https://github.com/mreckah/Semsar_Mate.git
cd Semsar_Mate
```

### **2. Create Virtual Environment**

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### **3. Install Dependencies**

```bash
pip install -r requirements.txt
```

### **4. Environment Configuration**

Create a `.env` file in the root directory:

```env
# Copy from .env.example and fill in your values
API_KEY=your_openrouter_api_key_here
SECRET_KEY=your_secret_key_here
DATABASE_URL=sqlite:///semsar_mate.db
```

### **5. Initialize Database**

```bash
python -c "from app import app, db; app.app_context().push(); db.create_all()"
```

### **6. Run the Application**

```bash
python app.py
```

The application will be available at `http://localhost:5000`

## 📁 Project Structure

```plaintext
semsar-mate/
├── app.py
├── models.py
├── requirements.txt
├── .env.example
├── .gitignore
├── static/
│   ├── css/
│   ├── js/
│   └── images/
├── templates/
├── instance/
```

## 🚀 Demo

### **Home Page**

- ![image](https://github.com/user-attachments/assets/f9dee588-38cf-4c24-82ff-17a0fad5a23f)
- ![image](https://github.com/user-attachments/assets/28a17038-0fa6-4b0b-a85b-7fad18fc0d9e)
- ![image](https://github.com/user-attachments/assets/0f71c98f-062b-4510-9d4a-f5163342974d)

### **Search Results - Hotel Search**

- ![image](https://github.com/user-attachments/assets/7d8424a6-e6a2-4e84-be98-ec7333edd9b9)

### **AI Assistant**

- ![image](https://github.com/user-attachments/assets/985f1674-e875-4a22-ba23-5f6331b3165e)

### **My Bookings Dashboard**

- ![image](https://github.com/user-attachments/assets/4affaa8a-7ddb-4469-aa00-2438f2e87eb0)

### **Booking Form**

- ![image](https://github.com/user-attachments/assets/9423d4c3-c01e-47e3-9df1-27eba03eebe8)

### **Cancellation Modal**

- ![image](https://github.com/user-attachments/assets/9aa95dcc-b789-4cee-a243-6fc0c5e65370)

### **Voice Agent**

- ![image](https://github.com/user-attachments/assets/5b348d26-dea7-474f-827c-b3a9f2637237)

### **Mobile Responsive Design**

- ![image](https://github.com/user-attachments/assets/5ac0e428-b7b0-4f93-aa49-d86aa7911a8c)


## 📞 Support

Check GitHub Issues or email at **[m.reckahwalt@gmail.com]**

### **Planned Features**

- Payment integration
- Email notifications
- Advanced hotel filters
- User reviews
