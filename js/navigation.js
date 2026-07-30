let map;
let currentPosition;
let currentMarker;
let routePolyline;
let destinationMarker;
let startMarker;
let searchHistory = [];

const placeService = new kakao.maps.services.Places();
const KAKAO_REST_KEY = '573c375f1fc5fb520c1b8d462ed7283f';

function initNavigationSearch() {
    const searchInput = document.getElementById('nav-search-input');
    const searchButton = document.getElementById('nav-search-button');

    if (searchButton) {
        searchButton.addEventListener('click', searchPlace);
    }

    if (searchInput) {
        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                searchPlace();
            }
        });
        searchInput.addEventListener('input', updateAutocomplete);
        searchInput.addEventListener('focus', updateAutocomplete);
    }

    document.addEventListener('click', (event) => {
        const list = document.getElementById('autocomplete-list');
        if (list && !list.contains(event.target) && event.target.id !== 'nav-search-input') {
            list.classList.add('hidden');
        }
    });

    loadSearchHistory();
    initMap();
    moveToCurrentLocation();
}

function initMap() {
    const container = document.getElementById('nav-map');
    const options = {
        center: new kakao.maps.LatLng(37.50136, 127.0396),
        level: 4
    };

    map = new kakao.maps.Map(container, options);

    currentMarker = new kakao.maps.Marker({
        position: options.center,
        map,
        title: '현재 위치'
    });
}

function moveToCurrentLocation() {
    if (!navigator.geolocation) {
        alert('현재 위치를 지원하지 않는 브라우저입니다.');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            currentPosition = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            const currentLatLng = new kakao.maps.LatLng(currentPosition.lat, currentPosition.lng);
            map.setCenter(currentLatLng);
            currentMarker.setPosition(currentLatLng);
        },
        () => {
            alert('현재 위치를 가져올 수 없습니다. 기본 위치로 표시됩니다.');
        }
    );
}

function searchPlace(keywordInput) {
    const keyword = keywordInput || document.getElementById('nav-search-input').value;
    const resultArea = document.querySelector('.search-result');
    const autocompleteList = document.getElementById('autocomplete-list');

    if (!keyword || !keyword.trim()) {
        alert('검색어를 입력해주세요.');
        return;
    }

    if (resultArea) {
        resultArea.innerHTML = '<p class="empty-message">검색 중입니다...</p>';
    }

    if (autocompleteList) {
        autocompleteList.classList.add('hidden');
    }

    saveSearchHistory(keyword);
    placeService.keywordSearch(keyword, placeSearchCallback);
}

function placeSearchCallback(data, status) {
    const resultArea = document.querySelector('.search-result');

    if (!resultArea) {
        return;
    }

    if (status === kakao.maps.services.Status.OK) {
        resultArea.innerHTML = '';
        data.forEach((place) => {
            const address = place.road_address_name || place.address_name || '주소 정보 없음';
            const itemHtml = `
                <div class="item" data-lat="${place.y}" data-lng="${place.x}" data-name="${place.place_name}">
                    <div class="place-name">${place.place_name}</div>
                    <div class="place-address">${address}</div>
                </div>
            `;
            resultArea.insertAdjacentHTML('beforeend', itemHtml);
        });

        document.querySelectorAll('.search-result .item').forEach((item, index) => {
            item.addEventListener('click', () => {
                const lat = parseFloat(item.dataset.lat);
                const lng = parseFloat(item.dataset.lng);
                const name = item.dataset.name;
                drawRoute({ y: lat, x: lng, place_name: name });
            });
        });
    } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        resultArea.innerHTML = '<p class="empty-message">검색 결과가 없습니다.</p>';
    } else {
        resultArea.innerHTML = '<p class="empty-message">검색 중 오류가 발생했습니다.</p>';
    }
}

function loadSearchHistory() {
    try {
        const history = localStorage.getItem('navSearchHistory');
        searchHistory = history ? JSON.parse(history) : [];
    } catch (e) {
        searchHistory = [];
    }
}

