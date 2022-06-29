import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [dts({
        beforeWriteFile: (filePath: string, content: string) => {
            const  newFilePath = filePath.replace('src/', '')
            return {
                filePath: newFilePath,
                content
            }
        }
    })],
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'vite-plugin-cos',
            formats: ['cjs'],
            fileName: (format) => 'index.js',
        }
    }
})