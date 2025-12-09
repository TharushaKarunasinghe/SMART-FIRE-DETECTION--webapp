import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  get,
  query,
  limitToLast,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { firebaseConfig, thingspeakConfig } from "./config.js";

// Initialize Firebase
console.log("🚀 Initializing Firebase...");
console.log("📋 Config:", {
  databaseURL: firebaseConfig.databaseURL,
  projectId: firebaseConfig.projectId,
});

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

console.log("✅ Firebase initialized successfully!");
console.log("📊 Database instance:", database);

// Global state
let currentData = {
  temperature: 0,
  humidity: 0,
  smoke: 0,
  gas: 0,
  warningLevel: 0,
  warningLabel: "All Clear",
  timestamp: Date.now(),
};

let historicalData = {
  labels: [],
  temperature: [],
  humidity: [],
  smoke: [],
  gas: [],
  warningLevel: [],
};

let chart = null;
let dataSource = "firebase"; // 'firebase', 'thingspeak', or 'both'

// Warning level configuration
const warningLevels = {
  0: {
    label: "All Clear",
    icon: "🟢",
    message: "No fire danger detected. All systems normal.",
    class: "level-0",
  },
  1: {
    label: "Watch",
    icon: "🟡",
    message: "Minor environmental changes detected. Continue monitoring.",
    class: "level-1",
  },
  2: {
    label: "Caution",
    icon: "🟠",
    message: "Elevated readings detected. Stay alert.",
    class: "level-2",
  },
  3: {
    label: "Warning",
    icon: "🔴",
    message: "Fire risk detected! Take precautionary measures.",
    class: "level-3",
  },
  4: {
    label: "EMERGENCY",
    icon: "🚨",
    message: "CRITICAL FIRE DANGER! EVACUATE IMMEDIATELY!",
    class: "level-4",
  },
};

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  console.log("🔥 Fire Detection System Initializing...");
  console.log("📄 DOM Content Loaded");

  // Check if all required elements exist
  const requiredElements = [
    "temp-value",
    "hum-value",
    "smoke-value",
    "gas-value",
    "alert-banner",
    "alert-icon",
    "alert-level",
    "alert-message",
    "last-update",
    "firebase-status",
    "thingspeak-status",
  ];

  const missingElements = requiredElements.filter(
    (id) => !document.getElementById(id)
  );
  if (missingElements.length > 0) {
    console.error("❌ Missing DOM elements:", missingElements);
  } else {
    console.log("✅ All required DOM elements found");
  }

  initChart();
  setupDataSourceListeners();
  startDataFetching();

  console.log("✅ Fire Detection System Initialized!");
  console.log("📡 Waiting for real-time data from Firebase and ThingSpeak...");
  console.log("🔍 If no data appears, check:");
  console.log("  - ESP8266 is running and connected to WiFi");
  console.log("  - Arduino Serial Monitor shows data uploads");
  console.log(
    "  - Firebase Console: https://console.firebase.google.com/project/fire-detection-fcaf9/database/data/~2Flatest"
  );
  console.log("  - Run: window.fireDetection.readFirebase() to debug");
});

// Setup data source radio buttons
function setupDataSourceListeners() {
  const radios = document.querySelectorAll('input[name="data-source"]');
  radios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const oldSource = dataSource;
      dataSource = e.target.value;
      console.log(`📡 Data source changed: ${oldSource} → ${dataSource}`);

      // Clear and restart data fetching
      historicalData = {
        labels: [],
        temperature: [],
        humidity: [],
        smoke: [],
        gas: [],
        warningLevel: [],
      };
      updateChart();

      // If switched to ThingSpeak or Both, fetch immediately
      if (dataSource === "thingspeak" || dataSource === "both") {
        console.log(
          "🔄 Fetching ThingSpeak data immediately after source change..."
        );
        fetchThingSpeakData();
      }
    });
  });
}

