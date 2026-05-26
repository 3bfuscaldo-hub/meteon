const API_KEY = '6bcc2ef88d039f36852a22373431d23b';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const ITALIAN_CITIES = [
    'Roma',
    'Milano',
    'Napoli',
    'Torino',
    'Palermo',
    'Genova',
    'Bologna',
    'Firenze',
    'Bari',
    'Catania',
    'Venezia',
    'Verona',
    'Messina',
    'Padova',
    'Trieste'
];

const cityInput = document.getElementById('cityInput');
const suggestionsList = document.getElementById('suggestions');
const loader = document.getElementById('loader');
const errorDiv = document.getElementById('error');
const currentWeatherSection = document.getElementById('currentWeather');
const forecastWeatherSection = document.getElementById('forecastWeather');

// Event Listeners
cityInput.addEventListener('input', showSuggestions);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchCity();
    }
});

// Mostra i suggerimenti mentre l'utente digita
function showSuggestions() {
    const value = cityInput.value.toLowerCase().trim();
    
    if (!value) {
        suggestionsList.innerHTML = '';
        return;
    }

    const filtered = ITALIAN_CITIES.filter(city => 
        city.toLowerCase().startsWith(value)
    );

    suggestionsList.innerHTML = '';
    filtered.forEach(city => {
        const li = document.createElement('li');
        li.textContent = city;
        li.onclick = () => {
            cityInput.value = city;
            suggestionsList.innerHTML = '';
            searchCity();
        };
        suggestionsList.appendChild(li);
    });
}

// Funzione di ricerca
function searchCity() {
    const city = cityInput.value.trim();
    if (!city) {
        showError('Per favore, inserisci il nome di una città');
        return;
    }
    
    suggestionsList.innerHTML = '';
    getWeather(city);
}

// Ottiene i dati meteo
async function getWeather(city) {
    try {
        showLoader(true);
        errorDiv.style.display = 'none';
        
        // Ottiene le coordinate della città
        const geoResponse = await fetch(
            `${BASE_URL}/find?q=${city},IT&type=like&appid=${API_KEY}`
        );
        
        if (!geoResponse.ok) throw new Error('Errore nella ricerca');
        
        const geoData = await geoResponse.json();
        
        if (!geoData.list || geoData.list.length === 0) {
            showError('Città non trovata. Prova con un\'altra città italiana.');
            showLoader(false);
            return;
        }
        
        const { lat, lon, name } = geoData.list[0];
        
        // Ottiene il meteo attuale
        const currentResponse = await fetch(
            `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&lang=it&appid=${API_KEY}`
        );
        
        if (!currentResponse.ok) throw new Error('Errore nel recupero del meteo');
        const currentData = await currentResponse.json();
        
        // Ottiene le previsioni a 5 giorni
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&lang=it&appid=${API_KEY}`
        );
        
        if (!forecastResponse.ok) throw new Error('Errore nel recupero delle previsioni');
        const forecastData = await forecastResponse.json();
        
        displayCurrentWeather(currentData, name);
        displayForecast(forecastData);
        
        showLoader(false);
    } catch (error) {
        console.error('Errore:', error);
        showError('Errore nel caricamento dei dati meteo. Riprova più tardi.');
        showLoader(false);
    }
}

// Mostra il meteo attuale
function displayCurrentWeather(data, cityName) {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    const formattedDate = now.toLocaleDateString('it-IT', options);
    
    document.getElementById('cityName').textContent = cityName;
    document.getElementById('date').textContent = formattedDate;
    document.getElementById('temperature').textContent = Math.round(data.main.temp);
    document.getElementById('weatherDescription').textContent = data.weather[0].description;
    document.getElementById('feelsLike').textContent = Math.round(data.main.feels_like) + '°C';
    document.getElementById('windSpeed').textContent = data.wind.speed.toFixed(1) + ' m/s';
    document.getElementById('humidity').textContent = data.main.humidity + '%';
    document.getElementById('pressure').textContent = data.main.pressure + ' hPa';
    document.getElementById('visibility').textContent = (data.visibility / 1000).toFixed(1) + ' km';
    document.getElementById('clouds').textContent = data.clouds.all + '%';
    
    // Icona meteo da OpenWeatherMap
    const iconCode = data.weather[0].icon;
    document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    
    currentWeatherSection.style.display = 'block';
}

// Mostra le previsioni a 5 giorni
function displayForecast(data) {
    const forecastGrid = document.getElementById('forecastGrid');
    forecastGrid.innerHTML = '';
    
    // Raggruppa le previsioni per giorno (ogni 24 ore)
    const dailyForecasts = {};
    
    data.list.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const day = date.toLocaleDateString('it-IT', { weekday: 'short', month: 'short', day: 'numeric' });
        
        if (!dailyForecasts[day]) {
            dailyForecasts[day] = forecast;
        }
    });
    
    // Mostra i primi 5 giorni
    Object.entries(dailyForecasts).slice(0, 5).forEach(([day, forecast]) => {
        const card = document.createElement('div');
        card.className = 'forecast-card';
        
        const iconCode = forecast.weather[0].icon;
        const tempMax = Math.round(forecast.main.temp_max);
        const tempMin = Math.round(forecast.main.temp_min);
        const description = forecast.weather[0].description;
        
        card.innerHTML = `
            <div class="forecast-date">${day}</div>
            <img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="Icona meteo" class="forecast-icon">
            <div class="forecast-description">${description}</div>
            <div class="forecast-temps">
                <span class="forecast-temp-max">Max: ${tempMax}°C</span>
                <span class="forecast-temp-min">Min: ${tempMin}°C</span>
            </div>
        `;
        
        forecastGrid.appendChild(card);
    });
    
    forecastWeatherSection.style.display = 'block';
}

// Funzioni di utilità
function showLoader(show) {
    loader.style.display = show ? 'block' : 'none';
}

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    currentWeatherSection.style.display = 'none';
    forecastWeatherSection.style.display = 'none';
}

// Carica il meteo di Roma al caricamento della pagina
window.addEventListener('load', () => {
    getWeather('Roma');
});