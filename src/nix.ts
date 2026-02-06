import { existsSync } from "node:fs";
import { exec, getExecOutput } from "@actions/exec";

export type ContentAddress = {
	hash: string;
	method: string;
};

export type Path = {
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

export type Package = Path & {
	name: string;
};

export async function packages() {
	const path_info = await getExecOutput(
		"nix",
		["path-info", "--all", "--json", "--json-format", "2"],
		{
			silent: true,
		},
	);
	const parsed: { info: Record<string, Path> } = JSON.parse(path_info.stdout);

	const packages: Package[] = [];
	for (const [name, info] of Object.entries(parsed.info)) {
		if (name.endsWith(".drv")) {
			continue;
		}

		packages.push({
			name,
			...info,
		});
	}

	return packages;
}

export async function verify(pkg: Package, store: string) {
	const code = await exec(
		"nix",
		[
			"store",
			"verify",
			"--no-contents",
			"--no-trust",
			"--store",
			store,
			`${pkg.storeDir}/${pkg.name}`,
		],
		{
			silent: true,
			ignoreReturnCode: true,
		},
	);
	return code === 0;
}

export async function substituters() {
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
