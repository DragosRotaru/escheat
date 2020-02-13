const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const shared = require("./shared");

const { CANADA_BANK_URL, DATE, randomSleep } = shared;

const searchTerm = "JAKOB";

const dataWriter = createCsvWriter({
  path: `data/${DATE}-${searchTerm}.csv`,
  header: [
    "id",
    "account",
    "name",
    "address",
    "amount",
    "coOwner",
    "reportedBy",
    "balanceType",
    "lastTransactionDate",
    "transferDate"
  ]
});

const url = (page, searchTerm) =>
  `${CANADA_BANK_URL}?page=${page}&lastName=${encodeURIComponent(searchTerm)}`;

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  process.once("SIGINT", () => browser.close());
  const page = await browser.newPage();
  await dataWriter.writeRecords([
    {
      id: "ID",
      account: "Account ID",
      name: "Name",
      address: "Address",
      amount: "Amount $ CAD",
      coOwner: "Co-Owner",
      reportedBy: "Reported By",
      balanceType: "Type",
      lastTransactionDate: "Last Transaction Date",
      transferDate: "Transfer Date"
    }
  ]);
  let hasResults = true;
  let pageNum = 1;
  while (hasResults) {
    await randomSleep();
    await page.goto(url(pageNum, searchTerm), {
      timeout: 1000000
    });
    const $ = cheerio.load(await page.content());
    hasResults = $("#searchTable").length > 0;
    if (hasResults) {
      console.log("extracting page: ", pageNum);
      // Getting all unique class IDs
      let ids = new Set();
      $("#searchTable > tbody > tr").map(async (i, el) => {
        try {
          const classes = $(el)
            .attr("class")
            .trim()
            .split(/\s+/)
            .filter(item => !isNaN(item))
            .forEach(item => ids.add(item));
        } catch (error) {
          console.log(error);
        }
      });
      ids = Array.from(new Set(ids));
      console.log("IDs: ", ids);
      ids.forEach(async id => {
        const entry = { id };
        $(`#searchTable > tbody > tr.${id}`).map(async (i, el) => {
          if (i === 0) {
            entry.account = $(el)
              .find(".colPropertyNum")
              .text()
              .trim();
            entry.name = $(el)
              .children()
              .eq(2)
              .text()
              .trim();
            entry.address = $(el)
              .find(".colFullAddress")
              .text()
              .replace(/\s+/g, " ")
              .trim();
            entry.amount = $(el)
              .find(".colAmount")
              .text()
              .trim();
            entry.coOwner = $(el)
              .find(".colCoOwner")
              .text()
              .trim();
          }
          if (i === 2) {
            entry.reportedBy = $(el)
              .text()
              .replace(/\s+/g, " ")
              .replace("Reported By:", "")
              .trim();
          }
          if (i === 3) {
            const text = $(el)
              .text()
              .replace(
                "Balance Type; Last Transaction Date; Transfer Date:",
                ""
              )
              .trim()
              .split(";");
            entry.balanceType = text[0].split("/")[0];
            entry.lastTransactionDate = text[1];
            entry.transferDate = text[2];
          }
        });
        await dataWriter.writeRecords([entry]);
      });
      pageNum++;
    }
  }
  await browser.close();
})();
