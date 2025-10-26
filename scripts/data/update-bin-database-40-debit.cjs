#!/usr/bin/env node
/**
 * Update BIN Database with 40 Debit Cards from CSV
 * Converts binlist-data.csv to public/bin-database.json (only 40 debit cards)
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CSV_PATH = path.join(__dirname, '..', 'binlist-data.csv');
const JSON_PATH = path.join(__dirname, '..', 'public', 'bin-database.json');
const MAX_DEBIT_CARDS = 40;

/**
 * Map brand names to standard format
 */
function normalizeBrand(brand) {
  const brandMap = {
    'VISA': 'Visa',
    'MASTERCARD': 'Mastercard',
    'AMEX': 'American Express',
    'AMERICAN EXPRESS': 'American Express',
    'DISCOVER': 'Discover',
    'JCB': 'JCB',
    'DINERS CLUB': 'Diners Club',
    'UNIONPAY': 'UnionPay',
    'MAESTRO': 'Maestro',
    'PRIVATE LABEL': 'Private Label'
  };
  
  return brandMap[brand?.toUpperCase()] || brand || 'Unknown';
}

/**
 * Determine card length based on brand
 */
function getCardLength(brand) {
  const bin = brand?.toUpperCase() || '';
  if (bin.includes('AMEX') || bin.includes('AMERICAN EXPRESS')) return 15;
  if (bin.includes('DINERS')) return 14;
  return 16;
}

/**
 * Determine CVV length based on brand
 */
function getCVVLength(brand) {
  const bin = brand?.toUpperCase() || '';
  if (bin.includes('AMEX') || bin.includes('AMERICAN EXPRESS')) return 4;
  return 3;
}

/**
 * Determine scheme from brand
 */
function getScheme(brand) {
  const b = brand?.toLowerCase() || '';
  if (b.includes('visa')) return 'visa';
  if (b.includes('mastercard')) return 'mastercard';
  if (b.includes('amex') || b.includes('american express')) return 'amex';
  if (b.includes('discover')) return 'discover';
  if (b.includes('jcb')) return 'jcb';
  if (b.includes('diners')) return 'diners';
  if (b.includes('unionpay')) return 'unionpay';
  if (b.includes('maestro')) return 'maestro';
  return 'unknown';
}

async function convertCSVtoJSON() {
  console.log('🔄 Extracting 40 DEBIT cards from CSV...');
  console.log(`📂 Reading: ${CSV_PATH}`);
  
  const bins = {};
  let lineCount = 0;
  let debitCount = 0;
  
  const fileStream = fs.createReadStream(CSV_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let headers = [];
  
  for await (const line of rl) {
    lineCount++;
    
    // Skip header line
    if (lineCount === 1) {
      headers = line.split(',');
      console.log(`📋 Headers: ${headers.join(', ')}`);
      continue;
    }
    
    // Stop if we have enough debit cards
    if (debitCount >= MAX_DEBIT_CARDS) {
      console.log(`✅ Found ${MAX_DEBIT_CARDS} debit cards, stopping search.`);
      break;
    }
    
    // Parse CSV line - handle quoted fields with commas
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Push the last value
    
    const cleanValues = values;
    
    if (cleanValues.length < headers.length) {
      continue; // Skip malformed lines
    }
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = cleanValues[index] || '';
    });
    
    const bin = row.bin;
    const brand = row.brand || 'Unknown';
    const type = (row.type || 'credit').toLowerCase();
    const issuer = row.issuer || '';
    const country = row.alpha_2 || 'US';
    const countryName = row.country || 'Unknown';
    
    // Only process DEBIT cards
    if (type !== 'debit') {
      continue;
    }
    
    if (!bin || bin.length < 4) {
      continue; // Skip invalid BINs
    }
    
    // Skip PRIVATE LABEL cards without issuer info (prefer branded cards)
    if (brand === 'PRIVATE LABEL' && !issuer) {
      continue;
    }
    
    const normalizedBrand = normalizeBrand(brand);
    const scheme = getScheme(brand);
    
    bins[bin] = {
      scheme: scheme,
      type: type,
      brand: normalizedBrand,
      bank: issuer || 'Various',
      country: country,
      countryName: countryName,
      length: getCardLength(brand),
      cvvLength: getCVVLength(brand)
    };
    
    debitCount++;
    
    // Progress indicator
    if (debitCount % 10 === 0) {
      console.log(`⏳ Found ${debitCount} debit cards...`);
    }
  }
  
  console.log(`✅ Processed ${debitCount} debit cards out of ${lineCount - 1} total lines`);
  
  // Create final database object
  const database = {
    bins: bins
  };
  
  // Write to JSON file
  console.log(`💾 Writing to: ${JSON_PATH}`);
  fs.writeFileSync(JSON_PATH, JSON.stringify(database, null, 2), 'utf8');
  
  const fileSize = fs.statSync(JSON_PATH).size;
  const fileSizeKB = (fileSize / 1024).toFixed(2);
  
  console.log(`✅ BIN database updated successfully!`);
  console.log(`📊 Total Debit BINs: ${Object.keys(bins).length}`);
  console.log(`📦 File size: ${fileSizeKB} KB`);
  console.log(`📍 Location: ${JSON_PATH}`);
}

// Run the conversion
convertCSVtoJSON().catch(error => {
  console.error('❌ Error converting BIN database:', error);
  process.exit(1);
});

