console.log("--- script.js loaded ---"); // TEST LOG

// JavaScript code will go here 

document.addEventListener('DOMContentLoaded', () => {
    console.log("--- DOMContentLoaded event fired ---"); // TEST LOG

    // --- Fraction-based Layout Constants ---
    const VIEWPORT_PADDING_LEFT_FRACTION = 0.05;  // 5% of viewport width
    const VIEWPORT_PADDING_RIGHT_FRACTION = 0.05; // 5% of viewport width
    const VIEWPORT_PADDING_TOP_FRACTION = 0.05;   // 5% of viewport width
    const HEADER_HEIGHT_FRACTION = 0.05;          // 10% of viewport width
    const HEADER_BOTTOM_PADDING_PX = 100;        // New: Space below header, above cards
    const FOOTER_AREA_HEIGHT_FRACTION = 0.05;   // New: Fraction for footer area height
    const FOOTER_AREA_TOP_PADDING_PX = 100;     // New: Space above footer area

    // --- Grid Configuration ---
    const MIN_CARD_GAP_PX = 60; // Minimum spacing between cards (horizontally and vertically)
    const VERTICAL_CARD_GAP_PX = 100; // New: Specific vertical gap
    const FIXED_CARD_WIDTH = 295;
    const FIXED_CARD_HEIGHT = 415;
    
    // --- Old Configuration (to be reviewed/removed if fully unused) ---
    // const gridSize = 20; 
    // const cardAspectRatio = 4 / 3; 
    // const minCardWidth = 200;     
    // const maxCardWidth = 350;     
    // const baseCardWidthPercent = 10; 
    
    const layoutConfig = { // p_card might still be used by eff_width/height if those are kept for other reasons
        CARD_PADDING: 0, // This specific padding for collision detection is less relevant for simple grid.
        LOGO_PADDING: 0 // Logo padding is 0
    };
    console.log("Layout Config (simplified for grid):", layoutConfig);
    
    const maxPlacementAttempts = 100; // May not be needed for simple grid
    const cardsHtmlPath = '_cards.html';

    // --- Element Selection ---
    const mainElement = document.querySelector('main');
    const logoElement = document.querySelector('.text-logo');
    const navElement = document.querySelector('.header-nav');
    const footerElement = document.querySelector('footer');
    const footerCopyrightElement = document.querySelector('.footer-copyright');
    const footerSocialIconsElement = document.querySelector('.footer-social-icons');

    // --- Helper Functions (Overlap checks might be removable if no dynamic placement) ---
    function checkOverlapBL(card1_eff_pos, card1_eff_dims, card2_eff_pos, card2_eff_dims) {
        // This function might be simplified or removed if not used by logo or other non-grid elements
        if (!card1_eff_pos || !card2_eff_pos) return false;
        const r1x = card1_eff_pos.x; const r1y = card1_eff_pos.y;
        const r1w = card1_eff_dims.w; const r1h = card1_eff_dims.h;
        const r2x = card2_eff_pos.x; const r2y = card2_eff_pos.y;
        const r2w = card2_eff_dims.w; const r2h = card2_eff_dims.h;
        const tolerance = 1e-9;
        if (r1x + r1w <= r2x + tolerance || r1x >= r2x + r2w - tolerance ||
            r1y + r1h <= r2y + tolerance || r1y >= r2y + r2h - tolerance) {
            return false;
        } else { return true; }
    }

    // --- Main Layout Logic ---
    console.log("About to call loadAndLayoutCards...");
    loadAndLayoutCards();
    console.log("Called loadAndLayoutCards.");

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log("--- Window resized, reloading cards --- RERUNNING LAYOUT");
            loadAndLayoutCards();
        }, 500);
    });

    async function loadAndLayoutCards() {
        console.log("Entered loadAndLayoutCards function.");
        if (!mainElement || !logoElement || !navElement || !footerElement || !footerCopyrightElement || !footerSocialIconsElement) {
            console.error("Critical element(s) not found: main, logo, nav, footer, copyright, or social icons.");
            return;
        }

        const viewportWidth = window.innerWidth;
        const viewportPaddingLeftPx = viewportWidth * VIEWPORT_PADDING_LEFT_FRACTION;
        const viewportPaddingRightPx = viewportWidth * VIEWPORT_PADDING_RIGHT_FRACTION;
        const viewportPaddingTopPx = viewportWidth * VIEWPORT_PADDING_TOP_FRACTION;
        const headerHeightPx = viewportWidth * HEADER_HEIGHT_FRACTION;
        const actualHeaderTopBoundary = viewportPaddingTopPx;
        const cardLayoutTopBoundary = actualHeaderTopBoundary + headerHeightPx + HEADER_BOTTOM_PADDING_PX;

        console.log(`Dynamic Values: vpPadL=${viewportPaddingLeftPx.toFixed(1)}, vpPadR=${viewportPaddingRightPx.toFixed(1)}, vpPadT=${viewportPaddingTopPx.toFixed(1)}, headerH=${headerHeightPx.toFixed(1)}, headerBottomPad=${HEADER_BOTTOM_PADDING_PX}, cardsTop=${cardLayoutTopBoundary.toFixed(1)}`);
        
        console.log(`[HeaderDebug] logoElement display: ${getComputedStyle(logoElement).display}`);
        console.log(`[HeaderDebug] navElement display: ${getComputedStyle(navElement).display}`);

        logoElement.style.left = `${viewportPaddingLeftPx}px`;
        const logoHeight = logoElement.offsetHeight;
        logoElement.style.top = `${actualHeaderTopBoundary + (headerHeightPx - logoHeight) / 2}px`;

        navElement.style.right = `${viewportPaddingRightPx}px`;
        const navHeight = navElement.offsetHeight;
        navElement.style.top = `${actualHeaderTopBoundary + (headerHeightPx - navHeight) / 2}px`;

        // --- Position Footer Elements ---
        const footerAreaHeightPx = viewportWidth * FOOTER_AREA_HEIGHT_FRACTION;
        // Footer itself is positioned by normal flow + JS-set height and margin-top (done in layoutCardsInGrid)
        
        // Copyright Text (left-aligned, vertically centered in footer area)
        footerCopyrightElement.style.left = `${viewportPaddingLeftPx}px`;
        const copyrightHeight = footerCopyrightElement.offsetHeight;
        const copyrightTopPosition = (footerAreaHeightPx - copyrightHeight) / 2;
        footerCopyrightElement.style.top = `${copyrightTopPosition}px`; // Relative to footer
        // Note: For this to work with absolute positioning *inside* the footer, footer needs position:relative.

        // Social Icons (right-aligned, vertically centered in footer area)
        footerSocialIconsElement.style.right = `${viewportPaddingRightPx}px`;
        const socialHeight = footerSocialIconsElement.offsetHeight;
        const socialTopPosition = (footerAreaHeightPx - socialHeight) / 2;
        footerSocialIconsElement.style.top = `${socialTopPosition}px`; // Relative to footer

        try {
            const response = await fetch(cardsHtmlPath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const cardsHtml = await response.text();
            mainElement.innerHTML = cardsHtml;
            mainElement.style.position = 'relative';

            const loadedCardContainers = Array.from(mainElement.querySelectorAll('.card-container'));
            console.log(`Found ${loadedCardContainers.length} card containers.`);

            if (loadedCardContainers.length > 0) {
                setTimeout(() => layoutCardsInGrid(
                    loadedCardContainers,
                    mainElement, // layoutContainer
                    viewportPaddingLeftPx,
                    viewportPaddingRightPx,
                    cardLayoutTopBoundary,
                    viewportWidth
                ), 100);
            } else {
                console.warn("No card containers selected, layout skipped.");
            }
        } catch (error) {
            console.error('Error loading or processing cards:', error);
        }
    }

    function layoutCardsInGrid(cardElements, layoutContainer, vpPadLeft, vpPadRight, cardsTopStart, vpWidth) {
        console.log(`--- Starting Grid Layout for ${cardElements.length} cards ---`);

        const cardAreaMinX = vpPadLeft;
        const cardAreaMaxX = vpWidth - vpPadRight;
        const cardAreaWidth = cardAreaMaxX - cardAreaMinX;
        const cardAreaMinY = cardsTopStart;

        console.log(`Grid Card Layout Area: X=[${cardAreaMinX.toFixed(1)}, ${cardAreaMaxX.toFixed(1)}], W=${cardAreaWidth.toFixed(1)}, Y>=${cardAreaMinY.toFixed(1)}`);

        // Prepare card data objects
        const allCardData = cardElements.map((element, index) => {
            // Apply fixed dimensions directly for styling and internal data
            element.style.width = `${FIXED_CARD_WIDTH}px`;
            element.style.height = `${FIXED_CARD_HEIGHT}px`;
            // For grid, position is determined by grid logic, not initial CSS state for measurement
            element.style.position = 'absolute'; 
            element.style.visibility = 'hidden'; // Start hidden, make visible when placed

            return {
                id: element.id || `card-grid-${index}`,
                element: element,
                labelElement: element.querySelector('.card-label'),
                width: FIXED_CARD_WIDTH,
                height: FIXED_CARD_HEIGHT,
                pos: { x: null, y: null },
                // p_card and eff_ dimensions might be removed if not used by anything else
                p_card: layoutConfig.CARD_PADDING, 
                get eff_width() { return this.width + 2 * this.p_card; },
                get eff_height() { return this.height + 2 * this.p_card; }
            };
        });
        
        if (allCardData.length === 0) {
            console.warn("No card data to layout in grid.");
            return;
        }

        // Calculate number of columns
        let numCols = Math.floor((cardAreaWidth + MIN_CARD_GAP_PX) / (FIXED_CARD_WIDTH + MIN_CARD_GAP_PX));
        if (numCols <= 0) numCols = 1; // Ensure at least one column if there's any space
        
        console.log(`[Grid] Calculated numCols: ${numCols}`);

        // Calculate actual horizontal gap
        let actualHorizontalGap = MIN_CARD_GAP_PX;
        if (numCols > 1) {
            actualHorizontalGap = (cardAreaWidth - (numCols * FIXED_CARD_WIDTH)) / (numCols - 1);
            if (actualHorizontalGap < MIN_CARD_GAP_PX) {
                 // This case means we will use a gap smaller than MIN_CARD_GAP_PX to fill the width.
                 // Or, if we must respect MIN_CARD_GAP_PX, we might need to recalculate numCols.
                 // For now, assume filling the width is priority.
                 console.warn(`[Grid] Calculated horizontal gap (${actualHorizontalGap.toFixed(1)}) is less than MIN_CARD_GAP_PX (${MIN_CARD_GAP_PX}). Using calculated gap.`);
            }
        } else { // Single column
            actualHorizontalGap = 0; // No horizontal gap needed for a single column
        }
        console.log(`[Grid] Actual horizontal gap: ${actualHorizontalGap.toFixed(1)}`);
        
        // Position cards in the grid
        allCardData.forEach((card, index) => {
            const row = Math.floor(index / numCols);
            const col = index % numCols;

            if (numCols === 1) {
                card.pos.x = cardAreaMinX; // Left-align single column
            } else {
                card.pos.x = cardAreaMinX + col * (FIXED_CARD_WIDTH + actualHorizontalGap);
            }
            card.pos.y = cardAreaMinY + row * (FIXED_CARD_HEIGHT + VERTICAL_CARD_GAP_PX); // Using new VERTICAL_CARD_GAP_PX

            card.element.style.left = `${card.pos.x}px`;
            card.element.style.top = `${card.pos.y}px`;
            card.element.style.visibility = 'visible';
            card.element.style.opacity = '1';
            console.log(`[Grid] Placed card ${card.id} at R${row},C${col} -> X:${card.pos.x.toFixed(1)}, Y:${card.pos.y.toFixed(1)}`);
        });
        
        // --- Set Main Element Height & Footer Styling ---
        let maxY = 0;
        const placedCardsForSizing = allCardData.filter(card => card.pos && card.pos.x !== null);
        placedCardsForSizing.forEach(card => {
            maxY = Math.max(maxY, card.pos.y + card.height);
        });
        mainElement.style.height = `${maxY}px`; // Set main element height to encompass cards
        console.log(`[Layout] Main element height set to: ${maxY.toFixed(1)}px`);

        if (footerElement) {
            const calculatedFooterAreaHeightPx = vpWidth * FOOTER_AREA_HEIGHT_FRACTION; // vpWidth from layoutCardsInGrid params
            footerElement.style.height = `${calculatedFooterAreaHeightPx}px`;
            footerElement.style.marginTop = `${FOOTER_AREA_TOP_PADDING_PX}px`;
            footerElement.style.position = 'relative'; // Needed for absolute positioning of children
            console.log(`[Layout] Footer styled: Height=${calculatedFooterAreaHeightPx.toFixed(1)}px, MarginTop=${FOOTER_AREA_TOP_PADDING_PX}px, Position=relative`);
        } else {
            console.warn("[Layout] Footer element not found for styling.");
        }
        
        const svgHeight = maxY + FOOTER_AREA_TOP_PADDING_PX + (vpWidth * FOOTER_AREA_HEIGHT_FRACTION) + 20; // Adjust SVG height to cover footer too + buffer

        // --- Visualization (Corner Dots - now hidden but code remains) ---
        let markerSvg = document.getElementById('corner-marker-svg');
        if (!markerSvg) {
             markerSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
             markerSvg.id = 'corner-marker-svg';
             Object.assign(markerSvg.style, {position: 'absolute', top: '0', left: '0', pointerEvents: 'none', zIndex: '9999'});
             layoutContainer.appendChild(markerSvg);
        } else {
            while (markerSvg.firstChild) markerSvg.removeChild(markerSvg.firstChild);
        }
        markerSvg.style.width = `${vpWidth}px`;
        markerSvg.style.height = `${svgHeight}px`;
        updateCornerDots(placedCardsForSizing, markerSvg); // Update dots for the cards placed by grid

        // --- Place Labels ---
        console.log("Label placement call (was temporarily disabled)."); // Ensure this log is different or removed later
        setTimeout(() => {
            placeLabels(placedCardsForSizing); // Place labels for the cards placed by grid
        }, 15);
    }

    // --- Removed old layout functions: layoutCardsWithTopRight, placeCardsTopRight, redistributeCardsHorizontally ---
    // --- Removed old helper functions: snapToGrid, snapPositionsToGrid ---

    // --- Visualization Update Function (corner dots) ---
    function updateCornerDots(cardData, svgCanvas) { 
         console.log("--- Inside updateCornerDots (Direct Calculation) --- ");
         while (svgCanvas.firstChild) svgCanvas.removeChild(svgCanvas.firstChild);
         cardData.forEach(card => {
             if (!card.element || !card.pos || card.pos.x === null) return;
             const { pos, width, height } = card; // Corrected: x and y are in card.pos
             const x = pos.x; // Use pos.x
             const y = pos.y; // Use pos.y

             const corners = [
                 { svgX: x,       svgY: y,       type: 'top',    label: 'TL' },
                 { svgX: x + width,svgY: y,       type: 'top',    label: 'TR' },
                 { svgX: x,       svgY: y + height,type: 'bottom', label: 'BL' },
                 { svgX: x + width,svgY: y + height,type: 'bottom', label: 'BR' }
             ];
             corners.forEach(corner => createMarker(corner.svgX, corner.svgY, corner.type === 'top' ? 'red' : 'green', corner.label, svgCanvas));
         });
         console.log("--- Finished updateCornerDots (Direct Calculation) --- ");
    }

    function createMarker(x, y, color, label, svgTarget) {
        if (!svgTarget) return;
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        Object.assign(marker.style, { visibility: 'hidden' }); // Dots are hidden
        marker.setAttribute('cx', x.toFixed(1));
        marker.setAttribute('cy', y.toFixed(1));
        marker.setAttribute('r', '5');
        marker.setAttribute('fill', color);
        marker.setAttribute('stroke', 'white');
        marker.setAttribute('stroke-width', '1');
        svgTarget.appendChild(marker);
        if (label) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            Object.assign(text.style, { visibility: 'hidden' }); // Dot labels are hidden
            text.setAttribute('x', (x + 7).toFixed(1));
            text.setAttribute('y', (y + 3).toFixed(1));
            text.setAttribute('fill', 'black');
            text.setAttribute('stroke', 'white');
            text.setAttribute('stroke-width', '0.3');
            text.setAttribute('font-size', '10px');
            text.setAttribute('font-family', 'sans-serif');
            text.textContent = label;
            svgTarget.appendChild(text);
        }
    }

    function placeLabels(placedOrFixedCards) {
        console.log(`Phase 2: Processing ${placedOrFixedCards.length} cards for labels.`);
        placedOrFixedCards.forEach(card => {
            const label = card.labelElement;
            if (!label || !card.pos || card.pos.x === null || card.pos.y === null) return;
            Object.assign(label.style, {
                position: 'absolute',
                zIndex: '100',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '2px 5px',
                borderRadius: '3px',
                fontSize: '15px',
                fontWeight: 'normal',
                // border: '1px solid #ccc',
                display: 'block'
            });
            const labelHeight = label.offsetHeight;
            label.style.left = '0px';
            label.style.top = `-${labelHeight}px`;
            label.style.visibility = 'visible';
        });
    }
});