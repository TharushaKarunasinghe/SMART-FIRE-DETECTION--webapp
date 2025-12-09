#include "fire_detection_model.h"
#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>
#include <NTPClient.h>
#include <WiFiUdp.h>

// WiFi Credentials - UPDATE WITH YOUR NETWORK
#define WIFI_SSID "Rumeth"        // Replace with your WiFi name
#define WIFI_PASSWORD "51015202530" // Replace with your WiFi password

// Firebase Configuration
#define FIREBASE_HOST "fire-detection-fcaf9-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_AUTH "AIzaSyCUOxni60Lh-__ZeE7vzeRMo7XvgWzBWUo"

// ThingSpeak Configuration
#define THINGSPEAK_API_KEY "SKGNAYL7O2WJ0HI0"
#define THINGSPEAK_SERVER "api.thingspeak.com"

// Firebase objects
FirebaseData firebaseData;
FirebaseAuth auth;
FirebaseConfig config;

// NTP Client for timestamp
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 19800, 60000); // UTC+5:30 for India

// Create an instance of the DecisionTree classifier
Eloquent::ML::Port::DecisionTree classifier;

// Scaler parameters from training
float temp_mean = 21.608380644952057;
float hum_mean = 58.95664551004219;
float smoke_mean = 84.47882523953255;
float gas_mean = 246.5997711187497;
float temp_std = 6.039009247386651;
float hum_std = 11.772935513775936;
float smoke_std = 572.9422942558082;
float gas_std = 2797.8461006020616;

// LED Pin Definitions for ESP8266
#define LED_ALL_CLEAR D1    // GPIO5 - Green LED - Level 0
#define LED_WATCH D2        // GPIO4 - Yellow LED - Level 1
#define LED_CAUTION D5      // GPIO14 - Orange LED - Level 2
#define LED_WARNING D6      // GPIO12 - Red LED - Level 3
#define LED_EMERGENCY D7    // GPIO13 - Red LED - Level 4

// Global variables
unsigned long lastUploadTime = 0;
const unsigned long uploadInterval = 5000; // Upload every 5 seconds
int readingCount = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  // Initialize LED pins as OUTPUT
  pinMode(LED_ALL_CLEAR, OUTPUT);
  pinMode(LED_WATCH, OUTPUT);
  pinMode(LED_CAUTION, OUTPUT);
  pinMode(LED_WARNING, OUTPUT);
  pinMode(LED_EMERGENCY, OUTPUT);
  
  // Turn off all LEDs initially
  digitalWrite(LED_ALL_CLEAR, LOW);
  digitalWrite(LED_WATCH, LOW);
  digitalWrite(LED_CAUTION, LOW);
  digitalWrite(LED_WARNING, LOW);
  digitalWrite(LED_EMERGENCY, LOW);
  
  Serial.println("\n========================================");
  Serial.println("🔥 SMART FIRE DETECTION SYSTEM");
  Serial.println("========================================");
  
  // Connect to WiFi
  connectWiFi();
  
  // Initialize Firebase
  initFirebase();
  
  // Initialize NTP Client
  timeClient.begin();
  
  Serial.println("System Initialized Successfully!");
  Serial.println("LEDs configured on pins:");
  Serial.println("  D1 (GPIO5)  - Green (All Clear)");
  Serial.println("  D2 (GPIO4)  - Yellow (Watch)");
  Serial.println("  D5 (GPIO14) - Orange (Caution)");
  Serial.println("  D6 (GPIO12) - Red (Warning)");
  Serial.println("  D7 (GPIO13) - Red (Emergency)");
  Serial.println("========================================\n");
  
  // LED startup test sequence
  Serial.println("Running LED test sequence...");
  testLEDs();
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectWiFi();
  }
  
  // Update time
  timeClient.update();
  
  // Simulate sensor readings (replace with real sensors later)
  float temperature = random(15, 70);
  float humidity = random(30, 90);
  float smoke = random(0, 1000);
  float gas = random(0, 5000);
  
  // Normalize features
  float features[4] = {
    (temperature - temp_mean) / temp_std,
    (humidity - hum_mean) / hum_std,
    (smoke - smoke_mean) / smoke_std,
    (gas - gas_mean) / gas_std
  };
  
  // Get prediction
  int prediction = classifier.predict(features);
  const char* warningLabel = classifier.predictLabel(features);
  
  // Display results
  Serial.println("--- Sensor Readings ---");
  Serial.print("Temperature: "); Serial.print(temperature); Serial.println(" °C");
  Serial.print("Humidity: "); Serial.print(humidity); Serial.println(" %");
  Serial.print("Smoke: "); Serial.print(smoke); Serial.println(" units");
  Serial.print("Gas: "); Serial.print(gas); Serial.println(" PPM");
  
  Serial.println("\n--- Prediction ---");
  Serial.print("⚠️  WARNING LEVEL: "); Serial.print(prediction);
  Serial.print(" ("); Serial.print(warningLabel); Serial.println(")");
  
  // Control LEDs
  updateLEDs(prediction);
  
  // Upload to Firebase and ThingSpeak
  if (millis() - lastUploadTime >= uploadInterval) {
    uploadToFirebase(temperature, humidity, smoke, gas, prediction, warningLabel);
    uploadToThingSpeak(temperature, humidity, smoke, gas);
    lastUploadTime = millis();
  }
  
  Serial.println("========================================\n");
  delay(3000);
}

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi Connection Failed!");
    Serial.println("Please check your credentials and try again.");
  }
}

