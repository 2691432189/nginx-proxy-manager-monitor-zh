import assert from "node:assert/strict";
import fs from "node:fs";
import { after, before, describe, it } from "node:test";
import { DEFAULT_ADMIN_PORT, getAdminPort, validateListenPorts } from "../lib/listen-ports.js";
import { assertHostRenderable } from "../lib/nginx-values.js";
import utils from "../lib/utils.js";

const TEMPLATES = new URL("../templates/", import.meta.url);
const render = (file, ctx) =>
	utils.getRenderEngine().parseAndRender(fs.readFileSync(new URL(file, TEMPLATES), "utf8"), ctx);

const base = { httpPort: 80, sslPort: 443, hasCertificate: false };

// Keep the tests independent of the environment the suite happens to run in
let previousAdminPort;
before(() => {
	previousAdminPort = process.env.NPM_ADMIN_PORT;
	process.env.NPM_ADMIN_PORT = "81";
});
after(() => {
	if (typeof previousAdminPort === "undefined") {
		delete process.env.NPM_ADMIN_PORT;
	} else {
		process.env.NPM_ADMIN_PORT = previousAdminPort;
	}
});

const withAdminPort = (value, run) => {
	const previous = process.env.NPM_ADMIN_PORT;
	if (typeof value === "undefined") {
		delete process.env.NPM_ADMIN_PORT;
	} else {
		process.env.NPM_ADMIN_PORT = value;
	}
	try {
		run();
	} finally {
		if (typeof previous === "undefined") {
			delete process.env.NPM_ADMIN_PORT;
		} else {
			process.env.NPM_ADMIN_PORT = previous;
		}
	}
};

