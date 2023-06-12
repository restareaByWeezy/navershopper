const puppeteer = require("puppeteer");

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

async function scrapeProductTitlesAndPrices() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://search.shopping.naver.com/search/all?query=주얼리"); // 네이버 쇼핑 메인페이지로 이동
  autoScroll(page); // 스크롤
  await page.waitForSelector(".basicList_list_basis__uNBZx");
  // 상품 제목 및 가격 추출
  const products = await page.evaluate(() => {
    const adProductArr = [];
    const productArr = [];

    //adProduct
    const adProductEls = document.querySelectorAll(".adProduct_item__1zC9h");
    adProductEls.forEach(productEl => {
      const title = productEl.querySelector(".adProduct_link__NYTV9").innerText;
      const price = productEl.querySelector(".price_num__S2p_v").innerText;
      adProductArr.push({ title, price });
    });

    //product
    const productEls = document.querySelectorAll(".product_item__MDtDF");
    productEls.forEach(productEl => {
      const title = productEl.querySelector(".product_link__TrAac").innerText;
      const price = productEl.querySelector(".price_num__S2p_v").innerText;
      productArr.push({ title, price });
    });

    return { adProductArr, productArr };
  });

  console.log("products", products);

  await browser.close();
}

scrapeProductTitlesAndPrices();
