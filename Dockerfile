# DIGEST:sha256:33831eb1176e36e9a4854b7b1b99909c76719ed6c2e32fa922bdcb4d57a91ab3
FROM node:17.6.0-slim

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
# installs, work.
RUN apt-get update \
  && apt-get install -y wget gnupg \
  && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /src
COPY ./ .
# Install puppeteer so it's available in the container.
RUN npm install \
  && groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
  && mkdir -p /home/pptruser/Downloads \
  && chown -R pptruser:pptruser /home/pptruser \
  && chown -R pptruser:pptruser ./node_modules \
  && chown -R pptruser:pptruser ./package.json \
  && chown -R pptruser:pptruser ./package-lock.json

# Run everything after as non-privileged user.
USER pptruser

# COPY ./app .

EXPOSE 8080
CMD ["sh", "entrypoint.sh"]
