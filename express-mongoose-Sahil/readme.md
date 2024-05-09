
## COURSE SELLING API

This is an application to create online courses also with that you can update,delete and view your courses .

## Technologies Used
- Node.js
- Express.js
- MongoDB
- Mongoose


## Quick Note If you face any difficulty refer to the given link 
```bash
Docs Link : https://keploy.io/blog/community/getting-started-with-keploy
```

## Get Started! 🎬

**1. Clone the repository and move to express-mongoose-Sahil :**
Run the following command to start the application:

```bash
git clone https://github.com/keploy/samples-typescript && cd samples-typescript/express-mongoose-Sahil

# Install the dependencies
npm install
```

**2. Run the Development Server:**
Run the following command to start the application:

```Bash
node server.js
```

### Docker installation and running the mongodb compass

**1. Install docker in your windows and follow this tutorial to connect with mongodb compass :**
``` bash
https://www.youtube.com/watch?v=NEPZqSvKx40&list=PLff_PESolMjuDXQdjiqYRW_GnDQjU32QX
```

**2. after installing docker and running those commands in video use this command as well to create a network:**
```bash
docker network create keploy-network
```

> **url should look something like this depending on your connection you can adjust, also update your .env file with mongodb_url:`mongodb://127.0.0.1:27023/courses`.*


## keploy installation

On Windows, WSL is required to run Keploy Binary. 

```bash
wsl --install
```

### Capture the testcases in keploy

```bash
sudo -E env PATH=$PATH keploy record -c 'npm start'
```
## Running the testcases

```bash
keploy -E env PATH=$PATH keploy test -c 'npm start' --delay 10
```

### Api endpoints 
- GET http://localhost:3000/courses - to get all courses.

- POST http://localhost:3000/courses - to post courses .

- DELETE http://localhost:3000/courses/:id - to delete a specific course.

- PUT http://localhost:3000/courses/:id  - to update any course.

jest test coverage report : 
![Screenshot 2024-04-22 025850](https://github.com/s2ahil/samples-typescript/assets/101473078/f60570d0-b998-4b4a-912d-80d4c73604e3)

postman tests: 
![Screenshot 2024-04-22 031914](https://github.com/s2ahil/samples-typescript/assets/101473078/1ee5850e-3d31-46bd-bb5e-f842e5262cdd)

Keploy test report:
![image](https://github.com/s2ahil/samples-typescript/assets/101473078/48f2b866-04d1-433b-9270-34c15786893c)
