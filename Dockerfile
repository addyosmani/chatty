# Use node:18 as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Copy the entire application source code to the working directory
COPY . .

# Build the application
RUN npm run build

# Expose the port on which the application runs
EXPOSE 3000

# Command to start the application
CMD npm run start