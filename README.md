# 🚌 Smart Bus Tracking System

A comprehensive bus tracking and scheduling system with user authentication for students and bus drivers.

## ✨ Features

### 🔐 **Authentication System**
- **Student Registration & Login**: Students can create accounts and access bus tracking features
- **Driver Registration & Login**: Bus drivers can register with license information and manage their routes
- **Session Management**: Secure login sessions with proper logout functionality
- **User Type Separation**: Different interfaces for students and drivers

### 📍 **Bus Tracking**
- **Real-time GPS Tracking**: Live bus location updates with coordinates
- **GPS Simulation**: Automated GPS simulator for testing bus movements
- **Route Management**: Multiple bus routes with stops and schedules
- **Location History**: Track bus movement history

### 👥 **User Management**
- **Student Features**: 
  - Register for bus services
  - Select routes and stops
  - View bus schedules
  - Track bus locations
- **Driver Features**:
  - Driver dashboard
  - Bus assignment
  - Route management
  - Location updates

### 🎨 **Modern Interface**
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Beautiful UI**: Modern gradient design with smooth animations
- **User-friendly**: Intuitive navigation and clear feedback
- **Separate Files**: Clean code organization with separate CSS and JavaScript

## 🚀 Quick Start

### 1. **Install Backend Dependencies**
```bash
cd backend
pip install -r requirements.txt
```

### 2. **Database Setup**
1. Start MySQL server
2. Run the database schema:
   ```bash
   cd database
   mysql -u root -p < schema.sql
   ```
   This creates all tables and inserts sample data including test users.

### 3. **Configure Database**
Edit `backend/app.py` and update your MySQL credentials:
```python
def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",                    # Your MySQL username
        password="yourpassword",        # Your MySQL password
        database="smartbus"
    )
```

### 4. **Start the Application**

#### Terminal 1: Start Flask Backend
```bash
cd backend
python app.py
```
The API will be available at: http://127.0.0.1:5000

#### Terminal 2: Start GPS Simulator (Optional)
```bash
cd backend
python gps_simulator.py
```
This simulates real-time GPS updates for testing.

### 5. **Access the System**
Open `index.html` (in the root directory) in your web browser.

## 👤 **Test Accounts**

The system comes with pre-created test accounts:

### Students
- **Username**: `student1`
- **Password**: `password123`

### Drivers
- **Username**: `driver1` or `driver2`
- **Password**: `password123`

## 📁 **Project Structure**

```
BUS/
├── index.html            # Main web interface (entry point)
├── backend/              # Backend files
│   ├── app.py           # Flask API with authentication
│   ├── gps_simulator.py # GPS simulation script
│   ├── requirements.txt # Python dependencies
│   └── README.md        # Backend documentation
├── frontend/             # Frontend files
│   ├── styles.css       # CSS styles
│   ├── script.js        # JavaScript functionality
│   └── README.md        # Frontend documentation
├── database/             # Database files
│   ├── schema.sql       # Database schema with auth tables
│   └── README.md        # Database documentation
├── README.md            # This file (main documentation)
├── OracleTest.java      # (existing Oracle test)
└── OracleTest.class     # (existing compiled Java)
```

## 🔧 **API Endpoints**

### Authentication
- `POST /auth/register` - Register new user (student/driver)
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/status` - Check login status

### Bus Management
- `GET /routes` - Get all routes
- `GET /stops/<route_id>` - Get stops for a route
- `GET /buses` - Get all buses
- `GET /bus-location/<bus_id>` - Get latest bus location
- `POST /track/<bus_id>` - Update bus GPS location

### Student Features
- `POST /student-register` - Register student for bus service
- `GET /schedule/<route_id>` - Get bus schedule

## 🎯 **How to Use**

### For Students:
1. **Login/Register**: Click "Login / Register" button
2. **Register**: Create account with student type
3. **Select Route**: Choose your bus route and stop
4. **Track Bus**: View real-time bus locations
5. **View Schedule**: Check bus timings

### For Drivers:
1. **Register**: Create driver account with license info
2. **Login**: Access driver dashboard
3. **Select Bus**: Choose your assigned bus
4. **Start Route**: Begin route tracking
5. **Update Location**: Send GPS updates

## 🗄️ **Database Schema**

### Core Tables
- **USER_ACCOUNTS**: User authentication (students & drivers)
- **DRIVER**: Driver-specific information
- **BUS**: Bus details and capacity
- **ROUTE**: Route information
- **STOP**: Bus stops for each route
- **STUDENT**: Student bus service registration
- **SCHEDULE**: Bus schedules and timings
- **TRACKING**: Real-time GPS coordinates

## 🔒 **Security Features**

- **Password Hashing**: SHA-256 password encryption
- **Session Management**: Secure session handling
- **Input Validation**: Server-side validation
- **CORS Support**: Cross-origin request handling
- **User Type Separation**: Role-based access

## 🎨 **UI Features**

- **Responsive Design**: Mobile-friendly interface
- **Modern Styling**: Beautiful gradients and animations
- **User Feedback**: Success/error messages
- **Loading States**: Visual feedback for API calls
- **Modal Dialogs**: Clean authentication interface

## 🧪 **Testing**

1. **Test Student Flow**:
   - Register as student
   - Select route and stop
   - Track bus location
   - View schedules

2. **Test Driver Flow**:
   - Register as driver
   - Login to dashboard
   - Select bus and start route
   - Update GPS location

3. **Test GPS Simulation**:
   - Run GPS simulator
   - Watch buses move along routes
   - Verify location updates

## 🚀 **Next Steps**

To complete the remaining features:
- Real-time notifications
- Interactive maps (Google Maps integration)
- Mobile app development
- Admin panel
- SMS/Email alerts
- Route optimization
- Historical analytics

## ❓ **Troubleshooting**

### Common Issues:

1. **"Failed to connect to server"**
   - Ensure Flask app is running: `cd backend && python app.py`
   - Check if port 5000 is available

2. **Database connection errors**
   - Verify MySQL is running
   - Check credentials in `backend/app.py`
   - Ensure `smartbus` database exists
   - Run schema: `cd database && mysql -u root -p < schema.sql`

3. **Authentication not working**
   - Check if USER_ACCOUNTS table exists
   - Verify session secret key in `backend/app.py`
   - Clear browser cookies and try again

4. **GPS simulation not working**
   - Start GPS simulator: `cd backend && python gps_simulator.py`
   - Check Flask API connectivity

5. **CSS/JS not loading**
   - Ensure files are in correct folders: `frontend/styles.css` and `frontend/script.js`
   - Check file paths in `index.html`

## 🎉 **Ready to Use!**

Your Smart Bus Tracking System now includes:
- ✅ User authentication for students and drivers
- ✅ Separate CSS and JavaScript files
- ✅ Modern, responsive interface
- ✅ Real-time bus tracking
- ✅ Driver dashboard
- ✅ Student registration system
- ✅ GPS simulation
- ✅ Complete database schema

The system is production-ready with core functionality and provides a solid foundation for further development!