// Start data fetching based on selected source
function startDataFetching() {
  console.log("🔄 Starting data fetching...");
  console.log("📊 Data source:", dataSource);
  console.log("🔥 Firebase database URL:", firebaseConfig.databaseURL);

  // Firebase real-time listener - Arduino writes to /latest/
  const firebaseCurrentRef = ref(database, "latest");
  console.log("👂 Setting up Firebase listener for: /latest");
  console.log("🔗 Full path: " + firebaseConfig.databaseURL + "/latest");

  onValue(
    firebaseCurrentRef,
    (snapshot) => {
      console.log(
        "📡 Firebase callback triggered at:",
        new Date().toLocaleTimeString()
      );
      console.log("📦 Snapshot exists:", snapshot.exists());

      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log(
          "✅ Firebase RAW data received:",
          JSON.stringify(data, null, 2)
        );
        console.log("🎯 Current data source:", dataSource);
        console.log("📊 Data structure check:");
        console.log(
          "  - temperature:",
          data.temperature,
          typeof data.temperature
        );
        console.log("  - humidity:", data.humidity, typeof data.humidity);
        console.log("  - smoke:", data.smoke, typeof data.smoke);
        console.log("  - gas:", data.gas, typeof data.gas);
        console.log(
          "  - warningLevel:",
          data.warningLevel,
          typeof data.warningLevel
        );

        if (dataSource === "firebase" || dataSource === "both") {
          console.log("🔄 Updating UI with Firebase data...");
          const updateData = {
            temperature: parseFloat(data.temperature) || 0,
            humidity: parseFloat(data.humidity) || 0,
            smoke: parseFloat(data.smoke) || 0,
            gas: parseFloat(data.gas) || 0,
            warningLevel: parseInt(data.warningLevel) || 0,
            warningLabel:
              data.warningLabel ||
              warningLevels[parseInt(data.warningLevel) || 0].label,
            timestamp: parseInt(data.timestamp) || Date.now(),
          };
          console.log("📝 Prepared data for UI:", updateData);
          updateCurrentData(updateData);
          updateFirebaseStatus(true);
          console.log("✅ UI update complete!");
        }
      } else {
        console.warn("⚠️ No data exists at /latest");
        console.log("💡 Possible reasons:");
        console.log("  1. ESP8266 hasn't sent data yet");
        console.log("  2. Arduino code not uploading to /latest path");
        console.log("  3. Firebase rules blocking access");
        console.log(
          "🔍 Check Firebase Console: https://console.firebase.google.com/project/fire-detection-fcaf9/database"
        );
        updateFirebaseStatus(false);
      }
    },
    (error) => {
      console.error("❌ Firebase listener error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      updateFirebaseStatus(false);
    }
  );

  // Test Firebase connection by reading root
  console.log("🧪 Testing Firebase read access...");
  const testRef = ref(database, "/");
  onValue(
    testRef,
    (snapshot) => {
      console.log("✅ Firebase read access successful!");
      console.log("📊 Root data structure:", Object.keys(snapshot.val() || {}));
    },
    (error) => {
      console.error("❌ Firebase read access failed:", error);
    },
    { onlyOnce: true }
  );

  // Fetch Firebase history - Arduino writes to /readings/
  const firebaseHistoryRef = ref(database, "readings");
  const historyQuery = query(firebaseHistoryRef, limitToLast(20));
  console.log("👂 Setting up Firebase listener for: /readings (history)");

  onValue(
    historyQuery,
    (snapshot) => {
      console.log("📡 Firebase history callback triggered");
      console.log("📦 History snapshot exists:", snapshot.exists());

      if (
        snapshot.exists() &&
        (dataSource === "firebase" || dataSource === "both")
      ) {
        const history = snapshot.val();
        console.log(
          "✅ Firebase history data received, entries:",
          Object.keys(history).length
        );
        processFirebaseHistory(history);
      } else {
        console.warn("⚠️ No history data available");
      }
    },
    (error) => {
      console.error("❌ Firebase history error:", error);
    }
  );

  // ThingSpeak polling (every 20 seconds to respect rate limits)
  console.log("🔄 Setting up ThingSpeak polling...");
  console.log("📊 Data source mode:", dataSource);

  if (dataSource === "thingspeak" || dataSource === "both") {
    console.log("✅ ThingSpeak polling enabled");
    console.log("⏱️ Fetch interval: 20 seconds");
    console.log("📡 Fetching initial ThingSpeak data...");
    fetchThingSpeakData(); // Initial fetch
    setInterval(() => {
      console.log("⏰ ThingSpeak polling interval triggered");
      fetchThingSpeakData();
    }, 20000); // Poll every 20 seconds
  } else {
    console.log("⚠️ ThingSpeak polling disabled - data source is:", dataSource);
  }
}