describe("listen port validation", () => {
	it("accepts the defaults", () => {
		assert.deepEqual(validateListenPorts(base), { httpPort: 80, sslPort: 443 });
	});

	it("accepts custom ports", () => {
		assert.deepEqual(validateListenPorts({ ...base, httpPort: 8080, sslPort: 8443, hasCertificate: true }), {
			httpPort: 8080,
			sslPort: 8443,
		});
	});

	it("rejects values that Number() would silently convert", () => {
		for (const value of [true, false, "0x10", "8080.0", " 8080 ", "1e3"]) {
			assert.throws(
				() => validateListenPorts({ ...base, httpPort: value }),
				/between 1 and 65535/,
				`accepted ${JSON.stringify(value)}`,
			);
		}
	});

	it("rejects out of range and non-integers", () => {
		for (const value of [0, 65536, 1.5, "abc", -1]) {
			assert.throws(() => validateListenPorts({ ...base, httpPort: value }), /between 1 and 65535/);
			assert.throws(() => validateListenPorts({ ...base, sslPort: value }), /between 1 and 65535/);
		}
	});

	it("rejects the backend port", () => {
		assert.throws(
			() => validateListenPorts({ ...base, httpPort: 3000 }),
			/reserved by the Nginx Proxy Manager backend/,
		);
		assert.throws(
			() => validateListenPorts({ ...base, sslPort: 3000 }),
			/reserved by the Nginx Proxy Manager backend/,
		);
	});

	it("rejects the configured admin port", () => {
		withAdminPort(" 8181 ", () => {
			assert.equal(getAdminPort(), 8181);
			assert.throws(
				() => validateListenPorts({ ...base, httpPort: 8181 }),
				/reserved by the Nginx Proxy Manager admin interface/,
			);
			assert.throws(
				() => validateListenPorts({ ...base, sslPort: 8181 }),
				/reserved by the Nginx Proxy Manager admin interface/,
			);
		});
	});

	it("falls back to the default admin port for invalid values", () => {
		for (const value of ["", "abc", "0", "-1", "81.5", "70000"]) {
			withAdminPort(value, () => {
				assert.equal(getAdminPort(), DEFAULT_ADMIN_PORT, `NPM_ADMIN_PORT=${value}`);
			});
		}
		withAdminPort(undefined, () => {
			assert.equal(getAdminPort(), DEFAULT_ADMIN_PORT);
		});
	});

	it("rejects 443 as HTTP and 80 as HTTPS", () => {
		assert.throws(() => validateListenPorts({ ...base, httpPort: 443 }), /443 is always used for HTTPS/);
		assert.throws(() => validateListenPorts({ ...base, sslPort: 80 }), /80 is always used for HTTP/);
	});

	it("rejects equal ports with a certificate", () => {
		assert.throws(
			() => validateListenPorts({ ...base, httpPort: 8443, sslPort: 8443, hasCertificate: true }),
			/must be different/,
		);
	});

	it("accepts equal ports without a certificate", () => {
		assert.deepEqual(validateListenPorts({ ...base, httpPort: 8443, sslPort: 8443 }), {
			httpPort: 8443,
			sslPort: 8443,
		});
	});

	it("rejects a port used for HTTPS by another host", () => {
		assert.throws(
			() =>
				validateListenPorts({
					...base,
					httpPort: 8443,
					sslPort: 443,
					otherHosts: [
						{
							id: 2,
							domain_names: ["app.example.com"],
							listen_port: 80,
							listen_port_ssl: 8443,
							has_certificate: true,
						},
					],
				}),
			/already used for HTTPS by Proxy Host #2 \(app\.example\.com\)/,
		);
	});

	it("rejects a port used for HTTP by another host when TLS is enabled", () => {
		assert.throws(
			() =>
				validateListenPorts({
					...base,
					httpPort: 80,
					sslPort: 8080,
					hasCertificate: true,
					otherHosts: [
						{
							id: 3,
							domain_names: ["other.example.com"],
							listen_port: 8080,
							listen_port_ssl: 443,
							has_certificate: false,
						},
					],
				}),
			/already used for HTTP by Proxy Host #3 \(other\.example\.com\)/,
		);
	});

	it("accepts a plain port shared with another plain host", () => {
		assert.deepEqual(
			validateListenPorts({
				...base,
				httpPort: 8080,
				otherHosts: [
					{
						id: 4,
						domain_names: ["plain.example.com"],
						listen_port: 8080,
						listen_port_ssl: 443,
						has_certificate: false,
					},
				],
			}),
			{ httpPort: 8080, sslPort: 443 },
		);
	});

	it("ignores a stored HTTPS port when the host has no certificate", () => {
		assert.deepEqual(
			validateListenPorts({
				...base,
				sslPort: 8443,
				otherHosts: [
					{
						id: 5,
						domain_names: ["https.example.com"],
						listen_port: 8443,
						listen_port_ssl: 8443,
						has_certificate: true,
					},
				],
			}),
			{ httpPort: 80, sslPort: 8443 },
		);
	});

	it("hides other hosts' details when includeHostDetails is false", () => {
		assert.throws(
			() =>
				validateListenPorts({
					...base,
					httpPort: 8443,
					includeHostDetails: false,
					otherHosts: [
						{
							id: 2,
							domain_names: ["secret.example.com"],
							listen_port: 80,
							listen_port_ssl: 8443,
							has_certificate: true,
						},
					],
				}),
			(err) => err.message.includes("another Proxy Host") && !err.message.includes("secret.example.com"),
		);
		assert.throws(
			() =>
				validateListenPorts({
					...base,
					httpPort: 9090,
					includeHostDetails: false,
					tcpStreams: [{ id: 5, incoming_port: 9090 }],
				}),
			(err) => err.message.includes("another Stream") && !err.message.includes("#5"),
		);
	});

	it("rejects a port used by a TCP stream", () => {
		assert.throws(
			() => validateListenPorts({ ...base, httpPort: 9090, tcpStreams: [{ id: 5, incoming_port: 9090 }] }),
			/already used by Stream #5/,
		);
		assert.throws(
			() =>
				validateListenPorts({
					...base,
					sslPort: 9443,
					hasCertificate: true,
					tcpStreams: [{ id: 6, incoming_port: 9443 }],
				}),
			/already used by Stream #6/,
		);
	});
});

