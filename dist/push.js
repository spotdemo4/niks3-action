#!/usr/bin/env node
import { c as info, d as startGroup, f as exec, i as endGroup, n as substituters, r as verify, s as getState, t as packages, u as setFailed } from "./nix-oWFgJy35.js";

//#region src/push.ts
async function main() {
	info("Collecting packages");
	const init = JSON.parse(getState("packages"));
	const now = await packages();
	info("Getting substituters");
	const stores = await substituters();
	const packages$1 = [];
	info("Verifying packages");
	pkgLoop: for (const pkg of now) {
		if (init.some((p) => p.narHash === pkg.narHash)) continue;
		for (const store of stores) if (await verify(pkg, store)) continue pkgLoop;
		packages$1.push(pkg);
	}
	const server_url = getState("server-url");
	const auth_token = getState("auth-token");
	startGroup(`Pushing ${packages$1.length} packages to cache`);
	for (const pkg of packages$1) await exec("niks3", [
		"push",
		"--server-url",
		server_url,
		"--auth-token",
		auth_token,
		`${pkg.storeDir}/${pkg.name}`
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