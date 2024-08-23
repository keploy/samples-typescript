import dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

const checkDatabaseUrlExist = () => {
    if(!DATABASE_URL){
        process.exit(1);
    }
}

export default checkDatabaseUrlExist;