import matplotlib.pyplot as plt
import matplotlib.patches as patches
import time
import math
import random  # Added for potential random initial placement


class Rectangle:
    """Represents a card with dimensions, padding, and position."""

    def __init__(self, id, width, height, p_card, fixed=False, initial_pos=None):
        # Validate inputs
        if width <= 0 or height <= 0:
            raise ValueError(
                f"Card {id} dimensions must be positive (w={width}, h={height})."
            )
        if p_card < 0:
            raise ValueError(f"Card {id} padding cannot be negative (p_card={p_card}).")

        self.id = id
        self.width = width
        self.height = height
        self.p_card = p_card  # Padding specific to this card
        self.fixed = fixed  # Boolean indicating if the card's position is fixed

        # Position (x, y) refers to the TOP-LEFT corner of the ACTUAL card area
        # This will store the FINAL calculated position (or initial if fixed)
        self.pos = initial_pos if fixed else (None, None)

        # Store a separate initial position for visualization purposes before placement
        # If fixed, it's the same as the final position. If movable, it's set later.
        self.initial_pos_vis = initial_pos if fixed else (None, None)

        # Ensure fixed cards have a position
        if fixed and not initial_pos:
            raise ValueError(f"Fixed card {id} must have an initial_pos provided.")

    @property
    def eff_width(self):
        """Calculate the effective width including padding on both sides."""
        return self.width + 2 * self.p_card

    @property
    def eff_height(self):
        """Calculate the effective height including padding on top and bottom."""
        return self.height + 2 * self.p_card

    @property
    def eff_pos(self):
        """Get the effective top-left position based on the FINAL position."""
        if self.pos[0] is None or self.pos[1] is None:
            return (None, None)
        return (self.pos[0] - self.p_card, self.pos[1] - self.p_card)

    @eff_pos.setter
    def eff_pos(self, value):
        """Set the FINAL actual position based on the desired effective top-left."""
        eff_x, eff_y = value
        if eff_x is None or eff_y is None:
            self.pos = (None, None)
        else:
            self.pos = (eff_x + self.p_card, eff_y + self.p_card)

    def get_eff_pos_for_vis(self, use_initial=False):
        """Get the effective top-left position for visualization (initial or final)."""
        pos_to_use = self.initial_pos_vis if use_initial else self.pos
        if pos_to_use is None or pos_to_use[0] is None or pos_to_use[1] is None:
            return (None, None)
        return (pos_to_use[0] - self.p_card, pos_to_use[1] - self.p_card)

    def __repr__(self):
        """Provide a user-friendly string representation of the rectangle."""
        pos_str = (
            f"({self.pos[0]:.1f}, {self.pos[1]:.1f})"
            if self.pos[0] is not None
            else "Unplaced"
        )
        init_pos_str = (
            f"({self.initial_pos_vis[0]:.1f}, {self.initial_pos_vis[1]:.1f})"
            if self.initial_pos_vis is not None and self.initial_pos_vis[0] is not None
            else "None"
        )
        return (
            f"Rect(id={self.id}, w={self.width}, h={self.height}, "
            f"p_card={self.p_card}, final_pos={pos_str}, init_pos={init_pos_str}, fixed={self.fixed})"
        )


# --- Placement Logic (Unchanged from previous version) ---
def check_overlap(r1_eff_pos, r1_eff_dims, r2_eff_pos, r2_eff_dims):
    """Checks overlap based on effective boundaries."""
    r1x, r1y = r1_eff_pos
    r1w, r1h = r1_eff_dims
    r2x, r2y = r2_eff_pos
    r2w, r2h = r2_eff_dims
    if r1x is None or r1y is None or r2x is None or r2y is None:
        return False
    tolerance = 1e-9
    if (
        r1x + r1w <= r2x + tolerance
        or r1x >= r2x + r2w - tolerance
        or r1y + r1h <= r2y + tolerance
        or r1y >= r2y + r2h - tolerance
    ):
        return False
    else:
        return True


