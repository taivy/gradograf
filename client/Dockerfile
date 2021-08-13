FROM node:15.0.1-alpine
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package*.json ./
COPY tsconfig.json ./
RUN yarn 
COPY . .
CMD [ "yarn", "start" ]
