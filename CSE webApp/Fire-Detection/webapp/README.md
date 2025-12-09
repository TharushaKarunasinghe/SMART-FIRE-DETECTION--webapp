# 🔥 Smart Fire Detection System - Web Application

A modern, real-time web dashboard for monitoring fire detection sensors with dual data source support (Firebase Realtime Database + ThingSpeak IoT Platform).

## 🌟 Features

- **Real-time Monitoring**: Live sensor data updates from ESP8266 device
- **Dual Data Sources**:
  - Firebase Realtime Database (real-time updates)
  - ThingSpeak IoT Platform (batch data with historical records)
- **Visual Alerts**: 5-level warning system with LED indicators
- **Historical Charts**: Interactive Chart.js visualizations of last 20 readings
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Dark themed interface with smooth animations

## 📊 Data Structure

### Firebase Paths

```
/fireDetection/
  ├── current/
  │   ├── temperature (float)
  │   ├── humidity (float)
  │   ├── smoke (float)
  │   ├── gas (float)
  │   ├── warningLevel (int: 0-4)
  │   ├── warningLabel (string)
  │   ├── timestamp (int)
  │   └── leds/
  │       ├── allClear (boolean)
  │       ├── watch (boolean)
  │       ├── caution (boolean)
  │       ├── warning (boolean)
  │       └── emergency (boolean)
  └── history/
      └── [timestamp]/
          ├── temperature
          ├── humidity
          ├── smoke
          ├── gas
          └── warningLevel
```

### ThingSpeak Fields

- **Field 1**: Temperature (°C)
- **Field 2**: Humidity (%)
- **Field 3**: Smoke Level (units)
- **Field 4**: Gas Level (PPM)
- **Field 5**: Warning Level (0-4)

## 🚀 Quick Start

### Prerequisites

- Modern web browser (Chrome, Firefox, Edge, Safari)
- Python 3.x (for local development server) or any HTTP server

### Installation

1. **Navigate to webapp directory**:

   ```powershell
   cd "d:\CSE webApp\Fire-Detection\webapp"
   ```

2. **Start local server**:

   ```powershell
   python -m http.server 8000
   ```

3. **Open in browser**:
   ```
   http://localhost:8000
   ```

## 📱 Configuration

All API keys and credentials are in `config.js`:

```javascript
// Firebase Configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  // ... other config
};

// ThingSpeak Configuration
const thingspeakConfig = {
  channelId: "3116566",
  readApiKey: "6TL6IV8I62QZ509P",
  writeApiKey: "SKGNAYL7O2WJ0HI0",
};
```

## 🎨 Warning Levels

| Level | Label     | Icon | LED Color    | Description            |
| ----- | --------- | ---- | ------------ | ---------------------- |
| 0     | All Clear | 🟢   | Green        | No danger detected     |
| 1     | Watch     | 🟡   | Yellow       | Minor changes detected |
| 2     | Caution   | 🟠   | Orange       | Elevated readings      |
| 3     | Warning   | 🔴   | Red          | Fire risk detected     |
| 4     | EMERGENCY | 🚨   | Flashing Red | Critical danger!       |

## 🔄 Data Source Modes

1. **Firebase (Real-time)**: Uses Firebase Realtime Database for instant updates
2. **ThingSpeak (Batch)**: Fetches data from ThingSpeak every 20 seconds
3. **Both (Combined)**: Uses both sources simultaneously

## 📊 Dashboard Components

### 1. Connection Status

- Real-time Firebase connection indicator
- ThingSpeak API status indicator

### 2. Alert Banner

- Large warning display with current threat level
- Dynamic colors and animations based on warning level
- Last update timestamp

### 3. LED Indicators

- Visual representation of 5 warning levels
- Active LED highlights with glow effects
- Emergency level includes flashing animation

### 4. Sensor Cards

- Temperature (°C)
- Humidity (%)
- Smoke Level (units)
- Gas Level (PPM)
- Color-coded status badges (Normal/Elevated/High/Critical)

### 5. Historical Chart

- Multi-line chart showing last 20 readings
- Dual Y-axis for different sensor ranges
- Interactive tooltips with exact values

## 🛠️ Technical Details

### Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with animations
- **JavaScript (ES6+)**: Modular code with imports
- **Firebase SDK 10.7.1**: Realtime database integration
- **Chart.js**: Data visualization
- **Google Fonts**: Inter font family

### File Structure

```
webapp/
├── index.html          # Main HTML structure
├── styles.css          # Styling and animations
├── app.js             # Main application logic
├── config.js          # API keys and configuration
└── README.md          # This file
```

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🔒 Security Notes

1. **Firebase Rules**: Update security rules before deployment
2. **API Keys**: Keep ThingSpeak API keys secure
3. **HTTPS**: Use HTTPS in production
4. **CORS**: Configure CORS for ThingSpeak if needed

## 🐛 Troubleshooting

### Firebase not connecting

- Check Firebase configuration in `config.js`
- Verify database URL matches your Firebase project
- Check Firebase security rules

### ThingSpeak data not loading

- Verify channel ID and API keys
- Check ThingSpeak rate limits (15 sec between updates)
- Ensure channel is accessible

### Chart not displaying

- Check browser console for errors
- Verify Chart.js CDN is accessible
- Ensure historical data is being fetched

## 📝 Arduino Integration

The webapp expects data from ESP8266 running `fire_detection_esp8266_complete.ino`:

**Data Flow**:

```
ESP8266 → Firebase → Web App (real-time)
ESP8266 → ThingSpeak → Web App (polling)
```

**Update Intervals**:

- Firebase: Real-time (instant)
- ThingSpeak: Every 15 seconds (from Arduino)
- Webapp polling: Every 20 seconds (for ThingSpeak)

## 📈 Future Enhancements

- [ ] User authentication
- [ ] Historical data export (CSV/JSON)
- [ ] Email/SMS notifications
- [ ] Customizable alert thresholds
- [ ] Multiple device support
- [ ] Advanced analytics dashboard

## 👥 Credits

**COE3012 Group Project 2025**

- Fire Detection System using Machine Learning
- Real-time IoT monitoring with dual cloud platforms

## 📄 License

This project is part of an academic group project.

## 🆘 Support

For issues or questions:

1. Check Arduino serial monitor for device status
2. Check browser console for JavaScript errors
3. Verify Firebase and ThingSpeak credentials
4. Ensure network connectivity

---

**Last Updated**: October 15, 2025  
**Version**: 1.0.0
