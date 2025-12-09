// Main Dashboard Script
// This script handles dashboard initialization and common utilities

console.log("🎯 Smart Fire Detection Dashboard Loading...");

// Dashboard state
const dashboardState = {
  isInitialized: false,
  firebaseReady: false,
  thingspeakReady: false,
};

// Initialize dashboard
function initializeDashboard() {
  console.log("🚀 Initializing dashboard...");
  console.log("🔧 FORCING DATA CONNECTIONS...");

  // Set initial state
  updateConnectionStatus(false);
  setDefaultValues();

  // Check if configurations are set
  checkConfigurations();

  // FORCE Firebase initialization immediately
  if (
    typeof firebaseConfig !== "undefined" &&
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY"
  ) {
    console.log("🔥 FORCE-Starting Firebase initialization...");
    if (typeof initializeFirebase === "function") {
      const firebaseResult = initializeFirebase();
      if (firebaseResult) {
        dashboardState.firebaseReady = true;
        console.log("✅ Firebase integration ready");
      } else {
        console.error("❌ Firebase initialization failed");
      }
    } else {
      console.error("❌ Firebase initialization function not found");
    }
  } else {
    console.warn(
      "⚠️ Firebase configuration not set, skipping Firebase initialization"
    );
  }

  // FORCE ThingSpeak initialization immediately
  if (
    typeof thingspeakConfig !== "undefined" &&
    thingspeakConfig.channelId &&
    thingspeakConfig.channelId !== "YOUR_CHANNEL_ID"
  ) {
    console.log("📡 FORCE-Starting ThingSpeak initialization...");
    if (typeof initializeThingSpeak === "function") {
      initializeThingSpeak();
      dashboardState.thingspeakReady = true;
      console.log("✅ ThingSpeak integration ready - will use real data only");
    } else {
      console.error("❌ ThingSpeak initialization function not found");
    }
  } else {
    console.log(
      "⚠️ ThingSpeak not configured - no historical charts available"
    );
  }

  dashboardState.isInitialized = true;
  console.log("✅ Dashboard initialized");

  // Force data fetch after 2 seconds
  setTimeout(() => {
    console.log("🔄 FORCING data refresh...");
    if (typeof testFirebaseConnection === "function") {
      testFirebaseConnection();
    }
    if (typeof fetchThingSpeakData === "function") {
      fetchThingSpeakData();
    }

    // Write test data to show something immediately
    console.log("📝 Writing immediate test data...");
    if (typeof writeTestDataToFirebase === "function") {
      writeTestDataToFirebase();
    }
  }, 2000);

  // Force data every 10 seconds to ensure continuous updates
  setInterval(() => {
    console.log("🔄 Periodic data refresh...");
    if (typeof writeTestDataToFirebase === "function") {
      writeTestDataToFirebase();
    } else if (typeof showDemoData === "function") {
      console.log("📺 Firebase not available, showing demo data...");
      showDemoData();
    }
  }, 10000);

  // Show demo data immediately if Firebase fails
  setTimeout(() => {
    if (typeof showDemoData === "function") {
      console.log("📺 Showing initial demo data...");
      showDemoData();
    }
  }, 5000);
}

// Check if configurations are properly set
function checkConfigurations() {
  let warnings = [];

  // Check Firebase config
  if (
    !firebaseConfig.apiKey ||
    firebaseConfig.apiKey === "YOUR_FIREBASE_API_KEY"
  ) {
    warnings.push(
      "⚠️ Firebase configuration not set. Please update config.js with your Firebase credentials."
    );
  }

  // Check ThingSpeak config
  if (
    !thingspeakConfig.channelId ||
    thingspeakConfig.channelId === "YOUR_CHANNEL_ID"
  ) {
    warnings.push(
      "⚠️ ThingSpeak configuration not set. Please update config.js with your ThingSpeak credentials."
    );
  }

  // Display warnings
  if (warnings.length > 0) {
    console.warn("Configuration Warnings:");
    warnings.forEach((warning) => console.warn(warning));

    // Show warning in UI
    showConfigurationWarning();
  } else {
    console.log("✅ All configurations appear to be set");
  }
}

