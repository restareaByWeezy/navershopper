const puppeteer = require("puppeteer");

async function monitorAPICalls() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.setRequestInterception(true); // 요청 감지 활성화

  page.on("request", req => {
    if (req.resourceType() === "xhr") {
      console.log("API Call detected:", req.url());
    }
    req.continue();
  });

  await page.goto(
    "https://search.shopping.naver.com/search/all?query=%EC%A3%BC%EC%96%BC%EB%A6%AC",
    {
      waitUntil: "networkidle0",
    }
  );

  await autoScroll(page);

  await browser.close();
}

monitorAPICalls();

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

const urls = [
  "https://search.shopping.naver.com/api/search/all?eq=&iq=&origQuery=%EC%A3%BC%EC%96%BC%EB%A6%AC&pagingIndex=8&pagingSize=80&productSet=total&query=%EC%A3%BC%EC%96%BC%EB%A6%AC&sort=rel&viewType=list&xq=",
];

for (let i = 1; i < 100; i++) {
  const pageUrl = `https://search/all?pagingIndex=${i}`;

  page.goto(pageUrl);

  ///...필요한
}
