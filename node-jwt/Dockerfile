FROM node:18

# Create app directory
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/* 

WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --omit=dev

ADD https://keploy-enterprise.s3.us-west-2.amazonaws.com/releases/latest/assets/freeze_time_arm64.so /lib/keploy/freeze_time_arm64.so
RUN chmod +x /lib/keploy/freeze_time_arm64.so
# Run app.py when the container launches
ENV LD_PRELOAD=/lib/keploy/freeze_time_arm64.so

# Bundle app source
COPY . .

EXPOSE 8080
CMD [ "node", "app.js" ]