// Fetch data from ThingSpeak
async function fetchThingSpeakData() {
  if (dataSource !== "thingspeak" && dataSource !== "both") return;

  try {
    console.log("📡 Fetching data from ThingSpeak...");
    const url = `${thingspeakConfig.baseUrl}/channels/${thingspeakConfig.channelId}/feeds.json?api_key=${thingspeakConfig.readApiKey}&results=20`;
    console.log("🔗 ThingSpeak URL:", url);

    const response = await fetch(url);

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    console.log("✅ ThingSpeak data received successfully!");
    console.log("📊 Channel info:", data.channel);
    console.log("📈 Number of feeds:", data.feeds?.length || 0);

    if (data.feeds && data.feeds.length > 0) {
      // Get latest reading
      const latest = data.feeds[data.feeds.length - 1];
      console.log("📋 Latest ThingSpeak reading:", {
        field1_temp: latest.field1,
        field2_hum: latest.field2,
        field3_smoke: latest.field3,
        field4_gas: latest.field4,
        field5_level: latest.field5,
        created_at: latest.created_at,
      });

      if (dataSource === "thingspeak") {
        console.log("🔄 Updating UI with ThingSpeak data...");
        updateCurrentData({
          temperature: parseFloat(latest.field1) || 0,
          humidity: parseFloat(latest.field2) || 0,
          smoke: parseFloat(latest.field3) || 0,
          gas: parseFloat(latest.field4) || 0,
          warningLevel: parseInt(latest.field5) || 0,
          warningLabel: warningLevels[parseInt(latest.field5) || 0].label,
          timestamp: new Date(latest.created_at).getTime(),
        });
      }

      // Process historical data
      processThingSpeakHistory(data.feeds);
      updateThingSpeakStatus(true);
      console.log("✅ ThingSpeak data processed successfully!");
    } else {
      console.warn("⚠️ No feeds found in ThingSpeak response");
      updateThingSpeakStatus(false);
    }
  } catch (error) {
    console.error("❌ ThingSpeak fetch error:", error);
    console.error("💡 Check:");
    console.error("  - Channel ID:", thingspeakConfig.channelId);
    console.error("  - Read API Key:", thingspeakConfig.readApiKey);
    console.error("  - ThingSpeak URL:", thingspeakConfig.baseUrl);
    console.error("  - Network connectivity");
    updateThingSpeakStatus(false);
  }
}

// Process Firebase history
function processFirebaseHistory(history) {
  console.log("📊 Processing Firebase history...");
  const entries = Object.entries(history).slice(-20);
  console.log("📈 Number of entries to process:", entries.length);

  historicalData = {
    labels: [],
    temperature: [],
    humidity: [],
    smoke: [],
    gas: [],
    warningLevel: [],
  };

  entries.forEach(([timestamp, data], index) => {
    const date = new Date(parseInt(timestamp));
    const timeLabel = date.toLocaleTimeString();

    historicalData.labels.push(timeLabel);
    historicalData.temperature.push(data.temperature || 0);
    historicalData.humidity.push(data.humidity || 0);
    historicalData.smoke.push(data.smoke || 0);
    historicalData.gas.push(data.gas || 0);
    historicalData.warningLevel.push(data.warningLevel || 0);

    if (index < 3 || index >= entries.length - 3) {
      // Log first 3 and last 3 entries for debugging
      console.log(`📋 Entry ${index + 1}:`, {
        time: timeLabel,
        temp: data.temperature,
        hum: data.humidity,
        smoke: data.smoke,
        gas: data.gas,
        level: data.warningLevel,
      });
    }
  });

  console.log("✅ Firebase history processed:", {
    totalEntries: historicalData.labels.length,
    firstEntry: historicalData.labels[0],
    lastEntry: historicalData.labels[historicalData.labels.length - 1],
  });

  updateChart();
}