def place_cards_bottom_left(movable_cards, fixed_card, W, p_top, p_side):
    """Places movable cards using Bottom-Left heuristic."""
    placed_cards = []
    unplaced_cards = []
    max_y_coord = p_top
    min_x_bound, max_x_bound = p_side, W - p_side
    min_y_bound = p_top
    eff_W_space = max_x_bound - min_x_bound

    if fixed_card:
        if fixed_card.pos == (None, None):
            raise ValueError("Fixed card lacks initial position.")
        fx, fy = fixed_card.eff_pos
        fw, fh = fixed_card.eff_width, fixed_card.eff_height
        tolerance = 1e-9
        if (
            fx < min_x_bound - tolerance
            or fy < min_y_bound - tolerance
            or fx + fw > max_x_bound + tolerance
        ):
            raise ValueError(f"Fixed card {fixed_card.id} out of bounds.")
        placed_cards.append(fixed_card)
        max_y_coord = max(max_y_coord, fy + fh)
        # print(f"Validated fixed card: {fixed_card}") # Keep commented unless debugging

    sorted_cards = sorted(
        movable_cards, key=lambda r: (r.height, r.width), reverse=True
    )

    for card in sorted_cards:
        card_eff_w, card_eff_h = card.eff_width, card.eff_height
        if card_eff_w > eff_W_space + 1e-9:
            print(
                f"Warning: Card {card.id} (eff_w={card_eff_w:.1f}) wider than space ({eff_W_space:.1f}). Cannot place."
            )
            unplaced_cards.append(card)
            continue

        candidate_y = {min_y_bound}
        for p_card in placed_cards:
            candidate_y.add(p_card.eff_pos[1] + p_card.eff_height)
        sorted_candidate_y = sorted(list(candidate_y))

        found_pos_for_card = False
        min_found_y = float("inf")
        best_pos_for_min_y = None

        for y in sorted_candidate_y:
            if y >= min_found_y:
                continue
            x = min_x_bound
            while x + card_eff_w <= max_x_bound + 1e-9:
                potential_eff_pos = (x, y)
                overlap = False
                max_overlapping_x_edge = -1
                for p_card in placed_cards:
                    if check_overlap(
                        potential_eff_pos,
                        (card_eff_w, card_eff_h),
                        p_card.eff_pos,
                        (p_card.eff_width, p_card.eff_height),
                    ):
                        overlap = True
                        max_overlapping_x_edge = max(
                            max_overlapping_x_edge, p_card.eff_pos[0] + p_card.eff_width
                        )

                if not overlap:
                    found_pos_for_card = True
                    min_found_y = y
                    best_pos_for_min_y = potential_eff_pos
                    break  # Found left-most x for this y
                else:
                    next_x = max_overlapping_x_edge
                    if next_x <= x + 1e-9:
                        # print(f"Debug: Card {card.id} potentially stuck at x={x:.1f}, y={y:.1f}. Incrementing x.")
                        x += 1  # Increment slightly if stuck
                    else:
                        x = next_x  # Jump past obstacle

        if found_pos_for_card:
            card.eff_pos = best_pos_for_min_y  # Sets final card.pos
            placed_cards.append(card)
            max_y_coord = max(max_y_coord, card.eff_pos[1] + card.eff_height)
        else:
            print(f"Error: Could not find valid position for card {card.id}.")
            unplaced_cards.append(card)

    all_placed_cards = ([fixed_card] if fixed_card else []) + [
        c for c in sorted_cards if c not in unplaced_cards
    ]
    return all_placed_cards, max_y_coord, unplaced_cards


