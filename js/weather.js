// Weather UI behavior moved from weather-1.html
// Requires: axios (CDN) and ../config.js to be included before this script in the page

// Header clock and user info
function updateClock() {
	const now = new Date();
	const opts = { month: 'numeric', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' };
	const el = document.getElementById('currentDate');
	if (el) el.textContent = now.toLocaleString('ko-KR', opts);
}
updateClock();
setInterval(updateClock, 60_000);

// Simple active state for bottom nav
document.addEventListener('click', (e) => {
	const btn = e.target.closest('.nav-btn');
	if (!btn) return;
	document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
	btn.classList.add('active');
});

// Read API key — prefer `weather_api_key` set in config.js, fall back to API_KEY
const API_KEY = window.weather_api_key || window.API_KEY || 'REPLACE_WITH_YOUR_API_KEY';

function iconUrlFor(code) {
	switch (true) {
		case /01/.test(code): return '../images/clear.png';
		case /02|03/.test(code): return '../images/clouds.png';
		case /04/.test(code): return '../images/broken_clouds.png';
		case /09|10/.test(code): return '../images/rain.png';
		case /11/.test(code): return '../images/thunderstorm.png';
		case /13/.test(code): return '../images/snow.png';
		case /50/.test(code): return '../images/mist.png';
		default: return '../images/clear.png';
	}
}

async function getWeather() {
	const useDummy = !API_KEY || API_KEY.startsWith('REPLACE') || API_KEY.length < 10;
	const fallbackCity = 'Seoul';
	console.log('weather: API_KEY present?', !!API_KEY, 'useDummy=', useDummy);
	if (useDummy) {
		const dummy = generateDummyData(fallbackCity);
		renderWeatherInteractive(dummy);
		return;
	}

	let url;
	try {
		const pos = await new Promise((res, rej) => {
			if (!navigator.geolocation) return rej(new Error('geolocation unsupported'));
			navigator.geolocation.getCurrentPosition(p => res(p.coords), () => rej(new Error('permission denied')),{timeout:5000});
		});
		url = `https://api.openweathermap.org/data/2.5/forecast?lat=${pos.latitude}&lon=${pos.longitude}&appid=${API_KEY}&units=metric&lang=kr`;
	} catch (e) {
		url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(fallbackCity)}&appid=${API_KEY}&units=metric&lang=kr`;
	}

	try {
		console.log('weather: fetching url=', url);
		const res = await axios.get(url);
		console.log('weather: api response status=', res.status);
		const data = res.data;
		renderWeatherInteractive(data);
	} catch (error) {
		console.error('API error, falling back to dummy data:', error && error.message, error && error.response && error.response.data);
		const dummy = generateDummyData(fallbackCity);
		renderWeatherInteractive(dummy);
	}
}

function generateDummyData(cityName) {
	const now = new Date();
	const hour = now.getHours();
	const nextSlotHour = Math.ceil((hour+1)/3)*3 % 24;
	const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), nextSlotHour, 0, 0);
	const icons = ['01d','02d','03d','04d','09d','10d','11d','13d','50d'];
	const list = [];
	let tempBase = 20;
	for (let i=0;i<5*8;i++) {
		const dt = new Date(start.getTime() + i*3*60*60*1000);
		const t = tempBase + Math.sin(i/4)*6 + (Math.random()-0.5)*2;
		const humidity = 50 + Math.round((Math.random()*30));
		const wind = (Math.random()*3 + 1).toFixed(1);
		const icon = icons[i % icons.length];
		const desc = {
			'01d':'맑음','02d':'구름 조금','03d':'구름','04d':'흐림','09d':'약한 비','10d':'비','11d':'뇌우','13d':'눈','50d':'안개'
		}[icon] || '맑음';

		list.push({
			dt: Math.floor(dt.getTime()/1000),
			dt_txt: dt.toISOString().replace('T',' ').slice(0,19),
			main: { temp: Math.round(t*10)/10, humidity },
			weather: [{ icon, description: desc }],
			wind: { speed: Number(wind) }
		});
	}
	return { city: { name: cityName }, list };
}

// Render interactive main display + mini cards + hourly details
function renderWeatherInteractive(data) {
	const container = document.getElementById('result');
	if (!container) return;
	const now = new Date();
	const dateLabel = `현재 ${now.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })} ${now.toLocaleDateString('ko-KR', { weekday: 'short' })}`;
	container.innerHTML = `
		<div class="main-display">
			<div class="main-left">
				<div class="display-date">${dateLabel}</div>
				<div class="city-name">${data.city.name}</div>
				<div class="big-desc" id="mainDesc"></div>
				<div class="main-stats" id="mainStats"></div>
			</div>
			<div class="main-right">
				<div class="big-temp" id="mainTemp">--°C</div>
				<img class="big-icon" id="mainIcon" src="" alt="">
			</div>
		</div>
		<div class="mini-row"><div class="weather-container" id="weatherContainer"></div></div>
		<div class="day-details" id="dayDetails"></div>
	`;

	const groups = {};
	data.list.forEach(item => {
		const day = item.dt_txt.split(' ')[0];
		if (!groups[day]) groups[day] = [];
		groups[day].push(item);
	});

	const dates = Object.keys(groups).slice(0,5);
	const containerEl = document.getElementById('weatherContainer');

	dates.forEach((day, idx) => {
		const dayItems = groups[day];
		const temps = dayItems.map(i => i.main.temp);
		const minT = Math.min(...temps);
		const maxT = Math.max(...temps);
		let rep = dayItems.find(i => i.dt_txt.includes('12:00:00')) || dayItems[0];

		const dateObj = new Date(rep.dt_txt);
		// Format like "7월 31일 금요일"
		const weekdayLong = new Intl.DateTimeFormat('ko-KR', { weekday: 'long' }).format(dateObj);
		const dayNameShort = `${dateObj.getMonth()+1}월 ${dateObj.getDate()}일 ${weekdayLong}`;

		const card = document.createElement('div');
		card.className = 'weather-card' + (idx===0? ' active':'');
		card.dataset.day = day;
		card.innerHTML = `
			<div class="date">${dayNameShort}</div>
			<img class="icon" src="${iconUrlFor(rep.weather[0].icon)}" alt="${rep.weather[0].description}">
			<div class="info">${Math.round(rep.main.temp)}°C</div>
			<div class="info">${Math.round(minT)}° / ${Math.round(maxT)}°</div>
		`;

		card.addEventListener('click', () => {
			document.querySelectorAll('.weather-card').forEach(c=>c.classList.remove('active'));
			card.classList.add('active');
			updateMainDisplay(dayItems, day);
		});

		containerEl.appendChild(card);
	});

	const firstDay = dates[0];
	if (firstDay) updateMainDisplay(groups[firstDay], firstDay);
}

function collapseCard(card) {
	if (!card) return;
	const details = card.querySelector('.details');
	if (!details) return;
	card.classList.remove('expanded');
	details.style.opacity = '0';
	setTimeout(() => { details.innerHTML = ''; details.style.display = 'none'; details.style.maxHeight = '0'; }, 360);
}

function updateMainDisplay(dayItems, dayKey) {
	if (!dayItems || dayItems.length===0) return;
	const rep = dayItems.find(i => i.dt_txt.includes('12:00:00')) || dayItems[0];
	const mainTempEl = document.getElementById('mainTemp');
	const mainIconEl = document.getElementById('mainIcon');
	const mainDescEl = document.getElementById('mainDesc');
	const mainStatsEl = document.getElementById('mainStats');

	// Update the main display date to match the selected day's representative slot
	const displayDateEl = document.querySelector('.display-date');
	try {
		const dateObj = new Date(rep.dt_txt);
		const weekdayLong = new Intl.DateTimeFormat('ko-KR', { weekday: 'long' }).format(dateObj);
		const dateText = `${dateObj.getMonth()+1}월 ${dateObj.getDate()}일 ${weekdayLong}`;
		if (displayDateEl) displayDateEl.textContent = dateText;
	} catch (e) {
		// fallback: do nothing
	}

	if (mainTempEl) mainTempEl.textContent = Math.round(rep.main.temp) + '°C';
	if (mainIconEl) { mainIconEl.src = iconUrlFor(rep.weather[0].icon); mainIconEl.alt = rep.weather[0].description; }
	if (mainDescEl) mainDescEl.textContent = rep.weather[0].description;

	const temps = dayItems.map(i => i.main.temp);
	const minT = Math.min(...temps);
	const maxT = Math.max(...temps);
	const humidity = Math.round(dayItems.reduce((s,i)=>s+i.main.humidity,0)/dayItems.length);
	const wind = (dayItems.reduce((s,i)=>s+i.wind.speed,0)/dayItems.length).toFixed(1);
	if (mainStatsEl) mainStatsEl.textContent = `Min ${Math.round(minT)}° · Max ${Math.round(maxT)}° · Hum ${humidity}% · Wind ${wind} m/s`;

	renderDayDetails(dayItems);
}

function renderDayDetails(dayItems) {
	const el = document.getElementById('dayDetails');
	if (!el) return;
	el.innerHTML = '';
	dayItems.forEach(i => {
		const time = i.dt_txt.split(' ')[1].slice(0,5);
		const row = document.createElement('div');
		row.className = 'hour-row';
		row.innerHTML = `
			<div class="time">${time}</div>
			<img src="${iconUrlFor(i.weather[0].icon)}" style="width:40px;height:40px;object-fit:contain">
			<div style="flex:1">
				<div style="font-weight:600;color:#dff0ff">${i.weather[0].description}</div>
				<div style="font-size:13px;color:#bcd7e8">온도: ${Math.round(i.main.temp*10)/10}°C · 습도: ${i.main.humidity}% · 바람: ${i.wind.speed} m/s</div>
			</div>
			<div class="hour-temp">${Math.round(i.main.temp)}°C</div>
		`;
		el.appendChild(row);
	});
}

// kick off
document.addEventListener('DOMContentLoaded', () => {
	if (typeof axios === 'undefined') {
		console.warn('axios not found — ensure CDN script is included');
	}
	getWeather();
	// translate vertical wheel to horizontal scroll for the mini cards (desktop)
	const bindWheelToMiniRow = () => {
		const sc = document.querySelector('.weather-container');
		if (!sc) return;
		// avoid duplicate listeners
		if (sc._wheelBound) return;
		sc._wheelBound = true;
		sc.addEventListener('wheel', (e) => {
			if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
				e.preventDefault();
				sc.scrollLeft += e.deltaY;
			}
		}, { passive: false });
	};
	bindWheelToMiniRow();
	// re-bind after dynamic rendering
	const observer = new MutationObserver(() => bindWheelToMiniRow());
	observer.observe(document.getElementById('result') || document.body, { childList: true, subtree: true });
});

