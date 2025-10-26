#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Card Generator - Python Implementation
Professional credit card and person information generator
Based on Luhn algorithm and Markov chain optimization
"""

import json
import random
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Tuple, Optional


class LuhnValidator:
    """Luhn algorithm implementation for credit card validation"""
    
    @staticmethod
    def calculate_check_digit(card_number: str) -> str:
        """Calculate Luhn check digit"""
        total = 0
        should_double = True
        
        for digit in reversed(card_number):
            n = int(digit)
            
            if should_double:
                n *= 2
                if n > 9:
                    n -= 9
            
            total += n
            should_double = not should_double
        
        check_digit = (10 - (total % 10)) % 10
        return str(check_digit)
    
    @staticmethod
    def validate(card_number: str) -> bool:
        """Validate complete card number using Luhn algorithm"""
        total = 0
        should_double = False
        
        for digit in reversed(card_number):
            n = int(digit)
            
            if should_double:
                n *= 2
                if n > 9:
                    n -= 9
            
            total += n
            should_double = not should_double
        
        return total % 10 == 0


class MarkovChainGenerator:
    """Markov chain digit generator"""
    
    # Transition probability matrix
    TRANSITION_MATRIX = {
        0: [0.08, 0.11, 0.12, 0.10, 0.09, 0.11, 0.08, 0.10, 0.11, 0.10],
        1: [0.10, 0.08, 0.11, 0.12, 0.09, 0.10, 0.11, 0.09, 0.10, 0.10],
        2: [0.11, 0.10, 0.08, 0.11, 0.12, 0.09, 0.10, 0.11, 0.09, 0.09],
        3: [0.09, 0.11, 0.10, 0.08, 0.11, 0.12, 0.09, 0.10, 0.11, 0.09],
        4: [0.10, 0.09, 0.11, 0.10, 0.08, 0.11, 0.12, 0.09, 0.10, 0.10],
        5: [0.11, 0.10, 0.09, 0.11, 0.10, 0.08, 0.11, 0.12, 0.09, 0.09],
        6: [0.09, 0.11, 0.10, 0.09, 0.11, 0.10, 0.08, 0.11, 0.12, 0.09],
        7: [0.10, 0.09, 0.11, 0.10, 0.09, 0.11, 0.10, 0.08, 0.11, 0.11],
        8: [0.11, 0.10, 0.09, 0.11, 0.10, 0.09, 0.11, 0.10, 0.08, 0.11],
        9: [0.10, 0.11, 0.10, 0.09, 0.11, 0.10, 0.09, 0.11, 0.10, 0.09]
    }
    
    @classmethod
    def get_next_digit(cls, previous_segment: str) -> int:
        """Generate next digit using Markov chain"""
        if not previous_segment:
            return random.randint(0, 9)
        
        last_digit = int(previous_segment[-1])
        probabilities = cls.TRANSITION_MATRIX[last_digit]
        
        rand = random.random()
        cumulative = 0
        
        for digit in range(10):
            cumulative += probabilities[digit]
            if rand < cumulative:
                return digit
        
        return 0


class BINDatabase:
    """BIN database manager"""
    
    def __init__(self, db_path: Optional[str] = None):
        """Initialize BIN database"""
        if db_path is None:
            # Use absolute path relative to script location
            script_dir = Path(__file__).parent
            db_path = str(script_dir.parent / 'public' / 'bin-database.json')
        self.database = self._load_database(db_path)
    
    def _load_database(self, path: str) -> Dict:
        """Load BIN database from file"""
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('bins', {})
        except Exception as e:
            print(f"⚠️ BIN database load failed: {e}")
            return {}
    
    def detect_card_brand(self, bin_code: str) -> Dict:
        """Detect card brand from BIN"""
        # Try exact match
        if bin_code in self.database:
            return self.database[bin_code]
        
        # Try 4-digit match
        bin_4 = bin_code[:4]
        if bin_4 in self.database:
            return self.database[bin_4]
        
        # Try 2-digit match
        bin_2 = bin_code[:2]
        if bin_2 in self.database:
            return self.database[bin_2]
        
        # Try 1-digit match
        bin_1 = bin_code[:1]
        if bin_1 in self.database:
            return self.database[bin_1]
        
        # Fallback to traditional rules
        return self._detect_by_rules(bin_code)
    
    def _detect_by_rules(self, bin_code: str) -> Dict:
        """Detect card brand using traditional rules"""
        if bin_code.startswith('4'):
            return {'brand': 'Visa', 'length': 16, 'cvvLength': 3, 'bank': 'Unknown', 'country': 'US'}
        elif bin_code.startswith('5'):
            return {'brand': 'Mastercard', 'length': 16, 'cvvLength': 3, 'bank': 'Unknown', 'country': 'US'}
        elif bin_code.startswith(('34', '37')):
            return {'brand': 'American Express', 'length': 15, 'cvvLength': 4, 'bank': 'Unknown', 'country': 'US'}
        else:
            return {'brand': 'Unknown', 'length': 16, 'cvvLength': 3, 'bank': 'Unknown', 'country': 'US'}


class CardGenerator:
    """Credit card generator"""
    
    def __init__(self, bin_db_path: Optional[str] = None):
        """Initialize card generator"""
        self.bin_db = BINDatabase(bin_db_path)
    
    @staticmethod
    def hash_bank_name(bank_name: str) -> int:
        """Generate hash seed from bank name"""
        if not bank_name or bank_name == "Unknown":
            return 0
        
        hash_obj = hashlib.md5(bank_name.encode('utf-8'))
        hash_hex = hash_obj.hexdigest()
        return int(hash_hex[:8], 16) % 100
    
    def generate_account_segment(self, length: int, bin_code: str, bank_name: str) -> str:
        """Generate account number segment"""
        segment = ""
        bank_seed = self.hash_bank_name(bank_name)
        
        # First 2 digits - branch code
        bin_last_4 = bin_code[-4:] if len(bin_code) >= 4 else bin_code
        branch_code = (int(bin_last_4) + bank_seed) % 100
        segment += str(branch_code).zfill(2)
        
        # Middle digits - Markov chain
        for _ in range(length - 4):
            next_digit = MarkovChainGenerator.get_next_digit(segment)
            segment += str(next_digit)
        
        # Last 2 digits - sequence number
        sequence = random.randint(10, 99)
        segment += str(sequence)
        
        return segment
    
    @staticmethod
    def generate_expiry_date() -> Tuple[str, str]:
        """Generate realistic expiry date"""
        year_weights = [
            (2, 0.15), (3, 0.40), (4, 0.25), (5, 0.15), (6, 0.05)
        ]
        
        rand = random.random()
        cumulative = 0
        years_to_add = 3
        
        for years, weight in year_weights:
            cumulative += weight
            if rand < cumulative:
                years_to_add = years
                break
        
        # Month distribution
        common_months = [3, 5, 6, 9, 11, 12]
        if random.random() < 0.8:
            month = random.choice(common_months)
        else:
            month = random.randint(1, 12)
        
        expiry_date = datetime.now() + timedelta(days=365 * years_to_add)
        return f"{month:02d}/{expiry_date.year % 100:02d}"
    
    @staticmethod
    def generate_cvv(card_number: str, expiry_date: str, cvv_length: int) -> str:
        """Generate CVV code"""
        seed = int(card_number[-4:]) + int(expiry_date.replace('/', ''))
        pseudo_random = (seed * 9301 + 49297) % 233280
        
        if cvv_length == 4:
            cvv = str((pseudo_random % 9000) + 1000)
        else:
            cvv = str((pseudo_random % 900) + 100)
        
        # Avoid weak patterns
        weak_patterns = ['111', '222', '333', '444', '555', '666', '777', '888', '999', '000']
        if cvv[:3] in weak_patterns:
            offset = 1234 if cvv_length == 4 else 123
            if cvv_length == 4:
                cvv = str(((pseudo_random + offset) % 9000) + 1000)
            else:
                cvv = str(((pseudo_random + offset) % 900) + 100)
        
        return cvv[:cvv_length]
    
    def generate_card(self, bin_code: str = '532959') -> Dict:
        """Generate complete card information"""
        brand_info = self.bin_db.detect_card_brand(bin_code)
        
        card_length = brand_info.get('length', 16)
        cvv_length = brand_info.get('cvvLength', 3)
        bank_name = brand_info.get('bank', 'Unknown')
        
        # Generate account segment
        account_length = card_length - len(bin_code) - 1
        account_segment = self.generate_account_segment(account_length, bin_code, bank_name)
        
        # Generate card number without check digit
        card_without_check = bin_code + account_segment
        
        # Calculate check digit
        check_digit = LuhnValidator.calculate_check_digit(card_without_check)
        full_card_number = card_without_check + check_digit
        
        # Validate
        if not LuhnValidator.validate(full_card_number):
            print(f"⚠️ Luhn validation failed, regenerating...")
            return self.generate_card(bin_code)
        
        # Generate expiry and CVV
        expiry_date = self.generate_expiry_date()
        cvv = self.generate_cvv(full_card_number, expiry_date, cvv_length)
        
        # Format card number
        if card_length == 15:
            formatted = f"{full_card_number[:4]} {full_card_number[4:10]} {full_card_number[10:]}"
        else:
            formatted = f"{full_card_number[:4]} {full_card_number[4:8]} {full_card_number[8:12]} {full_card_number[12:]}"
        
        return {
            'cardNumber': full_card_number,
            'cardNumberFormatted': formatted,
            'expiryDate': expiry_date,
            'cvv': cvv,
            'brand': brand_info.get('brand', 'Unknown'),
            'bank': bank_name,
            'country': brand_info.get('country', 'US'),
            'countryName': brand_info.get('countryName', 'United States')
        }


class PersonGenerator:
    """US person information generator"""
    
    FIRST_NAMES_MALE = [
        'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
        'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Donald'
    ]
    
    FIRST_NAMES_FEMALE = [
        'Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan',
        'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Margaret'
    ]
    
    LAST_NAMES = [
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
        'Rodriguez', 'Martinez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore'
    ]
    
    def __init__(self, address_db_path: Optional[str] = None):
        """Initialize person generator"""
        if address_db_path is None:
            # Use absolute path relative to script location
            script_dir = Path(__file__).parent
            address_db_path = str(script_dir.parent / 'public' / 'real-addresses.json')
        self.address_database = self._load_address_database(address_db_path)
    
    def _load_address_database(self, path: str) -> Dict:
        """Load address database"""
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"⚠️ Address database load failed: {e}")
            return {}
    
    def generate_name(self) -> str:
        """Generate US person name"""
        gender = random.choice(['male', 'female'])
        
        if gender == 'male':
            first_name = random.choice(self.FIRST_NAMES_MALE)
        else:
            first_name = random.choice(self.FIRST_NAMES_FEMALE)
        
        last_name = random.choice(self.LAST_NAMES)
        return f"{first_name} {last_name}"
    
    def generate_address(self) -> Dict:
        """Generate US address"""
        try:
            us_data = self.address_database.get('US', {})
            
            # Random state
            states = list(us_data.keys())
            if not states:
                return self._generate_fallback_address()
            
            state = random.choice(states)
            cities = us_data[state]
            
            # Random city
            city_names = list(cities.keys())
            if not city_names:
                return self._generate_fallback_address()
            
            city = random.choice(city_names)
            addresses = cities[city]
            
            # Random address
            if not addresses:
                return self._generate_fallback_address()
            
            address = random.choice(addresses)
            
            return {
                'street': address['street'],
                'city': city,
                'state': state,
                'zip': address['zip'],
                'country': 'US',
                'source': 'database'
            }
        
        except Exception as e:
            print(f"⚠️ Address generation failed: {e}")
            return self._generate_fallback_address()
    
    def _generate_fallback_address(self) -> Dict:
        """Generate fallback address"""
        street_names = ['Main', 'Oak', 'Maple', 'Cedar', 'Elm', 'Washington']
        suffixes = ['St', 'Ave', 'Rd', 'Dr', 'Ln']
        
        number = random.randint(100, 9999)
        street = random.choice(street_names)
        suffix = random.choice(suffixes)
        
        return {
            'street': f"{number} {street} {suffix}",
            'city': 'Portland',
            'state': 'OR',
            'zip': '97219',
            'country': 'US',
            'source': 'generator'
        }


def generate_complete_info(bin_code: str = '532959', quantity: int = 1) -> List[Dict]:
    """Generate complete person and card information"""
    card_gen = CardGenerator()
    person_gen = PersonGenerator()
    
    results = []
    
    for i in range(quantity):
        card = card_gen.generate_card(bin_code)
        name = person_gen.generate_name()
        address = person_gen.generate_address()
        
        result = {
            'name': name,
            'card': card,
            'address': address,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        results.append(result)
    
    return results


def save_to_file(data: List[Dict], filename: str = 'generated_cards.txt'):
    """Save to file"""
    with open(filename, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("Card Helper v1.0 - Card and Person Information Generator\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Quantity: {len(data)} records\n")
        f.write("=" * 80 + "\n\n")
        
        for idx, item in enumerate(data, 1):
            f.write(f"{'=' * 80}\n")
            f.write(f"Record #{idx}\n")
            f.write(f"{'=' * 80}\n\n")
            
            # Person info
            f.write("【Person Information】\n")
            f.write(f"Name: {item['name']}\n")
            f.write(f"Generated: {item['timestamp']}\n\n")
            
            # Card info
            card = item['card']
            f.write("【Card Information】\n")
            f.write(f"Card Number: {card['cardNumber']}\n")
            f.write(f"Formatted: {card['cardNumberFormatted']}\n")
            f.write(f"Expiry: {card['expiryDate']}\n")
            f.write(f"CVV: {card['cvv']}\n")
            f.write(f"Brand: {card['brand']}\n")
            f.write(f"Bank: {card['bank']}\n")
            f.write(f"Country: {card['countryName']} ({card['country']})\n\n")
            
            # Address info
            addr = item['address']
            f.write("【Address Information】\n")
            f.write(f"Street: {addr['street']}\n")
            f.write(f"City: {addr['city']}\n")
            f.write(f"State: {addr['state']}\n")
            f.write(f"ZIP: {addr['zip']}\n")
            f.write(f"Country: {addr['country']}\n")
            f.write(f"Source: {addr['source']}\n\n")
            
            # Simple format
            f.write("【Simple Format】\n")
            f.write(f"{card['cardNumber']}|{card['expiryDate']}|{card['cvv']}\n")
            f.write(f"{item['name']}\n")
            f.write(f"{addr['street']}, {addr['city']}, {addr['state']} {addr['zip']}\n\n")


if __name__ == '__main__':
    print("🚀 Card Helper v1.0 - Card and Person Information Generator")
    print("=" * 80)
    
    # Configuration
    BIN_CODE = '451710'  # Visa Debit Card (Jyske Bank, Denmark)
    QUANTITY = 10
    
    print(f"📋 Configuration:")
    print(f"   BIN: {BIN_CODE}")
    print(f"   Quantity: {QUANTITY}")
    print()
    
    # Generate
    print("🔄 Generating...")
    data = generate_complete_info(BIN_CODE, QUANTITY)
    
    # Save
    print("💾 Saving to generated_cards.txt...")
    save_to_file(data, 'generated_cards.txt')
    
    print()
    print("✅ Generation complete!")
    print(f"📄 File saved: generated_cards.txt")
    print(f"📊 Generated {len(data)} records")
    print()
    
    # Show first example
    if data:
        first = data[0]
        print("📝 Example (first record):")
        print(f"   Name: {first['name']}")
        print(f"   Card: {first['card']['cardNumber']}")
        print(f"   Expiry: {first['card']['expiryDate']}")
        print(f"   CVV: {first['card']['cvv']}")
        print(f"   Address: {first['address']['street']}, {first['address']['city']}, {first['address']['state']}")

