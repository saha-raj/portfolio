Documentation: 2D Card Placement Algorithm
Version: Corresponds to the code in artifact card_placement_code (includes initial/final plotting, fixed card coloring).

Dependencies: matplotlib (pip install matplotlib)

1. Problem Overview
The script aims to solve a 2D placement problem: arranging rectangular "cards" within a defined space without any overlaps. Key characteristics of the problem include:

Space: Bounded width (W), effectively unbounded height (extends downwards). Includes padding at the top (p_top) and sides (p_side).

Cards: Rectangles of potentially varying dimensions (width, height). Each card has its own padding (p_card) around it.

Fixed Card: One card is designated as "fixed" and its position is predetermined.

Overlap Constraint: Cards (including their padding) cannot overlap each other.

Boundary Constraint: Cards must remain within the padded boundaries of the space (left, right, top).

Goal: Place all movable cards as compactly as possible, generally minimizing the overall height used, starting from an arbitrary initial configuration. The script also visualizes both the initial and final placements.

2. Algorithm: Bottom-Left Heuristic
The script implements a variation of the Bottom-Left (BL) packing heuristic, a common greedy algorithm for strip packing problems (fixed width, infinite height).

Sorting: Movable cards are first sorted, typically by a primary criterion like decreasing height and a secondary criterion like decreasing width. This often helps achieve better packing density.

Iterative Placement: Cards are placed one by one in their sorted order.

Position Selection: For each card, the algorithm searches for the "best" valid position. "Best" is defined as:

The position with the lowest possible y coordinate (Bottom-most).

Among positions with the same lowest y, the one with the lowest x coordinate (Left-most).

Candidate Positions: The search for the best position considers potential y coordinates defined by the top boundary (p_top) and the bottom edges of already placed cards' effective areas. For each candidate y, it scans horizontally from the left boundary (p_side) to find the first x coordinate where the card fits without overlapping any previously placed cards and stays within the width boundary.

Effective Boundaries: All collision checks and boundary checks are performed using the effective dimensions and positions of the cards (i.e., the card size plus its p_card padding on all sides).

3. Code Components
3.1. Rectangle Class
Purpose: Represents a single card and manages its properties and state.

Attributes:

id: A unique identifier for the card.

width, height: Dimensions of the actual card.

p_card: Padding specific to this card.

fixed: Boolean flag indicating if the card's position is fixed.

pos: Tuple (x, y) storing the final calculated top-left corner of the actual card. None until placed (unless fixed).

initial_pos_vis: Tuple (x, y) storing an initial position used only for the initial state visualization. For fixed cards, this is the same as pos.

Properties:

eff_width, eff_height: Calculate the dimensions including padding (width + 2*p_card, height + 2*p_card).

eff_pos: Calculates the effective top-left corner (x - p_card, y - p_card) based on the final pos. Used for placement calculations and collision checks.

Methods:

get_eff_pos_for_vis(use_initial=False): Returns the effective top-left corner corresponding to either initial_pos_vis or pos, used by the plotting function.

__repr__(): Provides a formatted string representation of the card's state.

3.2. check_overlap(r1_eff_pos, r1_eff_dims, r2_eff_pos, r2_eff_dims)
Purpose: Checks if two rectangles overlap.

Inputs: Takes the effective top-left positions and effective dimensions of two rectangles.

Logic: Uses standard axis-aligned bounding box (AABB) overlap detection logic. Returns True if they overlap, False otherwise. Includes a small tolerance for floating-point comparisons.

3.3. place_cards_bottom_left(movable_cards, fixed_card, W, p_top, p_side)
Purpose: Implements the core Bottom-Left placement algorithm.

Inputs:

movable_cards: List of Rectangle objects to be placed.

fixed_card: The single fixed Rectangle object (or None).

W, p_top, p_side: Space parameters.

Logic:

Validates and adds the fixed_card (if any) to the placed_cards list.

Sorts movable_cards (descending height, then width).

Iterates through sorted movable cards:

Checks if the card is too wide for the effective space width.

Generates candidate y coordinates (space top padding + bottom edges of placed cards).

Sorts candidate y coordinates (ascending).

For each y, scans x from the left boundary (p_side).

At each potential (x, y), checks for overlaps with all placed_cards using check_overlap on effective boundaries.

If overlap, jumps x to the right edge of the obstacle and continues scanning.

If no overlap and within width bounds, selects this (x, y) as the best for the current y level and breaks the x scan.

Keeps track of the best position found across all y levels (lowest y, then lowest x).

Assigns the best found effective position to the card using the eff_pos setter (which updates the final pos).

Adds the successfully placed card to placed_cards.

Tracks cards that couldn't be placed (e.g., too wide).

Outputs: Returns a tuple: (list_of_all_placed_cards, max_y_coordinate_reached, list_of_unplaced_cards).

3.4. plot_layout(...)
Purpose: Visualizes the card layout using Matplotlib.

Inputs: List of Rectangle objects, space parameters, maximum y-coordinate for plot bounds, title, filename, and use_initial_pos flag.

Logic:

Sets up a Matplotlib figure and axes.

Draws the boundary of the effective placement area.

Iterates through the provided cards:

Selects pos or initial_pos_vis based on use_initial_pos.

Skips cards without a valid position for the selected view.

Determines color: Black for fixed cards, colors from a colormap (viridis) for movable cards.

Draws the effective padding area (dashed outline).

Draws the actual card rectangle with the determined face color.

Adds text label (ID, dimensions) inside the card, adjusting text color for contrast.

Adds a "FIXED" label above fixed cards.

Configures plot limits, labels, title, aspect ratio, and grid.

Saves the plot to the specified plot_filename.

Closes the plot figure to free memory.

4. Coordinate System & Padding
Origin: The coordinate system assumes (0,0) is at the top-left corner of the entire space (before considering p_top, p_side).

Axes: x increases to the right, y increases downwards.

pos Attribute: The (x, y) stored in card.pos (and card.initial_pos_vis) refers to the top-left corner of the actual card.

Effective Area: For all placement logic and overlap checks, the code uses the card's effective area, which includes the p_card padding. The effective top-left corner is at (pos.x - p_card, pos.y - p_card).

Space Padding: The placement algorithm operates within the bounds defined by p_side, W - p_side, and p_top. The fixed card must be placed such that its effective area respects these boundaries. Movable cards are placed respecting these boundaries automatically by the algorithm.

5. Usage (if __name__ == "__main__":)
The main execution block demonstrates how to use the functions:

Define Parameters: Sets values for W_space, p_top_space, p_side_space, p_card_padding.

Create Fixed Card: Instantiates the fixed Rectangle, providing its dimensions and a valid initial_pos. The example calculates initial_pos to align the effective top-left of the fixed card with the space padding boundaries.

Create Movable Cards: Defines data for movable cards and creates Rectangle instances.

Assign Initial Positions (for Vis): Loops through movable cards and assigns a simple initial_pos_vis (e.g., stacked/staggered near top-left) purely for the initial visualization plot. Calculates initial_max_y needed for this plot.

Plot Initial Layout: Calls plot_layout with use_initial_pos=True to save the initial state visualization (card_layout_initial.png).

Run Placement: Calls place_cards_bottom_left with the movable cards list and the fixed card instance.

Display Results: Prints the final calculated positions (card.pos) for placed cards and lists any unplaced cards. Prints the maximum y coordinate reached.

Plot Final Layout: Calls plot_layout again with use_initial_pos=False and the results from the placement function to save the final layout visualization (card_layout_final.png).