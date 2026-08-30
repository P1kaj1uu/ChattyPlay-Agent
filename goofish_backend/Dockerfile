# Hugging Face Docker Space：运行常驻 Node/Hono 闲鱼后端
FROM node:20-bookworm-slim

ENV NODE_ENV=production \
    PORT=7860 \
    GOOFISH_DATA_DIR=/data \
    GOOFISH_LOG_DIR=/data/logs

WORKDIR /app

# better-sqlite3 在没有匹配预编译产物时需要本地编译工具。
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
# tsx 是容器运行 TypeScript 入口所需的运行工具，目前位于 devDependencies。
RUN npm ci --include=dev && npm cache clean --force

COPY . .

RUN mkdir -p /data/logs && chown -R node:node /app /data

USER node

EXPOSE 7860

CMD ["npm", "run", "start"]
