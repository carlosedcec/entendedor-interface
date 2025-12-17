import { defineConfig } from "vite";
import path from "node:path";
import fg from "fast-glob";
import fs from "node:fs";

function getHtmlPages() {

    const files = fg.sync("src/pages/**/*.html", { cwd: __dirname });

    const inputs = {
        main: path.resolve(__dirname, "index.html")
    };

    for (const file of files) {
        const name = file.replace(/\.html$/, "");
        inputs[name] = path.resolve(__dirname, file);
    }

    return inputs;

}

function prettyUrlsMPA(pagesDir) {
    return {
        name: "pretty-urls-mpa",
        configureServer(server) {
            server.middlewares.use((req, _res, next) => {
                if (!req.url || req.method !== "GET") return next();

                const [rawPath] = req.url.split("?");
                const urlPath = rawPath.split("#")[0];

                // ignora rotas internas do vite e arquivos com extensão (assets)
                if (
                    urlPath.startsWith("/@") ||
                    urlPath.startsWith("/__") ||
                    urlPath.includes(".")
                ) {
                    return next();
                }

                // só reescreve navegação HTML
                const accept = String(req.headers.accept || "");
                if (!accept.includes("text/html")) return next();

                const root = server.config.root;
                const clean = urlPath === "/" ? "index" : urlPath.replace(/^\//, "");

                const candidates = [
                    path.join(root, `${clean}.html`),                 // /login -> /login.html (se existir na raiz)
                    path.join(root, pagesDir, `${clean}.html`),       // /login -> /views/login.html
                    path.join(root, pagesDir, clean, "index.html"),   // /login -> /views/login/index.html
                ];

                for (const file of candidates) {
                    if (fs.existsSync(file)) {
                        const rel = path.relative(root, file).split(path.sep).join("/");
                        req.url = "/" + rel; // reescreve a request
                        break;
                    }
                }

                next();
            });
        },
    };
}

export default defineConfig({
    plugins: [prettyUrlsMPA("src/pages")],
    server: {
        hmr: false,
        port: 80
    },
    base: "./",
    build: {
        rollupOptions: {
            input: getHtmlPages()
        },
    },
    assetFileNames: (assetInfo) => {
        if (assetInfo.name == 'style.css')
            return 'style.css';
        return assetInfo.name;
    },
});