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