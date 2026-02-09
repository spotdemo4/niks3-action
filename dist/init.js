#!/usr/bin/env node
import { c as setFailed, d as which, i as getInput, l as startGroup, n as endGroup, o as info, r as getIDToken, s as saveState, t as packages, u as exec } from "./nix-tdF-Csdb.js";

//#region src/init.ts
async function main() {
	info("Collecting packages");
	const packages$1 = await packages();
	saveState("packages", JSON.stringify(Array.from(packages$1.keys())));
	const audience = getInput("audience", { required: false });
	if (audience) {
		info("Using OIDC authentication");
		const id_token = await getIDToken(audience);
		saveState("server-url", audience);
		saveState("auth-token", id_token);
	} else {
		const server_url = getInput("server-url", { required: true });
		const auth_token = getInput("auth-token", { required: true });
		saveState("server-url", server_url);
		saveState("auth-token", auth_token);
	}
	try {
		await which("niks3", true);
		info("Niks3 is already installed, skipping installation");
	} catch {
		startGroup("Installing niks3");
		const inputs = getInput("inputs-from");
		if (inputs) await exec("nix", [
			"profile",
			"add",
			"--inputs-from",
			inputs,
			"github:Mic92/niks3"
		]);
		else await exec("nix", [
			"profile",
			"add",
			"github:Mic92/niks3"
		]);
		endGroup();
	}
}
try {
	await main();
} catch (error) {
	if (error instanceof Error) setFailed(error.message);
}

//#endregion
export {  };