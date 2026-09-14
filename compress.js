const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const MAX_WIDTH = 1200;
const QUALITY = 80;
const IMG_DIR = path.join(__dirname, 'img');

async function compressImage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) return;

    try {
        const metadata = await sharp(filePath).metadata();
        const needsResize = metadata.width > MAX_WIDTH;
        const isJpg = ['.jpg', '.jpeg'].includes(ext);

        let pipeline = sharp(filePath);

        if (needsResize) {
            pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
        }

        if (isJpg) {
            pipeline = pipeline.jpeg({ quality: QUALITY, mozjpeg: true });
        } else {
            pipeline = pipeline.png({ quality: QUALITY, compressionLevel: 9 });
        }

        await pipeline.toFile(filePath + '.tmp');
        fs.renameSync(filePath + '.tmp', filePath);

        const stat = fs.statSync(filePath);
        console.log(`  OK: ${path.relative(IMG_DIR, filePath)} (${(stat.size / 1024).toFixed(1)}KB)`);
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
    console.log('');

    if (!fs.existsSync(IMG_DIR)) {
        console.error('No se encontro la carpeta img/');
        process.exit(1);
    }

    await processDir(IMG_DIR);
    console.log('');
    console.log('Compresion completada.');
}

main();
