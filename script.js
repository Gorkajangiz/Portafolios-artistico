(() => {
    // Rutas: 1→2 (right), 2→3 (down), 3→4 (left), 4→5 (up)  — mecanismo original, sin tocar.
    const forwardDir = { 1: 'right', 2: 'down', 3: 'left', 4: 'up', 5: null };
    const forwardTarget = { 1: 2, 2: 3, 3: 4, 4: 5, 5: null };
    const backDir = { 1: null, 2: 'left', 3: 'up', 4: 'right', 5: 'down' };
    const backTarget = { 1: null, 2: 1, 3: 2, 4: 3, 5: 4 };

    let currentSection = 1;
    let isTransitioning = false;
    let transitionTimeout = null;

    const sections = {};
    for (let i = 1; i <= 5; i++) sections[i] = document.getElementById('section' + i);

    const viewport = document.getElementById('viewport');
    const roomIndexDots = document.querySelectorAll('#roomIndex span');
    const navLinks = document.querySelectorAll('.site-header__link');
    const siteHeader = document.getElementById('siteHeader');
    const siteBurger = document.getElementById('siteBurger');

    function updateIndicators() {
        roomIndexDots.forEach((dot, idx) => {
            dot.classList.toggle('is-active', idx + 1 === currentSection);
        });
        navLinks.forEach(link => {
            link.classList.toggle('is-active', Number(link.dataset.jump) === currentSection);
        });
    }

    function navigateTo(targetSection, direction) {
        if (isTransitioning || targetSection === null || targetSection === currentSection) return;
        isTransitioning = true;
        if (transitionTimeout) clearTimeout(transitionTimeout);

        const currentEl = sections[currentSection];
        const targetEl = sections[targetSection];

        let exitClass;
        switch (direction) {
            case 'down': exitClass = 'hidden-up'; break;
            case 'up': exitClass = 'hidden-down'; break;
            case 'right': exitClass = 'hidden-left'; break;
            case 'left': exitClass = 'hidden-right'; break;
            default: exitClass = 'hidden-up';
        }
        currentEl.classList.remove('active');
        currentEl.classList.add(exitClass);

        targetEl.classList.remove('active', 'hidden-up', 'hidden-down', 'hidden-left', 'hidden-right');
        targetEl.style.transition = 'none';
        targetEl.style.transform = '';
        targetEl.style.opacity = '';
        targetEl.style.pointerEvents = '';
        targetEl.style.zIndex = '';

        if (direction === 'right') {
            targetEl.style.transform = 'translateX(100%)';
        } else if (direction === 'left') {
            targetEl.style.transform = 'translateX(-100%)';
        } else if (direction === 'down') {
            targetEl.style.transform = 'translateY(100%)';
        } else if (direction === 'up') {
            targetEl.style.transform = 'translateY(-100%)';
        }
        targetEl.style.pointerEvents = 'none';
        targetEl.style.zIndex = '1';

        void targetEl.offsetWidth;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                targetEl.style.transition = 'transform 0.6s cubic-bezier(0.45, 0.05, 0.25, 0.95)';
                targetEl.style.transform = 'translate(0, 0)';
                targetEl.style.pointerEvents = 'auto';
                targetEl.style.zIndex = '10';
                targetEl.classList.add('active');

                const finishTransition = () => {
                    if (transitionTimeout) clearTimeout(transitionTimeout);
                    targetEl.style.transition = '';
                    targetEl.style.transform = '';
                    targetEl.style.pointerEvents = '';
                    targetEl.style.zIndex = '';
                    currentSection = targetSection;
                    updateIndicators();
                    isTransitioning = false;
                };

                targetEl.addEventListener('transitionend', () => {
                    finishTransition();
                }, { once: true });

                transitionTimeout = setTimeout(() => {
                    if (isTransitioning && currentSection !== targetSection) {
                        finishTransition();
                    }
                }, 700);
            });
        });
    }

    function goForward() {
        const dir = forwardDir[currentSection];
        if (dir && forwardTarget[currentSection]) navigateTo(forwardTarget[currentSection], dir);
    }
    function goBack() {
        const dir = backDir[currentSection];
        if (dir && backTarget[currentSection]) navigateTo(backTarget[currentSection], dir);
    }

    // Botón de entrada en la sección 1
    const btnEnter = document.getElementById('btnEnter');
    if (btnEnter) btnEnter.addEventListener('click', goForward);

    // ---------- Cabecera: salto directo a cualquier sala ----------
    // No sigue necesariamente la dirección de la brújula original: entra
    // desde la derecha si avanza en el índice de salas, desde la izquierda
    // si retrocede, conservando siempre la transición tipo diapositiva.
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const target = Number(link.dataset.jump);
            if (!target || target === currentSection) {
                closeMobileNav();
                return;
            }
            navigateTo(target, target > currentSection ? 'right' : 'left');
            closeMobileNav();
        });
    });

    function closeMobileNav() {
        siteHeader.classList.remove('is-open');
    }
    if (siteBurger) {
        siteBurger.addEventListener('click', () => {
            siteHeader.classList.toggle('is-open');
        });
    }

    // Scroll
    viewport.addEventListener('wheel', (e) => {
        // No interceptar el scroll cuando ocurre dentro de un panel que se desplaza en sí mismo
        if (e.target.closest('.terms-scroll, .pricing-row, .gallery-grid, .lightbox')) return;
        e.preventDefault();
        if (isTransitioning) return;
        const dy = e.deltaY, dx = e.deltaX;
        if (Math.abs(dy) > Math.abs(dx)) {
            if (dy > 30) {
                const dir = forwardDir[currentSection];
                if (dir && forwardTarget[currentSection]) navigateTo(forwardTarget[currentSection], dir);
            } else if (dy < -30) {
                const dir = backDir[currentSection];
                if (dir && backTarget[currentSection]) navigateTo(backTarget[currentSection], dir);
            }
        } else {
            if (dx > 30) {
                if (forwardDir[currentSection] === 'right' && forwardTarget[currentSection]) navigateTo(forwardTarget[currentSection], 'right');
                else if (backDir[currentSection] === 'right' && backTarget[currentSection]) navigateTo(backTarget[currentSection], 'right');
            } else if (dx < -30) {
                if (forwardDir[currentSection] === 'left' && forwardTarget[currentSection]) navigateTo(forwardTarget[currentSection], 'left');
                else if (backDir[currentSection] === 'left' && backTarget[currentSection]) navigateTo(backTarget[currentSection], 'left');
            }
        }
    }, { passive: false });

    // Tacto
    let touchStartX = 0, touchStartY = 0, touchHandled = false, touchInsideScrollable = false;
    viewport.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchHandled = false;
            touchInsideScrollable = !!e.target.closest('.terms-scroll, .pricing-row, .gallery-grid, .lightbox');
        }
    }, { passive: false });
    viewport.addEventListener('touchmove', e => {
        if (touchHandled || isTransitioning || touchInsideScrollable) return;
        if (e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        if (Math.abs(dx) > 50 || Math.abs(dy) > 50) {
            touchHandled = true;
            if (Math.abs(dy) > Math.abs(dx)) {
                if (dy < -50) { const d = forwardDir[currentSection]; if (d && forwardTarget[currentSection]) navigateTo(forwardTarget[currentSection], d); }
                else if (dy > 50) { const d = backDir[currentSection]; if (d && backTarget[currentSection]) navigateTo(backTarget[currentSection], d); }
            } else {
                if (dx < -50) {
                    if (forwardDir[currentSection] === 'left' && forwardTarget[currentSection]) navigateTo(forwardTarget[currentSection], 'left');
                    else if (backDir[currentSection] === 'left' && backTarget[currentSection]) navigateTo(backTarget[currentSection], 'left');
                } else if (dx > 50) {
                    if (forwardDir[currentSection] === 'right' && forwardTarget[currentSection]) navigateTo(forwardTarget[currentSection], 'right');
                    else if (backDir[currentSection] === 'right' && backTarget[currentSection]) navigateTo(backTarget[currentSection], 'right');
                }
            }
        }
    }, { passive: false });

    // Teclado
    document.addEventListener('keydown', e => {
        if (isTransitioning) return;
        if (document.getElementById('lightbox').classList.contains('is-open')) return;
        const key = e.key;
        if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(key)) return;
        e.preventDefault();
        if (key === 'ArrowRight') {
            if (forwardDir[currentSection] === 'right' && forwardTarget[currentSection]) navigateTo(forwardTarget[currentSection], 'right');
            else if (backDir[currentSection] === 'right' && backTarget[currentSection]) navigateTo(backTarget[currentSection], 'right');
        } else if (key === 'ArrowLeft') {
            if (forwardDir[currentSection] === 'left' && forwardTarget[currentSection]) navigateTo(forwardTarget[currentSection], 'left');
            else if (backDir[currentSection] === 'left' && backTarget[currentSection]) navigateTo(backTarget[currentSection], 'left');
        } else if (key === 'ArrowDown') {
            if (forwardDir[currentSection] === 'down' && forwardTarget[currentSection]) navigateTo(forwardTarget[currentSection], 'down');
            else if (backDir[currentSection] === 'down' && backTarget[currentSection]) navigateTo(backTarget[currentSection], 'down');
        } else if (key === 'ArrowUp') {
            if (forwardDir[currentSection] === 'up' && forwardTarget[currentSection]) navigateTo(forwardTarget[currentSection], 'up');
            else if (backDir[currentSection] === 'up' && backTarget[currentSection]) navigateTo(backTarget[currentSection], 'up');
        }
    });

    // ---------- Lightbox: galería completa (sección 2) ----------
    const lightbox = document.getElementById('lightbox');
    const btnOpenGallery = document.getElementById('btnOpenGallery');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxBackdrop = document.getElementById('lightboxBackdrop');

    function openLightbox() {
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
    }
    function closeLightbox() {
        lightbox.classList.remove('is-open');
        lightbox.setAttribute('aria-hidden', 'true');
    }

    if (btnOpenGallery) btnOpenGallery.addEventListener('click', openLightbox);
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
    });

    updateIndicators();
})();