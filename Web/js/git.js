const apiEndpoints = {
    routes: 'http://exam-2023-1-api.std-900.ist.mospolytech.ru/api/routes?api_key=45e5f6f1-a24c-4ec7-aae9-56a2e9b375aa',
    guides: 'http://exam-2023-1-api.std-900.ist.mospolytech.ru/api/routes/{id-маршрута}/guides?api_key=45e5f6f1-a24c-4ec7-aae9-56a2e9b375aa',
    orders: 'http://exam-2023-1-api.std-900.ist.mospolytech.ru/api/orders?api_key=45e5f6f1-a24c-4ec7-aae9-56a2e9b375aa'
};

const xhr = new XMLHttpRequest();
let orderDetails = {
    guide_id: 0,
    route_id: 0,
    date: '',
    time: '',
    duration: 0,
    persons: 0,
    price: 0,
    optionFirst: false,
    optionSecond: false
};

function sendRequest(method, url, data = null) {
    return new Promise((resolve, reject) => {
        xhr.open(method, url)
        xhr.responseType = 'json'
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
        xhr.onload = () => {
            if (xhr.status >= 400) {
                reject(xhr.response)
            } else {  
                resolve(xhr.response)
            }
        }
        xhr.onerror = () => {
            reject(xhr.response)
        }

        if (data && typeof data === 'object') {
            const encodedData = Object.keys(data)
                .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
                .join('&');
            xhr.send(encodedData);
        } else {
            xhr.send();
        }
    })
}

let currentPage = 1;
const maxRows = 10;
let displayedRoutes = [];

function displayRoutes(page) {
    const first = (page - 1) * maxRows;
    const last = first + maxRows;
    const routesToDisplay = displayedRoutes.slice(first, last);
    const routesTable = document.getElementById('routesTable');
    routesTable.innerHTML = '';
    routesToDisplay.forEach(route => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${route.name}</td>
            <td>${route.description.length > 80 ? `${route.description.substring(0, 80)}... <a href="#" class="tooltip-wide" data-bs-toggle="tooltip" title="${route.description}">читать полностью</a>` : route.description}</td>
            <td>${route.mainObject.length > 80 ? `${route.mainObject.substring(0, 80)}... <a href="#" class="tooltip-wide" data-bs-toggle="tooltip" title="${route.mainObject}">читать полностью</a>` : route.mainObject}</td>
            <td><button class="btn btn-light" id="selectButton" onclick="selectRoute(event, '${route.name}', '${route.id}')">Выбрать</button></td>
        `;
        routesTable.appendChild(row);
    });

    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });
}

function setupPagination(totalPages) {
    const paginationContainer = document.getElementById('paginationButtons');
    paginationContainer.innerHTML = '';
    const ul = document.createElement('ul');
    ul.classList.add('pagination');
    ul.className += ' justify-content-center';
  
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.classList.add('page-item');
        const button = document.createElement('button');
        button.textContent = i;
        button.classList.add('page-link');
        button.onclick = function() {
            currentPage = i;
            displayRoutes(currentPage);
        };
        li.appendChild(button); 
        ul.appendChild(li);
    }
    paginationContainer.appendChild(ul);
}

function nextButton() {
    if (currentPage < Math.ceil(displayedRoutes.length / maxRows)) {
        currentPage++;
        displayRoutes(currentPage);
    }
}

function prevButton() {
    if (currentPage > 1) {
        currentPage--;
        displayRoutes(currentPage);
    }
}

function showRoutes() {
    sendRequest('GET', apiEndpoints.routes)
    .then(data => {
        displayedRoutes = data;
        const totalPages = Math.ceil(displayedRoutes.length / maxRows);
        const next = document.getElementById('next');
        const prev = document.getElementById('prev');

        displayRoutes(currentPage);
        setupPagination(totalPages);
        next.setAttribute('onclick', 'nextButton()');
        prev.setAttribute('onclick', 'prevButton()');
    }) 
}

showRoutes();

function selectRoute(event, name, id) {
    const table_td = document.querySelectorAll('#routesTable td');
    const table_btn = document.querySelectorAll('#routesTable button');
    const table_a = document.querySelectorAll('#routesTable a');
    const orderBtn = document.getElementById('orderBtn');
    let selected = event.target.parentElement.parentElement;

    table_td.forEach(row => {
        row.style.backgroundColor = '';
    });

    table_btn.forEach(row => {
        row.style.backgroundColor = '';
    });

    table_a.forEach(row => {
        row.style.backgroundColor = '';
    });

    selected.querySelectorAll('*').forEach(child => {
        child.style.backgroundColor = '#c8c8c8';
    });

    orderBtn.classList.add('disabled');
    document.querySelector('#routeName').innerText = `${name}`;

    showGuides(event, name, id);
}

function showGuides(event, routeName, routeId) {
    var activeGuides = document.querySelector('.guides');
    activeGuides.classList.add('active');
    const modifiedGuidesApi = apiEndpoints.guides.replace('{id-маршрута}', `${routeId}`);
    sendRequest('GET', modifiedGuidesApi)
    .then(data => {
        const guidesTable = document.getElementById('guidesTable'); 
        guidesTable.innerHTML = '';
        data.forEach(guide => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><i class="bi bi-file-person" style="font-size: 25px !important;"></i></td>
                <td>${guide.name}</td>
                <td>${guide.language}</td>
                <td>${guide.workExperience}</td>
                <td>${guide.pricePerHour} руб.</td>
                <td><button class="btn btn-light" id="selectButton" onclick="selectGuide(event, '${routeName}', '${guide.name}', '${routeId}', '${guide.id}', '${guide.pricePerHour}')">Выбрать</button></td>
            `;
            guidesTable.appendChild(row);
        });
    })
}

