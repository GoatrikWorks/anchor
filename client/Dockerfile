FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_CHAIN_ID
ARG NEXT_PUBLIC_IDENTITY_CONTRACT
ARG NEXT_PUBLIC_AGREEMENTS_CONTRACT

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_CHAIN_ID=$NEXT_PUBLIC_CHAIN_ID
ENV NEXT_PUBLIC_IDENTITY_CONTRACT=$NEXT_PUBLIC_IDENTITY_CONTRACT
ENV NEXT_PUBLIC_AGREEMENTS_CONTRACT=$NEXT_PUBLIC_AGREEMENTS_CONTRACT

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
