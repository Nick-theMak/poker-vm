# Build stage
FROM golang:1.21-alpine AS builder

# Set working directory
WORKDIR /cmd

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Final stage
FROM alpine:latest

WORKDIR /cmd

# Copy the binary from builder
COPY --from=builder /app/cmd .

# Expose port 8080
EXPOSE 8080

# Run the application
CMD ["./main"]