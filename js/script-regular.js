console.log("--- script-regular.js loaded ---");

document.addEventListener('DOMContentLoaded', () => {
    console.log("--- DOMContentLoaded event fired (script-regular) ---");

    // --- Fraction-based Layout Constants (Keep these) ---
    const VIEWPORT_PADDING_LEFT_FRACTION = 0.05;
    const VIEWPORT_PADDING_RIGHT_FRACTION = 0.05;
    const VIEWPORT_PADDING_TOP_FRACTION = 0.05;
    const HEADER_HEIGHT_FRACTION = 0.05;
    const HEADER_BOTTOM_PADDING_PX = 100;
    const FOOTER_AREA_HEIGHT_FRACTION = 0.05;
    const FOOTER_AREA_TOP_PADDING_PX = 100;

    // --- Element Selection (Keep these) ---
    const mainElement = document.querySelector('main');
    const logoElement = document.querySelector('.text-logo');
    const navElement = document.querySelector('.header-nav');
    const footerElement = document.querySelector('footer');
    const footerCopyrightElement = document.querySelector('.footer-copyright');
    const footerSocialIconsElement = document.querySelector('.footer-social-icons');

    // --- Main Function to Position Header, Footer, and set Main Content Padding ---
    function setupPageLayout() {
        console.log("[RegularLayout] setupPageLayout called.");

        if (!mainElement || !logoElement || !navElement || !footerElement || !footerCopyrightElement || !footerSocialIconsElement) {
            console.error("[RegularLayout] Critical element(s) not found.");
            return;
        }

        const viewportWidth = window.innerWidth;
        const viewportPaddingLeftPx = viewportWidth * VIEWPORT_PADDING_LEFT_FRACTION;
        const viewportPaddingRightPx = viewportWidth * VIEWPORT_PADDING_RIGHT_FRACTION;
        const viewportPaddingTopPx = viewportWidth * VIEWPORT_PADDING_TOP_FRACTION;
        const headerHeightPx = viewportWidth * HEADER_HEIGHT_FRACTION;
        const actualHeaderTopBoundary = viewportPaddingTopPx;
        const contentTopStartPx = actualHeaderTopBoundary + headerHeightPx + HEADER_BOTTOM_PADDING_PX;

        console.log(`[RegularLayout] Dynamic Values: vpPadL=${viewportPaddingLeftPx.toFixed(1)}, vpPadR=${viewportPaddingRightPx.toFixed(1)}, contentTopStart=${contentTopStartPx.toFixed(1)}`);

        // Position header and footer elements
        positionHeaderAndFooter(viewportWidth, viewportPaddingLeftPx, viewportPaddingRightPx, actualHeaderTopBoundary, headerHeightPx);

        // Style the main content area's padding
        if (mainElement) {
            mainElement.style.paddingTop = `${contentTopStartPx}px`;
            mainElement.style.paddingLeft = `${viewportPaddingLeftPx}px`;
            mainElement.style.paddingRight = `${viewportPaddingRightPx}px`;
            // mainElement height will be determined by its content + CSS flex-grow for sticky footer
        }
        
        // Style the footer itself (height, margin-top)
        if (footerElement) {
            const calculatedFooterAreaHeightPx = viewportWidth * FOOTER_AREA_HEIGHT_FRACTION;
            footerElement.style.height = `${calculatedFooterAreaHeightPx}px`;
            footerElement.style.marginTop = `${FOOTER_AREA_TOP_PADDING_PX}px`;
            footerElement.style.position = 'relative'; // For absolute positioned children
            console.log(`[RegularLayout] Footer styled: Height=${calculatedFooterAreaHeightPx.toFixed(1)}px, MarginTop=${FOOTER_AREA_TOP_PADDING_PX}px`);
        }
    }

    // Helper to position header/footer elements (Kept from script-simple.js)
    function positionHeaderAndFooter(vpWidth, vpPadLeft, vpPadRight, actualHeaderTop, headerH) {
        if (!logoElement || !navElement || !footerCopyrightElement || !footerSocialIconsElement) return;

        logoElement.style.left = `${vpPadLeft}px`;
        const logoH = logoElement.offsetHeight;
        logoElement.style.top = `${actualHeaderTop + (headerH - logoH) / 2}px`;

        navElement.style.right = `${vpPadRight}px`;
        const navH = navElement.offsetHeight;
        navElement.style.top = `${actualHeaderTop + (headerH - navH) / 2}px`;
        
        const footerAreaH = vpWidth * FOOTER_AREA_HEIGHT_FRACTION;
        footerCopyrightElement.style.left = `${vpPadLeft}px`;
        const copyrightH = footerCopyrightElement.offsetHeight;
        footerCopyrightElement.style.top = `${(footerAreaH - copyrightH) / 2}px`;

        footerSocialIconsElement.style.right = `${vpPadRight}px`;
        const socialH = footerSocialIconsElement.offsetHeight;
        footerSocialIconsElement.style.top = `${(footerAreaH - socialH) / 2}px`;
    }

    // --- Initial Setup & Resize Listener ---
    setupPageLayout(); // Call on initial load

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log("--- Window resized (script-regular), re-running setupPageLayout ---");
            setupPageLayout();
        }, 500);
    });

    // All card-specific logic, filtering logic, label logic, SVG dot logic is REMOVED.

});