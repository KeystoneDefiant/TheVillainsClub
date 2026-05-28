#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Convert a string to camelCase
 * Handles spaces, underscores, and hyphens as delimiters
 * Preserves existing camelCase
 */
function toCamelCase(str) {
  const ext = str.match(/\.[^.]+$/)?.[0] || '';
  const baseName = str.slice(0, str.length - ext.length);
  
  // If it's already camelCase, don't convert
  if (baseName === baseName.replace(/[\s_-]/g, '') && /[a-z]+[A-Z]/.test(baseName)) {
    return str; // Already camelCase
  }
  
  return baseName
    .split(/[\s_-]+/)
    .map((word, index) => {
      if (index === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('') + ext;
}

/**
 * Convert directory name to camelCase
 * Preserves existing camelCase
 */
function dirToCamelCase(str) {
  // If it's already camelCase, don't convert
  if (str === str.replace(/[\s_-]/g, '') && /[a-z]+[A-Z]/.test(str)) {
    return str; // Already camelCase
  }
  
  return str
    .split(/[\s_-]+/)
    .map((word, index) => {
      if (index === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

/**
 * Main execution
 */
async function main() {
  const contentDir = path.join(__dirname, '../content');
  const bandsDir = path.join(contentDir, 'audio/bands');
  const bandsJsonPath = path.join(contentDir, 'bands.json');

  console.log('🎵 Starting camelCase conversion for band audio files...\n');

  // Read bands.json
  let bandsData;
  try {
    const jsonContent = fs.readFileSync(bandsJsonPath, 'utf-8');
    bandsData = JSON.parse(jsonContent);
  } catch (err) {
    console.error('❌ Error reading bands.json:', err.message);
    process.exit(1);
  }

  // Process each band
  const renamedBands = [];
  
  for (const band of bandsData.bands) {
    const oldDirName = band.id;
    const newDirName = dirToCamelCase(oldDirName);
    const oldDirPath = path.join(bandsDir, oldDirName);
    const newDirPath = path.join(bandsDir, newDirName);

    console.log(`📁 Processing band: ${oldDirName} → ${newDirName}`);

    // Check if old directory exists
    if (!fs.existsSync(oldDirPath)) {
      console.warn(`  ⚠️  Directory not found: ${oldDirPath}`);
      renamedBands.push(band);
      continue;
    }

    // Read current music files
    let musicFiles;
    try {
      musicFiles = fs.readdirSync(oldDirPath).filter(f => f.endsWith('.mp3'));
    } catch (err) {
      console.error(`  ❌ Error reading directory: ${err.message}`);
      renamedBands.push(band);
      continue;
    }

    // Create new directory if needed
    if (oldDirName !== newDirName) {
      if (!fs.existsSync(newDirPath)) {
        try {
          fs.mkdirSync(newDirPath, { recursive: true });
          console.log(`  ✅ Created directory: ${newDirName}`);
        } catch (err) {
          console.error(`  ❌ Error creating directory: ${err.message}`);
          renamedBands.push(band);
          continue;
        }
      }
    }

    // Rename and track music files
    const newMusicFiles = [];
    for (const musicFile of musicFiles) {
      const newFileName = toCamelCase(musicFile);
      const oldFilePath = path.join(oldDirPath, musicFile);
      const newFilePath = path.join(newDirPath, newFileName);

      try {
        // Only process if the new name is different from the old name
        if (musicFile !== newFileName) {
          // Use renameSync which handles case changes on case-insensitive filesystems
          fs.renameSync(oldFilePath, newFilePath);
          console.log(`    📄 ${musicFile} → ${newFileName}`);
        } else {
          console.log(`    ℹ️  ${musicFile} (no change needed)`);
        }
        newMusicFiles.push(newFileName);
      } catch (err) {
        console.error(`    ❌ Error renaming file: ${err.message}`);
        newMusicFiles.push(musicFile); // Keep original if rename fails
      }
    }

    // Update band entry
    const updatedBand = {
      ...band,
      id: newDirName,
      asset_root: `audio/bands/${newDirName}`,
      music_files: newMusicFiles,
    };

    renamedBands.push(updatedBand);
  }

  // Write updated bands.json
  try {
    const updatedData = {
      ...bandsData,
      bands: renamedBands,
    };
    fs.writeFileSync(bandsJsonPath, JSON.stringify(updatedData, null, 2));
    console.log(`\n✅ Updated bands.json\n`);
  } catch (err) {
    console.error('❌ Error writing bands.json:', err.message);
    process.exit(1);
  }

  // Remove old directories if they differ from new ones
  for (const band of bandsData.bands) {
    const oldDirName = band.id;
    const newDirName = dirToCamelCase(oldDirName);
    const oldDirPath = path.join(bandsDir, oldDirName);
    const newDirPath = path.join(bandsDir, newDirName);

    if (oldDirName !== newDirName && fs.existsSync(oldDirPath)) {
      try {
        fs.rmSync(oldDirPath, { recursive: true, force: true });
        console.log(`🗑️  Removed old directory: ${oldDirName}`);
      } catch (err) {
        console.warn(`⚠️  Could not remove old directory ${oldDirName}: ${err.message}`);
      }
    }
  }

  console.log('\n✅ Conversion complete!');
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
