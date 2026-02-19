import { google } from 'googleapis';
import { Readable } from 'stream';
import dotenv from 'dotenv';

dotenv.config();

export function getOAuthClient() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'postmessage' // Critical for React-OAuth code flow
    );
}

/**
 * Uploads a file to a specific folder in Google Drive.
 * @param {Object} authClient - Authenticated Google OAuth2 client
 * @param {Object} file - File object (from multer)
 * @param {string} folderName - Name of the folder to upload to
 * @returns {Promise<Object>} - File metadata (id, name, webViewLink, etc.)
 */
export async function uploadToDrive(authClient, file, folderName = 'ormmakurippu') {
    const drive = google.drive({ version: 'v3', auth: authClient });

    // 1. Find or Create Folder
    let folderId;
    const q = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;

    try {
        const listRes = await drive.files.list({
            q: q,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        if (listRes.data.files && listRes.data.files.length > 0) {
            folderId = listRes.data.files[0].id;
        } else {
            // Create folder
            const createRes = await drive.files.create({
                requestBody: {
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder',
                },
                fields: 'id',
            });
            folderId = createRes.data.id;
        }
    } catch (error) {
        console.error('Error finding/creating folder:', error);
        throw new Error('Failed to access Google Drive folder');
    }

    // 2. Upload File
    try {
        // Sanitize filename
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');

        const fileMetadata = {
            name: safeName,
            parents: [folderId],
        };

        const media = {
            mimeType: file.mimetype,
            body: Readable.from(file.buffer),
        };

        const fileRes = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, name, mimeType, size, webViewLink',
        });

        return fileRes.data;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw new Error('Failed to upload file to Google Drive');
    }
}
