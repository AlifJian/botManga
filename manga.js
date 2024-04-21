import puppeteer from 'puppeteer-extra';
import stealth from "puppeteer-extra-plugin-stealth";
// import { Browser } from 'puppeteer';
import axios from 'axios';
import fs from 'fs';
import pdf from "pdfkit";
import sharp from "sharp";


puppeteer.use(stealth());

const downloadFile = (url) => {
  return axios
    .get(url, {
      responseType: "arraybuffer"
    })
    .then(response => Buffer.from(response.data, "binary").toString('base64'))
  }
  

const convertToJpeg = async (imageUrl, index) => {
  const base64Img = await downloadFile(imageUrl);
  const buffer = Buffer.from(base64Img, "base64");
  await sharp(buffer).jpeg().toFile(`./download/${index}.jpeg`);
};

const imageFormat = async (imageUrl) => {
  const supportedFormats = ["jpeg", "jpg", "png", "gif", "webp"];
  const format = imageUrl.split(".").pop();
  if(supportedFormats.includes(format)){
    return format.toLowerCase();
  }
  return null;
}


const mangaToto = async () => {
    const url = "https://wto.to"
    const browser = await puppeteer.launch({headless : false});

    const page = await browser.newPage();
    await page.setJavaScriptEnabled(true);
    console.log("menuju page")
    await page.goto(url);
    console.log("pemrosesan")
    //Ambil data dari w.toto
    const seriesList = await page.$$('.col.item.line-b.no-flag');
    const Data = []

  for (let i = 0; i < 10; i++) {
    const series = seriesList[i];
    // Ambil URL dan gambar
    const link = await series.$eval('a.item-cover', anchor => anchor.href);
    const imageUrl = await series.$eval('img.rounded', img => img.src);

    // Ambil judul
    const title = await series.$eval('a.item-title', title => title.textContent.trim());

    // Ambil genre
    const genres = await series.$$eval('.item-genre span', spans => spans.map(span => span.textContent.trim()));

    // Ambil informasi volume dan chapter
    const volChapInfo = await series.$eval('.item-volch a.visited', info => info.textContent.trim());

    //Ambil Informasi link chapter
    const chpUrl = await series.$eval('.item-volch a.visited', anchor => anchor.href.slice("https://wto.to/chapter/".length));


    // Ambil informasi pengguna dan waktu
    const userInfo = await series.$eval('.item-volch i', info => info.textContent.trim());

    // isi hasil ke data
    let data = {
        url : link,
        image : imageUrl,
        title,
        genre : genres.join(", "),
        chp : volChapInfo,
        chpUrl,
        updateAt : userInfo
    }
    Data.push(data);
  }
  await page.setDefaultNavigationTimeout(0);
  await browser.close()
  return Data;
}

const mangaTotoDownload = async (chapter) => {
    const url = "https://wto.to/chapter/" + chapter;
    const Datas = [];
    console.log(url)
    const browser = await puppeteer.launch({headless : false});
  
      console.log("buat page")
      const page = await browser.newPage();
      console.log("selesai buat page")
      await page.setJavaScriptEnabled(true);
      console.log("menuju page")
      await page.goto(url, {waitUntil : 'networkidle2', timeout : 0});
    try {
      console.log("Scrolll")
      // Get scroll width and height of the rendered page and set viewport
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
      await page.setViewport({ width: bodyWidth, height: bodyHeight });
      console.log("selesai Scroll")
      console.log("mengambil data")
      // Menggunakan selector untuk mendapatkan elemen gambar dengan class "page-img"
      const imgElements = await page.$$eval("#viewer .item .page-img", (els) => {
        return els.map( el => el.src)
      })
      console.log("data selesai diambil")
      for(const el of imgElements){
        Datas.push(el)
      }
      // console.log(imgElements)
    }catch (error) {
      console.log(error);
      return;
    }finally{
      browser.close();
    }
    
    const mangaPdf = new pdf;
    mangaPdf.pipe(fs.createWriteStream(`${chapter}.pdf`))
    for(let i = 0; i < Datas.length; i++){
      const format = await imageFormat(Datas[i]);
      console.log(format)
      if(format == "webp"){
        await convertToJpeg(Datas[i], i);
        mangaPdf.image(`./download/${i}.jpeg`, { fit: [612, 792] });
        mangaPdf.addPage();
        fs.unlinkSync(`./download/${i}.jpeg`);
      }else if(format == "jpeg" || format == "png"){
        const base64Img = await downloadFile(Datas[i]);
        await fs.writeFileSync(`./download/${i}.${format})`, base64Img, {encoding : "base64"})
        await mangaPdf.image(`./download/${i}.${format}`);
        await mangaPdf.addPage();
        await fs.unlinkSync(`./download/${i}.jpeg`);
      }else{
        console.log("format gambar tidak didukung")
      }
      
    }
    mangaPdf.end()

    return Datas.length
}

const screenshot = async (url) => {
    const browser = await puppeteer.launch({headless : true});

    const page = await browser.newPage();
    await page.setJavaScriptEnabled(true);
    await page.goto(url, {waitUntil : 'networkidle0'});

    // Get scroll width and height of the rendered page and set viewport
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    await page.setViewport({ width: bodyWidth, height: bodyHeight });

    await page.screenshot({path : "./image/image.jpg", fullPage : true});

    await browser.close()
}
// Perintah mendownload manga dengan param id
mangaTotoDownload("2801984");

// Perintah mendapatkan list manga
// mangaToto().then( d => console.log(d))
export {screenshot, mangaToto, mangaTotoDownload};