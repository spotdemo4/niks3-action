import { defineConfig } from "rolldown";

export default defineConfig({
	input: ["src/init.ts", "src/push.ts"],
	platform: "node",
	tsconfig: true,
	output: {
		dir: "dist",
		banner: "#!/usr/bin/env node",
		cleanDir: true,
	},
});
