/**
 * 현재 날짜와 시간을 갱신하는 함수
 */
function updateDateTime() {

    const now = new Date();

    // 날짜
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    // 시간
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    const second = String(now.getSeconds()).padStart(2, "0");

    const dateElement = document.getElementById("currentDate");
    const timeElement = document.getElementById("currentTime");

    if (dateElement) {
        dateElement.textContent = `${year}.${month}.${day}`;
    }

    if (timeElement) {
        timeElement.textContent = `${hour}:${minute}:${second}`;
    }
}

// 최초 실행
updateDateTime();

// 1초마다 갱신
setInterval(updateDateTime, 1000);

// ==========================
// 현재 위치 기반 헤더 날씨 표시
// ==========================
async function fetchWeatherForCoords(lat, lon) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=kr`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('weather fetch failed');
        const data = await res.json();
        const temp = Math.round(data.main.temp);
        const description = data.weather && data.weather[0] && data.weather[0].description ? data.weather[0].description : '';
        const icon = data.weather && data.weather[0] && data.weather[0].icon ? data.weather[0].icon : null;
        const iconUrl = icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : '';

        const weatherEl = document.getElementById('header-weather');
        if (weatherEl) {
            weatherEl.innerHTML = `${iconUrl ? `<img src="${iconUrl}" alt="${description}">` : ''}<div class="weather-text">${temp}°C</div>`;
        }
    } catch (e) {
        console.error('fetchWeatherForCoords error', e);
    }
}

function updateWeatherByGeolocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeatherForCoords(lat, lon);
    }, (err) => {
        console.warn('geolocation failed for weather', err);
    });
}

// 초기 호출 + 주기(10분)
updateWeatherByGeolocation();
setInterval(updateWeatherByGeolocation, 10 * 60 * 1000);