FROM node:10.14.1

# Install Oracle client
RUN mkdir -p opt/oracle
WORKDIR /opt/oracle
COPY ./oracle/ ./

RUN npm install -g node-gyp && \
    apt-get update && \
    apt-get install libaio1 build-essential unzip curl -y && \
    unzip instantclient-basic-linux.x64-18.3.0.0.0dbru.zip && \
    rm instantclient-basic-linux.x64-18.3.0.0.0dbru.zip

RUN sh -c "echo /opt/oracle/instantclient_18_3 > /etc/ld.so.conf.d/oracle-instantclient.conf" && \
    ldconfig

ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_18_3:$LD_LIBRARY_PATH

RUN yarn config set ignore-engines true

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .

ENV PORT 8080

EXPOSE 8080

CMD [ "npm", "start" ]