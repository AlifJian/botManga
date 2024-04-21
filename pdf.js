const pdf = require("pdfkit");
const fs = require("fs")

const mangaPdf = new pdf;
mangaPdf.pipe(fs.createWriteStream(`asep.pdf`))
// for(let i = 0; i < 16; i++){
    mangaPdf.image(`./download/0.webp`)
// }

mangaPdf.end()