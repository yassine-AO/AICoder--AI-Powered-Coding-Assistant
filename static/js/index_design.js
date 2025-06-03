document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');
    const scrollToTop = document.getElementById('scroll-to-top');
    const logo = document.getElementById('logo');
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-link');

    // Handle navbar transparency and color inversion
    const handleScroll = () => {
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;

        // Show/hide scroll-to-top button
        if (scrollPosition > windowHeight / 2) {
            scrollToTop.classList.add('show');
        } else {
            scrollToTop.classList.remove('show');
        }

        // Handle color inversion
        if (scrollPosition > windowHeight / 2) {
            document.body.classList.add('inverted');
            navbar.classList.add('inverted');
            navbar.style.backgroundColor = 'rgba(0, 0, 0, 1)';
            logo.style.display = 'block';
        } else {
            document.body.classList.remove('inverted');
            navbar.classList.remove('inverted');
            navbar.style.backgroundColor = scrollPosition > 50 ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.9)';
            logo.style.display = 'none';
        }
    };

    window.addEventListener('scroll', handleScroll);

    // Smooth scrolling for navigation links
    navLinks.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 70, // Account for fixed navbar
                    behavior: 'smooth'
                });
                // Close mobile menu after clicking a link
                const navbarCollapse = document.querySelector('.navbar-collapse');
                if (navbarCollapse.classList.contains('show')) {
                    navbarCollapse.classList.remove('show');
                }
            }
        });
    });

    // Smooth scroll to top
    scrollToTop.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

});








const changingPhrase = document.getElementById('changing-phrase');
const star = document.getElementById('star');

const phrases = [
    'Instant fixes for cleaner code.',
    ' Fetch data, fuel innovation.',
    'Streamline Your Assessments',
    'Solve issues before they compile',
    'Code smarter, not harder'
];

let currentPhraseIndex = 0;

function changePhrase() {
    changingPhrase.classList.add('fade');
    setTimeout(() => {
        currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
        changingPhrase.textContent = phrases[currentPhraseIndex];
        changingPhrase.classList.remove('fade');
    }, 500);
}

// Initial phrase and star position
changingPhrase.textContent = phrases[currentPhraseIndex];

// Start the animations
setInterval(changePhrase, 4000);
