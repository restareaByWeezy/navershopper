const puppeteer = require("puppeteer");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

scrapeProductTitlesAndPrices(
  "https://search.shopping.naver.com/search/all?query=주얼리"
);

async function scrapeProductTitlesAndPrices(url) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle0" }); // 네이버 쇼핑 메인페이지로 이동

  await autoScroll(page);

  // 전체 HTML 코드를 가져옵니다.
  const html = await page.content();
  await browser.close();

  // JSDOM을 사용하여 HTML 코드를 분석합니다.
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const product = [];
  const adProduct = [];

  //제품 개수
  const totalProductCount = Number(
    document.querySelector("span[class^='subFilter_num__']").textContent
  );

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
    });

    //price
    Array.from(productDiv.querySelectorAll('span[class^="price_num"]')).forEach(
      price => {
        singleProduct.price = price.textContent;
      }
    );

    //mall
    Array.from(
      productDiv.querySelectorAll('a[class^="product_mall_"]')
    ).forEach(mall => {
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
    });

    //price
    Array.from(
      adProductDiv.querySelectorAll('span[class^="price_num"]')
    ).forEach(price => {
      singleAdProduct.price = price.textContent;
    });

    //mall
    Array.from(
      adProductDiv.querySelectorAll('a[class^="product_mall_"]')
    ).forEach(mall => {
      if (singleAdProduct.mall === undefined) singleAdProduct.mall = [];
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
