#!/usr/bin/env node
import { c as info, d as setFailed, f as startGroup, i as endGroup, p as exec, s as getState, t as packages } from "./nix-L5xASWm5.js";

//#region src/push.ts
async function main() {
	info("Collecting packages");
	const init = new Set(JSON.parse(getState("packages")));
	const now = await packages();
	info("Filtering packages");
	const paths = /* @__PURE__ */ new Set();
	for (const [name, pkg] of now) {
		if (!pkg.ultimate) continue;
		if (init.has(name)) continue;
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