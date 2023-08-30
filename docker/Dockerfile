FROM node:alpine
LABEL authors="Alessio De Biasi"

COPY ./src /srv/app/src
COPY  ./.env ./package.json ./tsconfig.base.json ./tsconfig.app.json /srv/app
WORKDIR /srv/app
RUN npm install &&  \
    npm run compile-sources --omit=dev && \
    npm prune --production && \
    rm -fR src && \
    rm -fR tsconfig* && \
    rm -fR ./build/**/*.map.js && \
    rm -fR ./build/*.tsbuildinfo

EXPOSE 5000

ENTRYPOINT ["node", "/srv/app/build/src/main"]
