import express, { Request, Response } from 'express';
import { getAllTests, getTestById, rerunTest } from './keploy';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.get("/tests", async (req: Request, res: Response) => {
    try {
        const tests = await getAllTests();
        res.json(tests);
    } catch (error) {
        console.error("Error fetching tests:", error);
        res.status(500).json({ error: "Failed to fetch tests" });
    }
});
app.get("/tests/:id", async (req: Request, res: Response):Promise<void> => {
    const testId = req.params.id;
    try {
        const test = await getTestById(testId);
        res.json(test);
    } catch (error) {
        console.error("Error fetching test:", error);
        res.status(500).json({ error: "Failed to fetch test" });
    }
});
app.post("/tests/:id/rerun", async (req: Request, res: Response) => {
    const testId = req.params.id;
    try {
        const result = await rerunTest(testId);
        res.json(result);
    } catch (error) {
        console.error("Error rerunning test:", error);
        res.status(500).json({ error: "Failed to rerun test" });
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});