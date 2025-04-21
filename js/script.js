console.log("--- script.js loaded ---"); // TEST LOG

// JavaScript code will go here 

document.addEventListener('DOMContentLoaded', () => {
    console.log("--- DOMContentLoaded event fired ---"); // TEST LOG

    // --- Configuration ---
    const gridSize = 20; // Must match the background-size in CSS
    const cardAspectRatio = 4 / 3; // Width / Height
    const minCardWidth = 250;     // Minimum card width in px (Reduced slightly)
    const maxCardWidth = 400;     // Maximum card width in px (Reduced slightly)
    const baseCardWidthPercent = 10; // Base percentage of container width (Reduced slightly)
    
    // --- NEW: Layout Configuration Object ---
    const layoutConfig = {
        CONTAINER_PADDING_TOP: 80,  // Pixels from top edge of layout container
        CONTAINER_PADDING_SIDE: 50, // Pixels from left/right edges of layout container
        CARD_PADDING: 30,           // Pixels around each movable card
        LOGO_PADDING: 30            // Pixels around the logo obstacle
    };
    console.log("Layout Config:", layoutConfig);
    // --- END NEW ---
    
    const viewportPadding = {
        top: 40, // Pixels from top (Replaces percent)
        right: 40,      // Pixels from right
        bottom: 40,     // Pixels from bottom
        left: 40        // Pixels from left
    };
    const maxPlacementAttempts = 100; // Prevent infinite loops
    const cardsHtmlPath = '_cards.html'; // Path to the cards HTML file

    // --- Element Selection ---
    const mainElement = document.querySelector('main');
    // Remove initial selection - will select after loading
    // const cardContainers = Array.from(document.querySelectorAll('.card-container'));
    const logoElement = document.querySelector('.logo-svg');
    const whoWeAreCardElement = document.querySelector('#who-we-are-card');

    // --- Helper Functions ---
    // Rounds a value (Not used by BL algorithm, keep if needed elsewhere)
    const snapToGrid = (value) => Math.floor(value / gridSize) * gridSize;

    // Generates a random integer (Not used by BL algorithm)
    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Checks if two rectangles (defined by {left, top, right, bottom}) overlap
    const doDomRectsOverlap = (rect1, rect2) => {
        const tolerance = 1e-9; // Tolerance for floating point comparisons
        return !(
            rect1.right < rect2.left + tolerance ||
            rect1.left > rect2.right - tolerance ||
            rect1.bottom < rect2.top + tolerance ||
            rect1.top > rect2.bottom - tolerance
        );
    };

    // Checks overlap based on effective boundaries of card objects (Bottom-Left Algorithm)
    // Assumes card objects have eff_pos {x, y} and eff_dims {w, h}
    function checkOverlapBL(card1_eff_pos, card1_eff_dims, card2_eff_pos, card2_eff_dims) {
        if (!card1_eff_pos || !card2_eff_pos) return false; // Should not happen if positions are set
        const r1x = card1_eff_pos.x;
        const r1y = card1_eff_pos.y;
        const r1w = card1_eff_dims.w;
        const r1h = card1_eff_dims.h;
        const r2x = card2_eff_pos.x;
        const r2y = card2_eff_pos.y;
        const r2w = card2_eff_dims.w;
        const r2h = card2_eff_dims.h;

        const tolerance = 1e-9; // Small tolerance for floating point comparisons

        if (
            r1x + r1w <= r2x + tolerance || // r1 is left of r2
            r1x >= r2x + r2w - tolerance || // r1 is right of r2
            r1y + r1h <= r2y + tolerance || // r1 is above r2
            r1y >= r2y + r2h - tolerance    // r1 is below r2
        ) {
            return false; // No overlap
        } else {
            return true; // Overlap detected
        }
    }

    // --- Main Layout Logic ---
    console.log("About to call loadAndLayoutCards..."); // TEST LOG
    loadAndLayoutCards();
    console.log("Called loadAndLayoutCards."); // TEST LOG

    // Optional: Recalculate on resize (debounced)
    console.log("Setting up resize listener..."); // TEST LOG
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log("--- Window resized, reloading cards --- RERUNNING LAYOUT");
            loadAndLayoutCards(); // Re-run the whole process on resize
        }, 500);
    });

    // --- Load Cards and Initiate Layout --- //
    async function loadAndLayoutCards() {
        console.log("Entered loadAndLayoutCards function."); // TEST LOG
        if (!mainElement) {
            console.error("Main element not found!");
            return;
        }
        // REMOVED containerElement check

        try {
            const response = await fetch(cardsHtmlPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const cardsHtml = await response.text();
            console.log("Fetched _cards.html content");
            // --- DEBUG: Log the fetched HTML string (keep for now) ---
            console.log("--- Fetched HTML String START ---");
            console.log(cardsHtml);
            console.log("--- Fetched HTML String END ---");
            // --- END DEBUG ---
            mainElement.innerHTML = cardsHtml; // Load cards into main

            // --- DEBUG: Log the innerHTML of mainElement AFTER setting (keep for now) ---
            console.log("--- mainElement.innerHTML AFTER setting START ---");
            console.log(mainElement.innerHTML);
            console.log("--- mainElement.innerHTML AFTER setting END ---");
            // --- END DEBUG ---

            // REMOVED containerElement selection
            // --- Set mainElement as positioning context ---
            mainElement.style.position = 'relative'; 
            console.log("Set mainElement position to relative.");
            // --- END positioning context ---

            const loadedCardContainers = Array.from(mainElement.querySelectorAll('.card-container'));
            console.log(`Found ${loadedCardContainers.length} card containers after loading.`);

            if (loadedCardContainers.length > 0) {
                // Use setTimeout to allow browser to render elements and calculate sizes
                setTimeout(() => layoutCardsWithBottomLeft(loadedCardContainers, mainElement), 100); // Pass mainElement as container
            } else {
                console.warn("No card containers selected, layout skipped.");
            }

        } catch (error) {
            console.error('Error loading or processing cards:', error);
        }
    }

    // --- Phase 1: Card Layout using Bottom-Left Heuristic --- //
    function layoutCardsWithBottomLeft(cardElements, layoutContainer) { 
        console.log(`--- Starting Bottom-Left Layout for ${cardElements.length} cards ---`);

        if (!layoutContainer || cardElements.length === 0) {
            console.warn("Layout container or card elements missing for layout.");
            return;
        }

        // --- Get Layout Container Dimensions and Padding --- 
        const containerRect = layoutContainer.getBoundingClientRect();
        const p_top_space = layoutConfig.CONTAINER_PADDING_TOP;
        const p_side_space = layoutConfig.CONTAINER_PADDING_SIDE;
        const W_container = layoutContainer.clientWidth; 
        const containerHeight = layoutContainer.clientHeight; // Get height too

        console.log(`Layout Container: W=${W_container.toFixed(1)}, H=${containerHeight.toFixed(1)}`);
        console.log(`Using Configured Padding: Top=${p_top_space.toFixed(1)}, Side=${p_side_space.toFixed(1)}`);

        // --- Identify Fixed Card Element --- 
        const fixedCardElement = document.querySelector('#who-we-are-card'); 
        // --- Identify Logo Element --- (Needed for obstacle)
        const logoElement = document.querySelector('.logo-svg');

        // --- Prepare Fixed Obstacles List (Logo + Fixed Card) --- 
        const fixedObstacles = [];

        // --- Prepare All Card Data (including calculating scaled sizes) --- 
        const allCardData = cardElements.map((element, index) => {
            const isFixed = (element === fixedCardElement);
            
            // Calculate Scaled Size
            const sizeScale = parseFloat(element.dataset.sizeScale) || 1;
            const targetWidth = (W_container * baseCardWidthPercent / 100) * sizeScale;
            const clampedWidth = Math.max(minCardWidth, Math.min(targetWidth, maxCardWidth));
            const calculatedWidth = clampedWidth; // Use clamped width directly

            // Apply calculated width to element style TEMPORARILY for initial rect measurement
            element.style.width = `${calculatedWidth}px`;
            // Don't set temporary height
            element.style.position = 'absolute'; 
            element.style.visibility = 'hidden'; 
            element.style.display = 'block'; 
            element.style.top = '0px'; 
            element.style.left = '0px';
            element.style.margin = '0'; 

            // Get bounding rect AFTER applying width and allowing content to flow
            const rect = element.getBoundingClientRect(); 
            const measuredHeight = rect.height; // Get the ACTUAL measured height now
            
            // --- NEW: Snap dimensions to grid --- 
            const snappedWidth = Math.round(calculatedWidth / gridSize) * gridSize;
            const snappedHeight = Math.round(measuredHeight / gridSize) * gridSize;
            // --- END NEW ---
            
            // Calculate initial position relative to the layoutContainer's top-left corner
            const initialX = rect.left - containerRect.left;
            const initialY = rect.top - containerRect.top;

            // Use snapped dimensions for zero check and card data
            if (snappedWidth <= 0 || snappedHeight <= 0) { 
                 console.warn(`Card ${element.id || index} has zero SNAPPED dimensions, skipping. W:${snappedWidth}, H:${snappedHeight}`);
                 element.style.display = 'none';
                return null;
            }

            const card = {
                id: element.id || `card-${index}`,
                element: element,
                labelElement: element.querySelector('.card-label'),
                // Use SNAPPED dimensions
                width: snappedWidth,  
                height: snappedHeight, 
                // height: measuredHeight, // << CRITICAL FIX: Use MEASURED height from getBoundingClientRect to include content. DO NOT CHANGE BACK. >> -> Now using snappedHeight
                p_card: layoutConfig.CARD_PADDING, 
                fixed: isFixed,
                pos: isFixed ? { x: initialX, y: initialY } : { x: null, y: null }, 
                initial_pos_vis: { x: initialX, y: initialY }, 
                
                // Effective dimensions and position getters/setters 
                // These will now use the snapped width/height
                get eff_width() { return this.width + 2 * this.p_card; },
                get eff_height() { return this.height + 2 * this.p_card; },
                get eff_pos() { 
                    if (this.pos.x === null || this.pos.y === null) return null;
                    return { x: this.pos.x - this.p_card, y: this.pos.y - this.p_card };
                },
                set eff_pos(value) {
                    if (value === null || value.x === null || value.y === null) {
                        this.pos = { x: null, y: null };
                    } else {
                         this.pos = { x: value.x + this.p_card, y: value.y + this.p_card };
                    }
                },
                 get_eff_pos_for_vis(use_initial = false) {
                    const pos_to_use = use_initial ? this.initial_pos_vis : this.pos;
                    if (!pos_to_use || pos_to_use.x === null || pos_to_use.y === null) return null;
                    return { x: pos_to_use.x - this.p_card, y: pos_to_use.y - this.p_card };
                 }
            };

            // --- DEBUG: Log prepared card data ---
            console.log(`[Data Prep] Card ${card.id}: ` +
                        `Size=(${card.width.toFixed(1)}x${card.height.toFixed(1)}) ` +
                        `EffSize=(${card.eff_width.toFixed(1)}x${card.eff_height.toFixed(1)}) ` +
                        `InitialPos=(${initialX.toFixed(1)}, ${initialY.toFixed(1)}) ` +
                        `IsFixed=${card.fixed}`
            );
            // --- END DEBUG ---

            // If this is the fixed card, add its data to fixedObstacles
            if (isFixed) {
                console.log(`Identified Fixed Card: ${card.id} at initial relative pos (${card.pos.x.toFixed(1)}, ${card.pos.y.toFixed(1)})`);
                // Add structure expected by placeCardsBottomLeft 
                const fixedCardObstacle = {
                    id: card.id + " (fixed)",
                    eff_pos: card.eff_pos, // Calculate effective pos based on initial pos
                    eff_width: card.eff_width,
                    eff_height: card.eff_height
                };
                 // --- DEBUG: Log fixed card obstacle data ---
                if (fixedCardObstacle.eff_pos) {
                    console.log(`  [Obstacle Prep] Fixed Card ${fixedCardObstacle.id}: ` +
                                `EffPos=(${fixedCardObstacle.eff_pos.x.toFixed(1)}, ${fixedCardObstacle.eff_pos.y.toFixed(1)}) ` +
                                `EffSize=(${fixedCardObstacle.eff_width.toFixed(1)}x${fixedCardObstacle.eff_height.toFixed(1)})`
                    );
                } else {
                     console.warn(`  [Obstacle Prep] Fixed Card ${fixedCardObstacle.id} has NULL eff_pos initially.`);
                }
                // --- END DEBUG ---
                fixedObstacles.push(fixedCardObstacle);
               
                // Make fixed card element visible immediately at its initial position
                 element.style.left = `${card.pos.x}px`; 
                 element.style.top = `${card.pos.y}px`;
                 element.style.width = `${card.width}px`; // Ensure final size is set
                 element.style.height = `${card.height}px`;
                 element.style.visibility = 'visible'; 
                 element.style.opacity = '1'; 
            }

            return card;
        }).filter(data => data !== null);

        // --- Add Logo as a Fixed Obstacle --- 
        if (logoElement) {
            const logoRect = logoElement.getBoundingClientRect();
            const logoX = logoRect.left - containerRect.left;
            const logoY = logoRect.top - containerRect.top;
            const logoW = logoRect.width;
            const logoH = logoRect.height;

            if (logoW > 0 && logoH > 0) {
                // Create an obstacle object for the logo
                const logoObstacle = {
                    id: "logo-svg (fixed)",
                    // Calculate effective position and dimensions for the logo obstacle
                    eff_pos: { x: logoX - layoutConfig.LOGO_PADDING, y: logoY - layoutConfig.LOGO_PADDING },
                    eff_width: logoW + 2 * layoutConfig.LOGO_PADDING,
                    eff_height: logoH + 2 * layoutConfig.LOGO_PADDING
                };
                // --- DEBUG: Log logo obstacle data ---
                console.log(`  [Obstacle Prep] Logo ${logoObstacle.id}: ` +
                            `EffPos=(${logoObstacle.eff_pos.x.toFixed(1)}, ${logoObstacle.eff_pos.y.toFixed(1)}) ` +
                            `EffSize=(${logoObstacle.eff_width.toFixed(1)}x${logoObstacle.eff_height.toFixed(1)}) ` +
                            `(using LOGO_PADDING: ${layoutConfig.LOGO_PADDING})` // Add note about padding used
                );
                 // --- END DEBUG ---
                fixedObstacles.push(logoObstacle);
                // console.log(`Added Logo Obstacle: ...`); // Redundant log
            } else {
                 console.warn("Logo element found but has zero dimensions.");
            }
        }

        const movableCards = allCardData.filter(card => !card.fixed);

        // --- Execute Placement Algorithm --- 
        console.log(`Running Top-Right Algorithm with ${fixedObstacles.length} fixed obstacles...`);
        const placementResult = placeCardsTopRight(
            movableCards,
            fixedObstacles, // Pass the list of all fixed obstacles
            W_container,    // Use container clientWidth
            p_top_space,
            p_side_space
        );

        const placedCards = placementResult.placed; // These are the movable cards that were placed
        const unplacedCards = placementResult.unplaced;
        console.log(`Placement complete. Placed Movable: ${placedCards.length}, Unplaced Movable: ${unplacedCards.length}`);

        // --- NEW: Snap Placed Movable Card Positions to Grid --- 
        const cardsToSnap = allCardData.filter(card => !card.fixed && card.pos && card.pos.x !== null);
        if (cardsToSnap.length > 0) {
            console.log(`[Snapping] Snapping ${cardsToSnap.length} placed movable cards to grid (size: ${gridSize})...`);
            snapPositionsToGrid(cardsToSnap, gridSize);
        }
        // --- END NEW ---

        // --- Apply Final (Potentially Snapped) Positions and Sizes to Movable Cards --- 
        // This loop now applies the snapped positions for movable cards
        movableCards.forEach(card => { // Iterate only over movable cards here
            if (card.pos && card.pos.x !== null && card.pos.y !== null) {
                card.element.style.left = `${card.pos.x}px`;
                card.element.style.top = `${card.pos.y}px`;
                card.element.style.width = `${card.width}px`; 
                card.element.style.height = `${card.height}px`;
                card.element.style.visibility = 'visible';
                card.element.style.opacity = '1';
            } else {
                card.element.style.visibility = 'hidden'; // Keep unplaced cards hidden
                console.log(`Card ${card.id} remains unplaced.`);
            }
        });
        
        // --- Calculate Max Y coordinate reached by placed cards --- 
        // This calculation should use the potentially snapped positions
        let maxY = 0;
        const allPlacedOrFixedCardsForMaxY = allCardData.filter(card => card.pos && card.pos.x !== null);
        allPlacedOrFixedCardsForMaxY.forEach(card => {
            maxY = Math.max(maxY, card.pos.y + card.height);
        });
        console.log(`[Layout] Max Y reached by cards (post-snap): ${maxY.toFixed(1)}`);
        const svgHeight = maxY + 20; 

        // --- Visualization (Corner Dots) --- 
        // This will now visualize based on the snapped positions
        let markerSvg = document.getElementById('corner-marker-svg');
        if (!markerSvg) { // Create if doesn't exist
             markerSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
             markerSvg.id = 'corner-marker-svg'; 
             markerSvg.style.position = 'absolute'; 
             markerSvg.style.top = '0';
             markerSvg.style.left = '0';
             markerSvg.style.pointerEvents = 'none';
             markerSvg.style.zIndex = '9999';
             layoutContainer.appendChild(markerSvg); 
             console.log("Created marker SVG canvas and appended to layout container.");
        } else { // Clear if exists
            while (markerSvg.firstChild) {
                markerSvg.removeChild(markerSvg.firstChild);
            }
        }
        // Always update SVG size
        markerSvg.style.width = `${W_container}px`;
        markerSvg.style.height = `${svgHeight}px`; // Use calculated max Y + buffer
        // --- DEBUG: Log SVG Canvas State ---
        const svgStyle = getComputedStyle(markerSvg);
        console.log(`[SVG Check] markerSvg created/updated. ` +
                    `Offset W/H: ${markerSvg.offsetWidth}x${markerSvg.offsetHeight}, ` +
                    `Style W/H: ${markerSvg.style.width}x${markerSvg.style.height}, ` +
                    `Visibility: ${svgStyle.visibility}, Display: ${svgStyle.display}`
        );
        // --- END DEBUG ---
        
        // Combine placed movable cards and the original fixed card data for visualization
        const allPlacedOrFixedCards = allCardData.filter(card => card.fixed || (card.pos && card.pos.x !== null));
        console.log(`Updating corner dots for ${allPlacedOrFixedCards.length} cards immediately...`);
        updateCornerDots(allPlacedOrFixedCards, markerSvg); // Pass only cards and SVG target

        // --- Place Labels --- 
        // Move label placement also inside the timeout to ensure it uses final positions
        // setTimeout(() => {
        //     placeLabels(allPlacedOrFixedCards); // Update labels for placed cards
        // }, 0);
        // Temporarily disable label placement to focus on corner dots
        console.log("Label placement temporarily disabled for debugging dots.");
    }

    // --- Top-Right Algorithm Implementation --- 
    function placeCardsTopRight(movableCards, fixedObstacles, W, p_top, p_side) {
        const placed_movable_cards = []; // Tracks successfully placed movable cards
        const unplaced_movable_cards = [];
        const min_x_bound = p_side;
        const max_x_bound = W - p_side; // Use container width and padding
        const min_y_bound = p_top;
        const eff_W_space = max_x_bound - min_x_bound;
        const tolerance = 1e-9;

        console.log(`[TR Start] Placement Area Bounds: X=[${min_x_bound.toFixed(1)}, ${max_x_bound.toFixed(1)}], Y>=${min_y_bound.toFixed(1)}`);

        // 1. Initialize placed list with all fixed obstacles
        const current_obstacles = [...fixedObstacles]; 
        console.log(`[TR Start] Starting with ${current_obstacles.length} fixed obstacles.`);
        // --- DEBUG: Log initial obstacles list --- 
        current_obstacles.forEach(obs => {
            if (obs.eff_pos) {
                console.log(`  [Initial Obstacle] ${obs.id}: EffPos=(${obs.eff_pos.x.toFixed(1)}, ${obs.eff_pos.y.toFixed(1)}) EffSize=(${obs.eff_width.toFixed(1)}x${obs.eff_height.toFixed(1)})`);
            } else {
                 console.log(`  [Initial Obstacle] ${obs.id}: NULL eff_pos`);
            }
        });
        // --- END DEBUG ---

        // Validate fixed obstacles are within bounds
        current_obstacles.forEach(obstacle => {
            if (!obstacle.eff_pos) {
                 console.warn(`Obstacle ${obstacle.id} lacks eff_pos, skipping validation.`);
                 return;
            }
            const fx_eff = obstacle.eff_pos;
            const fw_eff = obstacle.eff_width;
            if (fx_eff.x < min_x_bound - tolerance ||
                fx_eff.y < min_y_bound - tolerance ||
                fx_eff.x + fw_eff > max_x_bound + tolerance) {
                console.error(`Fixed obstacle ${obstacle.id} is out of bounds! Eff Pos:(${fx_eff.x.toFixed(1)}, ${fx_eff.y.toFixed(1)}), Eff Width:${fw_eff.toFixed(1)}`);
                // Keep it in the list, but placement might fail.
            }
        });

        // 2. Sort Movable Cards (Height descending, then Width descending)
        const sortedMovable = [...movableCards].sort((a, b) => {
            if (b.height !== a.height) { return b.height - a.height; }
            else if (b.width !== a.width) { return b.width - a.width; } 
            else { return 0; }
        });
        console.log(`[TR Algo] Sorted ${sortedMovable.length} movable cards.`);

        // 3. Place Movable Cards Iteratively
        sortedMovable.forEach((card_to_place, cardIndex) => {
            const card_eff_w = card_to_place.eff_width;
            const card_eff_h = card_to_place.eff_height;
            console.log(`
[TR Algo ${cardIndex+1}/${sortedMovable.length}] Processing Card: ${card_to_place.id} (EffSize ${card_eff_w.toFixed(1)}x${card_eff_h.toFixed(1)})`);

            // Check if card is too wide for the space
            if (card_eff_w > eff_W_space + tolerance) {
                console.warn(`Card ${card_to_place.id} (eff_w=${card_eff_w.toFixed(1)}) is wider than available space (${eff_W_space.toFixed(1)}). Cannot place.`);
                unplaced_movable_cards.push(card_to_place);
                return; // Continue to next card
            }

            // Generate candidate Y positions
            let candidate_y = new Set([min_y_bound]);
            current_obstacles.forEach(obstacle => {
                if (obstacle.eff_pos) { 
                     candidate_y.add(obstacle.eff_pos.y + obstacle.eff_height);
                }
            });
            const sorted_candidate_y = Array.from(candidate_y).sort((a, b) => a - b);
            console.log(`  [TR Algo] Candidate Ys: [${sorted_candidate_y.map(y => y.toFixed(1)).join(', ')}]`);

            let found_pos_for_card = false;
            let min_found_y = Infinity;
            let best_eff_pos_for_min_y = null;

            // Iterate through candidate Y positions (lowest Y first)
            for (const y of sorted_candidate_y) {
                console.log(`    [TR Algo] Testing Y = ${y.toFixed(1)}`);
                if (y >= min_found_y) {
                    console.log(`      [TR Algo] Skipping Y >= min_found_y (${min_found_y.toFixed(1)})`);
                    continue; 
                }

                // --- MODIFIED X-SCANNING LOGIC (Right-to-Left) ---
                let x = max_x_bound - card_eff_w; // Start checking from the rightmost possible position
                let iterations = 0; // Safety break for potential infinite loops
                const maxIterations = W * 2; // Heuristic limit

                while (x >= min_x_bound - tolerance && iterations < maxIterations) {
                    iterations++;
                    const potential_eff_pos = { x: x, y: y };
                    console.log(`      [TR Algo] Testing EffPos: (${x.toFixed(1)}, ${y.toFixed(1)})`);
                    let overlap = false;
                    let min_colliding_obstacle_x_start = Infinity; // Find leftmost edge of colliding obstacles

                    // Check overlap with ALL current obstacles
                    for (const obstacle of current_obstacles) {
                         if (!obstacle.eff_pos) { /* ... warning ... */ continue; }
                         
                         const doesOverlap = checkOverlapBL(
                             potential_eff_pos, { w: card_eff_w, h: card_eff_h },
                             obstacle.eff_pos, { w: obstacle.eff_width, h: obstacle.eff_height }
                         );
                         console.log(`        [TR Check] Card ${card_to_place.id} vs Obstacle ${obstacle.id} -> Overlap: ${doesOverlap}`);

                         if (doesOverlap) {
                            overlap = true;
                            min_colliding_obstacle_x_start = Math.min(min_colliding_obstacle_x_start, obstacle.eff_pos.x);
                            // Optimization: If we overlap something, we don't need to check others for *this specific x*, 
                            // but we do need the minimum x_start from *all* overlaps at this y to jump correctly.
                            // Let's keep iterating obstacles for this x to find the true minimum x_start.
                            // break; // Removed break - check all obstacles at this x,y
                         }
                    }

                    if (!overlap) {
                        // Found a valid spot (lowest Y, rightmost X for this Y)
                        console.log(`      [TR Algo] Found VALID spot at EffPos (${x.toFixed(1)}, ${y.toFixed(1)})`);
                        found_pos_for_card = true;
                        min_found_y = y;
                        best_eff_pos_for_min_y = potential_eff_pos;
                        break; // Found the best X for this Y, exit while loop
                    } else {
                        // Overlap detected. Jump X to the left of the leftmost colliding obstacle.
                        const next_x = min_colliding_obstacle_x_start - card_eff_w - tolerance; // Subtract width and tolerance
                        console.log(`      [TR Algo] Overlap detected. Min colliding obstacle X_start: ${min_colliding_obstacle_x_start.toFixed(1)}. Jumping X from ${x.toFixed(1)} to ${next_x.toFixed(1)}`);
                        
                        if (next_x < x - tolerance) { // Ensure we are moving left
                           x = next_x;
                        } else { 
                            // If jump doesn't move us left significantly, decrement manually to avoid stall
                            console.warn(`      [TR Algo] Potential stall detected or jump location invalid. Decrementing X by 1.`);
                            x -= 1; 
                        }
                    }
                } // End while loop (scanning X)

                if(iterations >= maxIterations){
                     console.error(`[TR Algo] Max iterations reached for card ${card_to_place.id} at Y=${y.toFixed(1)}. Potential infinite loop.`);
                }
                // --- END MODIFIED X-SCANNING --- 
                
                if (found_pos_for_card) {
                    console.log(`    [TR Algo] Best Y found for card. Breaking Y loop.`);
                    break; // Found the absolute best spot for this card
                }

            } // End for loop (iterating Y)

            // Assign position if found
            if (found_pos_for_card) {
                card_to_place.eff_pos = best_eff_pos_for_min_y; 
                const finalPos = card_to_place.pos; 
                console.log(`  [TR Algo] PLACED Card ${card_to_place.id} at Final Pos (${finalPos.x.toFixed(1)}, ${finalPos.y.toFixed(1)}) based on EffPos (${best_eff_pos_for_min_y.x.toFixed(1)}, ${best_eff_pos_for_min_y.y.toFixed(1)})`);
                placed_movable_cards.push(card_to_place);
                // Add the newly placed card as an obstacle
                const newObstacle = {
                    id: card_to_place.id + " (placed)",
                    eff_pos: card_to_place.eff_pos,
                    eff_width: card_to_place.eff_width,
                    eff_height: card_to_place.eff_height
                };
                 current_obstacles.push(newObstacle);
                 console.log(`    [TR Algo] Added ${newObstacle.id} to obstacles.`);
            } else {
                console.warn(`  [TR Algo] UNPLACED Card ${card_to_place.id}. No valid position found.`);
                unplaced_movable_cards.push(card_to_place);
            }
        }); // End forEach (iterating sortedMovable)

        console.log('[TR End] Finished placement algorithm.');
        return { placed: placed_movable_cards, unplaced: unplaced_movable_cards };
    }

    // --- NEW: Function to Snap Positions to Grid --- 
    function snapPositionsToGrid(cardData, gridSize) {
        if (!gridSize || gridSize <= 0) {
            console.warn("[Snapping] Invalid gridSize provided:", gridSize);
            return;
        }
        console.log(` -> Running snapPositionsToGrid for ${cardData.length} cards.`);
        cardData.forEach(card => {
            if (card.pos && card.pos.x !== null && card.pos.y !== null) {
                const originalX = card.pos.x;
                const originalY = card.pos.y;
                
                const snappedX = Math.round(originalX / gridSize) * gridSize;
                const snappedY = Math.round(originalY / gridSize) * gridSize;
                
                card.pos.x = snappedX;
                card.pos.y = snappedY;
                
                if (snappedX !== originalX || snappedY !== originalY) {
                    console.log(`    Card ${card.id}: Snapped (${originalX.toFixed(1)}, ${originalY.toFixed(1)}) -> (${snappedX}, ${snappedY})`);
                }
            } else {
                 console.log(`    Card ${card.id}: Skipped snapping (no position).`);
            }
        });
        console.log(` -> Finished snapPositionsToGrid.`);
    }
    // --- END NEW ---

    // --- Visualization Update Function --- 
    // Modified to calculate positions directly from card.pos and dimensions
    function updateCornerDots(cardData, svgCanvas) { 
         console.log("--- Inside updateCornerDots (Direct Calculation) --- ");
         // Clear existing markers
         while (svgCanvas.firstChild) {
             svgCanvas.removeChild(svgCanvas.firstChild);
         }

         // REMOVED getting container rect - positions are relative to container already
         // const containerRect = layoutContainer.getBoundingClientRect();
         // console.log(`Container Rect for Dots: T:${containerRect.top.toFixed(1)} L:${containerRect.left.toFixed(1)}`);

         cardData.forEach(card => {
             // Skip cards that weren't placed or don't have an element 
             if (!card.element || !card.pos || card.pos.x === null) { 
                 console.log(`Skipping dots for card ${card.id} (unplaced or missing element/pos)`);
                 return;
             } 

             // Use the card's calculated relative position and dimensions directly
             const x = card.pos.x;
             const y = card.pos.y;
             const w = card.width;
             const h = card.height;
             console.log(`  Card ${card.id} Rel Pos: (${x.toFixed(1)}, ${y.toFixed(1)}) Size: (${w.toFixed(1)}x${h.toFixed(1)})`);

             // REMOVED getBoundingClientRect and coordinate conversion
             // const cardRectVP = card.element.getBoundingClientRect();
             // const svgOriginX = containerRect.left;
             // const svgOriginY = containerRect.top;
             // const markerX = (coord) => coord - svgOriginX;
             // const markerY = (coord) => coord - svgOriginY;

             // Define corner points directly using relative coordinates
             const corners = [
                 { svgX: x,       svgY: y,       type: 'top',    label: 'TL' },
                 { svgX: x + w,   svgY: y,       type: 'top',    label: 'TR' },
                 { svgX: x,       svgY: y + h,   type: 'bottom', label: 'BL' },
                 { svgX: x + w,   svgY: y + h,   type: 'bottom', label: 'BR' }
             ];

             // Draw corner markers
             corners.forEach(corner => {
                 console.log(`    Drawing marker for ${card.id}-${corner.label} at SVG coords: (${corner.svgX.toFixed(1)}, ${corner.svgY.toFixed(1)})`);
                 createMarker(
                     corner.svgX, // Use direct SVG coordinates
                     corner.svgY, // Use direct SVG coordinates
                     corner.type === 'top' ? 'red' : 'green',
                     corner.label,
                     svgCanvas // Pass canvas to add marker to
                 );
             });
                
         });

         console.log("--- Finished updateCornerDots (Direct Calculation) --- ");
    }

    // --- Marker Creation Function (modified to accept SVG canvas) --- 
    function createMarker(x, y, color, label, svgTarget) {
        if (!svgTarget) {
            console.warn("[createMarker] SVG target not provided for marker");
            return;
        }

        // --- DEBUG: Check if coordinates are within SVG bounds ---
        let svgWidth = 0;
        let svgHeight = 0;
        try {
            // Use getBBox for intrinsic size if available, fallback to style/attributes
            // Note: getBBox might fail if SVG isn't rendered or has no content yet
            const bbox = svgTarget.getBBox(); 
            svgWidth = bbox.width;
            svgHeight = bbox.height;
        } catch (e) { 
            // Fallback if getBBox fails
            svgWidth = parseFloat(svgTarget.style.width) || svgTarget.width?.baseVal?.value || 0;
            svgHeight = parseFloat(svgTarget.style.height) || svgTarget.height?.baseVal?.value || 0;
        }

        if (svgWidth > 0 && svgHeight > 0) { // Only check if SVG bounds are known
            if (x < 0 || y < 0 || x > svgWidth || y > svgHeight) {
                console.warn(`[createMarker] Out of bounds! ` +
                            `Coord: (${x.toFixed(1)}, ${y.toFixed(1)}) vs ` +
                            `SVG Bounds: (${svgWidth.toFixed(1)}x${svgHeight.toFixed(1)})`
                );
                // Optionally: Skip drawing out-of-bounds markers? For now, just warn.
            }
        } else {
             console.warn(`[createMarker] Could not determine SVG bounds for boundary check.`);
        }
        // --- END DEBUG ---

        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        marker.setAttribute('cx', x.toFixed(1));
        marker.setAttribute('cy', y.toFixed(1));
        marker.setAttribute('r', '5'); // Smaller radius
        marker.setAttribute('fill', color);
        marker.setAttribute('stroke', 'white');
        marker.setAttribute('stroke-width', '1');
        svgTarget.appendChild(marker);
        
        // Add a label if provided
        if (label) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', (x + 7).toFixed(1)); // Offset label slightly
            text.setAttribute('y', (y + 3).toFixed(1)); // Adjust vertical alignment
            text.setAttribute('fill', 'black'); 
            text.setAttribute('stroke', 'white');
            text.setAttribute('stroke-width', '0.3');
            text.setAttribute('font-size', '10px');
            text.setAttribute('font-family', 'sans-serif');
            text.textContent = label;
            svgTarget.appendChild(text);
        }
    }

    // --- Place Labels Function (adjusted) --- 
    function placeLabels(placedOrFixedCards) {
        console.log(`Phase 2: Processing ${placedOrFixedCards.length} cards for labels.`);
        placedOrFixedCards.forEach(card => {
            const label = card.labelElement;
            // Ensure card has a position and a label element
            if (!label || !card.pos || card.pos.x === null) return; 

            // Place label above the card's final position
            label.style.position = 'absolute';
            // Position relative to the layout container element
            label.style.left = `${card.pos.x}px`;
            label.style.top = `${card.pos.y - 25}px`; // Place 25px above the card top 
            label.style.display = '';
            label.style.visibility = 'visible';
            label.style.zIndex = '100'; // Ensure above cards
            
            // Simple label styling
            label.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            label.style.padding = '2px 5px';
            label.style.borderRadius = '3px';
            label.style.fontSize = '12px';
            label.style.fontWeight = 'normal';
            label.style.border = '1px solid #ccc';
        });
    }

    // --- REMOVED OLD PHYSICS SIMULATION CODE ---
    /*
    // Function to apply forces (Repulsion, Boundary, Gravity)
    function applyForces(cardData, fixedElementsRects, allowedArea, config) { ... REMOVED ... }
    // Function to update card positions based on forces
    function updatePositions(cardData, config) { ... REMOVED ... }
    // Function to check if the system has stabilized
    function checkStability(totalMovement, stableIterations, config) { ... REMOVED ... }
    // Function to animate to final positions (might need adapting or removing if BL is instant)
    function animateToFinalPositions() { ... REMOVED ... }
    // The main simulation loop using requestAnimationFrame
    let animationFrameId = null;
    let iterationCount = 0;
    let stableCounter = 0;
    function simulationStep() { ... REMOVED ... }
    */

});