window.onload = function () {

    let map;
    let marker;

    // 지도 생성
    function initMap() {

        const container = document.getElementById("map");

        const options = {

            center: new kakao.maps.LatLng(37.50136, 127.0396),

            level: 3

        };

        map = new kakao.maps.Map(container, options);

        marker = new kakao.maps.Marker({

            position: options.center,
            map: map

        });

    }

    initMap();

    // 현재 위치 가져오기
    function moveToCurrentLocation() {

        if (!navigator.geolocation) {

            alert("현재 위치를 지원하지 않는 브라우저입니다.");
            return;

        }

        navigator.geolocation.getCurrentPosition(

            function (position) {

                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                const current = new kakao.maps.LatLng(lat, lng);

                map.setCenter(current);

                marker.setPosition(current);

            },

            function () {

                alert("현재 위치를 가져올 수 없습니다.");

            }

        );

    }

    moveToCurrentLocation();

};