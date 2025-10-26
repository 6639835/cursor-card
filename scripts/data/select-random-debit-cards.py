#!/usr/bin/env python3
"""
Random Debit Card Selector
Selects random debit cards from different countries that meet bin-database.json requirements
"""

import csv
import json
import random
from collections import defaultdict
from pathlib import Path

def load_bin_database(json_path):
    """Load and analyze the bin-database.json to understand required fields"""
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    # Get the required fields from existing entries
    required_fields = set()
    if data['bins']:
        sample_entry = next(iter(data['bins'].values()))
        required_fields = set(sample_entry.keys())
    
    print(f"✓ Loaded bin-database.json with {len(data['bins'])} entries")
    print(f"✓ Required fields: {', '.join(sorted(required_fields))}")
    return data, required_fields

def validate_card_entry(row, required_fields):
    """
    Validate that a card entry has all required fields from bin-database.json
    Returns tuple: (is_valid, formatted_entry)
    """
    # Check if it's a debit card
    if row['type'].upper() != 'DEBIT':
        return False, None
    
    # Map CSV columns to JSON format
    entry = {
        'scheme': row['brand'].lower().replace(' ', '') if row['brand'] else 'unknown',
        'type': row['type'].lower(),
        'brand': row['brand'] if row['brand'] else 'Unknown',
        'bank': row['issuer'] if row['issuer'] else 'Various',
        'country': row['alpha_2'],
        'countryName': row['country'],
        'length': 16,  # Default, will be set based on scheme
        'cvvLength': 3  # Default
    }
    
    # Set proper length and CVV based on scheme
    if 'amex' in entry['scheme'] or entry['scheme'] == 'americanexpress':
        entry['scheme'] = 'amex'
        entry['brand'] = 'American Express'
        entry['length'] = 15
        entry['cvvLength'] = 4
    elif 'visa' in entry['scheme']:
        entry['scheme'] = 'visa'
        entry['brand'] = 'Visa'
        entry['length'] = 16
        entry['cvvLength'] = 3
    elif 'mastercard' in entry['scheme'] or 'master' in entry['scheme']:
        entry['scheme'] = 'mastercard'
        entry['brand'] = 'Mastercard'
        entry['length'] = 16
        entry['cvvLength'] = 3
    elif 'discover' in entry['scheme']:
        entry['scheme'] = 'discover'
        entry['brand'] = 'Discover'
        entry['length'] = 16
        entry['cvvLength'] = 3
    elif 'jcb' in entry['scheme']:
        entry['scheme'] = 'jcb'
        entry['brand'] = 'JCB'
        entry['length'] = 16
        entry['cvvLength'] = 3
    elif 'dinersclub' in entry['scheme'] or 'diners' in entry['scheme']:
        entry['scheme'] = 'dinersclub'
        entry['brand'] = 'Diners Club'
        entry['length'] = 14
        entry['cvvLength'] = 3
    elif 'private' in entry['scheme'].lower() or 'label' in entry['brand'].lower():
        entry['scheme'] = 'unknown'
        entry['brand'] = 'Private Label'
    
    # Validate required fields are present and not empty
    for field in required_fields:
        if field not in entry or not entry[field]:
            return False, None
    
    # Ensure we have valid country code
    if not entry['country'] or len(entry['country']) != 2:
        return False, None
    
    return True, entry