void initFirebase() {
  Serial.println("Initializing Firebase...");
  
  // Configure Firebase
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  
  // Initialize Firebase
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  // Set timeout
  firebaseData.setBSSLBufferSize(1024, 1024);
  firebaseData.setResponseSize(1024);
  
  Serial.println("✅ Firebase Initialized!");
}

void uploadToFirebase(float temp, float hum, float smoke, float gas, int level, const char* label) {
  Serial.println("\n📤 Uploading to Firebase...");
  
  readingCount++;
  
  // Get current timestamp
  String timestamp = timeClient.getFormattedTime();
  unsigned long epochTime = timeClient.getEpochTime();
  
  // Create JSON path with timestamp
  String path = "/readings/" + String(epochTime);
  
  // Upload sensor data
  if (Firebase.setFloat(firebaseData, path + "/temperature", temp)) {
    Serial.println("✅ Temperature uploaded");
  } else {
    Serial.println("❌ Temperature upload failed: " + firebaseData.errorReason());
  }
  
  if (Firebase.setFloat(firebaseData, path + "/humidity", hum)) {
    Serial.println("✅ Humidity uploaded");
  } else {
    Serial.println("❌ Humidity upload failed: " + firebaseData.errorReason());
  }
  
  if (Firebase.setFloat(firebaseData, path + "/smoke", smoke)) {
    Serial.println("✅ Smoke uploaded");
  } else {
    Serial.println("❌ Smoke upload failed: " + firebaseData.errorReason());
  }
  
  if (Firebase.setFloat(firebaseData, path + "/gas", gas)) {
    Serial.println("✅ Gas uploaded");
  } else {
    Serial.println("❌ Gas upload failed: " + firebaseData.errorReason());
  }
  
  if (Firebase.setInt(firebaseData, path + "/warningLevel", level)) {
    Serial.println("✅ Warning Level uploaded");
  } else {
    Serial.println("❌ Warning Level upload failed: " + firebaseData.errorReason());
  }
  
  if (Firebase.setString(firebaseData, path + "/warningLabel", label)) {
    Serial.println("✅ Warning Label uploaded");
  } else {
    Serial.println("❌ Warning Label upload failed: " + firebaseData.errorReason());
  }
  
  if (Firebase.setString(firebaseData, path + "/timestamp", timestamp)) {
    Serial.println("✅ Timestamp uploaded");
  } else {
    Serial.println("❌ Timestamp upload failed: " + firebaseData.errorReason());
  }
  
  // Update latest reading
  Firebase.setFloat(firebaseData, "/latest/temperature", temp);
  Firebase.setFloat(firebaseData, "/latest/humidity", hum);
  Firebase.setFloat(firebaseData, "/latest/smoke", smoke);
  Firebase.setFloat(firebaseData, "/latest/gas", gas);
  Firebase.setInt(firebaseData, "/latest/warningLevel", level);
  Firebase.setString(firebaseData, "/latest/warningLabel", label);
  Firebase.setString(firebaseData, "/latest/timestamp", timestamp);
  
  // If emergency level, create alert
  if (level == 4) {
    String alertPath = "/alerts/" + String(epochTime);
    Firebase.setFloat(firebaseData, alertPath + "/temperature", temp);
    Firebase.setFloat(firebaseData, alertPath + "/humidity", hum);
    Firebase.setFloat(firebaseData, alertPath + "/smoke", smoke);
    Firebase.setFloat(firebaseData, alertPath + "/gas", gas);
    Firebase.setString(firebaseData, alertPath + "/timestamp", timestamp);
    Firebase.setString(firebaseData, alertPath + "/message", "EMERGENCY: Fire detected!");
    Serial.println("🚨 EMERGENCY ALERT SENT TO FIREBASE!");
  }
  
  Serial.println("Firebase upload complete!");
}

