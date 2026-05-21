# Build stage
FROM golang:1.22-alpine AS builder
RUN apk add --no-cache git
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server ./cmd/server

# Runtime stage
FROM alpine:3.19
RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    python3 \
    nodejs \
    npm \
    g++ \
    openjdk17-jdk \
    go \
    bash

# Symlink python3 to python for execution compatibility
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Globally install TypeScript runtimes for the compilation feature
RUN npm install -g ts-node typescript

WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]