def select_random_cards(csv_path, json_path, num_cards=10, prioritize_diversity=True):
    """
    Select random debit cards from CSV that meet bin-database.json requirements
    
    Args:
        csv_path: Path to binlist-data.csv
        json_path: Path to bin-database.json
        num_cards: Number of cards to select
        prioritize_diversity: If True, prioritize selecting cards from different countries
    """
    # Load bin database to understand requirements
    bin_db, required_fields = load_bin_database(json_path)
    
    # Group cards by country
    cards_by_country = defaultdict(list)
    total_valid = 0
    total_processed = 0
    
    print(f"\n📖 Reading {csv_path}...")
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            total_processed += 1
            
            # Show progress every 50k rows
            if total_processed % 50000 == 0:
                print(f"   Processed {total_processed:,} rows, found {total_valid:,} valid debit cards...")
            
            is_valid, entry = validate_card_entry(row, required_fields)
            
            if is_valid:
                cards_by_country[entry['country']].append({
                    'bin': row['bin'],
                    'entry': entry
                })
                total_valid += 1
    
    print(f"✓ Processed {total_processed:,} total rows")
    print(f"✓ Found {total_valid:,} valid debit cards")
    print(f"✓ From {len(cards_by_country)} different countries")
    
    # Select cards
    selected_cards = []
    
    if prioritize_diversity:
        print(f"\n🎲 Selecting {num_cards} cards (prioritizing country diversity)...")
        
        # Get list of countries sorted by number of cards (for better distribution)
        countries = list(cards_by_country.keys())
        random.shuffle(countries)
        
        # Select one card from each country first
        for country in countries:
            if len(selected_cards) >= num_cards:
                break
            card = random.choice(cards_by_country[country])
            selected_cards.append(card)
        
        # If we need more cards, randomly select from remaining
        if len(selected_cards) < num_cards:
            all_cards = [card for cards in cards_by_country.values() for card in cards]
            remaining = num_cards - len(selected_cards)
            additional = random.sample(all_cards, min(remaining, len(all_cards)))
            selected_cards.extend(additional)
    else:
        print(f"\n🎲 Selecting {num_cards} cards (random selection)...")
        all_cards = [card for cards in cards_by_country.values() for card in cards]
        selected_cards = random.sample(all_cards, min(num_cards, len(all_cards)))
    
    return selected_cards, cards_by_country

def display_results(selected_cards):
    """Display selected cards in a formatted way"""
    print(f"\n{'='*80}")
    print(f"SELECTED DEBIT CARDS ({len(selected_cards)} cards)")
    print(f"{'='*80}\n")
    
    for i, card in enumerate(selected_cards, 1):
        entry = card['entry']
        print(f"{i}. BIN: {card['bin']}")
        print(f"   Brand: {entry['brand']} ({entry['scheme']})")
        print(f"   Country: {entry['countryName']} ({entry['country']})")
        print(f"   Bank: {entry['bank']}")
        print(f"   Length: {entry['length']} digits, CVV: {entry['cvvLength']} digits")
        print()

def save_to_json(selected_cards, output_path):
    """Save selected cards to a JSON file in bin-database.json format"""
    output_data = {
        'bins': {}
    }
    
    for card in selected_cards:
        output_data['bins'][card['bin']] = card['entry']
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2)
    
    print(f"✓ Saved {len(selected_cards)} cards to {output_path}")

def main():
    # Set up paths
    script_dir = Path(__file__).parent.parent
    csv_path = script_dir / 'binlist-data.csv'
    json_path = script_dir / 'public' / 'bin-database.json'
    output_path = script_dir / 'scripts' / 'selected-debit-cards.json'
    
    print("🃏 Random Debit Card Selector")
    print("=" * 80)
    
    # Select cards
    selected_cards, all_cards_by_country = select_random_cards(
        csv_path=csv_path,
        json_path=json_path,
        num_cards=40,  # Change this number as needed
        prioritize_diversity=True
    )
    
    # Display results
    display_results(selected_cards)
    
    # Show country distribution
    print("=" * 80)
    print("COUNTRY DISTRIBUTION IN SELECTION")
    print("=" * 80)
    country_count = defaultdict(int)
    for card in selected_cards:
        country_count[card['entry']['country']] += 1
    
    for country, count in sorted(country_count.items()):
        country_name = selected_cards[0]['entry']['countryName'] if selected_cards else ''
        for card in selected_cards:
            if card['entry']['country'] == country:
                country_name = card['entry']['countryName']
                break
        print(f"  {country} ({country_name}): {count} card(s)")
    
    print()
    
    # Save to file
    save_to_json(selected_cards, output_path)
    
    print(f"\n✅ Done! Selected {len(selected_cards)} debit cards from {len(country_count)} countries")

if __name__ == '__main__':
    main()

