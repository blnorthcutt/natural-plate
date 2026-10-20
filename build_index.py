#!/usr/bin/env python3
"""
build_index.py — Generate recipes.json from recipe markdown files.

Scans the recipes/ directory for *.md files (excluding _TEMPLATE.md),
parses their YAML front matter, and writes a JSON index at recipes.json.

Usage:
    python3 build_index.py
"""

import json
import re
from pathlib import Path

RECIPES_DIR = Path(__file__).parent / "recipes"
OUTPUT = Path(__file__).parent / "recipes.json"


def parse_front_matter(text):
    """Split markdown text into (front_matter_block, body)."""
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', text, re.DOTALL)
    if not match:
        return None, text
    return match.group(1), text[match.end():]


def get_scalar(front, key):
    """Extract a scalar value: key: "value" or key: value"""
    m = re.search(rf'^{key}:\s*"([^"]*)"', front, re.MULTILINE)
    if m:
        return m.group(1)
    m = re.search(rf"^{key}:\s*'([^']*)'", front, re.MULTILINE)
    if m:
        return m.group(1)
    m = re.search(rf'^{key}:\s*(\S+)', front, re.MULTILINE)
    if m:
        return m.group(1)
    return None


def get_list(front, key):
    """Extract a YAML list: key:\n  - item1\n  - item2 OR key: ["a", "b"] OR key: [a, b]"""
    # Try inline array: key: ["a", "b"] or key: [a, b]
    m = re.search(rf'^{key}:\s*\[(.+)\]', front, re.MULTILINE)
    if m:
        raw = m.group(1)
        items = re.findall(r'"([^"]*)"|\'([^\']*)\'|([^,\s][^,]*[^,\s])', raw)
        return [i[0] or i[1] or i[2] for i in items]
    # Try block list: key:\n  - item1\n  - item2
    pattern = rf'^{key}:\s*\n((?:\s+- .+\n?)*)'
    m = re.search(pattern, front, re.MULTILINE)
    if not m:
        return []
    block = m.group(1)
    return [i.strip().strip('"').strip("'") for i in re.findall(r'^\s+-\s+(.+)$', block, re.MULTILINE)]


def get_dict_list(front, key):
    """Extract a list of dicts: key:\n  - name: x\n    amount: y\n    type: z\n    kind: w"""
    pattern = rf'^{key}:\s*\n((?:\s+- .+\n(?:\s+  .+\n?)*)*)'
    m = re.search(pattern, front, re.MULTILINE)
    if not m:
        return []
    block = m.group(1)
    items = []
    current = None
    for line in block.split('\n'):
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith('- '):
            if current:
                items.append(current)
            current = {}
            kv = stripped[2:].strip()
            if ': ' in kv:
                k, v = kv.split(': ', 1)
                current[k.strip()] = v.strip().strip('"').strip("'")
        elif current and ': ' in stripped:
            k, v = stripped.split(': ', 1)
            current[k.strip()] = v.strip().strip('"').strip("'")
    if current:
        items.append(current)
    return items


def extract_description(body):
    """Extract the first paragraph after ## Description."""
    m = re.search(r'## Description\s*\n+(.*?)(?:\n\n|\n##)', body, re.DOTALL)
    if m:
        desc = m.group(1).strip()
        return desc[:250] + ("..." if len(desc) > 250 else "")
    return ""


def main():
    recipes = []
    errors = []

    for md_file in sorted(RECIPES_DIR.glob("*.md")):
        if "_TEMPLATE" in md_file.name:
            continue

        text = md_file.read_text(encoding="utf-8")
        front, body = parse_front_matter(text)
        if front is None:
            errors.append(f"{md_file.name}: no front matter")
            continue

        title = get_scalar(front, "title")
        slug = get_scalar(front, "slug")
        if not title or not slug:
            errors.append(f"{md_file.name}: missing title or slug")
            continue

        servings_raw = get_scalar(front, "servings")
        source = get_scalar(front, "source")
        image = get_scalar(front, "image")
        recipe = {
            "id": slug,
            "title": title,
            "slug": slug,
            "source": source if source else None,
            "image": image if image else None,
            "file": f"./recipes/{md_file.name}",
            "servings": int(servings_raw) if servings_raw and servings_raw.isdigit() else 4,
            "prep_time": get_scalar(front, "prep_time") or "",
            "cook_time": get_scalar(front, "cook_time") or "",
            "total_time": get_scalar(front, "total_time") or "",
            "difficulty": get_scalar(front, "difficulty") or "easy",
            "season": get_list(front, "season"),
            "meal": get_list(front, "meal"),
            "dietary": get_list(front, "dietary"),
            "tags": get_list(front, "tags"),
            "ingredients": get_dict_list(front, "ingredients"),
            "description": extract_description(body),
        }
        recipes.append(recipe)
        print(f"  ✓ {md_file.name} → {slug}")

    recipes.sort(key=lambda r: r["slug"])
    
    # Collect all unique tags for tag pages
    all_tags = set()
    all_seasons = set()
    all_meals = set()
    all_dietary = set()
    all_ingredient_types = set()
    all_ingredient_kinds = set()
    for r in recipes:
        all_tags.update(r["tags"])
        all_seasons.update(r["season"])
        all_meals.update(r["meal"])
        all_dietary.update(r["dietary"])
        for ing in r["ingredients"]:
            if ing.get("type"):
                all_ingredient_types.add(ing["type"])
            if ing.get("kind"):
                all_ingredient_kinds.add(ing["kind"])

    output = {
        "recipes": recipes,
        "meta": {
            "count": len(recipes),
            "generated": "natural-plate build_index.py"
        },
        "taxonomies": {
            "tags": sorted(all_tags),
            "seasons": sorted(all_seasons),
            "meals": sorted(all_meals),
            "dietary": sorted(all_dietary),
            "ingredient_types": sorted(all_ingredient_types),
            "ingredient_kinds": sorted(all_ingredient_kinds),
        }
    }

    OUTPUT.write_text(json.dumps(output, indent=2, ensure_ascii=False))
    print(f"\n✅ Wrote {len(recipes)} recipes to {OUTPUT}")

    if errors:
        print(f"\n⚠️  {len(errors)} errors:")
        for e in errors:
            print(f"   {e}")


if __name__ == "__main__":
    main()