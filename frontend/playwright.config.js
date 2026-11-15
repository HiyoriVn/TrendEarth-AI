import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./browser',use:{baseURL:'http://127.0.0.1:4175',headless:true,launchOptions:process.env.EDGE_PATH?{executablePath:process.env.EDGE_PATH}:{}},webServer:{command:'npm run preview -- --host 127.0.0.1 --port 4175',url:'http://127.0.0.1:4175',reuseExistingServer:false}});