function saveSearchHistory(keyword) {
    const normalized = keyword.trim();
    if (!normalized) return;

    const existingIndex = searchHistory.findIndex((item) => item === normalized);
    if (existingIndex !== -1) {
        searchHistory.splice(existingIndex, 1);
    }

    searchHistory.unshift(normalized);
    if (searchHistory.length > 10) {
        searchHistory = searchHistory.slice(0, 10);
    }

    localStorage.setItem('navSearchHistory', JSON.stringify(searchHistory));
}

function updateAutocomplete() {
    const input = document.getElementById('nav-search-input');
    const list = document.getElementById('autocomplete-list');
    const query = input.value.trim().toLowerCase();

    if (!list) return;
    if (!query) {
        list.classList.add('hidden');
        list.innerHTML = '';
        return;
    }

    const matched = searchHistory.filter((item) => item.toLowerCase().includes(query));
    if (matched.length === 0) {
        list.classList.add('hidden');
        list.innerHTML = '';
        return;
    }

    list.innerHTML = matched.map((item) => `
        <div class="autocomplete-item" data-value="${item}">
            <div class="autocomplete-title">${item}</div>
        </div>
    `).join('');
    list.classList.remove('hidden');

    document.querySelectorAll('.autocomplete-item').forEach((item) => {
        item.addEventListener('click', () => {
            const value = item.dataset.value;
            const inputField = document.getElementById('nav-search-input');
            inputField.value = value;
            list.classList.add('hidden');
            searchPlace(value);
        });
    });
}

function searchPlace(keywordInput) {
    const keyword = keywordInput || document.getElementById('nav-search-input').value;
    const resultArea = document.querySelector('.search-result');
    const autocompleteList = document.getElementById('autocomplete-list');

    if (!keyword || !keyword.trim()) {
        alert('검색어를 입력해주세요.');
        return;
    }

    if (resultArea) {
        resultArea.innerHTML = '<p class="empty-message">검색 중입니다...</p>';
    }

    if (autocompleteList) {
        autocompleteList.classList.add('hidden');
    }

    saveSearchHistory(keyword);
    placeService.keywordSearch(keyword, placeSearchCallback);
}

function drawRoute(place) {
    if (!currentPosition) {
        alert('현재 위치를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
        return;
    }

    const origin = `${currentPosition.lng},${currentPosition.lat}`;
    const destination = `${place.x},${place.y}`;

    if (routePolyline) {
        routePolyline.setMap(null);
    }
    if (destinationMarker) {
        destinationMarker.setMap(null);
    }
    if (startMarker) {
        startMarker.setMap(null);
    }

    startMarker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(currentPosition.lat, currentPosition.lng),
        map,
        title: '출발지'
    });

    destinationMarker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(place.y, place.x),
        map,
        title: place.place_name
    });

    fetch(`https://apis-navi.kakaomobility.com/v1/directions?origin=${origin}&destination=${destination}`, {
        headers: {
            Authorization: `KakaoAK ${KAKAO_REST_KEY}`
        }
    })
        .then((response) => response.json())
        .then((data) => {
            const sections = data.routes?.[0]?.sections;
            if (!sections || sections.length === 0) {
                throw new Error('경로를 찾을 수 없습니다.');
            }

            const roads = sections[0].roads;
            const path = [];
            roads.forEach((road) => {
                for (let i = 0; i < road.vertexes.length; i += 2) {
                    const lng = road.vertexes[i];
                    const lat = road.vertexes[i + 1];
                    path.push(new kakao.maps.LatLng(lat, lng));
                }
            });

            routePolyline = new kakao.maps.Polyline({
                map,
                path,
                strokeWeight: 5,
                strokeColor: '#FF0000',
                strokeOpacity: 0.9,
                strokeStyle: 'solid'
            });

            const bounds = new kakao.maps.LatLngBounds();
            path.forEach((point) => bounds.extend(point));
            map.setBounds(bounds);
        })
        .catch((error) => {
            console.error('경로 API 오류', error);
            alert('경로를 불러오는 중 오류가 발생했습니다.');
        });
}

window.addEventListener('load', initNavigationSearch);
