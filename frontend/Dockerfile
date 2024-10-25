# Use the official Node.js image as the base image
FROM node:18 AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code, including .env
COPY . .

# Build the React application
RUN npm run build

# Use a minimal base image for serving the application
FROM nginx:alpine

# Copy the build output to the Nginx HTML directory
COPY --from=builder /app/build /usr/share/nginx/html

# Expose the port that the application will run on
EXPOSE 80

# Command to run the application
CMD ["nginx", "-g", "daemon off;"]



