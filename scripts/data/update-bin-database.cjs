#!/usr/bin/env node
/**
 * Update BIN Database from CSV
 * Converts binlist-data.csv to public/bin-database.json
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CSV_PATH = path.join(__dirname, '..', 'binlist-data.csv');
const JSON_PATH = path.join(__dirname, '..', 'public', 'bin-database.json');

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
  console.log('🔄 Converting BIN database from CSV to JSON...');
  console.log(`📂 Reading: ${CSV_PATH}`);
  
  const bins = {};
  let lineCount = 0;
  let processedCount = 0;
  
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
    
    // Parse CSV line properly handling quoted fields
    const fields = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim()); // Push last field
    
    if (fields.length < 8) {
      continue; // Skip malformed lines
    }
    
    const bin = fields[0];
    const brand = fields[1] || 'Unknown';
    const type = (fields[2] || 'credit').toLowerCase();
    const category = fields[3] || '';
    const issuer = fields[4] || '';
    const country = fields[5] || 'US';
    const alpha3 = fields[6] || '';
    const countryName = fields[7] || 'Unknown';
    
    if (!bin || bin.length < 4) {
      continue; // Skip invalid BINs
    }
    
    // Only store if brand is not PRIVATE LABEL or if it has an issuer
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
    
    processedCount++;
    
    // Progress indicator
    if (processedCount % 10000 === 0) {
      console.log(`⏳ Processed ${processedCount} BINs...`);
    }
  }
  
  console.log(`✅ Processed ${processedCount} valid BINs out of ${lineCount - 1} total lines`);
  
  // Create final database object
  const database = {
    bins: bins
  };
  
  // Write to JSON file
  console.log(`💾 Writing to: ${JSON_PATH}`);
  fs.writeFileSync(JSON_PATH, JSON.stringify(database, null, 2), 'utf8');
  
  const fileSize = fs.statSync(JSON_PATH).size;
  const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
  
  console.log(`✅ BIN database updated successfully!`);
  console.log(`📊 Total BINs: ${Object.keys(bins).length}`);
  console.log(`📦 File size: ${fileSizeMB} MB`);
  console.log(`📍 Location: ${JSON_PATH}`);
}

// Run the conversion
convertCSVtoJSON().catch(error => {
  console.error('❌ Error converting BIN database:', error);
  process.exit(1);
});

