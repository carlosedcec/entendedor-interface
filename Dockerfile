# 1) Build (Node)

FROM node:20-alpine AS build

WORKDIR /app

COPY ./package*.json ./

RUN npm install

COPY ./src ./

RUN npm run build

# 2) Runtime (Nginx)

FROM nginx:1.28

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]