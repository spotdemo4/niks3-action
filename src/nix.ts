import { existsSync } from "node:fs";
import { exec, getExecOutput } from "@actions/exec";

export type ContentAddress = {
	hash: string;
	method: string;
};

export type Package = {
	ca: ContentAddress;
	deriver: string | null;
	narHash: string;
	narSize: number;
	references: string[];
	registrationTime: number;
	signatures: string[];
	storeDir: string;
	ultimate: boolean;
	version: number;
};

export async function packages() {
	const info = await getExecOutput(
		"nix",
		["path-info", "--all", "--json", "--json-format", "2"],
		{
			silent: true,
		},
	);
	const parsed: { info: Record<string, Package> } = JSON.parse(info.stdout);

	const packages = new Map<string, Package>();
	for (const [name, info] of Object.entries(parsed.info)) {
		// Skip derivations
		if (name.endsWith(".drv")) {
			continue;
		}

		packages.set(name, info);
	}

	return packages;
}

export async function verify(name: string, pkg: Package, store: string) {
	const code = await exec(
		"nix",
		["path-info", "--store", store, `${pkg.storeDir}/${name}`],
		{
			silent: true,
			ignoreReturnCode: true,
		},
	);
	return code === 0;
}

export async function substituters() {
	// Get all substituters from nix config
	const config = await getExecOutput(
		"nix",
		["config", "show", "substituters"],
		{
			silent: true,
		},
	);
	const configSubs = config.stdout.split(" ").map((s) => s.trim());

	if (!existsSync("flake.nix")) {
		return configSubs;
	}

	// Get all substituters from flake.nix
	const flake = await getExecOutput(
		"nix",
		["eval", "--json", "--file", "flake.nix", "nixConfig"],
		{
			silent: true,
			ignoreReturnCode: true,
		},
	);
	if (flake.exitCode !== 0) {
		return configSubs;
	}

	const parsed = JSON.parse(flake.stdout);
	const flakeSubs: string[] = parsed.substituters || [];
	const flakeExtraSubs: string[] = parsed["extra-substituters"] || [];

	return [...new Set([...configSubs, ...flakeSubs, ...flakeExtraSubs])];
}