# --- Visualization Function (MODIFIED) ---
def plot_layout(
    cards,
    W,
    p_top,
    p_side,
    plot_max_y,
    title="Card Layout",
    plot_filename="card_layout.png",
    use_initial_pos=False,
):
    """
    Plots the card layout using Matplotlib. Can plot initial or final positions.
    Colors the fixed card black.

    Args:
        cards: List of Rectangle objects to plot.
        W: Total width of the bounding space.
        p_top: Padding at the top of the space.
        p_side: Padding at the sides of the space.
        plot_max_y: The maximum y-coordinate to set the plot limit (can be calculated based on initial/final).
        title: The title for the plot.
        plot_filename: The filename to save the plot image.
        use_initial_pos: Boolean, if True plots initial_pos_vis, otherwise plots final pos.
    """
    fig, ax = plt.subplots(1, figsize=(10, 8))

    # Determine plot boundaries
    plot_height = max(plot_max_y + p_top * 2, W * 0.6)  # Add buffer
    eff_W = W - 2 * p_side

    # Draw effective placement area boundary
    rect_space = patches.Rectangle(
        (p_side, p_top),
        eff_W,
        plot_height - p_top,
        linewidth=1.5,
        edgecolor="darkgrey",
        facecolor="#FDFDFD",
        linestyle="--",
        label=f"Placement Area (W={eff_W:.0f})",
    )
    ax.add_patch(rect_space)

    # Use a perceptually uniform colormap for movable cards
    num_movable = sum(1 for card in cards if not card.fixed)
    colors = plt.cm.get_cmap(
        "viridis", max(1, num_movable)
    )  # Avoid division by zero if no movable cards
    movable_idx = 0

    placed_card_count = 0
    for card in cards:
        # Determine which position and effective position to use for plotting
        pos_to_plot = card.initial_pos_vis if use_initial_pos else card.pos
        eff_pos_to_plot = card.get_eff_pos_for_vis(use_initial=use_initial_pos)

        # Skip cards that don't have a valid position for the current view (initial/final)
        if pos_to_plot is None or pos_to_plot[0] is None or pos_to_plot[1] is None:
            continue

        placed_card_count += 1
        x, y = pos_to_plot  # Actual top-left corner for plotting
        w, h = card.width, card.height  # Actual dimensions
        eff_x, eff_y = eff_pos_to_plot  # Effective top-left corner (includes padding)
        eff_w, eff_h = (
            card.eff_width,
            card.eff_height,
        )  # Effective dimensions (includes padding)

        # Determine color: Black for fixed, colormap for movable
        if card.fixed:
            face_color = "black"
            text_color = "white"
            padding_edge_color = "grey"  # Make padding outline visible against black
        else:
            color_idx = movable_idx / max(1, num_movable - 1) if num_movable > 1 else 0
            face_color = colors(color_idx)
            text_color = (
                "white" if sum(face_color[:3]) < 1.5 else "black"
            )  # Basic contrast check
            padding_edge_color = face_color
            movable_idx += 1

        # Draw padding area (effective boundary)
        rect_padding = patches.Rectangle(
            (eff_x, eff_y),
            eff_w,
            eff_h,
            linewidth=1,
            edgecolor=padding_edge_color,
            facecolor="none",
            linestyle=":",
            alpha=0.7,
        )
        ax.add_patch(rect_padding)

        # Draw actual card rectangle
        rect_card = patches.Rectangle(
            (x, y),
            w,
            h,
            linewidth=1.5,
            edgecolor="black",
            facecolor=face_color,
            alpha=0.9,
        )
        ax.add_patch(rect_card)

        # Add text label inside the card
        fontsize = max(6, min(10, int(min(w, h) / 5)))
        ax.text(
            x + w / 2,
            y + h / 2,
            f"{card.id}\n({w}x{h})",
            ha="center",
            va="center",
            fontsize=fontsize,
            color=text_color,
            weight="bold",
        )

        # Mark fixed card distinctly (already done by color, but label helps)
        if card.fixed:
            ax.text(
                eff_x + eff_w / 2,
                eff_y - 5,
                "FIXED",
                ha="center",
                va="bottom",
                fontsize=10,
                color="red",
                weight="bold",
            )

    # Configure plot axes and labels
    ax.set_xlim(0, W)
    ax.set_ylim(plot_height, 0)  # Invert y-axis
    ax.set_xlabel(f"Width (X) - Total W = {W}")
    ax.set_ylabel("Height (Y)")
    ax.set_title(f"{title} ({placed_card_count}/{len(cards)} cards shown)")
    ax.set_aspect("equal", adjustable="box")
    plt.grid(True, linestyle=":", alpha=0.4)
    plt.tight_layout()

    # Save the plot to the specified file
    try:
        plt.savefig(plot_filename, dpi=150)
        print(f"Plot saved to {plot_filename}")
    except Exception as e:
        print(f"Error saving plot '{plot_filename}': {e}")
    finally:
        plt.close(fig)  # Close the plot figure