describe("listen port rendering", () => {
	it("renders custom ports for a proxy host", async () => {
		const out = await render("_listen.conf", {
			ipv6: false,
			certificate: true,
			http2_support: true,
			listen_port: 8080,
			listen_port_ssl: 8443,
			domain_names: ["app.example.com"],
		});
		assert.match(out, /listen 8080;/);
		assert.match(out, /listen 8443 ssl;/);
		assert.doesNotMatch(out, /listen\s*;/);
	});

	it("renders custom ports for IPv6 listeners", async () => {
		const out = await render("_listen.conf", {
			ipv6: true,
			certificate: true,
			http2_support: false,
			listen_port: 8080,
			listen_port_ssl: 8443,
			domain_names: ["app.example.com"],
		});
		assert.match(out, /listen \[::\]:8080;/);
		assert.match(out, /listen \[::\]:8443 ssl;/);
	});

	it("falls back to 80/443 for hosts without the fields", async () => {
		const out = await render("_listen.conf", {
			ipv6: false,
			certificate: false,
			http2_support: false,
			domain_names: ["old.example.com"],
		});
		assert.match(out, /listen 80;/);
		assert.match(out, /server_name old.example.com;/);
		assert.doesNotMatch(out, /listen\s*;/);
	});

	it("falls back to 80/443 for stored null ports", async () => {
		const out = await render("_listen.conf", {
			ipv6: false,
			certificate: true,
			http2_support: false,
			listen_port: null,
			listen_port_ssl: null,
			domain_names: ["old.example.com"],
		});
		assert.match(out, /listen 80;/);
		assert.match(out, /listen 443 ssl;/);
		assert.doesNotMatch(out, /listen\s*;/);
	});
});

describe("forced SSL redirect rendering", () => {
	const ctx = (extra) => ({
		certificate: true,
		certificate_id: 1,
		ssl_forced: true,
		trust_forwarded_proto: false,
		...extra,
	});

	it("uses the custom HTTPS port in the redirect host", async () => {
		const out = await render("_forced_ssl.conf", ctx({ listen_port_ssl: 8443 }));
		assert.match(out, /set \$npm_ssl_redirect_host "\$host:8443";/);
	});

	it("keeps the plain host for 443 and for hosts without the field", async () => {
		for (const extra of [{ listen_port_ssl: 443 }, { listen_port_ssl: null }, {}]) {
			const out = await render("_forced_ssl.conf", ctx(extra));
			assert.match(out, /set \$npm_ssl_redirect_host \$host;/);
			assert.doesNotMatch(out, /\$host:/);
		}
	});

	it("keeps the trust_forwarded_proto handling", async () => {
		const out = await render("_forced_ssl.conf", ctx({ listen_port_ssl: 8443, trust_forwarded_proto: true }));
		assert.match(out, /set \$trust_forwarded_proto "T";/);
		assert.match(out, /include conf\.d\/include\/force-ssl\.conf;/);
	});
});

describe("render-time port check", () => {
	const host = (extra) => ({
		id: 1,
		domain_names: ["app.example.com"],
		forward_host: "127.0.0.1",
		locations: [],
		...extra,
	});

	it("accepts valid ports and absent ports", () => {
		assertHostRenderable("proxy_host", host({}));
		assertHostRenderable("proxy_host", host({ listen_port: 80, listen_port_ssl: 443 }));
		assertHostRenderable("proxy_host", host({ listen_port: 8080, listen_port_ssl: null }));
	});

	it("refuses stored values that are not valid ports", () => {
		for (const value of ["8080", 0, 65536, 1.5, true]) {
			assert.throws(
				() => assertHostRenderable("proxy_host", host({ listen_port: value })),
				(err) => err.unsafeNginxValue === true && err.message.includes("listen port"),
				`accepted ${JSON.stringify(value)}`,
			);
			assert.throws(
				() => assertHostRenderable("proxy_host", host({ listen_port_ssl: value })),
				(err) => err.unsafeNginxValue === true && err.message.includes("listen port ssl"),
				`accepted ${JSON.stringify(value)}`,
			);
		}
	});
});
