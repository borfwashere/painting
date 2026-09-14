const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const MAX_WIDTH = 2000;
const QUALITY = 80;
const IMG_DIR = path.join(__dirname, 'img');

const PNG_RENAMES = [];

async function compressImage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return;

    try {
        const metadata = await sharp(filePath).metadata();
        const needsResize = metadata.width > MAX_WIDTH;

        let pipeline = sharp(filePath);

        if (needsResize) {
            pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
        }

        const isPng = ext === '.png';
        let outPath = filePath;

        if (isPng) {
            outPath = filePath.replace(/\.png$/i, '.jpg');
            pipeline = pipeline.jpeg({ quality: QUALITY, mozjpeg: true });
            PNG_RENAMES.push({ from: filePath, to: outPath });
        } else if (ext === '.gif') {
            outPath = filePath.replace(/\.gif$/i, '.jpg');
            pipeline = pipeline.jpeg({ quality: QUALITY, mozjpeg: true });
        } else if (ext === '.webp') {
            outPath = filePath.replace(/\.webp$/i, '.jpg');
            pipeline = pipeline.jpeg({ quality: QUALITY, mozjpeg: true });
        } else {
            pipeline = pipeline.jpeg({ quality: QUALITY, mozjpeg: true });
        }

        const tmpPath = outPath + '.tmp';
        await pipeline.toFile(tmpPath);
        fs.renameSync(tmpPath, outPath);

        if (outPath !== filePath) {
            fs.unlinkSync(filePath);
        }

        const stat = fs.statSync(outPath);
        console.log(`  OK: ${path.relative(IMG_DIR, outPath)} (${(stat.size / 1024).toFixed(1)}KB)`);
    } catch (err) {
        console.error(`  ERROR: ${path.relative(IMG_DIR, filePath)} - ${err.message}`);
    }
}

async function processDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            await processDir(fullPath);
        } else {
            await compressImage(fullPath);
        }
    }
}

async function main() {
    console.log('=== Compresion de imagenes ===');
    console.log(`Directorio: ${IMG_DIR}`);
    console.log(`Ancho maximo: ${MAX_WIDTH}px`);
    console.log(`Calidad: ${QUALITY}%`);
    console.log(`PNGs se convertiran a JPEG`);
    console.log('');

    if (!fs.existsSync(IMG_DIR)) {
        console.error('No se encontro la carpeta img/');
        process.exit(1);
    }

    await processDir(IMG_DIR);

    if (PNG_RENAMES.length > 0) {
        console.log('');
        console.log('=== PNGs convertidos a JPEG ===');
        console.log(JSON.stringify(PNG_RENAMES, null, 2));
    }

    console.log('');
    console.log('Compresion completada.');
}

main();
