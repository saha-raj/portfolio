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
    // loadAndLayoutCards(); // Initial call will be handled by hash logic
    // console.log("Called loadAndLayoutCards."); // Initial call will be handled by hash logic

    // --- Event Listeners for Filtering ---
    window.addEventListener('hashchange', handleHashChange);
    // Initial load handling
    document.addEventListener('DOMContentLoaded', () => {
        // Call handleHashChange on DOMContentLoaded AFTER initial card HTML might be loaded by loadAndLayoutCards
        // This ensures that if loadAndLayoutCards is async and loads _cards.html,
        // we attempt to filter after that HTML is in place.
        // However, loadAndLayoutCards itself will be the main trigger for fetching & initial layout.
        // The primary initial call path will be: DOMContentLoaded -> loadAndLayoutCards -> which then calls displayCardsForCategory.
        console.log("DOMContentLoaded fully processed, initial loadAndLayoutCards was called.");
        // No explicit call to handleHashChange here, loadAndLayoutCards will handle initial category via displayCardsForCategory
    });

    function handleHashChange() {
        console.log("[HashChange] Hash changed to:", window.location.hash);
        const category = parseCategoryFromHash(window.location.hash);
        // We need to ensure cards are loaded before trying to display/filter them based on hash.
        // The loadAndLayoutCards function will be the main entry point, which internally calls displayCardsForCategory.
        // If cards are already loaded (e.g. mainElement.innerHTML is populated), we might re-trigger display.
        // For simplicity now, let loadAndLayoutCards (triggered by resize or initial) handle category.
        // If direct refresh on hash change is needed without full reload, displayCardsForCategory would be called here.
        // This current setup implies that a hash change might visually update only after a subsequent resize/reload
        // OR we modify loadAndLayoutCards to call displayCardsForCategory, which it will now do.
        loadAndLayoutCards(); // Re-run the main layout logic which will pick up the new hash.
    }

    function parseCategoryFromHash(hash) {
        if (hash.startsWith('#category=')) {
            return decodeURIComponent(hash.substring(10)); // Length of "#category="
        }
        return null; // No category or empty
    }

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        console.log("[Resize] Event fired. Debouncing..."); // Log: Resize event start
        resizeTimeout = setTimeout(() => {
            console.log("--- Window resized (script-simple), RERUNNING LAYOUT --- "); // Log: Debounced call starting
            loadAndLayoutCards(); // Re-run the whole process on resize
        }, 500);
    });

    // This function will become the new core logic for fetching, filtering, and laying out cards.
    async function displayCardsForCategory(category) {
        console.log(`[Display-${Date.now()}] Attempting to display for category: "${category || 'All'}"`); // Log: displayCardsForCategory entry with timestamp
        if (!mainElement || !logoElement || !navElement || !footerElement || !footerCopyrightElement || !footerSocialIconsElement) {
            console.error("Critical element(s) not found in displayCardsForCategory.");
            return;
        }

        // Calculate dynamic pixel values (needed for layout)
        const viewportWidth = window.innerWidth;
        const viewportPaddingLeftPx = viewportWidth * VIEWPORT_PADDING_LEFT_FRACTION;
        const viewportPaddingRightPx = viewportWidth * VIEWPORT_PADDING_RIGHT_FRACTION;
        const viewportPaddingTopPx = viewportWidth * VIEWPORT_PADDING_TOP_FRACTION;
        const headerHeightPx = viewportWidth * HEADER_HEIGHT_FRACTION;
        const actualHeaderTopBoundary = viewportPaddingTopPx;
        const cardLayoutTopBoundary = actualHeaderTopBoundary + headerHeightPx + HEADER_BOTTOM_PADDING_PX;

        // Position header and footer elements (this logic is independent of card content)
        positionHeaderAndFooter(viewportWidth, viewportPaddingLeftPx, viewportPaddingRightPx, actualHeaderTopBoundary, headerHeightPx);

        try {
            // Fetch and inject _cards.html content
            // This ensures we always start with the full set of cards in the DOM before filtering.
            const response = await fetch(cardsHtmlPath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const cardsHtmlContent = await response.text();
            mainElement.innerHTML = cardsHtmlContent;
            mainElement.style.position = 'relative';
            console.log(`[Display-${Date.now()}] Injected _cards.html content into mainElement.`);

            const allCardContainers = Array.from(mainElement.querySelectorAll('.card-container'));
            console.log(`[Display-${Date.now()}] Found ${allCardContainers.length} total card containers from HTML.`);

            let activeCardContainers = allCardContainers;
            if (category) {
                console.log(`[Display-${Date.now()}] Filtering for category: "${category}"`);
                activeCardContainers = allCardContainers.filter(container => {
                    const labelElement = container.querySelector('.card-label');
                    return labelElement && labelElement.textContent.trim() === category;
                });
                console.log(`[Display-${Date.now()}] Found ${activeCardContainers.length} cards matching category: "${category}".`);
            } else {
                console.log(`[Display-${Date.now()}] No category specified, showing all ${allCardContainers.length} cards.`);
            }
            
            // --- NEW: Explicitly hide inactive card containers and show active ones ---
            allCardContainers.forEach(container => {
                if (!activeCardContainers.includes(container)) {
                    container.style.display = 'none'; 
                } else {
                    // Reset display for active containers so layoutCardsInGrid can manage them.
                    // The .card-container itself doesn't have a display style in CSS, 
                    // its children .story-card do. The container is primarily for grouping label + card.
                    // It being in the DOM is enough. layoutCardsInGrid makes its children visible.
                    container.style.display = ''; // Let it be default, or set to 'block' if preferred.
                }
            });
            // --- END NEW ---
            
            // Attach click listeners to ALL labels AFTER _cards.html is injected and parsed
            attachLabelClickListeners(allCardContainers);

            if (activeCardContainers.length > 0) {
                console.log(`[Display-${Date.now()}] Calling layoutCardsInGrid with ${activeCardContainers.length} active cards.`);
                setTimeout(() => layoutCardsInGrid(
                    activeCardContainers,
                    mainElement, // layoutContainer
                    viewportPaddingLeftPx, 
                    viewportPaddingRightPx, 
                    cardLayoutTopBoundary,
                    viewportWidth
                ), 0); // Using 0ms timeout, just to push to end of event queue
            } else {
                console.warn("[Display] No card containers to display after filtering.");
                // Clear main content area if no cards match, or display a message
                mainElement.style.height = '0px'; // Collapse main area
                const footerEl = document.querySelector('footer');
                if (footerEl) {
                    const footerH = viewportWidth * FOOTER_AREA_HEIGHT_FRACTION;
                    footerEl.style.height = `${footerH}px`;
                    footerEl.style.marginTop = `${FOOTER_AREA_TOP_PADDING_PX}px`;
                }
            }
        } catch (error) {
            console.error('[Display] Error loading or processing cards for category:', error);
        }
    }

    // Extracted header/footer positioning to a helper
    function positionHeaderAndFooter(vpWidth, vpPadLeft, vpPadRight, actualHeaderTop, headerH) {
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

    function attachLabelClickListeners(cardContainers) {
        cardContainers.forEach(container => {
            const labelElement = container.querySelector('.card-label');
            if (labelElement) {
                // Remove old listener to prevent duplicates if re-attaching
                labelElement.removeEventListener('click', handleLabelClick);
                labelElement.addEventListener('click', handleLabelClick);
                labelElement.style.cursor = 'pointer'; // Add visual cue
            }
        });
    }

    function handleLabelClick(event) {
        const categoryName = event.target.textContent.trim();
        console.log(`[LabelClick] Label clicked: "${categoryName}"`);
        window.location.hash = 'category=' + encodeURIComponent(categoryName);
        // The hashchange event will trigger loadAndLayoutCards -> displayCardsForCategory
    }

    let initialLoadCalled = false; // Guard to ensure loadAndLayoutCards via DOMContentLoaded runs once for initial setup

    async function loadAndLayoutCards() {
        const callTimestamp = Date.now(); // Timestamp for this call
        console.log(`[LoadLayout-${callTimestamp}] loadAndLayoutCards called.`);
        initialLoadCalled = true;

        const category = parseCategoryFromHash(window.location.hash);
        console.log(`[LoadLayout-${callTimestamp}] Parsed category from hash: "${category || 'All'}".`);
        await displayCardsForCategory(category);
        console.log(`[LoadLayout-${callTimestamp}] displayCardsForCategory finished.`);
    }

    // Initial Load - Call loadAndLayoutCards which now handles category from hash
    loadAndLayoutCards(); 

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
                // backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '2px 5px',
                borderRadius: '3px',
                fontSize: '15px',
                fontWeight: '100',
                // border: '1px solid #ccc',
                display: 'block'
            });
            const labelHeight = label.offsetHeight;
            
            if (labelHeight === 0 && label.textContent.trim() !== '') {
                console.warn(`[Labels] offsetHeight is 0 for visible label of card ${card.id}. Text: "${label.textContent}". Check CSS.`);
            }

            // Position the label RELATIVE TO ITS PARENT (.card-container)
            const labelWidth = label.offsetWidth; // Get label width for right-alignment
            
            // card.width is FIXED_CARD_WIDTH (e.g., 290px from your last CSS change)
            // If card.width isn't directly on the card object from the grid logic, use FIXED_CARD_WIDTH
            const parentCardWidth = card.width || FIXED_CARD_WIDTH; // Ensure we have the card's actual width

            label.style.left = `${parentCardWidth - labelWidth}px`; // Position label's left edge so its right edge aligns with parent's right edge
            label.style.top = `-${labelHeight}px`; // Position label's top edge so its bottom aligns with parent's top edge
            
            label.style.visibility = 'visible';
        });
    }
});