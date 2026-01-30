import React, { useState, useEffect } from "react";
// import "./WeatherDashboard.css";
import { 
  FaSearch, FaMapMarkerAlt, FaWind, FaTint, FaSun, FaCloud, 
  FaCloudRain, FaRegCompass, FaHistory, FaTrash 
} from "react-icons/fa";

export default function Weather() {
  // Auth States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [authMode, setAuthMode] = useState("login");
  
  // Weather & History States
  const [query, setQuery] = useState("");
  const [weather, setWeather] = useState(null);
  const [unit, setUnit] = useState("C");
  const [history, setHistory] = useState([]);

  // --- 1. History Logic ---
  // Load history when user logs in
  useEffect(() => {
    if (isLoggedIn && userEmail) {
      const savedHistory = localStorage.getItem(`history_${userEmail}`);
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    }
  }, [isLoggedIn, userEmail]);

  const addToHistory = (cityName) => {
    const updatedHistory = [
      cityName, 
      ...history.filter(item => item.toLowerCase() !== cityName.toLowerCase())
    ].slice(0, 5); // Keep last 5 unique searches
    
    setHistory(updatedHistory);
    localStorage.setItem(`history_${userEmail}`, JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(`history_${userEmail}`);
  };

  // --- 2. Fetch Logic ---
  const convertTemp = (tempC) => (unit === "F" ? Math.round((tempC * 9) / 5 + 32) : Math.round(tempC));

  const fetchWeatherData = async (lat, lon, cityName) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`;
      const res = await fetch(url);
      const data = await res.json();

      setWeather({
        city: cityName,
        rawTemp: data.current.temperature_2m,
        condition: data.current.weather_code < 3 ? "Clear" : "Cloudy",
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        uvIndex: data.daily.uv_index_max[0],
        forecast: data.daily.time.map((date, i) => ({
          day: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
          max: data.daily.temperature_2m_max[i],
          min: data.daily.temperature_2m_min[i],
          code: data.daily.weather_code[i]
        }))
      });
      
      // Only add to history if it's a manual search (not "Local Weather")
      if (cityName !== "Local Weather") addToHistory(cityName);
    } catch (err) { console.error(err); }
  };

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery) return;
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${searchQuery}&count=1`);
    const data = await res.json();
    if (data.results) {
      const { latitude, longitude, name } = data.results[0];
      fetchWeatherData(latitude, longitude, name);
    }
  };
// Inside your Weather.jsx - Replace the Auth conditional return:
if (!isLoggedIn) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Left Side: Animated Weather Illustration */}
        <div className="auth-visual">
          <div className="weather-scene">
            <div className="sun-glow"></div>
            <FaSun className="auth-sun" />
            <FaCloudRain className="auth-cloud" />
            <div className="rain-drops">
              <span></span><span></span><span></span>
            </div>
          </div>
          <div className="visual-text">
            <h2>WeatherWise</h2>
            <p>Real-time insights for your daily adventures.</p>
          </div>
        </div>

        {/* Right Side: Clean Form */}
        <div className="auth-content">
          <div className="form-header">
            <h1>{authMode === "login" ? "Welcome Back" : "Create Account"}</h1>
            <p>Please enter your details to continue</p>
          </div>
          
          <div className="auth-form">
            <div className="input-group">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="name@company.com" 
                onChange={(e) => setUserEmail(e.target.value)} 
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" />
            </div>
            
            <button className="auth-btn-primary" onClick={() => userEmail && setIsLoggedIn(true)}>
              {authMode === "login" ? "Sign In" : "Get Started"}
            </button>
          </div>

          <p className="auth-footer">
            {authMode === "login" ? "Don't have an account?" : "Already a member?"}
            <button onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>
              {authMode === "login" ? "Sign up for free" : "Log in here"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="search-container">
          <div className="search-box">
            <FaSearch className="s-icon" />
            <input 
              type="text" 
              placeholder="Search places..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)} 
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button className="location-btn" onClick={() => {
            navigator.geolocation.getCurrentPosition(p => fetchWeatherData(p.coords.latitude, p.coords.longitude, "Local Weather"));
          }}><FaMapMarkerAlt /></button>
        </div>

        {weather && (
          <div className="weather-hero">
            <div className="big-icon"><FaSun /></div>
            <h1 className="temp-display">{convertTemp(weather.rawTemp)}<sup>°{unit}</sup></h1>
            <p className="day-info">{new Date().toLocaleDateString("en-US", {weekday:'long'})}, <span className="time-muted">16:00</span></p>
            <div className="divider"></div>
            <div className="meta-row"><FaCloud /> {weather.condition}</div>
            <div className="city-chip">{weather.city}</div>
          </div>
        )}

        {/* --- History Section --- */}
        <div className="history-section">
          <div className="history-header">
            <span>Recent</span>
            {history.length > 0 && <FaTrash className="clear-icon" onClick={clearHistory} />}
          </div>
          <div className="history-list">
            {history.map((item, i) => (
              <div key={i} className="history-item" onClick={() => {
                setQuery(item);
                handleSearch(item);
              }}>
                <FaHistory className="h-icon" /> {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="top-nav">
          <div className="tabs"><span className="active">Week</span></div>
          <div className="unit-switch">
            <button className={unit === "C" ? "active" : ""} onClick={() => setUnit("C")}>°C</button>
            <button className={unit === "F" ? "active" : ""} onClick={() => setUnit("F")}>°F</button>
          </div>
        </div>

        <div className="forecast-row">
          {weather?.forecast.map((d, i) => (
            <div className="f-card" key={i}>
              <p>{d.day}</p>
              <FaCloud className="f-icon" />
              <p><strong>{convertTemp(d.max)}°</strong> <span className="min-t">{convertTemp(d.min)}°</span></p>
            </div>
          ))}
        </div>

        <h3 className="section-title">Today's Highlights</h3>
        <div className="highlights-grid">
          <div className="h-card"><span>UV Index</span><div className="large-val">{weather?.uvIndex}</div></div>
          <div className="h-card">
            <span>Humidity</span>
            <div className="h-val-row">
              <div className="large-val">{weather?.humidity}%</div>
              <div className="progress-bar-v"><div className="progress-fill" style={{height: `${weather?.humidity}%`}}></div></div>
            </div>
          </div>
          <div className="h-card"><span>Wind Status</span><div className="large-val">{weather?.windSpeed} <small>km/h</small></div></div>
        </div>
      </div>
    </div>
  );
}