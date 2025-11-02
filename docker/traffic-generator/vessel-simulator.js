// vessel-simulator.js - HTTP-based vessel tracking simulator
const axios = require('axios');
const fs = require('fs');

// Configuration
const config = {
  apiEndpoint: 'http://localhost:3000/api/vessels/telemetry/report',
  authToken: 'your-device-auth-token-here', // Replace with actual device token
  deviceToken: 'simulator-device-123',
  vesselName: 'Simulator Vessel',
  updateIntervalMs: 5000, // Send a position update every 5 seconds (more realistic)
  movementSpeed: 0.0001, // Degrees of lat/long change per update
  startPosition: {
    latitude: 5.5500,  // Accra, Ghana approximate coordinates
    longitude: -0.2000
  }
};

// Current position and heading
let position = {
  latitude: config.startPosition.latitude,
  longitude: config.startPosition.longitude,
  heading: Math.random() * 360, // Random initial heading
  speed: 5 + (Math.random() * 5) // 5-10 knots
};

// Configure axios for API requests
const apiClient = axios.create({
  baseURL: config.apiEndpoint.split('/api')[0],
  headers: {
    'Authorization': `Bearer ${config.authToken}`,
    'Content-Type': 'application/json'
  }
});

// Change heading occasionally to create a more realistic path
setInterval(() => {
  // Change heading by up to 30 degrees in either direction
  position.heading += (Math.random() * 60 - 30);
  
  // Keep heading between 0-360
  position.heading = position.heading % 360;
  if (position.heading < 0) position.heading += 360;
  
  // Randomly adjust speed sometimes
  if (Math.random() > 0.8) {
    position.speed = Math.max(0.5, Math.min(15, position.speed + (Math.random() * 2 - 1)));
  }
  
  console.log(`Changed heading to ${position.heading.toFixed(1)}° at ${position.speed.toFixed(1)} knots`);
}, 10000); // Change heading every 10 seconds

// Start the simulator
console.log('Starting vessel tracking simulator...');
console.log('NOTE: Make sure to set a valid auth token in the config above');
setInterval(sendPositionUpdate, config.updateIntervalMs);

async function sendPositionUpdate() {
  // Calculate new position based on heading and speed
  const headingRad = position.heading * (Math.PI / 180);
  
  // Calculate movement based on speed and heading
  // This is a simplified calculation that doesn't account for Earth's curvature
  // but is good enough for testing purposes
  const movement = config.movementSpeed * (position.speed / 5);
  
  position.latitude += movement * Math.cos(headingRad);
  position.longitude += movement * Math.sin(headingRad);
  
  // Create message in the format expected by the API
  const payload = {
    device_token: config.deviceToken,
    latitude: position.latitude,
    longitude: position.longitude,
    accuracy: 5.0, // 5 meter accuracy
    speed: position.speed * 0.514444, // Convert knots to m/s
    bearing: position.heading,
    altitude: 0,
    timestamp: Math.floor(Date.now() / 1000), // Unix timestamp
    provider: 'simulator',
    vessel: config.vesselName
  };
  
  try {
    // Send HTTP POST to the API
    await apiClient.post('/api/vessels/telemetry/report', payload);
    console.log(`✓ Sent position update: ${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)} (${position.speed.toFixed(1)} knots)`);
  } catch (error) {
    if (error.response) {
      console.error(`✗ API Error ${error.response.status}: ${error.response.data?.message || 'Unknown error'}`);
    } else if (error.request) {
      console.error('✗ Network Error: Could not reach API endpoint');
    } else {
      console.error('✗ Request Error:', error.message);
    }
  }
}

process.on('SIGINT', () => {
  console.log('\nShutting down simulator...');
  process.exit();
});