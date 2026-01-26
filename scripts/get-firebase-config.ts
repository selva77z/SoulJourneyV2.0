
import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

async function getFirebaseConfig() {
    try {
        const keyPath = path.resolve('serviceAccountKey.json');
        if (!fs.existsSync(keyPath)) {
            throw new Error('serviceAccountKey.json not found');
        }

        const auth = new GoogleAuth({
            keyFile: keyPath,
            scopes: ['https://www.googleapis.com/auth/firebase', 'https://www.googleapis.com/auth/cloud-platform'],
        });

        const client = await auth.getClient();
        const projectId = await auth.getProjectId();

        console.log(`Authenticated for project: ${projectId}`);
        console.log('Fetching Web Apps...');

        // 1. List Web Apps
        const listRes = await client.request({
            url: `https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps`,
            method: 'GET'
        });

        let apps = (listRes.data as any).apps;

        if (!apps || apps.length === 0) {
            console.log('No Web Apps found. Creating one now...');

            const createRes = await client.request({
                url: `https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps`,
                method: 'POST',
                data: {
                    displayName: 'Soul Journey Web'
                }
            });

            const newApp = (createRes.data as any).name; // returns resource name
            // Expected format: projects/PROJECT_ID/webApps/APP_ID
            // We need to wait a moment for propagation potentially? Usually immediate.
            console.log(`Created new Web App: ${newApp}`);

            // Re-fetch list or just parse ID? The operation might be long-running (LRO).
            // The API returns an Operation, so we technically should poll. 
            // But let's try calling GetConfig on the result immediately if it gave us the detailed response, 
            // or we might need to wait.
            // Usually CreateWebApp returns an Operation. 

            const operation = createRes.data as any;
            if (operation.name && operation.name.includes('operations/')) {
                console.log('Creation initiated (Operation). Waiting 5 seconds...');
                await new Promise(r => setTimeout(r, 5000));
                // Try listing again
                const listRes2 = await client.request({
                    url: `https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps`,
                    method: 'GET'
                });
                apps = (listRes2.data as any).apps;
            } else {
                // Maybe it returned the app directly (unlikely based on docs, but possible).
                apps = [operation];
            }
        }

        if (!apps || apps.length === 0) {
            console.error('Still no apps found after creation attempt.');
            return;
        }

        console.log(`Found ${apps.length} web app(s). Fetching config for the first one: ${apps[0].displayName} (${apps[0].appId})`);

        // 2. Get Config for the first app
        const appId = apps[0].appId;
        const configRes = await client.request({
            url: `https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps/${appId}/config`,
            method: 'GET'
        });

        const config = (configRes.data as any);
        console.log('\n--- FIREBASE CONFIG ---');
        console.log(JSON.stringify(config, null, 2));
        console.log('-----------------------\n');

    } catch (error) {
        console.error('Error fetching/creating config:', error);
        if ((error as any).response) {
            console.error('Response data:', (error as any).response.data);
        }
    }
}

getFirebaseConfig();