// Process ThingSpeak history
function processThingSpeakHistory(feeds) {
  // Process ThingSpeak history for 'thingspeak' or 'both' modes
  if (dataSource !== "thingspeak" && dataSource !== "both") {
    console.log("⏭️ Skipping ThingSpeak history - data source is:", dataSource);
    return;
  }

  console.log("📊 Processing ThingSpeak history...");
  console.log("📈 Number of feeds to process:", feeds.length);

  historicalData = {
    labels: [],
    temperature: [],
    humidity: [],
    smoke: [],
    gas: [],
    warningLevel: [],
  };

  feeds.forEach((feed, index) => {
    const date = new Date(feed.created_at);
    const timeLabel = date.toLocaleTimeString();

    historicalData.labels.push(timeLabel);
    historicalData.temperature.push(parseFloat(feed.field1) || 0);
    historicalData.humidity.push(parseFloat(feed.field2) || 0);
    historicalData.smoke.push(parseFloat(feed.field3) || 0);
    historicalData.gas.push(parseFloat(feed.field4) || 0);
    historicalData.warningLevel.push(parseInt(feed.field5) || 0);

    if (index < 3 || index >= feeds.length - 3) {
      // Log first 3 and last 3 entries for debugging
      console.log(`📋 Feed ${index + 1}:`, {
        time: timeLabel,
        temp: feed.field1,
        hum: feed.field2,
        smoke: feed.field3,
        gas: feed.field4,
        level: feed.field5,
      });
    }
  });

  console.log("✅ ThingSpeak history processed:", {
    totalEntries: historicalData.labels.length,
    firstEntry: historicalData.labels[0],
    lastEntry: historicalData.labels[historicalData.labels.length - 1],
  });

  updateChart();
}

// Update current data display
function updateCurrentData(data) {
  console.log("🖥️ updateCurrentData called with:", data);
  currentData = { ...data };

  // Update sensor values
  console.log("📝 Updating DOM elements...");
  const tempEl = document.getElementById("temp-value");
  const humEl = document.getElementById("hum-value");
  const smokeEl = document.getElementById("smoke-value");
  const gasEl = document.getElementById("gas-value");

  if (!tempEl || !humEl || !smokeEl || !gasEl) {
    console.error("❌ DOM elements not found!");
    return;
  }

  const tempValue = data.temperature.toFixed(1);
  const humValue = data.humidity.toFixed(1);
  const smokeValue = Math.round(data.smoke);
  const gasValue = Math.round(data.gas);

  console.log("🔢 Setting values:");
  console.log("  Temperature:", tempValue, "°C");
  console.log("  Humidity:", humValue, "%");
  console.log("  Smoke:", smokeValue, "units");
  console.log("  Gas:", gasValue, "PPM");

  tempEl.textContent = tempValue;
  humEl.textContent = humValue;
  smokeEl.textContent = smokeValue;
  gasEl.textContent = gasValue;

  console.log("✅ Sensor values updated in DOM");
  console.log("✅ Current DOM content:");
  console.log("  temp-value:", tempEl.textContent);
  console.log("  hum-value:", humEl.textContent);
  console.log("  smoke-value:", smokeEl.textContent);
  console.log("  gas-value:", gasEl.textContent);

  // Update sensor statuses
  updateSensorStatus("temp", data.temperature, 30, 50, 60);
  updateSensorStatus("hum", data.humidity, 70, 80, 90);
  updateSensorStatus("smoke", data.smoke, 200, 500, 800);
  updateSensorStatus("gas", data.gas, 1000, 2500, 4000);

  // Update alert banner
  const level = data.warningLevel;
  const config = warningLevels[level];

  const alertBanner = document.getElementById("alert-banner");
  alertBanner.className = `alert-banner ${config.class}`;

  document.getElementById("alert-icon").textContent = config.icon;
  document.getElementById("alert-level").textContent = config.label;
  document.getElementById("alert-message").textContent = config.message;

  // Update timestamp - show current time when data was received
  const now = new Date();
  document.getElementById("last-update").textContent = now.toLocaleTimeString();

  // Update LED indicators
  updateLEDs(level);

  // Add to historical data if not already there
  const lastLabel = historicalData.labels[historicalData.labels.length - 1];
  const currentLabel = date.toLocaleTimeString();

  if (lastLabel !== currentLabel) {
    historicalData.labels.push(currentLabel);
    historicalData.temperature.push(data.temperature);
    historicalData.humidity.push(data.humidity);
    historicalData.smoke.push(data.smoke);
    historicalData.gas.push(data.gas);
    historicalData.warningLevel.push(data.warningLevel);

    // Keep only last 20 readings
    if (historicalData.labels.length > 20) {
      historicalData.labels.shift();
      historicalData.temperature.shift();
      historicalData.humidity.shift();
      historicalData.smoke.shift();
      historicalData.gas.shift();
      historicalData.warningLevel.shift();
    }

    updateChart();
  }
}

