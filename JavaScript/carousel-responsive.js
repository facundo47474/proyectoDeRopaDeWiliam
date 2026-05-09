/**
 * CARRUSEL DE FOTOS RESPONSIVO
 * Función reutilizable para inicializar carruseles en diferentes partes de la página
 */

function initMobileCarousel(carouselId) {
    const carousel = document.querySelector(`#${carouselId}`);
    
    if (!carousel) {
        console.warn(`Carrusel con ID ${carouselId} no encontrado`);
        return;
    }

    const screen = carousel.querySelector(".mobile-device-screen");
    const slides = Array.from(carousel.querySelectorAll(".mobile-slide"));
    const dotsContainer = carousel.querySelector(".mobile-dots");

    if (!screen || slides.length === 0) {
        console.warn(`Estructura incompleta en carrusel ${carouselId}`);
        return;
    }

    let currentIndex = 0;
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let isAnimating = false;

    const swipeLimit = 55;

    /* ============================= */
    /* CREAR DOTS */
    /* ============================= */

    slides.forEach((_, index) => {
        const dot = document.createElement("button");
        dot.classList.add("mobile-dot");
        dot.setAttribute("type", "button");
        dot.setAttribute("aria-label", `Ir a imagen ${index + 1}`);

        if (index === currentIndex) {
            dot.classList.add("active");
        }

        dot.addEventListener("click", () => {
            if (index === currentIndex || isAnimating) return;
            goToSlide(index);
        });

        dotsContainer.appendChild(dot);
    });

    const dots = Array.from(dotsContainer.querySelectorAll(".mobile-dot"));

    /* ============================= */
    /* ACTUALIZAR ESTADO */
    /* ============================= */

    function updateDots() {
        dots.forEach((dot, index) => {
            dot.classList.toggle("active", index === currentIndex);
        });
    }

    function cleanClasses() {
        slides.forEach((slide) => {
            slide.classList.remove(
                "active",
                "prev-out",
                "next-out",
                "prev-in",
                "next-in"
            );
        });
    }

    /* ============================= */
    /* CAMBIAR SLIDE */
    /* ============================= */

    function goToSlide(newIndex) {
        if (isAnimating) return;

        const oldIndex = currentIndex;

        if (newIndex < 0) {
            newIndex = slides.length - 1;
        }

        if (newIndex >= slides.length) {
            newIndex = 0;
        }

        if (newIndex === oldIndex) return;

        isAnimating = true;

        const oldSlide = slides[oldIndex];
        const newSlide = slides[newIndex];

        const goingForward =
            newIndex > oldIndex ||
            (oldIndex === slides.length - 1 && newIndex === 0);

        slides.forEach((slide) => {
            slide.classList.remove(
                "prev-out",
                "next-out",
                "prev-in",
                "next-in"
            );
        });

        if (goingForward) {
            newSlide.classList.add("next-in");

            requestAnimationFrame(() => {
                oldSlide.classList.remove("active");
                oldSlide.classList.add("prev-out");

                newSlide.classList.remove("next-in");
                newSlide.classList.add("active");
            });
        } else {
            newSlide.classList.add("prev-in");

            requestAnimationFrame(() => {
                oldSlide.classList.remove("active");
                oldSlide.classList.add("next-out");

                newSlide.classList.remove("prev-in");
                newSlide.classList.add("active");
            });
        }

        currentIndex = newIndex;
        updateDots();

        setTimeout(() => {
            cleanClasses();
            slides[currentIndex].classList.add("active");
            isAnimating = false;
        }, 460);
    }

    function nextSlide() {
        goToSlide(currentIndex + 1);
    }

    function prevSlide() {
        goToSlide(currentIndex - 1);
    }

    /* ============================= */
    /* SWIPE TOUCH / MOUSE */
    /* ============================= */

    function onStart(clientX) {
        if (isAnimating) return;

        isDragging = true;
        startX = clientX;
        currentX = clientX;

        screen.classList.add("is-dragging");
    }

    function onMove(clientX) {
        if (!isDragging || isAnimating) return;
        currentX = clientX;
    }

    function onEnd() {
        if (!isDragging || isAnimating) return;

        const diff = currentX - startX;

        if (diff > swipeLimit) {
            nextSlide();
        } else if (diff < -swipeLimit) {
            prevSlide();
        }

        isDragging = false;
        screen.classList.remove("is-dragging");
    }

    /* Touch */
    screen.addEventListener(
        "touchstart",
        (event) => {
            onStart(event.touches[0].clientX);
        },
        { passive: true }
    );

    screen.addEventListener(
        "touchmove",
        (event) => {
            onMove(event.touches[0].clientX);
        },
        { passive: true }
    );

    screen.addEventListener("touchend", onEnd);

    /* Mouse */
    screen.addEventListener("mousedown", (event) => {
        event.preventDefault();
        onStart(event.clientX);
    });

    window.addEventListener("mousemove", (event) => {
        onMove(event.clientX);
    });

    window.addEventListener("mouseup", onEnd);

    /* ============================= */
    /* TECLADO OPCIONAL */
    /* ============================= */

    document.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight") {
            nextSlide();
        }

        if (event.key === "ArrowLeft") {
            prevSlide();
        }
    });

    /* ============================= */
    /* INICIALIZACIÓN */
    /* ============================= */

    cleanClasses();
    slides[currentIndex].classList.add("active");
    updateDots();
}
