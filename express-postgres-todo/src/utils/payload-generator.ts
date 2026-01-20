/**
 * Utility functions for generating large payloads for testing
 */

interface SampleDataItem {
    id: number;
    title: string;
    description: string;
    completed: boolean;
    priority: number;
    metadata: {
        createdBy: string;
        notes: string;
        tags: string[];
    };
}

/**
 * Generates an array of JSON objects to approximate a specified size in kilobytes.
 * @param targetSizeInKb The desired size in KB.
 * @returns An array of JSON objects.
 */
export const generateJsonPayload = (targetSizeInKb: number): SampleDataItem[] => {
    const targetSizeBytes = targetSizeInKb * 1024;

    const sampleObject: SampleDataItem = {
        id: 0,
        title: "Sample Todo Item for Large Payload Testing",
        description: "This is a sample object used to create a JSON payload of a specific size for testing purposes.",
        completed: false,
        priority: 2,
        metadata: {
            createdBy: "system",
            notes: "Auto-generated for payload size testing. This note is intentionally verbose to increase the object size.",
            tags: ["test", "sample", "payload", "generated"]
        }
    };

    const singleObjectString = JSON.stringify(sampleObject);
    const sizeOfUnit = Buffer.byteLength(singleObjectString, 'utf8') + 1;
    const numberOfObjects = Math.floor(targetSizeBytes / sizeOfUnit);

    const payloadArray: SampleDataItem[] = [];
    for (let i = 0; i < numberOfObjects; i++) {
        payloadArray.push({
            id: i + 1,
            title: `Sample Todo Item #${i + 1} for Large Payload Testing`,
            description: "This is a sample object used to create a JSON payload of a specific size for testing purposes.",
            completed: i % 2 === 0,
            priority: (i % 4) + 1,
            metadata: {
                createdBy: "system",
                notes: "Auto-generated for payload size testing. This note is intentionally verbose to increase the object size.",
                tags: ["test", "sample", "payload", "generated"]
            }
        });
    }
    return payloadArray;
};

/**
 * Generates a base64 encoded string of approximately the specified size
 * @param sizeInKb The desired size in KB
 * @returns Base64 encoded string
 */
export const generateBase64Payload = (sizeInKb: number): string => {
    const targetBytes = sizeInKb * 1024;
    // Base64 encoding increases size by ~33%, so generate less raw data
    const rawBytes = Math.floor(targetBytes * 0.75);

    const buffer = Buffer.alloc(rawBytes);
    for (let i = 0; i < rawBytes; i++) {
        buffer[i] = Math.floor(Math.random() * 256);
    }

    return buffer.toString('base64');
};

/**
 * Generates a random string of specified length
 * @param length The desired length
 * @returns Random string
 */
export const generateRandomString = (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