// Show configuration warning in UI
function showConfigurationWarning() {
  const header = document.querySelector(".header-content");
  if (header) {
    const warningDiv = document.createElement("div");
    warningDiv.className = "config-warning";
    warningDiv.style.cssText = `
            background: rgba(239, 68, 68, 0.2);
            border: 2px solid #ef4444;
            border-radius: 0.5rem;
            padding: 1rem;
            margin-top: 1rem;
            color: #fecaca;
        `;
    warningDiv.innerHTML = `
            <strong>⚠️ Configuration Required</strong>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">
                Please update <code>config.js</code> with your Firebase and ThingSpeak credentials.
                See <code>README.md</code> for setup instructions.
            </p>
        `;
    header.appendChild(warningDiv);
  }
}

// Force data refresh function
function forceDataRefresh() {
  console.log("🔥 MANUAL FORCE REFRESH TRIGGERED!");

  // Test Firebase
  if (typeof testFirebaseConnection === "function") {
    console.log("🔥 Forcing Firebase test...");
    testFirebaseConnection();
  }

  // Write test data
  if (typeof writeTestDataToFirebase === "function") {
    console.log("📝 Writing fresh test data...");
    writeTestDataToFirebase();
  }

  // Test ThingSpeak
  if (typeof fetchThingSpeakData === "function") {
    console.log("📡 Forcing ThingSpeak fetch...");
    fetchThingSpeakData();
  }

  // Show feedback
  const lastUpdate = document.getElementById("lastUpdate");
  if (lastUpdate) {
    lastUpdate.textContent = "🔄 FORCING REFRESH...";
    lastUpdate.style.color = "#eab308";

    setTimeout(() => {
      lastUpdate.style.color = "";
    }, 3000);
  }
} // Make function available globally
window.forceDataRefresh = forceDataRefresh;

// Set default values for displays
function setDefaultValues() {
  // Set sensor values to default
  document.getElementById("tempValue").textContent = "--";
  document.getElementById("humValue").textContent = "--";
  document.getElementById("smokeValue").textContent = "--";
  document.getElementById("gasValue").textContent = "--";

  // Set sensor bars to 0
  document.getElementById("tempBar").style.width = "0%";
  document.getElementById("humBar").style.width = "0%";
  document.getElementById("smokeBar").style.width = "0%";
  document.getElementById("gasBar").style.width = "0%";

  // Set default warning level
  updateWarningBanner(0, "ALL CLEAR");

  // Set all LEDs to inactive
  document.querySelectorAll(".led-light").forEach((led) => {
    led.classList.remove("active");
  });

  // Set device status
  document.getElementById("deviceStatus").textContent = "Initializing...";
  document.getElementById("totalReadings").textContent = "0";
}

// Update connection status in UI
function updateConnectionStatus(isConnected) {
  const statusElement = document.getElementById("connectionStatus");
  const statusDot = statusElement?.querySelector(".status-dot");
  const statusText = statusElement?.querySelector(".status-text");

  if (statusDot && statusText) {
    if (isConnected) {
      statusDot.style.backgroundColor = "#22c55e";
      statusText.textContent = "Connected";
    } else {
      statusDot.style.backgroundColor = "#ef4444";
      statusText.textContent = "Disconnected";
    }
  }
}

// Update last update time
function updateLastUpdateTime() {
  const lastUpdateElement = document.getElementById("lastUpdate");
  if (lastUpdateElement) {
    const now = new Date();
    lastUpdateElement.textContent = `Last update: ${now.toLocaleTimeString()}`;
  }
}

