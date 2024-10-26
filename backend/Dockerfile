# Use the official Golang image as the base image for building the application
FROM golang:1.23 AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the Go module files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the application code
COPY . .

# Build the Go application
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o main .

# Use a minimal base image for the final build
FROM gcr.io/distroless/static-debian11

# Set the working directory inside the container
WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/main .

# Copy the .env file
COPY .env .

# Expose the port that the application will run on
EXPOSE 8000

# Command to run the application
CMD ["/app/main"]
