var $animation_elements = $('.block');
var $window = $(window);

function check_if_in_view() {
    var window_height = $window.height();
    var window_top_position = $window.scrollTop();
    var window_bottom_position = (window_top_position + window_height);

    $.each($animation_elements, function () {
        var $element = $(this);
        var element_height = $element.outerHeight();
        var element_top_position = $element.offset().top;
        var element_bottom_position = (element_top_position + element_height);

        //check to see if this current container is within viewport
        if ((element_bottom_position >= window_top_position) &&
            (element_top_position <= window_bottom_position)) {
            $element.css('opacity', '1');
        } else {
            $element.css('opacity', '0');
        }
    });
}

$window.on('scroll resize', check_if_in_view);
$window.trigger('scroll');

$('.car-modal-title').html($('#carType option:selected').text());
$('#modalImg').attr('src', $('#carImage').attr('src'));

$('#carType').change(function () {
    $('#carImage').attr('src', `data/images/${$('#carType option:selected').index()}.png`);
    $('.car-modal-title').html($('#carType option:selected').text());
    $('#modalImg').attr('src', $('#carImage').attr('src'));
})


$('#datepicker').datepicker({
    // Можно выбрать тольо даты, идущие за сегодняшним днем, включая сегодня
    minDate: new Date()
})

$('.owl-carousel').owlCarousel({
    loop: true,
    margin: 20,
    center: true,
    responsiveClass: true,
    dots: true,
    autoplay:true,
    autoplayTimeout:5000,
    autoplayHoverPause:true,
    responsive: {
        0: {
            items: 1,
        },
        600: {
            items: 2,
        },
        1000: {
            items: 3,
        }
    }
});



$('#phone-number')
    .keydown(function (e) {
        var key = e.which || e.charCode || e.keyCode || 0;
        $phone = $(this);

        // Don't let them remove the starting '('
        if ($phone.val().length === 1 && (key === 8 || key === 46)) {
            $phone.val('(');
            return false;
        }
        // Reset if they highlight and type over first char.
        else if ($phone.val().charAt(0) !== '(') {
            $phone.val('(' + String.fromCharCode(e.keyCode) + '');
        }

        // Auto-format- do not expose the mask as the user begins to type
        if (key !== 8 && key !== 9) {
            if ($phone.val().length === 3) {
                $phone.val($phone.val() + ')');
            }
            if ($phone.val().length === 4) {
                $phone.val($phone.val() + ' ');
            }
            if ($phone.val().length === 8) {
                $phone.val($phone.val() + '-');
            }
            if ($phone.val().length === 11) {
                $phone.val($phone.val() + '-');
            }
        }

        // Allow numeric (and tab, backspace, delete) keys only
        return (key == 8 ||
            key == 9 ||
            key == 46 ||
            (key >= 48 && key <= 57) ||
            (key >= 96 && key <= 105));
    })

    .bind('focus click', function () {
        $phone = $(this);

        if ($phone.val().length === 0) {
            $phone.val('(');
        }
        else {
            var val = $phone.val();
            $phone.val('').val(val); // Ensure cursor remains at the end
        }
    })

    .blur(function () {
        $phone = $(this);

        if ($phone.val() === '(') {
            $phone.val('');
        }
    });



//----- Maps Scripts Start -----//
var navigationMap;
var startPoint = false;
var endPoint = false;
var distance = 0;
var path;




function initMaps() {
    navigationMap = new ymaps.Map("map", {
        center: [41.299496, 69.240073],
        zoom: 14,
        controls: ['smallMapDefaultSet']
    }, 
    {
        restrictMapArea: [
            [41.419603, 69.1003223],
            [41.218096,69.4896933]
        ]
    },
    { searchControlProvider: 'yandex#search' }
    
);

    navigationMap.behaviors.disable('scrollZoom'); 

    navigationMap.controls.add('geolocationControl');
    navigationMap.controls.remove('searchControl');
    navigationMap.controls.add('zoomControl');

    navigationMap.events.add('click', function (event) {
        var coords = event.get('coords');
        if (startPoint === false) {
            startPoint = new ymaps.Placemark(coords, { balloonContent: 'Пункт А' }, {
                draggable: true,
                preset: 'islands#redHomeIcon',
                iconColor: '#F44336'
            });
            navigationMap.geoObjects.add(startPoint);

            startPoint.events.add('dragend', function () {
                setPoint(startPoint);
            });

            setPoint(startPoint);
            return;
        }
        if (endPoint === false) {
            endPoint = new ymaps.Placemark(coords, { balloonContent: 'Пункт B' }, {
                draggable: true,
                preset: 'islands#redGovernmentIcon',
                iconColor: '#2179CA'
            });
            navigationMap.geoObjects.add(endPoint);

            endPoint.events.add('dragend', function () {
                setPoint(endPoint);
            });

            setPoint(endPoint);
        }
    })
}