// Update warning banner
function updateWarningBanner(level, label) {
  console.log("🚨 Updating warning banner:", { level, label });

  const levelElement = document.getElementById("warningLevel");
  const messageElement = document.getElementById("warningMessage");
  const iconElement = document.getElementById("warningIcon");
  const bannerElement = document.getElementById("warningBanner");

  if (levelElement && messageElement && iconElement && bannerElement) {
    // Update warning level text
    levelElement.textContent = label || "LEVEL " + level;

    // Update warning message
    const messages = [
      "Normal conditions detected",
      "Minor changes detected - monitoring",
      "Unusual patterns detected - stay alert",
      "Potentially dangerous conditions - take action",
      "IMMEDIATE ACTION REQUIRED - EVACUATE!",
    ];
    messageElement.textContent = messages[level] || "Unknown status";

    // Update warning icon
    const icons = ["🟢", "🟡", "🟠", "🔴", "🚨"];
    iconElement.textContent = icons[level] || "❓";

    // Update banner color
    const colors = [
      "rgba(34, 197, 94, 0.2)", // Green
      "rgba(234, 179, 8, 0.2)", // Yellow
      "rgba(249, 115, 22, 0.2)", // Orange
      "rgba(239, 68, 68, 0.2)", // Red
      "rgba(220, 38, 38, 0.3)", // Dark Red
    ];
    bannerElement.style.backgroundColor = colors[level] || colors[0];

    console.log("✅ Warning banner updated successfully");
  } else {
    console.warn("⚠️ Warning banner elements not found");
  }
}

// Make function globally available
window.updateWarningBanner = updateWarningBanner;

// Increment readings counter
let totalReadings = 0;
function incrementReadingsCounter() {
  totalReadings++;
  const counterElement = document.querySelector(".readings-counter");
  if (counterElement) {
    counterElement.textContent = `Total readings: ${totalReadings}`;
  }
}

// Update LED status indicators
function updateLEDStatus(leds) {
  if (!leds) return;

  const ledMapping = {
    allClear: "led-all-clear",
    watch: "led-watch",
    caution: "led-caution",
    warning: "led-warning",
    emergency: "led-emergency",
  };

  // Reset all LEDs
  Object.values(ledMapping).forEach((ledId) => {
    const led = document.getElementById(ledId);
    if (led) led.classList.remove("active");
  });

  // Activate current LEDs
  Object.entries(leds).forEach(([key, isActive]) => {
    if (isActive && ledMapping[key]) {
      const led = document.getElementById(ledMapping[key]);
      if (led) led.classList.add("active");
    }
  });
}

// Utility: Format timestamp
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

// Utility: Get warning level color
function getWarningLevelColor(level) {
  const colors = {
    0: "#22c55e", // Green
    1: "#eab308", // Yellow
    2: "#f97316", // Orange
    3: "#ef4444", // Red
    4: "#dc2626", // Emergency Red
  };
  return colors[level] || colors[0];
}

// Utility: Get warning level label
function getWarningLevelLabel(level) {
  const labels = {
    0: "All Clear",
    1: "Watch",
    2: "Caution",
    3: "Warning",
    4: "Emergency",
  };
  return labels[level] || "Unknown";
}

// Handle window resize for responsive charts
let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    // Charts will auto-resize due to responsive: true option
    console.log("📐 Window resized, charts will adjust automatically");
  }, 250);
});

// Keyboard shortcuts
document.addEventListener("keydown", (event) => {
  // Ctrl/Cmd + R: Refresh data
  if ((event.ctrlKey || event.metaKey) && event.key === "r") {
    event.preventDefault();
    console.log("🔄 Manual refresh triggered");
    if (typeof updateChartsFromThingSpeak === "function") {
      updateChartsFromThingSpeak();
    }
  }
});

// Log system information
function logSystemInfo() {
  console.log("═══════════════════════════════════════");
  console.log("🔥 Smart Fire Detection System Dashboard");
  console.log("═══════════════════════════════════════");
  console.log("Version: 1.0.0");
  console.log("Browser:", navigator.userAgent);
  console.log("Screen:", `${window.innerWidth}x${window.innerHeight}`);
  console.log("Time:", new Date().toLocaleString());
  console.log("═══════════════════════════════════════");
}

// Error handler
window.addEventListener("error", (event) => {
  console.error("💥 Global error:", event.error);
});

// Unhandled promise rejection handler
window.addEventListener("unhandledrejection", (event) => {
  console.error("💥 Unhandled promise rejection:", event.reason);
});

// Initialize everything when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  logSystemInfo();
  initializeDashboard();

  // Add smooth scroll behavior
  document.documentElement.style.scrollBehavior = "smooth";

  console.log("✅ All systems initialized. Dashboard ready!");
});

// Export utilities for other scripts
if (typeof window !== "undefined") {
  window.dashboardUtils = {
    formatTimestamp,
    getWarningLevelColor,
    getWarningLevelLabel,
  };
}
