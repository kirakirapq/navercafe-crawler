const express = require('express');
const events = require('events');
const puppeteer = require('puppeteer');
const app = express()

events.EventEmitter.defaultMaxListeners = 15;

const responseNG = function (response) {
  return response.ok() === false
}

const responseOK = function (response) {
  return response.ok() === true;
}

const makeResponse = function (code, message, url) {
  const hasComment = Array.isArray(message) === true && message.length > 0;
  const isSuccess = code === 200 && hasComment === true;

  if (isSuccess === false) {
    console.info({ StatusCode: code, ErrorMessage: message, url: url });
  }

  return {
    isSuccess: isSuccess,
    hasComment: hasComment,
    statusCode: code,
    response: message
  }
}

const getUrl = function (cafeid, pageid) {
  return new String('http://cafe.naver.com/' + cafeid + '/' + pageid)
}


app.get('/cafeid/:cafeid/pageid/:pageid', async (req, res, next) => {
  req.setTimeout(1000 * 60 * 5);

  const cafeid = req.params.cafeid
  const pageid = req.params.pageid
  const url = getUrl(cafeid, pageid)

  // gnome-www-browser -> /etc/alternatives/gnome-www-browser
  // google-chrome -> /etc/alternatives / google - chrome
  // google-chrome-unstable -> /opt/google / chrome - unstable / google - chrome - unstable
  const gnome_www_browser = '/usr/bin/gnome-www-browser';
  const google_chrome = '/usr/bin/google-chrome';
  const google_chrome_unstable = '/usr/bin/google-chrome-unstable';
  const google_chrome_stable = '/usr/bin/google-chrome-stable';
  console.info(`start job`);
  console.info(url);

  const browser = await puppeteer.launch({
    headless: true,
    ignoreDefaultArgs: ['--disable-extensions'],
    args: [
      '--use-gl=egl',
      '--no-sandbox',
      '-disable-setuid-sandbox'
    ],
    executablePath: google_chrome_stable,
    waitForInitialPage: true
  }).catch((err) => {
    console.info(err);

    return res.status(200).send(makeResponse(500, err, url));
  });

  // const page = await browser.newPage().catch((err) => console.info(err));
  // await page.goto(url, { waitUntil: 'networkidle0' }).catch((err) => console.info(err));
  const page = await browser.newPage();
  const response = await page.goto(url, { waitUntil: 'networkidle0' });

  if (responseNG(response)) {
    browser.close();
    const msg = await response.text();
    // エラー内容はsns-crawler-phpへ返却
    return res.status(200).send(makeResponse(response.status(), { message: msg }, url));
  }

  const iframe = await page.frames().find(f => f.name() === 'cafe_main');

  // 1-1. #app > div > div > div.ArticleContentBox > div.article_container > div.CommentBox
  const commentBox = await iframe.$('div > div > div.ArticleContentBox > div.article_container > div.CommentBox');

  // 1-2. 非公開ページの場合はiframeから先のコンテンツは読み込めない
  if (commentBox === undefined || commentBox === null) {
    browser.close();
    const msg = 'Could not load because it is a member-only page.';
    // エラー内容はsns-crawler-phpへ返却
    return res.status(200).send(makeResponse(401, { message: msg }, url));
  }

  // 2-1. 'ul.comment_list > li.CommentItem > div.comment_area > div.comment_box'
  const commentList = await commentBox.$$eval(
    'ul.comment_list > li.CommentItem > div.comment_area > div.comment_box', (element) => {
      return element.map(
        elm => {
          return {
            textContent: elm.textContent,
            innerHTML: elm.innerHTML
          };
        }
      );
    }
  );
  // 2-2. CommentBock取得できなかった場合
  if (commentList === undefined || commentList === null) {
    browser.close();
    const msg = 'div.CommentBock was not found.';
    // エラー内容はsns-crawler-phpへ返却
    return res.status(200).send(makeResponse(401, { message: msg }, url));
  }

  // 2-3. CommentBockの中身がなかった場合
  if (commentList.length == 0) {
    browser.close();
    console.info('comment not found.');

    return res.status(200).send(makeResponse(200, [], url));
  }

  const comments = await Promise.all(
    commentList.map(
      async element => {
        const page = await browser.newPage();
        await page.setContent(element.innerHTML).catch((err) => {
          console.info(err);

          return res.status(200).send(makeResponse(500, err, url));
        });

        const nicknameElm = 'div.comment_nick_box > div.comment_nick_info > a.comment_nickname';
        const commentElm = 'div.comment_text_box > p.comment_text_view > span.text_comment';
        const dateElm = 'div.comment_info_box > span.comment_info_date';
        const id = cafeid + '_' + pageid;

        const name = await page.$eval(nicknameElm, item => { return item.textContent.trim(); }).catch((err) => { return ''; });
        const comment = await page.$eval(commentElm, item => { return item.textContent; }).catch((err) => { return ''; });
        const date = await page.$eval(dateElm, item => { return item.textContent; }).catch((err) => { return ''; });

        await page.close();

        return {
          id: id,
          url: url,
          cafeid: cafeid,
          pageid: pageid,
          name: name,
          comment: comment,
          date: date,
        };
      }));

  if (browser) browser.close();
  // console.info(comments);
  console.info(`complete job`);

  res.set('Content-Type', 'text/json');
  res.status(200).send(makeResponse(200, comments, url));
  res.end();

});

const server = app.listen(
  process.env.PORT || 8080, err => {
    if (err) return console.log(err);
    const port = server.address().port;
    console.info(`App listening on port ${port}`);
  }
);

server.setTimeout(1000 * 60 * 5);

process.on('SIGTERM', function () {
  console.log('naver-cafe scraping: received SIGTERM, exiting gracefully');

  process.exit(0);

});

process.on('SIGPIPE', function () {
  console.log('naver-cafe scraping: received SIGPIPE, exiting gracefully');

  process.exit(0);

});
