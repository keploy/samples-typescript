
## COURSE SELLING API

This is an application to create online courses also with that you can update,delete and view your courses .

## Technologies Used
- Node.js
- Express.js
- MongoDB
- Mongoose

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


## keploy installation

On Windows, WSL is required to run Keploy Binary. 

```bash
wsl --install
```

Once installed download and Install "Keploy Binary" :

```bash
curl --silent --location "https://github.com/keploy/keploy/releases/latest/download/keploy_linux_amd64.tar.gz" | tar xz -C /tmp

sudo mkdir -p /usr/local/bin && sudo mv /tmp/keploy /usr/local/bin && keploy
```

### Let's start the MongoDB Instance


```zsh
docker-compose up -d
```
> **url should look something like this depending on your connection you can adjust `mongodb://127.0.0.1:27017/keploy`.*

### Capture the testcases

```bash
sudo -E env PATH=$PATH keploy record -c 'npm start'
```
## Running the testcases

```bash
keploy -E env PATH=$PATH keploy test -c "npm start" --delay 10


jest test coverage report : 
![Screenshot 2024-04-22 025850](https://github.com/s2ahil/samples-typescript/assets/101473078/f60570d0-b998-4b4a-912d-80d4c73604e3)

postman tests: 
![Screenshot 2024-04-22 031914](https://github.com/s2ahil/samples-typescript/assets/101473078/1ee5850e-3d31-46bd-bb5e-f842e5262cdd)

Keploy test report:
![image](https://github.com/s2ahil/samples-typescript/assets/101473078/48f2b866-04d1-433b-9270-34c15786893c)