let initialPrice = 0;
const quantityInput = document.getElementById("quantity");
const option1Checkbox = document.getElementById("option1");
const option2Checkbox = document.getElementById("option2");
const durationSelect = document.getElementById("duration");
const timeInput = document.getElementById("time");
const dateInput = document.getElementById("date");
const totalCostDisplay = document.getElementById("totalCost");
const sendOrderButton = document.getElementById('send');

function selectGuide(event, routeName, guideName, routeId, guideId, price) {
    const table_td = document.querySelectorAll('#guidesTable td');
    const table_btn = document.querySelectorAll('#guidesTable button');
    const table_a = document.querySelectorAll('#guidesTable a');
    const table_svg = document.querySelectorAll('#guidesTable svg');
    const orderBtn = document.getElementById('orderBtn');
    let selected = event.target.parentElement.parentElement;

    table_td.forEach(row => {
        row.style.backgroundColor = '';
    });

    table_btn.forEach(row => {
        row.style.backgroundColor = '';
    });

    table_a.forEach(row => {
        row.style.backgroundColor = '';
    });

    table_svg.forEach(row => {
        row.style.backgroundColor = '';
    });

    selected.querySelectorAll('*').forEach(child => {
        child.style.backgroundColor = '#c8c8c8';
    });

    document.querySelector('#guideName').innerText = `${guideName}`;
    document.querySelector('#routeName1').innerText = `${routeName}`;
    orderBtn.classList.remove('disabled');

    initialPrice = parseInt(price);
    orderDetails.guide_id = parseInt(guideId);
    orderDetails.route_id = parseInt(routeId);
    totalCostDisplay.innerHTML = `${parseInt(initialPrice)} руб.`;
}

function setExcludedDates() {
    var today = new Date();
    var dd = today.getDate() + 1;
    var mm = today.getMonth() + 1;
    var yyyy = today.getFullYear();
    if(dd < 10){
      dd='0' + dd
    } 
    if(mm < 10){
      mm='0' + mm
    } 
    today = yyyy + '-' + mm + '-' + dd;
    dateInput.setAttribute("min", today);
    dateInput.setAttribute("value", today);
}

setExcludedDates();

function updateTotalPrice(guideCost) {
    const persons = parseInt(quantityInput.value);
    let increase = 0;

    if (persons > 5 && persons <= 10) {
        increase = 1000;
    } else if (persons > 10 && persons <= 20) {
        increase = 1500;
    }

    const durationValue = durationSelect.value;
    const selectedDate = new Date(dateInput.value);
    const selectedTime = new Date(`1970-01-01T${timeInput.value}:00`);
    const hours = ('0' + selectedTime.getHours()).slice(-2);
    const minutes = ('0' + selectedTime.getMinutes()).slice(-2);
    const week = selectedDate.getDay();

    let totalPrice = guideCost * durationValue + increase;

    if (week === 6 || week === 0) {
        totalPrice = (1.5 * guideCost * durationValue) + increase;
    }

    if (option1Checkbox.checked) {
        totalPrice *= 0.75;
        orderDetails.optionFirst = true;
    }

    if  (option2Checkbox.checked) {
        orderDetails.optionSecond = true;
        if (week === 6 || week === 0) {
            totalPrice *= 1.25;
        }
        else {
            totalPrice *= 1.30;
        }
    }

    if (selectedTime.getHours() >= 9 && selectedTime.getHours() < 12) {
        totalPrice += 400;
    }

    orderDetails.date = selectedDate.toISOString().split('T')[0];
    orderDetails.time = `${hours}:${minutes}`;
    orderDetails.duration = parseInt(durationValue);
    orderDetails.persons = parseInt(persons);
    orderDetails.price = parseInt(totalPrice);

    totalCostDisplay.innerHTML = `${parseInt(totalPrice)} руб.`;
}

function updateOrderDetails() { 
    updateTotalPrice(initialPrice);
}

quantityInput.addEventListener('input', updateOrderDetails);
dateInput.addEventListener('input', updateOrderDetails);
timeInput.addEventListener('input', updateOrderDetails);
option1Checkbox.addEventListener('click', updateOrderDetails);
option2Checkbox.addEventListener('click', updateOrderDetails);
durationSelect.addEventListener('change', updateOrderDetails);    
sendOrderButton.addEventListener('submit', submitOrder);

function submitOrder(event) {
    event.preventDefault();
    sendRequest('POST', apiEndpoints.orders, orderDetails)
    .then(response => {
        console.log('Order placed successfully:', response);

        const alert = document.getElementById('alert');
        alert.classList.add('active');
        setTimeout(() => {
            alert.classList.remove('active');
        }, 5000);
        console.log(orderDetails);
    })
    .catch(error => {
        console.error('Error placing order:', error);
    });
}