// Update sensor status badge
function updateSensorStatus(sensor, value, normal, elevated, high) {
  const statusElement = document.getElementById(`${sensor}-status`);

  if (value < normal) {
    statusElement.textContent = "Normal";
    statusElement.className = "sensor-status normal";
  } else if (value < elevated) {
    statusElement.textContent = "Elevated";
    statusElement.className = "sensor-status elevated";
  } else if (value < high) {
    statusElement.textContent = "High";
    statusElement.className = "sensor-status high";
  } else {
    statusElement.textContent = "Critical";
    statusElement.className = "sensor-status critical";
  }
}

// Update LED indicators
function updateLEDs(activeLevel) {
  for (let i = 0; i <= 4; i++) {
    const ledItem = document.getElementById(`led-${i}`);
    const ledLight = ledItem.querySelector(".led-light");

    if (i === activeLevel) {
      ledItem.classList.add("active");
      ledLight.classList.add("active");
    } else {
      ledItem.classList.remove("active");
      ledLight.classList.remove("active");
    }
  }
}

// Update connection status indicators
function updateFirebaseStatus(connected) {
  const indicator = document.getElementById("firebase-status");
  indicator.className = connected
    ? "status-indicator connected"
    : "status-indicator disconnected";
}

function updateThingSpeakStatus(connected) {
  const indicator = document.getElementById("thingspeak-status");
  indicator.className = connected
    ? "status-indicator connected"
    : "status-indicator disconnected";
}

// Initialize Chart.js
function initChart() {
  const ctx = document.getElementById("dataChart").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Temperature (°C)",
          data: [],
          borderColor: "#FF5722",
          backgroundColor: "rgba(255, 87, 34, 0.1)",
          tension: 0.4,
          yAxisID: "y",
        },
        {
          label: "Humidity (%)",
          data: [],
          borderColor: "#2196F3",
          backgroundColor: "rgba(33, 150, 243, 0.1)",
          tension: 0.4,
          yAxisID: "y",
        },
        {
          label: "Smoke (units)",
          data: [],
          borderColor: "#9E9E9E",
          backgroundColor: "rgba(158, 158, 158, 0.1)",
          tension: 0.4,
          yAxisID: "y1",
        },
        {
          label: "Gas (PPM)",
          data: [],
          borderColor: "#FFC107",
          backgroundColor: "rgba(255, 193, 7, 0.1)",
          tension: 0.4,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          labels: {
            color: "#ffffff",
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          backgroundColor: "rgba(22, 33, 62, 0.95)",
          titleColor: "#ffffff",
          bodyColor: "#ffffff",
          borderColor: "#FF5722",
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          ticks: {
            color: "#b0b0b0",
            maxRotation: 45,
            minRotation: 45,
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
        y: {
          type: "linear",
          position: "left",
          ticks: {
            color: "#b0b0b0",
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
          title: {
            display: true,
            text: "Temp (°C) / Humidity (%)",
            color: "#b0b0b0",
          },
        },
        y1: {
          type: "linear",
          position: "right",
          ticks: {
            color: "#b0b0b0",
          },
          grid: {
            display: false,
          },
          title: {
            display: true,
            text: "Smoke / Gas",
            color: "#b0b0b0",
          },
        },
      },
    },
  });
}

