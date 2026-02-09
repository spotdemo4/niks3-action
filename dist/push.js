#!/usr/bin/env node
import { a as getState, c as setFailed, l as startGroup, n as endGroup, o as info, t as packages, u as exec } from "./nix-tdF-Csdb.js";

//#region src/push.ts
async function main() {
	info("Collecting packages");
	const init = new Set(JSON.parse(getState("packages")));
	const now = await packages();
	info("Filtering packages");
	const paths = /* @__PURE__ */ new Set();
	for (const [name, pkg] of now) {
		if (init.has(name)) continue;
		if (!pkg.ultimate) continue;
		paths.add(`${pkg.storeDir}/${name}`);
	}
	startGroup(`Pushing ${paths.size} packages to cache`);
	const server_url = getState("server-url");
	const auth_token = getState("auth-token");
	for (const path of paths) await exec("niks3", [
		"push",
		"--server-url",
		server_url,
		"--auth-token",
		auth_token,
		path
	]);
	endGroup();
}
try {
	await main();
} catch (error) {
	if (error instanceof Error) setFailed(error.message);
}

//#endregion
export {  };