## COURSE SELLING API

This is an application to create online courses, and also update, delete, or view them.

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose

## Quick Note: If you face any difficulty, refer to the following link.

```bash
Docs Link : https://keploy.io/blog/community/getting-started-with-keploy
```

## Get Started! 🎬

#### Linux Users (Ubuntu/Debian) Note

The default `docker.io` package may not include Docker Compose v2, which is required for running Keploy sample projects using Docker Compose.

To avoid errors, install Docker Compose v2 using:

```bash
sudo apt update
sudo apt install docker-compose-plugin
```

Then use `docker compose up` instead of `docker-compose up`.

**1. Clone the repository and move to express-mongoose-Sahil :**
Run the following command to start the application:

```bash
git clone https://github.com/keploy/samples-typescript && cd samples-typescript/express-mongoose-Sahil

# Install the dependencies
npm install
```

**2. Run the Development Server:**
Run the following command to start the application:

```bash
npm start
```

### Docker Installation & MongoDB Compass

**1. Install docker in your windows and follow this tutorial to connect with mongodb compass :**

```
https://www.youtube.com/watch?v=NEPZqSvKx40&list=PLff_PESolMjuDXQdjiqYRW_GnDQjU32QX
```

# Pull the MongoDB image

```bash
docker pull mongo
```

# Run MongoDB container with port 27023 mapping

```bash
docker run --name mongo-db -p 27023:27017 -d mongo
```

**2. After installing Docker and following the video commands, run the following to create a network:**

```bash
docker network create keploy-network
```

> **The URL may vary depending on your connection. Also, update your .env file with MONGODB_URL::`mongodb://127.0.0.1:27023/courses`.*

## Keploy Installation

On Windows, WSL is required to run Keploy Binary.

# Install Keploy Binary

```bash
wsl --install
```

```bash
curl --silent --location "https://get.keploy.io" | bash
```

### Capture the testcases in keploy

```bash
sudo -E env PATH=$PATH keploy record -c 'npm start'
```

## Running the testcases

```bash
sudo -E env PATH=$PATH keploy test -c 'npm start' --delay 10
```

### API Endpoints

- GET http://localhost:3000/courses - to get all courses.

- POST http://localhost:3000/courses - to post courses.

- DELETE http://localhost:3000/courses/:id - to delete a specific course.

- PUT http://localhost:3000/courses/:id  - to update a specific course.

jest test coverage report :
![Screenshot 2024-04-22 025850](https://github.com/s2ahil/samples-typescript/assets/101473078/f60570d0-b998-4b4a-912d-80d4c73604e3)

postman tests:
![Screenshot 2024-04-22 031914](https://github.com/s2ahil/samples-typescript/assets/101473078/1ee5850e-3d31-46bd-bb5e-f842e5262cdd)

Keploy test report:
![image](https://github.com/s2ahil/samples-typescript/assets/101473078/48f2b866-04d1-433b-9270-34c15786893c)
