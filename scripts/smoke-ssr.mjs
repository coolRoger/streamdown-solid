import { createServer } from "vite";
import solidPlugin from "vite-plugin-solid";

const server = await createServer({
    appType: "custom",
    plugins: [solidPlugin()],
    server: { middlewareMode: true },
    ssr: { noExternal: ["streamdown-solidjs"] },
});

try {
    await server.ssrLoadModule("streamdown-solidjs");
    process.stdout.write("SSR smoke passed\n");
} finally {
    await server.close();
}