void uploadToThingSpeak(float temp, float hum, float smoke, float gas) {
  WiFiClient client;
  
  if (client.connect(THINGSPEAK_SERVER, 80)) {
    String postStr = "api_key=" + String(THINGSPEAK_API_KEY);
    postStr += "&field1=" + String(temp);
    postStr += "&field2=" + String(hum);
    postStr += "&field3=" + String(smoke);
    postStr += "&field4=" + String(gas);
    postStr += "\r\n\r\n";
    
    client.print("POST /update HTTP/1.1\n");
    client.print("Host: " + String(THINGSPEAK_SERVER) + "\n");
    client.print("Connection: close\n");
    client.print("Content-Type: application/x-www-form-urlencoded\n");
    client.print("Content-Length: " + String(postStr.length()) + "\n\n");
    client.print(postStr);
    
    Serial.println("✅ Data sent to ThingSpeak");
    client.stop();
  } else {
    Serial.println("❌ ThingSpeak connection failed");
  }
}

void updateLEDs(int level) {
  // Turn off all LEDs first
  digitalWrite(LED_ALL_CLEAR, LOW);
  digitalWrite(LED_WATCH, LOW);
  digitalWrite(LED_CAUTION, LOW);
  digitalWrite(LED_WARNING, LOW);
  digitalWrite(LED_EMERGENCY, LOW);
  
  // Turn on LED corresponding to warning level
  switch(level) {
    case 0:  // All Clear - Green
      digitalWrite(LED_ALL_CLEAR, HIGH);
      Serial.println("🟢 LED Status: GREEN - All Clear");
      break;
      
    case 1:  // Watch - Yellow
      digitalWrite(LED_WATCH, HIGH);
      Serial.println("🟡 LED Status: YELLOW - Watch");
      break;
      
    case 2:  // Caution - Orange
      digitalWrite(LED_CAUTION, HIGH);
      Serial.println("🟠 LED Status: ORANGE - Caution");
      break;
      
    case 3:  // Warning - Red
      digitalWrite(LED_WARNING, HIGH);
      Serial.println("🔴 LED Status: RED - Warning");
      break;
      
    case 4:  // Emergency - Flashing Red
      flashEmergencyLED();
      Serial.println("🚨 LED Status: FLASHING RED - EMERGENCY!");
      break;
  }
}

void flashEmergencyLED() {
  // Flash emergency LED rapidly for alert
  for(int i = 0; i < 3; i++) {
    digitalWrite(LED_EMERGENCY, HIGH);
    delay(200);
    digitalWrite(LED_EMERGENCY, LOW);
    delay(200);
  }
  digitalWrite(LED_EMERGENCY, HIGH); // Keep it on
}

void testLEDs() {
  // Test each LED in sequence
  Serial.println("Testing All Clear LED (Green)...");
  digitalWrite(LED_ALL_CLEAR, HIGH);
  delay(500);
  digitalWrite(LED_ALL_CLEAR, LOW);
  
  Serial.println("Testing Watch LED (Yellow)...");
  digitalWrite(LED_WATCH, HIGH);
  delay(500);
  digitalWrite(LED_WATCH, LOW);
  
  Serial.println("Testing Caution LED (Orange)...");
  digitalWrite(LED_CAUTION, HIGH);
  delay(500);
  digitalWrite(LED_CAUTION, LOW);
  
  Serial.println("Testing Warning LED (Red)...");
  digitalWrite(LED_WARNING, HIGH);
  delay(500);
  digitalWrite(LED_WARNING, LOW);
  
  Serial.println("Testing Emergency LED (Red)...");
  digitalWrite(LED_EMERGENCY, HIGH);
  delay(500);
  digitalWrite(LED_EMERGENCY, LOW);
  
  Serial.println("LED test complete!\n");
}
