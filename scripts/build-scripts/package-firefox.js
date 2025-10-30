import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..', '..');

const BUILD_DIR = path.join(ROOT_DIR, 'build-firefox');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

async function createXpi() {
  // Ensure dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // Get version from manifest
  const manifest = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'manifest.json'), 'utf8'));
  const version = manifest.version;
  const outputPath = path.join(DIST_DIR, `cursor-card-helper-firefox-${version}.xpi`);

  // Remove old file if exists
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }

  // Create write stream
  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log('\n✅ Package created successfully!');
      console.log(`📦 File: ${outputPath}`);
      console.log(`📊 Size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
      resolve(outputPath);
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add all files from build directory
    archive.directory(BUILD_DIR, false);

    archive.finalize();
  });
}

console.log('📦 Packaging Firefox extension...\n');
createXpi()
  .then((xpiPath) => {
    console.log('\n🎉 Ready to upload to Firefox Add-ons!');
    console.log('\n📋 Upload instructions:');
    console.log('   1. Go to: https://addons.mozilla.org/developers/');
    console.log('   2. Click \'Submit a New Add-on\'');
    console.log(`   3. Upload: ${path.basename(xpiPath)}`);
    console.log('   4. Choose distribution channel (Listed or Unlisted)');
    console.log('   5. Fill in listing details');
    console.log('   6. Submit for review');
    console.log('\n⚠️  Note: Firefox may request source code for review');
  })
  .catch((err) => {
    console.error('❌ Error creating package:', err);
    process.exit(1);
  });