# --- Example Usage (MODIFIED) ---
if __name__ == "__main__":
    # Define Space Parameters
    W_space = 500
    p_top_space = 50
    p_side_space = 20

    # Define Card Parameters
    p_card_padding = 5

    # Define Fixed Card
    try:
        fixed_card_instance = Rectangle(
            id="F0",
            width=100,
            height=60,
            p_card=p_card_padding,
            fixed=True,
            initial_pos=(75, 60),
        )
    except ValueError as e:
        print(f"Error initializing fixed card: {e}")
        fixed_card_instance = None

    # Define Movable Cards Data
    movable_cards_data = [
        {"id": "M1", "width": 50, "height": 80},
        {"id": "M2", "width": 70, "height": 50},
        {"id": "M3", "width": 120, "height": 90},
        {"id": "M4", "width": 60, "height": 60},
        {"id": "M5", "width": 90, "height": 40},
        {"id": "M6", "width": 150, "height": 70},
        {"id": "M7", "width": 40, "height": 100},
        {"id": "M8", "width": 80, "height": 80},
        {"id": "M9", "width": 200, "height": 50},
        {"id": "M10", "width": 30, "height": 120},
        {"id": "M11", "width": 480, "height": 30},
        {"id": "M12", "width": 50, "height": 50},
        {"id": "M13", "width": 75, "height": 75},
    ]

    # Create Rectangle instances for movable cards and assign initial vis positions
    movable_cards_list = []
    initial_max_y = p_top_space  # Track max y for initial plot bounds
    for i, d in enumerate(movable_cards_data):
        try:
            card = Rectangle(
                id=d["id"], width=d["width"], height=d["height"], p_card=p_card_padding
            )
            # Assign a simple initial position for visualization (e.g., offset stack)
            init_x = (
                p_side_space + p_card_padding + (i % 4) * 20
            )  # Stagger horizontally
            init_y = p_top_space + p_card_padding + (i // 4) * 20  # Stagger vertically
            card.initial_pos_vis = (init_x, init_y)
            movable_cards_list.append(card)
            # Update max y needed for initial plot (based on effective bottom edge)
            initial_max_y = max(
                initial_max_y,
                card.get_eff_pos_for_vis(use_initial=True)[1] + card.eff_height,
            )

        except ValueError as e:
            print(f"Error initializing movable card {d.get('id', 'N/A')}: {e}")

    # Combine fixed and movable for plotting lists
    all_cards_initial = (
        [fixed_card_instance] if fixed_card_instance else []
    ) + movable_cards_list
    if fixed_card_instance:
        initial_max_y = max(
            initial_max_y,
            fixed_card_instance.get_eff_pos_for_vis(use_initial=True)[1]
            + fixed_card_instance.eff_height,
        )

    # --- Generate Initial Placement Plot ---
    if all_cards_initial:
        print("\nGenerating initial placement plot...")
        plot_layout(
            cards=all_cards_initial,
            W=W_space,
            p_top=p_top_space,
            p_side=p_side_space,
            plot_max_y=initial_max_y,  # Use calculated max y for initial layout
            title="Initial Card Placement (Before Algorithm)",
            plot_filename="card_layout_initial.png",
            use_initial_pos=True,  # Specify plotting initial positions
        )
    else:
        print("No cards to plot initially.")

    # --- Execute the Placement Algorithm ---
    if fixed_card_instance or movable_cards_list:
        print("\nStarting card placement using Bottom-Left heuristic...")
        start_time = time.time()
        try:
            final_layout, final_max_y, unplaced_list = place_cards_bottom_left(
                movable_cards=movable_cards_list,  # Pass only movable ones to algorithm
                fixed_card=fixed_card_instance,
                W=W_space,
                p_top=p_top_space,
                p_side=p_side_space,
            )
            end_time = time.time()
            print(f"\nPlacement finished in {end_time - start_time:.4f} seconds.")
            print(f"Final max y-coordinate (effective bottom edge): {final_max_y:.1f}")

            # --- Display Final Positions ---
            print("\n--- Final Card Positions (Actual Top-Left Corner) ---")
            for card in final_layout:
                print(card)
            if unplaced_list:
                print("\n--- Unplaced Cards ---")
                for card in unplaced_list:
                    print(card)

            # --- Generate Final Placement Plot ---
            print("\nGenerating final placement plot...")
            # Combine placed and unplaced for the final plot context
            all_cards_final = final_layout + unplaced_list
            plot_layout(
                cards=all_cards_final,
                W=W_space,
                p_top=p_top_space,
                p_side=p_side_space,
                plot_max_y=final_max_y,  # Use max y returned by algorithm
                title="Final Card Layout (Bottom-Left Algorithm)",
                plot_filename="card_layout_final.png",
                use_initial_pos=False,  # Specify plotting final positions
            )

        except ValueError as e:
            print(f"\nError during placement: {e}")
        except Exception as e:
            print(f"\nAn unexpected error occurred: {e}")
    else:
        print("No valid cards defined to place.")

    print("\nScript finished.")