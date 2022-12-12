// node one-line.js --pol="INCCU" --pod="ARBUE" --equipnmentName="DRY 40" --equipmentSize=40

// ERROR WHILE HEADLESS: TRUE ---> input[id=capture_signIn_userId]

let puppeteer = require("puppeteer");
let fs = require("fs");
let minimist = require("minimist");


let args = minimist(process.argv);

let accessToken;

let configJSON = fs.readFileSync("./config.json", "utf-8"); // reading the config file
let configJSO = JSON.parse(configJSON); //converting the JSON file to JSO(javscript object)

const fetchToken = async () => {
  const browser = await puppeteer.launch({
    // defaultViewport: null, // to show the content in full screen
    // args: ["--start-maximized"], // to show the browser in full screen
    headless: true, // browser to be displayed on screen
    ignoreHTTPSErrors: true,
    args: [`--window-size=1920,1080`],
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
  });

  // get a tab

  let pages = await browser.pages();
  let page = pages[0];

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36"
  );

  //   await page.setUserAgent(userAgent);

  //   await page.goto("https://beta.transpost.co/");
  await page.goto("https://ecomm.one-line.com/one-ecom");

  //  await page.waitForSelector(
  //     "button[class=Button_btn__tzSCF Button_btnLight__MnybG Button_btnSizeSm__Z20IH PromotionPopoverContent_action-btn__T4GAG PromotionPopoverContent_skip-btn__R1Tsn]"
  //   );
  // Header_no-line-height__hehBx
  await page.waitForSelector("a[class=Header_no-line-height__hehBx]");
  await page.click("a[class=Header_no-line-height__hehBx]");

  // Go to login page
  await page.waitForSelector(
    "span[class=CreateLoginGroup_createlogin-title__w0qZ9]"
  );
  await page.click("span[class=CreateLoginGroup_createlogin-title__w0qZ9]");

  // Type userid
  await page.waitForSelector("input[id=capture_signIn_userId]");
  await page.type("input[id=capture_signIn_userId]", configJSO.userid, {
    delay: 100,
  });

  // type credentials
  await page.waitForSelector("input[id=capture_signIn_currentPassword]");
  await page.type(
    "input[id='capture_signIn_currentPassword']",
    configJSO.password,
    { delay: 100 }
  );

  //click on signin button
  await page.waitForSelector("button[class=sign-in-button]");
  await page.click("button[class='sign-in-button']");

  // For waiting to load completely

  // ("input[class=Input_input__UR4g2 input]");
  await page.waitForSelector("input[id=downshift-0-input]");
  await page.type("input[id='downshift-0-input']", configJSO.userid, {
    delay: 100,
  });

  accessToken = await page.evaluate(() => localStorage.getItem("accessToken"));

  console.log("accessToken", accessToken);

  let localStorageJSON = JSON.stringify(accessToken); // done
  fs.writeFileSync("token.json", localStorageJSON, "utf-8"); // done

  await browser.close();
};

var axios = require("axios");

const fetchData = async () => {
  const token = JSON.parse(fs.readFileSync("./token.json", "utf-8"));
  console.log("token ", token);

  var data = JSON.stringify({
    originLoc: args.pol,
    destinationLoc: args.pod,
    containers: [
      {
        equipmentIsoCode: "42G1",
        equipmentName: args.equipnmentName,
        quantity: 1,
        cargoType: "DR",
        sortIndex: 3,
        equipmentONECntrTpSz: "D4",
        equipmentSize: args.equipmentSize,
      },
    ],
  });

  var config = {
    method: "post",
    url: "https://ecomm.one-line.com/api/v1/quotation/schedules/vessel-dates",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data: data,
  };

  axios(config)
    .then(function (response) {
      console.log("response --->", JSON.stringify(response.data));
      const data = JSON.stringify(response.data);

      fs.writeFileSync("response.json", data, "utf-8"); // done
      return response.data;
    })
    .catch(async function (error) {
      console.log("error --->", error.response.data);
      const { status, code, message } = error.response.data;
      if (status == 401 && message === "Unauthorized" && code === "ERR-401") {
        console.log("run token fetcher");
        // wait to fetch the token
        await fetchToken();
        await fetchData();
      }
    });
};

// trigger when received input
setTimeout(() => {
  fetchData();
}, 1000);
