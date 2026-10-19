FROM node:18.10.0-alpine AS development

WORKDIR /usr/src/app

COPY package*.json ./
COPY yarn.lock ./
COPY prisma ./prisma

RUN rm -rf node_modules && yarn install --frozen-lockfile

COPY . .

CMD ["yarn", "start:dev"]


FROM development AS build

WORKDIR /usr/src/app

COPY --from=development usr/src/app/prisma ./prisma
COPY --from=development usr/src/app/package.json ./
COPY --from=development usr/src/app/yarn.lock ./
COPY --from=development usr/src/app/node_modules ./node_modules
COPY --from=development usr/src/app/prisma ./prisma
COPY --from=development usr/src/app .

RUN yarn build

ENV NODE_ENV=production

FROM node:18.10.0-alpine AS production

COPY  --from=build /usr/src/app/dist ./dist
COPY --from=build usr/src/app/prisma ./prisma
COPY  --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package.json ./package.json

CMD [ "yarn", "start:prod" ]
