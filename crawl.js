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

  const productDivs = Array.from(
    document.querySelectorAll('div[class^="product_item"]')
  );
  const adProductDivs = Array.from(
    document.querySelectorAll('div[class^="adProduct_item"]')
  );

  // '^=' 연산자는 클래스 이름이 특정 문자열로 시작하는 요소를 선택합니다.
  productDivs.forEach(productDiv => {
    const singleProduct = {};
    Array.from(
      productDiv.querySelectorAll('a[class^="product_link__"]')
    ).forEach(title => {
      singleProduct.title = title.textContent;
    });
    Array.from(productDiv.querySelectorAll('span[class^="price_num"]')).forEach(
      price => {
        singleProduct.price = price.textContent;
      }
    );
    product.push(singleProduct);
  });

  adProductDivs.forEach(adProductDiv => {
    const singleAdProduct = {};
    Array.from(
      adProductDiv.querySelectorAll('a[class^="adProduct_link__"]')
    ).forEach(title => {
      singleAdProduct.title = title.textContent;
    });
    Array.from(
      adProductDiv.querySelectorAll('span[class^="price_num"]')
    ).forEach(price => {
      singleAdProduct.price = price.textContent;
    });

    adProduct.push(singleAdProduct);
  });

  console.log(product);
  console.log(adProduct);
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
