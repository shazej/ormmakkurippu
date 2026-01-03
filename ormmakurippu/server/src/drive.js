import { google } from 'googleapis';
import { Readable } from 'stream';

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
        const fileMetadata = {
            name: file.originalname,
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

        // 3. Set permissions (optional: make it readable by anyone with link, or just rely on user ownership)
        // For now, we assume the user owns it so they can see it. 
        // If we want the specific "Open" link to work for others, we might need permissions, 
        // but since this is "User's Drive", the User is the one viewing it via the App usually.

        return fileRes.data;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw new Error('Failed to upload file to Google Drive');
    }
}
