const fs = require('fs');
const CsvReadableStream = require('csv-reader');

let inputStream = fs.createReadStream('contacts.csv', 'utf8');
let outCsv = "NAME,NUMBER"
inputStream
    .pipe(new CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true }))
    .on('data', function (row) {
        const numberStr = `${row[1]}`;
        if (numberStr.startsWith('971') && numberStr.length == 12) {
            console.log(row[1]);
            outCsv += `\n${row[0]},${row[1]}`
        }
    })
    .on('end', function () {
        console.log('No more rows!');
        fs.writeFileSync('fep.csv', outCsv);
    });