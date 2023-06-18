const puppeteer = require("puppeteer");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require("fs");

const product = [];
const adProduct = [];

let totalProductCount;

async function scrapeProductTitlesAndPrices(url, page, product, adProduct) {
  await page.goto(url, { waitUntil: "networkidle0" }); // 네이버 쇼핑 메인페이지로 이동

  await autoScroll(page);

  // 전체 HTML 코드를 가져옵니다.
  const html = await page.content();

  // JSDOM을 사용하여 HTML 코드를 분석합니다.
  const dom = new JSDOM(html);
  const document = dom.window.document;

  //제품 개수
  if (totalProductCount === undefined) {
    totalProductCount = Number(
      document.querySelector("span[class^='subFilter_num__']").textContent
    );
  }

  const productDivs = Array.from(
    document.querySelectorAll('div[class^="product_item"]')
  );
  const adProductDivs = Array.from(
    document.querySelectorAll('div[class^="adProduct_item"]')
  );

  //NOTE: 일반 상품
  productDivs.forEach(productDiv => {
    const singleProduct = {};

    //title
    Array.from(
      productDiv.querySelectorAll('a[class^="product_link__"]')
    ).forEach(title => {
      singleProduct.title = title.textContent;
      //link
      singleProduct.link = title.href;
    });

    //upload date
    Array.from(
      productDiv.querySelectorAll('span[class^="product_etc___"]')
    ).forEach(etc => {
      singleProduct.uploadDate = etc.textContent;
    });

    //zzim count
    Array.from(
      productDiv.querySelectorAll(
        'span[class^="product_zzim__"] > em[class^="product_num__"]'
      )
    ).forEach(zzim => {
      singleProduct.zzim = zzim.textContent;
    });

    //price
    Array.from(productDiv.querySelectorAll('span[class^="price_num"]')).forEach(
      price => {
        //remove comma
        price.textContent = price.textContent.replace(/,/g, "");
        singleProduct.price = price.textContent;
      }
    );

    //category
    // Array.from(
    //   productDiv
    //     .querySelectorAll('div[class^="product_depth__"]')
    //     .forEach(category => {
    //       singleProduct.category = category.textContent;
    //     })
    // );

    //mall
    Array.from(
      productDiv.querySelectorAll('a[class^="product_mall_"]')
    ).forEach(mall => {
      //remove comma
      mall.textContent = mall.textContent.replace(/,/g, "");
      if (singleProduct.mall === undefined) singleProduct.mall = [];
      singleProduct.mall.push(mall.textContent);
    });

    //img
    Array.from(productDiv.querySelectorAll("a > img")).forEach(img => {
      singleProduct.img = img.src;
    });

    product.push(singleProduct);
  });

  //NOTE: 광고 상품
  adProductDivs.forEach(adProductDiv => {
    const singleAdProduct = {};

    //title
    Array.from(
      adProductDiv.querySelectorAll('a[class^="adProduct_link__"]')
    ).forEach(title => {
      singleAdProduct.title = title.textContent;
      //link
      singleAdProduct.link = title.href;
    });

    //upload date
    Array.from(
      adProductDiv.querySelectorAll('span[class^="adProduct_etc___"]')
    ).forEach(etc => {
      singleAdProduct.uploadDate = etc.textContent;
    });

    //zzim count
    Array.from(
      adProductDiv.querySelectorAll(
        'span[class^="adProduct_zzim__"] > em[class^="adProduct_num__"]'
      )
    ).forEach(zzim => {
      singleAdProduct.zzim = zzim.textContent;
    });

    //price
    Array.from(
      adProductDiv.querySelectorAll('span[class^="price_num"]')
    ).forEach(price => {
      //remove comma
      price.textContent = price.textContent.replace(/,/g, "");
      singleAdProduct.price = price.textContent;
    });

    //category
    // Array.from(
    //   adProductDiv
    //     .querySelectorAll('div[class^="adProduct_depth__"]')
    //     .forEach(category => {
    //       singleAdProduct.category = category.textContent;
    //     })
    // );

    //mall
    Array.from(
      adProductDiv.querySelectorAll('a[class^="adProduct_mall_"]')
    ).forEach(mall => {
      if (singleAdProduct.mall === undefined) singleAdProduct.mall = [];
      //remove comma
      mall.textContent = mall.textContent.replace(/,/g, "");
      singleAdProduct.mall.push(mall.textContent);
    });

    //img
    Array.from(adProductDiv.querySelectorAll("a > img")).forEach(img => {
      singleAdProduct.img = img.src;
    });

    adProduct.push(singleAdProduct);
  });

  console.log("product", product);
  console.log("adProduct", adProduct);

  console.log("products length", product.length);
  console.log("adProducts length", adProduct.length);
}

//autoscroll
async function autoScroll(page) {
  console.log("AUTO SCROLLING START");
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0;
      const distance = 200;
      const maxScrollAttempts = 100;

      window.scrollTo(0, 0);

      const timer = setInterval(() => {
        const scrollHeight = document.documentElement.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        // 페이지의 끝에 도달하거나 최대 스크롤 시도 횟수를 넘으면 종료
        if (totalHeight >= scrollHeight || maxScrollAttempts <= 0) {
          clearInterval(timer);
          resolve(scrollHeight);
        }
        maxScrollAttempts--;
      }, 100);
    });

    window.scrollTo(0, 0);
  });
  console.log("AUTO SCROLLING FINISHED");
}

// 데이터를 CSV 형식으로 변환
function convertToCSV(data) {
  const header = Object.keys(data[0]).join(",");
  const rows = data.map(obj => Object.values(obj).join(","));
  return `${header}\n${rows.join("\n")}`;
}

function saveDataToCSV(data, filename) {
  const csvData = convertToCSV(data);
  fs.writeFileSync(filename, csvData, "utf-8");
  console.log(`Data saved to ${filename}`);
}

const mainFn = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  //페이지 어디서부터 어디까지 긁은건지 확인하기 위해
  // i = 1페이지부터 2페이지까지 긁어보겠다.
  for (let i = 1; i <= 2; i++) {
    console.log(i, "Page Crawl Start!");

    await scrapeProductTitlesAndPrices(
      //여기서 키워드 변경하면 됩니다.
      //1장에 80개 들어감
      `https://search.shopping.naver.com/search/all?pagingIndex=${i}&pagingSize=80&productSet=total&query=쥬얼리`,
      page,
      product,
      adProduct
    );
  }

  await browser.close();

  //csv 파일로 저장
  saveDataToCSV(product, "product_data.csv");
  saveDataToCSV(adProduct, "adProduct_data.csv");
};

mainFn();
