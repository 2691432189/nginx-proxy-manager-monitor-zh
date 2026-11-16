import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pjson from "../package.json" with { type: "json" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const versionFile = path.resolve(__dirname, "../../.version");

const readVersionFile = () => {
	try {
		const value = fs.readFileSync(versionFile, "utf8").trim();
		return value || null;
	} catch (_err) {
		return null;
	}
};

// Prefer the release version injected at build time (Docker), then the repo
// .version file (development), then the package manifest fallback.
const normalize = (value) => (typeof value === "string" ? value.trim().replace(/^v/, "") : value);

const rawVersion =
	[process.env.NPM_BUILD_VERSION, readVersionFile(), pjson.version]
		.map(normalize)
		.find((value) => typeof value === "string" && /^\d+\.\d+\.\d+/.test(value)) || "0.0.0";

const version = rawVersion.split("-").shift();
const [major, minor, revision] = version.split(".").map((part) => Number.parseInt(part, 10));

export { version, major, minor, revision };
export default version;
