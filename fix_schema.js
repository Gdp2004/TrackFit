const fs = require('fs');
const content = fs.readFileSync('src/backend/infrastructure/config/schema.sql', 'utf8');

// We need to quote all column names that have camelCase.
// E.g., dataNascita, coachId, createdAt, strutturaId, capacitaMassima, etc.
// A regex to find lines defining columns and quote the first word if it matches camelCase.
// Or we can just manually replace all known camelCase words in the file.
const replacements = [
    'dataNascita', 'coachId', 'createdAt', 'userId', 'strutturaId', 'capacitaMassima',
    'postiOccupati', 'dataOra', 'importoTotale', 'percezionesSforzo', 'frequenzaCardiacaMedia',
    'gpxTrace', 'stravaId', 'tipoId', 'dataInizio', 'dataFine', 'rinnovoAutomatico',
    'abbonamentoId', 'stripePaymentIntentId', 'tipoAbbonamentoId', 'percentualeSconto',
    'monoUso', 'couponId', 'usatoAt', 'risorsaId', 'attoreId', 'distanzaTotale',
    'tempoTotaleMinuti', 'ritmoMedio', 'incassoTotale', 'accessiGiornalieri',
    'abbonamentiAttivi', 'generatoAt', 'gestoreId', 'corsoId', 'sessioneId', 'vecchiaDataOra', 'nuovaDataOra'
];

let newContent = content;
for (const word of replacements) {
    // Replace whole word occurrences with quoted version
    const regex = new RegExp('\\\\b' + word + '\\\\b', 'g');
    newContent = newContent.replace(regex, '\"' + word + '\"');
}

fs.writeFileSync('src/backend/infrastructure/config/schema.sql', newContent);
console.log('Done!');
