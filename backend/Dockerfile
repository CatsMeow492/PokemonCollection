# Use the official Golang image as the base image for building the application
FROM golang:1.23 AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the Go module files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the application code
COPY . .

# Copy the .env file
COPY .env .

# Build the Go application
RUN go build -o main .

# Use a minimal base image for the final build
FROM gcr.io/distroless/base

# Set the working directory inside the container
WORKDIR /app

# Copy the binary and .env file from the builder stage
COPY --from=builder /app/main .
COPY --from=builder /app/.env .

# Expose the port that the application will run on
EXPOSE 8000

# Command to run the application
CMD ["./main"]
