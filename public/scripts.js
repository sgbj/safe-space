var nav = document.querySelector('nav');
var hamburger = document.getElementById('hamburger');

hamburger.onclick = function (e) {
    if (nav.classList.contains('active')) {
        nav.classList.remove('active');
    } else {
        nav.classList.add('active');
    }
    e.preventDefault();
};