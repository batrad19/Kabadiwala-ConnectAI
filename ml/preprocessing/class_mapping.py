"""
Official class mapping from dataset labels to Kabadiwala Connect AI app categories.

After running dataset_analysis.py, inspect the actual folder names and update
the mappings below.  The CONFIRMED_CATEGORIES list must only contain categories
that have training data — do NOT claim support for untrained categories.
"""

# ---------------------------------------------------------------------------
# E-Tadweer dataset classes → app category slugs
# ---------------------------------------------------------------------------
# Source: https://github.com/ELECTRONIC-WASTE  (update URL after verification)
# Update "original_folder_name" keys after running dataset_analysis.py on
# the actual E-Tadweer dataset to see exact folder names.

ETADWEER_TO_APP: dict[str, str] = {
    # --- Confirmed mappings (update after dataset inspection) ---
    "laptop": "laptop",
    "mobile": "mobile_phone",
    "battery": "battery",
    "keyboard": "keyboard",
    "mouse": "mouse",
    "pcb": "pcb",
    "monitor": "monitor",
    "printer": "printer",
    "television": "television",
    "cable": "cables",
    "charger": "charger_adapter",
    # --- Common alternate spellings seen in public datasets ---
    "laptops": "laptop",
    "mobiles": "mobile_phone",
    "phones": "mobile_phone",
    "smartphone": "mobile_phone",
    "batteries": "battery",
    "keyboards": "keyboard",
    "mice": "mouse",
    "circuit_board": "pcb",
    "circuit board": "pcb",
    "printed_circuit_board": "pcb",
    "monitors": "monitor",
    "printers": "printer",
    "tv": "television",
    "televisions": "television",
    "cables": "cables",
    "wire": "cables",
    "chargers": "charger_adapter",
    "adapter": "charger_adapter",
    "adapters": "charger_adapter",
}

# ---------------------------------------------------------------------------
# Kaggle E-Waste dataset classes → app category slugs
# ---------------------------------------------------------------------------
# Source: https://www.kaggle.com/datasets/akshat103/e-waste-image-dataset
# Update after inspecting downloaded dataset folder names.

KAGGLE_EWASTE_TO_APP: dict[str, str] = {
    # Placeholder — update after inspecting actual folder names
    # Example common names from Kaggle e-waste datasets:
    "CRT_TV": "television",
    "CRT_Monitor": "monitor",
    "Flat_Panel_Monitor": "monitor",
    "laptop": "laptop",
    "mobile_phone": "mobile_phone",
    "PCB": "pcb",
    "battery": "battery",
    "keyboard": "keyboard",
    "mouse": "mouse",
    "printer": "printer",
    "cable": "cables",
    "charger": "charger_adapter",
}

# ---------------------------------------------------------------------------
# Roboflow YOLO dataset classes → app category slugs
# ---------------------------------------------------------------------------
# Source: Roboflow Universe e-waste detection datasets
# Class names are defined in the data.yaml file.

ROBOFLOW_TO_APP: dict[str, str] = {
    # Update after downloading YOLO dataset and inspecting data.yaml
    "laptop": "laptop",
    "phone": "mobile_phone",
    "battery": "battery",
    "keyboard": "keyboard",
    "mouse": "mouse",
    "pcb": "pcb",
    "monitor": "monitor",
    "printer": "printer",
    "tv": "television",
    "cable": "cables",
    "charger": "charger_adapter",
}

# ---------------------------------------------------------------------------
# Official 12 App Categories
# ---------------------------------------------------------------------------
APP_CATEGORIES: list[str] = [
    "laptop",           # Laptops, notebooks, netbooks
    "mobile_phone",     # Smartphones, feature phones, tablets
    "battery",          # All battery types (Li-ion, NiMH, lead-acid)
    "keyboard",         # Desktop and laptop keyboards
    "mouse",            # Computer mice, trackballs
    "pcb",              # Printed circuit boards, motherboards, RAM
    "monitor",          # LCD, LED, CRT monitors
    "printer",          # Inkjet, laser, 3D printers
    "television",       # CRT, LED, plasma TVs
    "cables",           # Power cables, data cables, wires, connectors
    "charger_adapter",  # Chargers, power adapters, power banks
    "other_ewaste",     # Fallback for unrecognized e-waste
]

