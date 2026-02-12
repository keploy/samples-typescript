FROM node:18

WORKDIR /app

# Install keploy binary
RUN curl -Lo keploy https://github.com/keploy/keploy/releases/latest/download/keploy_linux_amd64 && \
    chmod +x keploy && \
    mv keploy /usr/local/bin/keploy

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8000

CMD ["node", "index.js"]
