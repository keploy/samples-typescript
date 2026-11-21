FROM node:20-bookworm-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl dumb-init && \
    rm -rf /var/lib/apt/lists/*

# node:20 ships npm 10.8.2, which names the temp files of its download cache
# with 8 hex digits of Math.random(). When two that are alive together get
# the same name, one's cleanup deletes the other's file and the install exits
# 254 on "EEXIST ... rename" (npm/cli#7308). npm 11.12.0 is the first with the
# fix. No node:20 or node:22 image ships it, and parse-server 8.2.3 does not
# allow Node 24, so npm is upgraded here. Keep it an npm 11, at 11.12.0 or
# newer: npm 12 does not run on Node 20, and it skips a dependency's install
# script unless package.json allows it.
RUN npm install -g npm@11.21.0 && rm -rf /root/.npm

WORKDIR /usr/src/app

# `npm ci` installs what package-lock.json lists and nothing else, and fails
# when package.json and the lock disagree, so the build resolves no version
# range. After a change to package.json, write the lock again with the npm
# above: npx npm@11.21.0 install --package-lock-only
COPY package*.json ./
RUN npm ci --omit=dev && rm -rf /root/.npm

COPY index.js ./

EXPOSE 1337

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
