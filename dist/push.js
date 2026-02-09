#!/usr/bin/env node
import { a as getIDToken, c as info, d as setFailed, f as startGroup, i as endGroup, o as getInput, p as exec, s as getState, t as packages } from "./nix-L5xASWm5.js";

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
	if (paths.size === 0) {
		info("No new packages to push");
		return;
	}
	let server_url = getInput("server-url", { required: false });
	let auth_token = getInput("auth-token", { required: false });
	const audience = getInput("audience", { required: false });
	const max_concurrent_uploads = getInput("max-concurrent-uploads", { required: false });
	startGroup(`Pushing ${paths.size} packages to cache`);
	for (const path of paths) {
		if (audience) {
			server_url = audience;
			auth_token = await getIDToken(audience);
		}
		await exec("niks3", [
			"push",
			"--server-url",
			server_url,
			"--auth-token",
			auth_token,
			"--max-concurrent-uploads",
			max_concurrent_uploads || "30",
			path
		], { ignoreReturnCode: true });
	}
	endGroup();
}
try {
	await main();
} catch (error) {
	if (error instanceof Error) setFailed(error.message);
}

//#endregion
export {  };