// Update chart with latest data
function updateChart() {
  if (!chart) {
    console.warn("⚠️ Chart not initialized yet");
    return;
  }

  console.log("📊 Updating chart with historical data...");
  console.log("📈 Data points:", {
    labels: historicalData.labels.length,
    temperature: historicalData.temperature.length,
    humidity: historicalData.humidity.length,
    smoke: historicalData.smoke.length,
    gas: historicalData.gas.length,
  });

  chart.data.labels = historicalData.labels;
  chart.data.datasets[0].data = historicalData.temperature;
  chart.data.datasets[1].data = historicalData.humidity;
  chart.data.datasets[2].data = historicalData.smoke;
  chart.data.datasets[3].data = historicalData.gas;

  chart.update("none"); // Update without animation for better performance

  console.log("✅ Chart updated successfully!");
}

// Export for debugging
window.fireDetection = {
  currentData,
  historicalData,
  dataSource,
  database,
  // Manual test function
  testUI: (temp = 30, hum = 65, smoke = 200, gas = 1000, level = 2) => {
    console.log("🧪 Manual UI test triggered");
    updateCurrentData({
      temperature: temp,
      humidity: hum,
      smoke: smoke,
      gas: gas,
      warningLevel: level,
      warningLabel: warningLevels[level].label,
      timestamp: Date.now(),
    });
  },
  // Manual Firebase read
  readFirebase: async () => {
    console.log("📖 Manual Firebase read from /latest...");
    const snapshot = await get(ref(database, "latest"));
    if (snapshot.exists()) {
      console.log("✅ Data found:", snapshot.val());
      return snapshot.val();
    } else {
      console.log("❌ No data found at /latest");
      return null;
    }
  },
  // Manual ThingSpeak read
  readThingSpeak: async () => {
    console.log("📖 Manual ThingSpeak read...");
    await fetchThingSpeakData();
  },
  // Force refresh from both sources
  refreshAll: async () => {
    console.log("🔄 Refreshing data from all sources...");
    console.log("📡 Reading Firebase...");
    const fbData = await get(ref(database, "latest"));
    if (fbData.exists()) {
      console.log("✅ Firebase data:", fbData.val());
    }
    console.log("📡 Reading ThingSpeak...");
    await fetchThingSpeakData();
  },
  // View chart data
  viewChartData: () => {
    console.log("📊 Current Chart Data:");
    console.log("Labels:", historicalData.labels);
    console.log("Temperature:", historicalData.temperature);
    console.log("Humidity:", historicalData.humidity);
    console.log("Smoke:", historicalData.smoke);
    console.log("Gas:", historicalData.gas);
    console.log("Warning Levels:", historicalData.warningLevel);
    return historicalData;
  },
  // Force chart update
  updateChart: () => {
    console.log("🔄 Forcing chart update...");
    updateChart();
  },
};

console.log("✅ Fire Detection System Ready!");
console.log("");
console.log("🎯 REAL DATA MODE - No dummy data will be shown!");
console.log("� Data sources configured:");
console.log("  ✅ Firebase: /latest/ (real-time)");
console.log("  ✅ ThingSpeak: Channel 3116566 (polling every 20s)");
console.log("");
console.log(" Debug commands available:");
console.log("  window.fireDetection.readFirebase() - Check Firebase data");
console.log("  window.fireDetection.readThingSpeak() - Fetch ThingSpeak now");
console.log("  window.fireDetection.refreshAll() - Refresh all data sources");
console.log("  window.fireDetection.currentData - View current sensor values");
console.log("  window.fireDetection.historicalData - View chart data");
console.log("  window.fireDetection.viewChartData() - Display chart data");
console.log("  window.fireDetection.updateChart() - Force chart refresh");
console.log(
  "  window.fireDetection.testUI(temp, hum, smoke, gas, level) - Test UI manually"
);
console.log("");
console.log("🔍 If no data appears:");
console.log("  1. Verify ESP8266 is running and connected");
console.log(
  "  2. Check: https://console.firebase.google.com/project/fire-detection-fcaf9/database/data/~2Flatest"
);
console.log("  3. Check: https://thingspeak.com/channels/3116566");