function setPoint(placemark) {
    var coords = placemark.geometry.getCoordinates();
    ymaps.geocode(coords).then(function (res) {
        var firstGeoObject = res.geoObjects.get(0);
        if (placemark === startPoint) {
            document.getElementById("trucking_address_a").value = firstGeoObject.getAddressLine();
            document.getElementById("trucking_point_a").value = coords;
        }
        if (placemark === endPoint) {
            document.getElementById("trucking_address_b").value = firstGeoObject.getAddressLine();
            document.getElementById("trucking_point_b").value = coords;
        }
    });
    drawPath();
}

function drawPath() {
    if (startPoint === false || endPoint === false)
        return;

    navigationMap.geoObjects.remove(path);

    ymaps.route([startPoint.geometry.getCoordinates(), endPoint.geometry.getCoordinates()], {
        mapStateAutoApply: true,
        multiRoute: false
    }).then(function (route) {
        path = route;
        distance = (route.getLength() / 1000).toFixed(2);
        navigationMap.geoObjects.add(route);
        path.getWayPoints().removeAll();
        document.getElementById("trucking_distance").value = distance;
        calculate();
    }, function (error) {
        alert("Возникла ошибка: " + error.message);
    }
    );
}

function setStartPoint() {
    if (startPoint !== false) {
        navigationMap.geoObjects.remove(startPoint);
        navigationMap.geoObjects.remove(path);
        startPoint = false;
        path = null;
        document.getElementById("trucking_address_a").value =
            document.getElementById("trucking_point_a").value = "";
    }
}

function setEndPoint() {
    if (endPoint !== false) {
        navigationMap.geoObjects.remove(endPoint);
        navigationMap.geoObjects.remove(path);
        endPoint = false;
        path = null;
        document.getElementById("trucking_address_b").value =
            document.getElementById("trucking_point_b").value = "";
    }
}

function refreshTrucking() {
    document.getElementById("number_of_movers").value = 0;
    document.getElementById("rent_hours").value = 1;
    document.getElementById("trucking_address_a").value =
        document.getElementById("trucking_address_b").value = "";
    startPoint = endPoint = false;
    navigationMap.geoObjects.removeAll();
    document.getElementById("trucking_distance").value = 0;
    document.getElementById("total_price").value = "";
}

var city_tariff = 10000;
var country_tariff = 20000;
var tariff = city_tariff;
var MIN_COST = 10000; 
var delivery_tariff = 2000;

function changeTariff(event){
    tariff = event.value === 'city' ? city_tariff : country_tariff; 
    calculate();
};

function typeOfCar(event){
    var carType = event.value;
    calculate();
}


function calculate(){
    var rent_time = document.getElementById('rent_hours').value;
    var number_of_movers = parseInt(document.getElementById('number_of_movers').value);
    var carType = document.getElementById('carType').value;

    overall_price = number_of_movers * 10000 + tariff + Math.max(distance * delivery_tariff, MIN_COST) + rent_time * carType;

    document.getElementById('total_price').value = commafy(overall_price);

    return overall_price;
}


function commafy( num ) {
    var str = num.toString().split('.');
    if (str[0].length >= 5) {
        str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
    }
    if (str[1] && str[1].length >= 5) {
        str[1] = str[1].replace(/(\d{3})/g, '$1 ');
    }
    return str.join('.');
}

ymaps.ready(initMaps);
//----- Maps Scripts End -----//
