const fs = require('fs');
const path = require('path');

const replacements = [
    'dataNascita', 'coachId', 'createdAt', 'strutturaId', 'gestoreId', 'dataOra',
    'capacitaMassima', 'postiOccupati', 'corsoId', 'userId', 'importoTotale',
    'percezionesSforzo', 'frequenzaCardiacaMedia', 'gpxTrace', 'stravaId', 'tipoId',
    'dataInizio', 'dataFine', 'rinnovoAutomatico', 'abbonamentoId', 'stripePaymentIntentId',
    'tipoAbbonamentoId', 'percentualeSconto', 'monoUso', 'couponId', 'usatoAt',
    'risorsaId', 'attoreId', 'distanzaTotale', 'tempoTotaleMinuti', 'ritmoMedio',
    'incassoTotale', 'accessiGiornalieri', 'abbonamentiAttivi', 'generatoAt',
    'sessioneId', 'vecchiaDataOra', 'nuovaDataOra'
];

// Helper to recursively get all files
function walkSync(dir, filelist = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            filelist = walkSync(filepath, filelist);
        } else {
            if (filepath.endsWith('.ts') || filepath.endsWith('.tsx') || filepath.endsWith('.sql')) {
                filelist.push(filepath);
            }
        }
    }
    return filelist;
}

const files = walkSync(path.join(__dirname, 'src'));

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    for (const word of replacements) {
        const regex = new RegExp('\\b' + word + '\\b', 'g');
        content = content.replace(regex, word.toLowerCase());
    }

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
}
console.log('Replacement complete.');
