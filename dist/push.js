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
	let server_url;
	let auth_token;
	const audience = getInput("audience", { required: false });
	if (audience) {
		info("Using OIDC authentication");
		server_url = audience;
		auth_token = await getIDToken(audience);
	} else {
		info("Using token authentication");
		server_url = getInput("server-url", { required: true });
		auth_token = getInput("auth-token", { required: true });
	}
	startGroup(`Pushing ${paths.size} packages to cache`);
	await exec("niks3", [
		"push",
		"--server-url",
		server_url,
		"--auth-token",
		auth_token,
		...paths
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