# Human-readable display names for the app UI
CATEGORY_DISPLAY_NAMES: dict[str, str] = {
    "laptop": "Laptop / Notebook",
    "mobile_phone": "Mobile Phone / Tablet",
    "battery": "Battery",
    "keyboard": "Keyboard",
    "mouse": "Mouse / Trackpad",
    "pcb": "Circuit Board / PCB",
    "monitor": "Monitor / Display",
    "printer": "Printer / Scanner",
    "television": "Television",
    "cables": "Cables & Wires",
    "charger_adapter": "Charger / Power Adapter",
    "other_ewaste": "Other E-Waste",
}

# ---------------------------------------------------------------------------
# Confirmed categories (populated after dataset analysis)
# ---------------------------------------------------------------------------
# IMPORTANT: Only list categories here that have verified training data.
# Backend will return a disclaimer for unconfirmed categories.

CONFIRMED_CATEGORIES: list[str] = []
# Example after running analysis and training:
# CONFIRMED_CATEGORIES = [
#     "laptop", "mobile_phone", "battery", "keyboard", "mouse",
#     "pcb", "monitor", "printer", "television", "cables", "charger_adapter"
# ]

# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------

def get_unified_mapping() -> dict[str, str]:
    """
    Merge all source mappings into a single lookup dict.
    Keys are lowercased for case-insensitive matching.
    Later mappings override earlier ones on conflict.
    """
    merged: dict[str, str] = {}
    for source_map in (ETADWEER_TO_APP, KAGGLE_EWASTE_TO_APP, ROBOFLOW_TO_APP):
        for k, v in source_map.items():
            merged[k.lower().strip()] = v
    return merged


def map_folder_name(folder_name: str) -> str:
    """
    Map a dataset folder name to an app category slug.
    Returns 'other_ewaste' if the mapping is unknown.
    """
    unified = get_unified_mapping()
    key = folder_name.lower().strip()
    return unified.get(key, "other_ewaste")


def build_class_to_idx(
    class_names: list[str],
    use_app_categories: bool = True,
) -> dict[str, int]:
    """
    Build a {class_name: int_index} mapping.

    If use_app_categories=True, maps folder names → APP_CATEGORIES first,
    then assigns integer indices based on APP_CATEGORIES order.
    If use_app_categories=False, assigns indices in sorted folder-name order.
    """
    if use_app_categories:
        # Map each folder name to an app category
        app_cats_present: set[str] = set()
        for name in class_names:
            app_cat = map_folder_name(name)
            app_cats_present.add(app_cat)
        # Build index from APP_CATEGORIES (preserves canonical order)
        ordered = [c for c in APP_CATEGORIES if c in app_cats_present]
        return {cat: idx for idx, cat in enumerate(ordered)}
    else:
        sorted_names = sorted(set(class_names))
        return {name: idx for idx, name in enumerate(sorted_names)}


def confirm_category(category: str) -> bool:
    """Return True if the category has verified training data."""
    return category in CONFIRMED_CATEGORIES


if __name__ == "__main__":
    print("APP_CATEGORIES:")
    for i, cat in enumerate(APP_CATEGORIES):
        display = CATEGORY_DISPLAY_NAMES[cat]
        confirmed = "✓" if cat in CONFIRMED_CATEGORIES else "○"
        print(f"  {confirmed} [{i:2d}] {cat:<20} → {display}")

    print("\nUnified mapping (sample):")
    unified = get_unified_mapping()
    for k, v in list(unified.items())[:8]:
        print(f"  '{k}' → '{v}'")
